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
