import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../supabase/migrations/20261120201500_signal_attribution_analysis.sql",import.meta.url),"utf8");
test("public publisher whitelist exposes only vetted aggregate analysis shapes",()=>{
  assert.match(sql,/unrecognized analysis field/);
  assert.match(sql,/unrecognized contact aggregate field/);
  assert.match(sql,/unrecognized opportunity aggregate field/);
  assert.match(sql,/unrecognized campaign reconciliation field/);
  assert.match(sql,/unrecognized editorial finding field/);
  assert.match(sql,/where k not in \('asOf','scope','source','routes','websiteFirstTouch','analysis','finding','decision'\)/);
  assert.doesNotMatch(sql,/patient_name|patient_email|patient_phone/i);
});
test("trusted publisher remains invoker-only, not anonymous callable",()=>{
  assert.doesNotMatch(sql,/security definer/i);
  assert.match(sql,/revoke all on function public\.publish_signal_week/);
  assert.match(sql,/from PUBLIC,anon,authenticated/);
});
