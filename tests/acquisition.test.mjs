import test from "node:test";
import assert from "node:assert/strict";
import {parsePublicAcquisition} from "../lib/signal/acquisition.ts";

const valid=()=>({
 asOf:"2026-11-20",scope:"historical_cohort",source:"Aesthetix export · Nov 20",
 routes:[
  {route:"Meta First Access",evidence:"campaign_tag",contacts:36,
   stages:[{stage:"Cold",contacts:21},{stage:"Lead",contacts:15}]},
  {route:"Google Ads",evidence:"google_click_id",contacts:11,
   stages:[{stage:"Lead",contacts:7},{stage:"Replied",contacts:4}]},
  {route:"Instagram bio link",evidence:"tracked_link",contacts:6,
   stages:[{stage:"Consultation stage",contacts:5}]},
  {route:"Website First Access",evidence:"first_session",contacts:32}
 ],
 websiteFirstTouch:[
  {channel:"Paid Search",contacts:12},{channel:"Social media",contacts:9},
  {channel:"Organic Search",contacts:9},{channel:"Direct traffic",contacts:2}
 ],
 finding:"Historical first-touch records identify several routes; they cannot be summed.",
 decision:"Audit Meta human replies before scaling native forms."
});
test("accepts a safe historical CRM cohort without implying weekly bookings",()=>{
 const p=parsePublicAcquisition(valid());assert.ok(p);
 assert.equal(p.routes[0].contacts,36);assert.equal(p.websiteFirstTouch.reduce((sum,x)=>sum+x.contacts,0),32);
});
test("rejects contact-level columns, names, identifiers and unsafe text",()=>{
 for(const extra of [{email:"person@example.com"},{contactId:"abc"},{phone:"555-555-0101"}]){
  const p=valid();Object.assign(p.routes[0],extra);assert.equal(parsePublicAcquisition(p),null);
 }
 const p=valid();p.finding="Email bob@example.com for records";assert.equal(parsePublicAcquisition(p),null);
});
test("rejects cross-route duplicates and incorrectly classified evidence",()=>{
 const p=valid();p.routes.push({...p.routes[0]});assert.equal(parsePublicAcquisition(p),null);
 const q=valid();q.routes[1].evidence="campaign_tag";assert.equal(parsePublicAcquisition(q),null);
});
test("rejects stage sums greater than contact cohorts and noninteger counts",()=>{
 const p=valid();p.routes[0].stages[0].contacts=37;assert.equal(parsePublicAcquisition(p),null);
 const q=valid();q.routes[0].contacts=2.5;assert.equal(parsePublicAcquisition(q),null);
});
test("rejects malformed dates and misdescribed weekly scope",()=>{
 const p=valid();p.scope="weekly";assert.equal(parsePublicAcquisition(p),null);
 const q=valid();q.asOf="2026-02-30";assert.equal(parsePublicAcquisition(q),null);
});
