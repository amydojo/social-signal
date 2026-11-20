-- Private, aggregate-only reconciliation for practice leadership.
-- No patient/lead identities, phone numbers, email addresses or notes.
begin;

create table if not exists public.signal_owner_outcomes (
  week_start date primary key,
  inquiries_received integer check (inquiries_received is null or inquiries_received>=0),
  qualified_inquiries integer check (qualified_inquiries is null or qualified_inquiries>=0),
  consultations_requested integer check (consultations_requested is null or consultations_requested>=0),
  consultations_booked integer check (consultations_booked is null or consultations_booked>=0),
  checked_at timestamptz not null default now(),
  checked_by uuid not null references auth.users(id),
  constraint owner_outcomes_week_is_monday check (extract(isodow from week_start)=1)
);
alter table public.signal_owner_outcomes enable row level security;
revoke all on table public.signal_owner_outcomes from PUBLIC,anon,authenticated;
grant select,insert,update on table public.signal_owner_outcomes to authenticated;

create policy "Owners read aggregate consultation verification"
on public.signal_owner_outcomes for select to authenticated
using (exists (
  select 1 from public.signal_members m
  where m.user_id=(select auth.uid()) and m.role='owner'
));

create policy "Owners record aggregate consultation verification"
on public.signal_owner_outcomes for insert to authenticated
with check (
  checked_by=(select auth.uid())
  and exists (
    select 1 from public.signal_members m
    where m.user_id=(select auth.uid()) and m.role='owner'
  )
);

create policy "Owners update aggregate consultation verification"
on public.signal_owner_outcomes for update to authenticated
using (exists (
  select 1 from public.signal_members m
  where m.user_id=(select auth.uid()) and m.role='owner'
))
with check (
  checked_by=(select auth.uid())
  and exists (
    select 1 from public.signal_members m
    where m.user_id=(select auth.uid()) and m.role='owner'
  )
);
comment on table public.signal_owner_outcomes is
  'Owner-only weekly aggregate consultation counts manually checked in Aesthetix. Never exposed through public SIGNAL publication. No patient-level data.';
commit;
