-- Enrich the public, reviewed acquisition projection with strict aggregate-only
-- opportunity/attribution diagnostics. Raw CRM records remain in private source.
begin;
CREATE OR REPLACE FUNCTION public.publish_signal_week(p_week date, p_captured_at timestamp with time zone, p_status text, p_data_through date, p_payload jsonb, p_published boolean DEFAULT true)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  existing public.signal_published_reports%rowtype;
  next_revision integer;
begin
  if p_week is null or extract(isodow from p_week)<>1 then
    raise exception 'week_start must be Monday';
  end if;
  if p_status not in ('in_progress','complete') then
    raise exception 'invalid report status';
  end if;
  if p_data_through is not null and (p_data_through<p_week or p_data_through>p_week+6) then
    raise exception 'data_through outside reporting week';
  end if;
  if p_captured_at is null or p_captured_at>now()+interval '1 day' then
    raise exception 'invalid capture timestamp';
  end if;
  if jsonb_typeof(p_payload)<>'object'
    or coalesce(jsonb_typeof(p_payload->'posts'),'')<>'array'
    or coalesce(jsonb_typeof(p_payload->'channels'),'')<>'array'
    or jsonb_array_length(p_payload->'posts')>400
    or jsonb_array_length(p_payload->'channels')>40
    or pg_column_size(p_payload)>524288
  then
    raise exception 'invalid public payload';
  end if;
  -- Never publish arbitrary source tables, raw account export rows or CRM data.
  if exists (
    select 1 from jsonb_object_keys(p_payload) k
    where k not in ('posts','channels','overview','diagnostics','coverage','acquisition')
  ) then
    raise exception 'unrecognized top-level public field';
  end if;
  -- Whitelist nested keys as well: public rows must never be raw exports.
  if exists (
    select 1 from jsonb_array_elements(p_payload->'posts') p(item)
    cross join lateral jsonb_object_keys(p.item) k(key)
    where k.key not in ('id','date','platform','account','format','title',
      'url','views','likes','comments','shares','saves','interactions','impressions','status','ctaChecked',
      'complianceChecked','thumbnailPath','coverUrl')
  ) then
    raise exception 'unrecognized post field in public payload';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_payload->'channels') c(item)
    cross join lateral jsonb_object_keys(c.item) k(key)
    where k.key not in ('platform','account','period','source','note','metrics')
  ) then
    raise exception 'unrecognized channel field in public payload';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_payload->'channels') c(item)
    where jsonb_typeof(c.item->'metrics')<>'array'
    or not (c.item ? 'metrics')
  ) then
    raise exception 'invalid channel metrics array';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_payload->'channels') c(item)
    cross join lateral jsonb_array_elements(c.item->'metrics') m(item)
    cross join lateral jsonb_object_keys(m.item) k(key)
    where k.key not in ('label','value','unit')
  ) then
    raise exception 'unrecognized metric field in public payload';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_payload->'posts') p(item)
    where ((p.item->>'url') is not null and (p.item->>'url') !~* '^https://')
       or ((p.item->>'coverUrl') is not null and (p.item->>'coverUrl') !~* '^https://')
       or ((p.item->>'thumbnailPath') is not null and
          (p.item->>'thumbnailPath') !~ '^/media/archive/[a-zA-Z0-9_.-]+')
  ) then
    raise exception 'unsafe public media or post URL';
  end if;

  -- Only safe aggregate acquisition projections may enter the public payload.
  -- The private source snapshot is never exposed here.
  if p_payload ? 'acquisition' then
    if jsonb_typeof(p_payload->'acquisition') <> 'object'
      or jsonb_typeof(p_payload->'acquisition'->'routes') <> 'array'
      or jsonb_typeof(p_payload->'acquisition'->'websiteFirstTouch') <> 'array'
      or jsonb_array_length(p_payload->'acquisition'->'routes') > 4
      or jsonb_array_length(p_payload->'acquisition'->'websiteFirstTouch') > 4
      or p_payload->'acquisition'->>'scope' <> 'historical_cohort'
    then
      raise exception 'invalid public aggregate acquisition projection';
    end if;
    if exists (
      select 1 from jsonb_object_keys(p_payload->'acquisition') k
      where k not in ('asOf','scope','source','routes','websiteFirstTouch','analysis','finding','decision')
    ) then raise exception 'unrecognized acquisition field'; end if;
    if exists (
      select 1 from jsonb_array_elements(p_payload->'acquisition'->'routes') route(item)
      cross join lateral jsonb_object_keys(route.item) k(key)
      where k.key not in ('route','evidence','contacts','stages')
    ) then raise exception 'unrecognized acquisition route field'; end if;
    if exists (
      select 1 from jsonb_array_elements(p_payload->'acquisition'->'routes') route(item),
        lateral jsonb_array_elements(coalesce(route.item->'stages','[]'::jsonb)) stage(item)
      cross join lateral jsonb_object_keys(stage.item) k(key)
      where k.key not in ('stage','contacts')
    ) then raise exception 'unrecognized acquisition stage field'; end if;
    if exists (
      select 1 from jsonb_array_elements(p_payload->'acquisition'->'websiteFirstTouch') ft(item)
      cross join lateral jsonb_object_keys(ft.item) k(key)
      where k.key not in ('channel','contacts')
    ) then raise exception 'unrecognized first touch field'; end if;

    -- Reviewed, aggregate-only CRM intelligence; reject unknown nested fields
    -- before any acquisition data reaches the anonymous reporting table.
    if p_payload->'acquisition' ? 'analysis' then
      if jsonb_typeof(p_payload->'acquisition'->'analysis') <> 'object'
        or jsonb_typeof(p_payload->'acquisition'->'analysis'->'contactCoverage') <> 'object'
        or jsonb_typeof(p_payload->'acquisition'->'analysis'->'opportunityCoverage') <> 'object'
        or jsonb_typeof(p_payload->'acquisition'->'analysis'->'operations') <> 'object'
        or jsonb_typeof(p_payload->'acquisition'->'analysis'->'opportunityGroups') <> 'array'
        or jsonb_typeof(p_payload->'acquisition'->'analysis'->'websiteOpportunityChannels') <> 'array'
        or jsonb_typeof(p_payload->'acquisition'->'analysis'->'campaigns') <> 'array'
        or jsonb_typeof(p_payload->'acquisition'->'analysis'->'findings') <> 'array'
        or jsonb_array_length(p_payload->'acquisition'->'analysis'->'opportunityGroups') > 4
        or jsonb_array_length(p_payload->'acquisition'->'analysis'->'websiteOpportunityChannels') > 4
        or jsonb_array_length(p_payload->'acquisition'->'analysis'->'campaigns') > 2
        or jsonb_array_length(p_payload->'acquisition'->'analysis'->'findings') > 5
        or pg_column_size(p_payload->'acquisition'->'analysis') > 24576
      then raise exception 'invalid public acquisition analysis'; end if;
      if exists (
        select 1 from jsonb_object_keys(p_payload->'acquisition'->'analysis') k
        where k not in ('contactCoverage','opportunityCoverage','opportunityGroups',
                        'websiteOpportunityChannels','campaigns','operations','findings')
      ) then raise exception 'unrecognized analysis field'; end if;
      if exists (
        select 1 from jsonb_object_keys(p_payload->'acquisition'->'analysis'->'contactCoverage') k
        where k not in ('total','sourceRecorded','firstSessionRecorded','utmSourceRecorded',
                        'metaNativeSource','instagramDM','instagramDMWithoutStatus')
      ) then raise exception 'unrecognized contact aggregate field'; end if;
      if exists (
        select 1 from jsonb_object_keys(p_payload->'acquisition'->'analysis'->'opportunityCoverage') k
        where k not in ('total','distinctContactIds','adSourceMissing',
                        'nonSurgicalTotal','nonSurgicalAdSourceMissing')
      ) then raise exception 'unrecognized opportunity aggregate field'; end if;
      if exists (
        select 1 from jsonb_object_keys(p_payload->'acquisition'->'analysis'->'operations') k
        where k not in ('metaLeadStage','metaEngagementZero','metaSmsInvalid',
                        'newestWebsiteMissingAdSource','newestWebsiteOpportunities',
                        'moreInformationOpportunities')
      ) then raise exception 'unrecognized operations aggregate field'; end if;
      if exists (
        select 1 from jsonb_array_elements(p_payload->'acquisition'->'analysis'->'opportunityGroups') e(item)
        cross join lateral jsonb_object_keys(e.item) k(key)
        where k.key not in ('name','opportunities','advancedStage','replied','lead','cancelNoShow')
      ) then raise exception 'unrecognized opportunity cohort field'; end if;
      if exists (
        select 1 from jsonb_array_elements(p_payload->'acquisition'->'analysis'->'websiteOpportunityChannels') e(item)
        cross join lateral jsonb_object_keys(e.item) k(key)
        where k.key not in ('channel','opportunities','advancedStage')
      ) then raise exception 'unrecognized website channel field'; end if;
      if exists (
        select 1 from jsonb_array_elements(p_payload->'acquisition'->'analysis'->'campaigns') e(item)
        cross join lateral jsonb_object_keys(e.item) k(key)
        where k.key not in ('platform','period','reportedEvents','spendUSD',
                            'contactEvidence','openOpportunities','note')
      ) then raise exception 'unrecognized campaign reconciliation field'; end if;
      if exists (
        select 1 from jsonb_array_elements(p_payload->'acquisition'->'analysis'->'findings') e(item)
        cross join lateral jsonb_object_keys(e.item) k(key)
        where k.key not in ('title','evidence','decision')
      ) then raise exception 'unrecognized editorial finding field'; end if;
    end if;
  end if;
  select * into existing from public.signal_published_reports
    where week_start=p_week for update;
  if found and p_captured_at<existing.captured_at then
    raise exception 'stale capture: newer report is already published';
  end if;
  -- Preserve human-reviewed business context across automatic daily refreshes.
  -- Do not carry it to another reporting week, and do not regress the as-of date.
  if found and existing.payload ? 'acquisition'
     and (not (p_payload ? 'acquisition') or
       coalesce(p_payload->'acquisition'->>'asOf','') <
         coalesce(existing.payload->'acquisition'->>'asOf','')) then
    p_payload:=jsonb_set(p_payload,'{acquisition}',existing.payload->'acquisition',true);
  end if;
  if found and existing.payload->'overview' ? 'reviewedAt'
     and (not (p_payload->'overview' ? 'reviewedAt') or
       coalesce(p_payload->'overview'->>'reviewedAt','') <
         coalesce(existing.payload->'overview'->>'reviewedAt','')) then
    p_payload:=jsonb_set(p_payload,'{overview}',existing.payload->'overview',true);
  end if;
  if found and p_captured_at=existing.captured_at
     and p_payload=existing.payload and p_status=existing.status
     and p_published=existing.published and p_data_through is not distinct from existing.data_through
  then
    return existing.revision; -- exact replay is idempotent
  end if;
  next_revision:=coalesce(existing.revision,0)+1;
  if found then
    insert into public.signal_publication_history(
      week_start,revision,payload,captured_at,status,published
    ) values(existing.week_start,existing.revision,existing.payload,
             existing.captured_at,existing.status,existing.published);
    update public.signal_published_reports
      set status=p_status,data_through=p_data_through,captured_at=p_captured_at,
          payload=p_payload,published=p_published,revision=next_revision,updated_at=now()
      where week_start=p_week;
  else
    insert into public.signal_published_reports(
      week_start,week_end,status,data_through,captured_at,payload,published,revision
    ) values (p_week,p_week+6,p_status,p_data_through,p_captured_at,p_payload,p_published,1);
  end if;
  insert into public.signal_publication_runs(
    week_start,captured_at,revision,post_count,channel_count,status
  ) values(p_week,p_captured_at,next_revision,jsonb_array_length(p_payload->'posts'),
           jsonb_array_length(p_payload->'channels'),p_status);
  return next_revision;
end;
$function$

revoke all on function public.publish_signal_week(date,timestamptz,text,date,jsonb,boolean)
  from PUBLIC,anon,authenticated;
commit;
