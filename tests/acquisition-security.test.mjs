import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("CRM aggregate import table is outside public schema and inaccessible to anonymous API roles",()=>{
  const sql=read("supabase/migrations/20261120193000_signal_acquisition_intelligence.sql");
  assert.match(sql,/create schema if not exists signal_private/i);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/revoke all on schema signal_private from PUBLIC,anon,authenticated/i);
  assert.match(sql,/revoke all on table signal_private\.acquisition_snapshots from PUBLIC,anon,authenticated/i);
  assert.doesNotMatch(sql,/grant\s+(?:all|select|insert)[^;]+\s+to\s+anon/i);
});
test("published aggregate is key-whitelisted and raw CRM identifiers are not in schema",()=>{
  const sql=read("supabase/migrations/20261120193000_signal_acquisition_intelligence.sql");
  assert.match(sql,/where k not in \('asOf','scope','source','routes','websiteFirstTouch','finding','decision'\)/);
  assert.match(sql,/where k\.key not in \('route','evidence','contacts','stages'\)/);
  assert.doesNotMatch(sql,/patient_name|patient_email|patient_phone|contact_id/i);
});
test("the anonymous reader never touches the private acquisition source",()=>{
  const publicRead=read("lib/signal/read-public.ts");
  const publicRoute=read("app/api/publications/route.ts");
  assert.doesNotMatch(publicRead+publicRoute,/signal_private\.acquisition_snapshots/);
});
