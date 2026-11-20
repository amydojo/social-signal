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

test("open owner testing page never loads or publishes private CRM outcomes",()=>{
  const page=readFileSync(new URL("../app/frew/owner/page.tsx",import.meta.url),"utf8");
  const preview=readFileSync(new URL("../app/frew/owner/owner-preview.tsx",import.meta.url),"utf8");
  const middleware=readFileSync(new URL("../middleware.ts",import.meta.url),"utf8");
  assert.match(page,/loadPublishedWeeksWithState/);
  assert.doesNotMatch(page,/signal_owner_outcomes|createSignalServerClient|saveOwnerCounts|signal_members/);
  assert.doesNotMatch(preview,/signal_owner_outcomes|fetch\(|localStorage|sessionStorage|saveOwnerCounts/);
  assert.match(preview,/Testing mode · not real CRM data/);
  assert.match(preview,/Nothing has been saved/);
  assert.match(middleware,/request\.nextUrl\.pathname==="\/frew\/owner"/);
});
test("the private weekly write action still checks both authentication and owner membership",()=>{
  const actions=readFileSync(new URL("../app/frew/owner/actions.ts",import.meta.url),"utf8");
  assert.match(actions,/supabase\.auth\.getUser\(\)/);
  assert.match(actions,/member\?\.role!=="owner"/);
  assert.match(actions,/from\("signal_owner_outcomes"\)/);
});

test("legacy owner sign-in route is now just a redirect to public preview",()=>{
  const login=readFileSync(new URL("../app/frew/owner/login/page.tsx",import.meta.url),"utf8");
  assert.match(login,/redirect\("\/frew\/owner"\)/);
  assert.doesNotMatch(login,/signInWithOtp|requestOwnerLink|createSignalServerClient/);
});
