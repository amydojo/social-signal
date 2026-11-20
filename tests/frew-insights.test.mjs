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
test("both Google and Meta appear as separate paid measurement units",()=>{
  const p=buildExecutivePulse([],[
    channel("Google Ads",{Conversions:5}),channel("Meta Ads",{Leads:4,Impressions:200})
  ]);
  assert.equal(p.paid.google.value,5);
  assert.equal(p.paid.meta.value,4);
  assert.equal(p.metrics[0].value,null);
  assert.equal(p.metrics[1].value,null);
});
test("zero Meta delivery does not manufacture zero form leads",()=>{
  const p=buildExecutivePulse([],[
    channel("Google Ads",{Conversions:5}),channel("Meta Ads",{Impressions:0,Spend:0})
  ]);
  assert.equal(p.paid.meta.value,null);
  assert.match(p.paid.meta.note,/0 reported impressions/);
});
test("posts are OPUS scoped and dated",()=>{
  const p=buildExecutivePulse([
    post("reel","Instagram","@opusplasticsurgery","Reel",120,"2026-11-18"),
    post("other","Instagram","@dr.frew","Reel",1400),
    post("carousel","Instagram","@opusplasticsurgery","Carousel",343,"2026-11-19"),
    post("story","Instagram","@opusplasticsurgery","Story",50)
  ],[]);
  assert.match(p.published.headline,/2 Instagram posts/);
  assert.match(p.published.detail,/2026-11-19 · carousel/);
  assert.doesNotMatch(p.published.detail,/other|story/);
});
test("no punctuality, posting quota, or attendance scoring",()=>{
  const p=buildExecutivePulse([],[]);
  for(const field of ["primary","secondary","verification","cadence","score","late","skipped"])
    assert.equal(Object.hasOwn(p,field),false);
});
test("only reviewed editorial can supersede the generic decision",()=>{
  const base={statement:"Follow-up needs checking",summary:"Older contacts are not new inquiries",
    action:"Review Meta replies before scaling",indicators:[]};
  const reviewed=buildExecutivePulse([],[],{...base,reviewedAt:"2026-11-20"});
  assert.match(reviewed.action,/Review Meta replies/);
  const plain=buildExecutivePulse([],[channel("Google Ads",{Conversions:5})],base);
  assert.match(plain.action,/Match Google conversion actions/);
});
test("story replies are not appointments",()=>{
  const p=buildExecutivePulse([],[channel("Instagram",{"Story replies":6},"@opusplasticsurgery")]);
  assert.match(p.conversation.headline,/6 Story replies/);
  assert.equal(p.metrics[1].value,null);
});
