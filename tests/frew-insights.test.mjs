import test from "node:test";
import assert from "node:assert/strict";
import {buildExecutivePulse} from "../app/frew/frew-insights.ts";

const post=(id,platform,account,format,views,date="2026-11-18")=>({
  id,date,platform,account,format,title:id,url:null,views,
  likes:null,comments:null,shares:null,saves:null,
  status:null,ctaChecked:null,complianceChecked:null
});
const channel=(platform,metrics,account="OPUS Search")=>({
  platform,account,source:"metricool",period:"Nov 16–18",
  metrics:Object.entries(metrics).map(([label,value])=>({label,value}))
});
test("paid actions do not turn into confirmed consults",()=>{
  const p=buildExecutivePulse([post("a","Instagram","@opusplasticsurgery","Reel",120)],
    [channel("Google Ads",{Conversions:5,"Cost / conversion":15.26,Spend:76.28})]);
  assert.equal(p.metrics[0].value,null);
  assert.equal(p.metrics[1].value,null);
  assert.equal(p.metrics[2].value,1);
  assert.equal(p.metrics[3].value,5);
  assert.match(p.action,/Aesthetix/);
});
test("published posts are scoped to the OPUS account and show factual dates",()=>{
  const p=buildExecutivePulse([
    post("opus-reel","Instagram","@opusplasticsurgery","Reel",1458,"2026-11-18"),
    post("other-account","Instagram","@dr.frew","Reel",3000,"2026-11-18"),
    post("opus-carousel","Instagram","@opusplasticsurgery","Carousel",343,"2026-11-19"),
    post("opus-story","Instagram","@opusplasticsurgery","Story",100,"2026-11-19")
  ],[]);
  assert.equal(p.metrics[2].value,2);
  assert.match(p.published.headline,/2 Instagram posts/);
  assert.match(p.published.detail,/2026-11-19 · opus-carousel/);
  assert.doesNotMatch(p.published.detail,/other-account|opus-story/);
});
test("no publication attendance targets, status or skipped-post classifications survive",()=>{
  const p=buildExecutivePulse([],[]);
  for(const field of ["primary","secondary","verification","cadence","score","late","skipped"]){
    assert.equal(Object.hasOwn(p,field),false,field);
  }
  assert.equal(p.metrics[2].value,null);
});
test("unknown results remain distinct from measured zero",()=>{
  const unknown=buildExecutivePulse([],[]);
  const zero=buildExecutivePulse([],[channel("Google Ads",{Conversions:0})]);
  assert.equal(unknown.metrics[3].value,null);
  assert.equal(zero.metrics[3].value,0);
});
test("a positive Meta lead count is not obscured by Google zero from another window",()=>{
  const p=buildExecutivePulse([],[
    channel("Google Ads",{Conversions:0}),channel("Meta Ads",{Leads:4})
  ]);
  assert.equal(p.metrics[3].label,"META LEADS");
  assert.equal(p.metrics[3].value,4);
});
test("story replies are a measured response, not proof of bookings",()=>{
  const p=buildExecutivePulse([],[
    channel("Instagram",{"Story replies":6},"@opusplasticsurgery")
  ]);
  assert.match(p.conversation.headline,/6 Story replies/);
  assert.equal(p.metrics[0].value,null);
});
