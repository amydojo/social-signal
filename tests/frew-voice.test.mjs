import test from "node:test";
import assert from "node:assert/strict";
import {writeWeekIntro} from "../app/frew/frew-voice.ts";

const post=(title,views,account="@opusplasticsurgery",platform="Instagram",format="Reel")=>({
  id:title,date:"2026-11-18",platform,account,format,
  title,url:null,views,likes:0,comments:0,shares:0,saves:0,status:null,ctaChecked:null,complianceChecked:null
});
const channel=(platform,metric,value,period="Nov 16–18",account="OPUS")=>({
  platform,account,period,source:"metricool",metrics:[{label:metric,value}]
});
test("Nov 16: team Q&A headlines, Google Ads is a supporting fact",()=>{
  const intro=writeWeekIntro([
    post("Dr. Frew + Tamara: office Q&A",1458),
    post("How do breast implants fit?",1039),
    post("Why does one implant feel harder?",343,"@opusplasticsurgery","Instagram","Carousel"),
    post("Another account",5000,"@dr.frew")
  ],[channel("Google Ads","Conversions",5)]);
  assert.match(intro.headline,/Frew and Tamara.*Q&A/);
  assert.doesNotMatch(intro.headline,/Google Ads/);
  assert.match(intro.summary,/1,458/);
  assert.match(intro.summary,/How do breast implants fit/);
  assert.match(intro.summary,/5 conversions/);
  assert.doesNotMatch(intro.summary,/Another account/);
  assert.match(intro.next,/Aesthetix/);
});
test("Nov 9: scar Reel headlines even though Google Ads reports two conversions",()=>{
  const intro=writeWeekIntro([
    post("What a scar can't show",1459),
    post("Why your belly is still bulging",937,"@opusplasticsurgery","Instagram","Carousel")
  ],[channel("Google Ads","Conversions",2,"Nov 10–15 · partial")]);
  assert.match(intro.headline,/scar Reel/);
  assert.match(intro.summary,/937/);
  assert.match(intro.summary,/Nov 10–15/);
});
test("Nov 2: team intro leads, and Meta's four leads beat Google's zero",()=>{
  const intro=writeWeekIntro([
    post("Meet Tamara",1628),
    post("Before-and-after: beyond the photo",1176,"@opusplasticsurgery","Instagram","Carousel")
  ],[
    channel("Google Ads","Conversions",0,"Nov 2–3 only"),
    channel("Meta Ads","Leads",4,"Nov 2–8")
  ]);
  assert.match(intro.headline,/Meet Tamara/);
  assert.match(intro.summary,/4 leads/);
  assert.doesNotMatch(intro.summary,/no conversions/);
});
test("measured zero and missing ad values remain different",()=>{
  const zero=writeWeekIntro([], [channel("Google Ads","Conversions",0)]);
  const missing=writeWeekIntro([], [channel("Google Ads","Conversions",null)]);
  assert.match(zero.headline,/no conversions/);
  assert.doesNotMatch(missing.headline,/conversions/);
  assert.match(missing.headline,/gathering/);
});
test("a measured TikTok post can headline without mixing platform views",()=>{
  const intro=writeWeekIntro([
    post("OPUS behind the scenes",829,"@opusplasticsurgery","TikTok","Video"),
    post("Dr Frew post",2000,"@drtylerfrew","TikTok","Video")
  ],[channel("Google Ads","Conversions",3)]);
  assert.match(intro.headline,/OPUS behind the scenes/);
  assert.match(intro.headline,/TikTok/);
  assert.doesNotMatch(intro.summary,/2,000/);
});
test("Story replies can headline if post metrics are missing",()=>{
  const intro=writeWeekIntro([], [
    channel("Instagram","Story replies",6,"Nov 9–15","@opusplasticsurgery"),
    channel("Google Ads","Conversions",2)
  ]);
  assert.match(intro.headline,/Stories got 6 replies/);
  assert.match(intro.summary,/2 conversions/);
});
test("zero-view content does not become a fake creative winner",()=>{
  const intro=writeWeekIntro([post("Not viewed",0)],[]);
  assert.doesNotMatch(intro.headline,/Not viewed/);
});
