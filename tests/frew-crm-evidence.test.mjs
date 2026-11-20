import test from "node:test";
import assert from "node:assert/strict";
import {parseCRMClinicalSnapshot,parseCRMConsultWeeks} from "../lib/signal/read-crm-evidence.ts";

const raw={
  snapshot_date:"2026-11-20",
  contact_total:241,paid_search_first_session:14,google_gclid_contacts:12,google_v02_campaign_contacts:12,
  google_matched_contacts:11,google_matched_week_contacts:9,google_matched_lead_stage:6,
  google_matched_replied_stage:5,google_matched_dated_consults:0,
  consult_booked_stage:12,consult_booked_dated:10,consult_booked_without_dated:2,
  consult_complete_stage:15,consult_complete_last_visit:15,
  surgery_scheduled_stage:11,surgery_scheduled_dated:11,
  appointment_field_records:34,appointment_date_disagreements:5,
  upcoming_consults:10,upcoming_confirmed:1,upcoming_unconfirmed:9,
  upcoming_website_route:7,upcoming_other_routes:3
};
const weeks=[
  {snapshot_date:"2026-11-20",week_start:"2026-11-23",scheduled_count:3,confirmed_count:1,unconfirmed_count:2,website_route_count:3,other_route_count:0},
  {snapshot_date:"2026-11-20",week_start:"2026-11-30",scheduled_count:5,confirmed_count:0,unconfirmed_count:5,website_route_count:2,other_route_count:3},
  {snapshot_date:"2026-11-20",week_start:"2026-12-07",scheduled_count:2,confirmed_count:0,unconfirmed_count:2,website_route_count:2,other_route_count:0}
];
test("clinic snapshot validates and remains aggregate-only",()=>{
  const s=parseCRMClinicalSnapshot(raw);
  assert.ok(s);
  assert.equal(s.contactTotal,241);
  assert.equal(s.googleMatchedContacts,11);
  assert.equal(s.googleMatchedWeekContacts,9);
  assert.equal(s.consultBookedStage,12);
  assert.equal(s.consultBookedDated,10);
  assert.equal(s.upcomingUnconfirmed,9);
  assert.equal(Object.keys(s).some(k=>/^(firstName|lastName|contactId|email|phone|patientName|message|notes|gclidValue)$/i.test(k)),false);
});
test("upcoming consultations are grouped into dated appointment weeks",()=>{
  const s=parseCRMClinicalSnapshot(raw);
  assert.ok(s);
  const parsed=parseCRMConsultWeeks(weeks,s);
  assert.deepEqual(parsed.map(x=>[x.weekStart,x.scheduled,x.confirmed]),[
    ["2026-11-23",3,1],["2026-11-30",5,0],["2026-12-07",2,0]
  ]);
});
test("invalid or mismatched CRM snapshots never render as reliable results",()=>{
  assert.equal(parseCRMClinicalSnapshot({...raw,google_matched_contacts:15}),null);
  assert.equal(parseCRMClinicalSnapshot({...raw,consult_booked_dated:12}),null);
  assert.equal(parseCRMClinicalSnapshot({...raw,upcoming_unconfirmed:10}),null);
  const s=parseCRMClinicalSnapshot(raw);
  assert.ok(s);
  assert.equal(parseCRMConsultWeeks(weeks.slice(1),s),null);
  assert.equal(parseCRMConsultWeeks([{...weeks[0],week_start:"2026-11-24"},...weeks.slice(1)],s),null);
  assert.equal(parseCRMConsultWeeks([{...weeks[0],confirmed_count:2},...weeks.slice(1)],s),null);
  assert.equal(parseCRMConsultWeeks([...weeks,weeks[0]],s),null);
});
