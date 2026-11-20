import test from "node:test";
import assert from "node:assert/strict";
import {writeWeekIntro} from "../app/frew/frew-voice.ts";

const post=(title,views,account="@opusplasticsurgery")=>({
  id:title,date:"2026-11-18",platform:"Instagram",account,format:"Reel",
  title,url:null,views,likes:0,comments:0,shares:0,saves:0,status:null,ctaChecked:null,complianceChecked:null
});
const channel=(platform,metric,value)=>({
  platform,account:"OPUS",period:"Nov 16–18",
  source:"metricool",metrics:[{label:metric,value}]
});
test("plain intro uses selected week, not auto-generated overview and not another Instagram account",()=>{
  const intro=writeWeekIntro([
    post("Dr. Frew + Tamara Q&A",1458),
    post("How do breast implants fit?",1039),
    post("Other account",9999,"@dr.frew")
  ],[channel("Google Ads","Conversions",5)]);
  assert.equal(intro.headline,"Google Ads recorded 5 conversions.");
  assert.match(intro.summary,/not confirmed consult bookings/);
  assert.match(intro.summary,/Dr. Frew \+ Tamara Q&A/);
  assert.doesNotMatch(intro.summary,/Other account/);
  assert.match(intro.next,/Aesthetix/);
});
test("zero is measured, null is unknown",()=>{
  assert.match(writeWeekIntro([], [channel("Google Ads","Conversions",0)]).headline,/0 conversions/);
  assert.doesNotMatch(writeWeekIntro([], [channel("Google Ads","Conversions",null)]).headline,/0 conversions/);
});
test("Meta leads are not treated as confirmed bookings",()=>{
  const intro=writeWeekIntro([], [channel("Meta Ads","Leads",4)]);
  assert.match(intro.headline,/4 leads/);
  assert.match(intro.summary,/not a count of booked consults/);
});
test("only sourced, week-scoped post data appears in intro",()=>{
  const intro=writeWeekIntro([post("Scar tissue explainer",251)],[]);
  assert.match(intro.headline,/Scar tissue explainer/);
  assert.doesNotMatch(intro.summary,/Google Ads/);
});
