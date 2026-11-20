-- OPUS SIGNAL — controlled public reporting boundary.
-- The existing signal_* source tables remain members-only. Only intentionally
-- published, aggregate/post-level editorial data is readable without login.
begin;

create table if not exists public.signal_published_reports (
  week_start date primary key,
  week_end date not null,
  status text not null check (status in ('in_progress','complete')),
  data_through date,
  captured_at timestamptz not null,
  schema_version smallint not null default 1 check (schema_version=1),
  revision integer not null default 1 check (revision>=1),
  published boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_week_is_monday check (extract(isodow from week_start)=1),
  constraint published_week_is_seven_days check (week_end=week_start+6),
  constraint published_through_bounded check (data_through is null or (data_through>=week_start and data_through<=week_end)),
  constraint published_payload_structure check (
    jsonb_typeof(payload)='object'
    and jsonb_typeof(payload->'posts')='array'
    and jsonb_typeof(payload->'channels')='array'
    and jsonb_array_length(payload->'posts')<=400
    and jsonb_array_length(payload->'channels')<=40
    and pg_column_size(payload)<=524288
  )
);
create index if not exists signal_published_reports_visible_idx
  on public.signal_published_reports(week_start desc)
  where published=true;

alter table public.signal_published_reports enable row level security;
revoke all on public.signal_published_reports from PUBLIC,anon,authenticated;
grant select (week_start,week_end,status,data_through,captured_at,schema_version,revision,published,payload)
  on public.signal_published_reports to anon,authenticated;
create policy "Only editorially published weekly reports are public"
  on public.signal_published_reports for select to anon,authenticated
  using (published=true);

-- Immutable previous versions are retained for owner review and recovery.
create table if not exists public.signal_publication_history (
  week_start date not null,
  revision integer not null,
  payload jsonb not null,
  captured_at timestamptz not null,
  status text not null,
  published boolean not null,
  archived_at timestamptz not null default now(),
  primary key(week_start,revision)
);
alter table public.signal_publication_history enable row level security;
revoke all on public.signal_publication_history from PUBLIC,anon,authenticated;

create table if not exists public.signal_publication_runs (
  id bigint generated always as identity primary key,
  week_start date not null,
  attempted_at timestamptz not null default now(),
  captured_at timestamptz not null,
  revision integer not null,
  post_count integer not null,
  channel_count integer not null,
  status text not null check(status in ('in_progress','complete'))
);
alter table public.signal_publication_runs enable row level security;
revoke all on public.signal_publication_runs from PUBLIC,anon,authenticated;

-- Writes are not API-accessible. This function uses the caller's privileges:
-- trusted connected SQL publishing only, no service role in client or Vercel.
create or replace function public.publish_signal_week(
  p_week date, p_captured_at timestamptz, p_status text,
  p_data_through date, p_payload jsonb, p_published boolean default true
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
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
    or jsonb_typeof(p_payload->'posts')<>'array'
    or jsonb_typeof(p_payload->'channels')<>'array'
    or jsonb_array_length(p_payload->'posts')>400
    or jsonb_array_length(p_payload->'channels')>40
    or pg_column_size(p_payload)>524288
  then
    raise exception 'invalid public payload';
  end if;
  -- Never publish arbitrary source tables, raw account export rows or CRM data.
  if exists (
    select 1 from jsonb_object_keys(p_payload) k
    where k not in ('posts','channels','overview','diagnostics','coverage')
  ) then
    raise exception 'unrecognized top-level public field';
  end if;
  select * into existing from public.signal_published_reports
    where week_start=p_week for update;
  if found and p_captured_at<existing.captured_at then
    raise exception 'stale capture: newer report is already published';
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
$$;

revoke all on function public.publish_signal_week(date,timestamptz,text,date,jsonb,boolean)
  from PUBLIC,anon,authenticated;
comment on table public.signal_published_reports is
  'Explicitly approved public-safe weekly reporting payloads only. Source tables remain RLS-private; no CRM or internal account notes.';
comment on function public.publish_signal_week(date,timestamptz,text,date,jsonb,boolean) is
  'Trusted publisher. Atomic revision history, idempotence and stale-capture refusal. Never callable by site visitors.';
commit;
