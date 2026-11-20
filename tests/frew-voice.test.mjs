import test from "node:test";
import assert from "node:assert/strict";
import {writeWeekIntro} from "../app/frew/frew-voice.ts";

const post=(title,views,account="@opusplasticsurgery",platform="Instagram",format="Reel")=>({
  id:title,date:"2026-11-18",platform,account,format,title,url:null,views,
  likes:0,comments:0,shares:0,saves:0,status:null,ctaChecked:null,complianceChecked:null
});
const channel=(platform,metric,value,period="Nov 16–18",account="OPUS")=>({
  platform,account,period,source:"metricool",metrics:[{label:metric,value}]
});
test("Nov 16: patient education and team are the story, not clicks or views",()=>{
  const x=writeWeekIntro([
    post("Dr. Frew + Tamara: office Q&A",1458),
    post("How do breast implants fit?",1039),
    post("Why does one implant feel harder?",343,"@opusplasticsurgery","Instagram","Carousel"),
    post("Other account",5000,"@dr.frew")
  ],[channel("Google Ads","Conversions",5)]);
  assert.match(x.headline,/office Q&A and two implant explainers/);
  assert.doesNotMatch(x.headline,/views|Google|conversion/i);
  assert.match(x.summary,/2 Reels and 1 carousel/);
  assert.match(x.summary,/5 conversions/);
  assert.match(x.summary,/doesn't show how many inquiries actually booked/);
  assert.doesNotMatch(x.summary,/1,458|5,000/);
  assert.match(x.next,/Tamara/);
});
test("Nov 9: talks about surgical topics rather than vanity metrics",()=>{
  const x=writeWeekIntro([
    post("What a scar can't show",1459),
    post("Why your belly is still bulging",937,"@opusplasticsurgery","Instagram","Carousel"),
    post("What you want to keep",555)
  ],[channel("Google Ads","Conversions",2)]);
  assert.match(x.headline,/scars and why the belly can still bulge/);
  assert.doesNotMatch(x.headline,/views|conversions/);
});
test("Nov 2: introducing Tamara is a work update, not a views leaderboard",()=>{
  const x=writeWeekIntro([
    post("Meet Tamara",1628),
    post("Lipo + tummy tuck",1133)
  ],[channel("Meta Ads","Leads",4)]);
  assert.match(x.headline,/introduced Tamara/);
  assert.match(x.summary,/4 leads/);
  assert.doesNotMatch(x.headline,/views|Meta/);
});
test("positive Meta leads outrank a partial Google zero in supporting copy",()=>{
  const x=writeWeekIntro([post("Meet Tamara",1628)],[
    channel("Google Ads","Conversions",0,"Nov 2–3"),
    channel("Meta Ads","Leads",4,"Nov 2–8")
  ]);
  assert.match(x.summary,/4 leads/);
  assert.doesNotMatch(x.summary,/Google Ads/);
});
test("no post data does not turn advertising into the headline",()=>{
  const x=writeWeekIntro([], [channel("Google Ads","Conversions",3)]);
  assert.match(x.headline,/inquiries and bookings/);
  assert.match(x.summary,/3 conversions/);
});
test("a missing metric is never a zero or a booking",()=>{
  const x=writeWeekIntro([],[channel("Google Ads","Conversions",null)]);
  assert.doesNotMatch(x.summary,/0 conversions/);
  assert.match(x.summary,/doesn't show how many inquiries actually booked/);
});
test("audience from unrelated account never changes editorial topic",()=>{
  const x=writeWeekIntro([post("Outside account",10000,"@dr.frew")],[]);
  assert.doesNotMatch(x.headline,/Outside account/);
});
