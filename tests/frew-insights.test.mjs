import test from "node:test";
import assert from "node:assert/strict";
import {buildExecutivePulse} from "../app/frew/frew-insights.ts";

const post=(id,platform,account,format,views,interactions,date="2026-11-18")=>({
  id,date,platform,account,format,title:id,url:null,views,
  interactions,likes:null,comments:null,shares:null,saves:null,
  status:null,ctaChecked:null,complianceChecked:null
});
const channel=(platform,metrics,account="OPUS Search")=>({
  platform,account,source:"metricool",period:"Nov 16–18",
  metrics:Object.entries(metrics).map(([label,value])=>({label,value}))
});
test("executive paid actions remain separate from unverified bookings",()=>{
  const v=buildExecutivePulse([post("a","Instagram","@opusplasticsurgery","Reel",120,8)],
    [channel("Google Ads",{Conversions:5,"Cost / conversion":15.26,Spend:76.28})]);
  assert.equal(v.metrics[0].value,null);
  assert.equal(v.metrics[1].value,null);
  assert.equal(v.metrics[2].value,1);
  assert.equal(v.metrics[3].value,5);
  assert.match(v.action,/Tamara/);
});
test("cadence uses only the requested OPUS account and weekday Story dates",()=>{
  const posts=[
    post("reel1","Instagram","@opusplasticsurgery","Reel",1458,40),
    post("reel2","Instagram","@opusplasticsurgery","Reel",1039,33),
    post("other","Instagram","@dr.frew","Reel",3000,20),
    post("c","Instagram","@opusplasticsurgery","Carousel",343,null),
    post("s1","Instagram","@opusplasticsurgery","Story",100,null,"2026-11-16"),
    post("s2","Instagram","@opusplasticsurgery","Story",80,null,"2026-11-16"),
    post("s3","Instagram","@opusplasticsurgery","Story",90,null,"2026-11-17"),
    post("weekend","Instagram","@opusplasticsurgery","Story",50,null,"2026-11-21")
  ];
  const p=buildExecutivePulse(posts,[]);
  assert.equal(p.primary[0].observed,2);
  assert.equal(p.primary[1].observed,1);
  assert.equal(p.primary[2].observed,2);
  assert.equal(p.secondary[0].observed,null);
  assert.equal(p.secondary[1].observed,null);
  assert.match(p.published.headline,/3 Instagram posts/);
  assert.match(p.published.detail,/reel1|reel2|c/);
});
test("empty channels are unverified rather than measured zero",()=>{
  const v=buildExecutivePulse([],[]);
  assert.equal(v.metrics[0].value,null);
  assert.equal(v.metrics[1].value,null);
  assert.equal(v.metrics[2].value,null);
  assert.equal(v.secondary[3].observed,null);
  assert.equal(v.verification.checked,0);
});
test("measured zero actions preserve zero without inventing cost",()=>{
  const v=buildExecutivePulse([], [channel("Google Ads",{Conversions:0,Spend:15.50})]);
  assert.equal(v.metrics[0].value,null);
  assert.equal(v.metrics[1].value,null);
  assert.equal(v.metrics[3].value,0);
});

test("positive Meta leads appear ahead of unrelated zero Google conversions",()=>{
  const v=buildExecutivePulse([],[
    channel("Google Ads",{Conversions:0}),
    channel("Meta Ads",{Leads:4})
  ]);
  assert.equal(v.metrics[3].label,"META LEADS");
  assert.equal(v.metrics[3].value,4);
});
