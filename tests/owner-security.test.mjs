import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("private outcomes schema denies anonymous clients and requires owner membership",()=>{
  const sql=readFileSync(new URL("../supabase/migrations/20261120043000_signal_owner_outcomes.sql",import.meta.url),"utf8");
  assert.match(sql,/enable row level security/);
  assert.match(sql,/revoke all on table public.signal_owner_outcomes from PUBLIC,anon,authenticated/);
  assert.match(sql,/to authenticated/);
  assert.match(sql,/m.role='owner'/);
  assert.doesNotMatch(sql,/grant[^;]+to anon/);
  assert.match(sql,/checked_by=\(select auth.uid\(\)\)/);
  assert.doesNotMatch(sql,/patient_name|patient_email|patient_phone/);
});
test("public Week reader does not import or query the private outcomes table",()=>{
  const read=readFileSync(new URL("../lib/signal/read-public.ts",import.meta.url),"utf8");
  const route=readFileSync(new URL("../app/api/publications/route.ts",import.meta.url),"utf8");
  assert.doesNotMatch(read+route,/signal_owner_outcomes/);
});


test("anonymous outcomes report has no protected table or editable form",()=>{
  const page=readFileSync(new URL("../app/frew/owner/page.tsx",import.meta.url),"utf8");
  assert.match(page,/loadPublishedWeeksWithState/);
  assert.doesNotMatch(page,/createSignalServerClient|auth\.getUser|signal_owner_outcomes|signal_members|saveOwnerCounts/);
  assert.doesNotMatch(page,/<form|type="submit"/);
  assert.match(page,/No confirmed CRM outcome totals/);
});
test("old sign-in link resolves to the public reporting route",()=>{
  const login=readFileSync(new URL("../app/frew/owner/login/page.tsx",import.meta.url),"utf8");
  assert.match(login,/redirect\("\/frew\/owner"\)/);
  assert.doesNotMatch(login,/requestOwnerLink|signInWithOtp/);
});
test("private outcome writes remain owner-only",()=>{
  const act=readFileSync(new URL("../app/frew/owner/actions.ts",import.meta.url),"utf8");
  assert.match(act,/supabase\.auth\.getUser\(\)/);
  assert.match(act,/member\?\.role!=="owner"/);
});

test("public publication accepts only whitelisted CRM aggregates, not private records",()=>{
  const sql=readFileSync(new URL("../supabase/migrations/20261120195000_signal_public_outcomes.sql",import.meta.url),"utf8");
  assert.match(sql,/unrecognized public outcomes field/);
  assert.match(sql,/Aesthetix verified aggregate/);
  assert.match(sql,/jsonb_set\(p_payload,'\{outcomes\}'/);
  assert.doesNotMatch(sql,/grant\s+select\s+on\s+public\.signal_owner_outcomes\s+to\s+anon/i);
});
