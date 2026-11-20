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
    action:"Review Meta replies before scaling",deck:"The reviewed week summary.",indicators:[]};
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

test("reviewed contact-created evidence fills the weekly lead card, never bookings",()=>{
  const reviewed={statement:"CRM intake evidence",summary:"Fifteen lead contacts.",
    action:"Review appointments",reviewedAt:"2026-11-20",
    indicators:[
      {label:"New CRM lead contacts",value:15,
       detail:"Nov 16–19 · 10 Website First Access, 3 Instagram DM, 2 4D Direct"},
      {label:"Website open opportunities at booked+ stage",value:14,
       detail:"Historical CRM-stage snapshot only"}
    ]};
  const p=buildExecutivePulse([],[],reviewed);
  assert.equal(p.metrics[0].value,15);
  assert.equal(p.metrics[0].label,"NEW INQUIRIES");
  assert.match(p.metrics[0].detail,/Nov 16–19/);
  assert.equal(p.metrics[1].value,null);
  assert.match(p.metrics[1].detail,/not yet available/);
});
test("verified surgical consultation stage is displayed as a stage snapshot",()=>{
  const reviewed={statement:"Consultations in progress",summary:"Leads are arriving.",
    action:"Follow up",reviewedAt:"2026-11-20",
    indicators:[{label:"Surgical consultations in booked stage",value:12,
      detail:"Nov 20 · Surgical consultations currently in booked stage"}]};
  const p=buildExecutivePulse([],[],reviewed);
  assert.equal(p.metrics[1].value,12);
  assert.equal(p.metrics[1].label,"SURGICAL CONSULTS · BOOKED STAGE");
  assert.match(p.metrics[1].detail,/Nov 20/);
  assert.equal(p.metrics[0].value,null);
});
test("unreviewed contact indicators, or only historical stages, do not fill KPI cards",()=>{
  const base={statement:"Draft",summary:"Unreviewed",action:"Check source",
    indicators:[{label:"New CRM lead contacts",value:15,detail:"Nov 16–19"},
      {label:"Surgical consultations in booked stage",value:12,detail:"Nov 20"}]};
  const unreviewed=buildExecutivePulse([],[],base);
  assert.equal(unreviewed.metrics[0].value,null);
  assert.equal(unreviewed.metrics[1].value,null);
  const historical=buildExecutivePulse([],[],{...base,reviewedAt:"2026-11-20",
    indicators:[{label:"Website open opportunities at booked+ stage",value:14,
      detail:"Historical cohort"}]});
  assert.equal(historical.metrics[0].value,null);
  assert.equal(historical.metrics[1].value,null);
});

test("reviewed week's insight is preferred over recorded view composition",()=>{
  const reviewed={statement:"Patient inquiries",summary:"First Access leads intake.",
    action:"Follow up",reviewedAt:"2026-11-20",
    indicators:[{label:"New CRM lead contacts",value:15,detail:"Nov 16–19"}],
    insight:{
      headline:"First Access brought in twice as many inquiries as other routes combined.",
      detail:"10 of 15 new inquiries (67%) arrived through First Access Nov 16–19."
    }};
  const p=buildExecutivePulse([
    post("reel1","Instagram","@opusplasticsurgery","Reel",100),
    post("reel2","Instagram","@opusplasticsurgery","Reel",50),
    post("carousel","Instagram","@opusplasticsurgery","Carousel",40)
  ],[],reviewed);
  assert.match(p.insight.headline,/twice as many/);
  assert.match(p.insight.detail,/10 of 15/);
  assert.equal(p.metrics[0].value,15);
  assert.equal(p.metrics[1].value,null);
});
test("no weak fallback insight is manufactured for weeks lacking reviewed evidence",()=>{
  const posts=[
    post("r1","Instagram","@opusplasticsurgery","Reel",2014),
    post("r2","Instagram","@opusplasticsurgery","Carousel",937),
    post("r3","Instagram","@opusplasticsurgery","Reel",100)
  ];
  assert.equal(buildExecutivePulse(posts,[]).insight,null);
  const draft={statement:"draft",summary:"draft",action:"draft",indicators:[],
    insight:{headline:"Unverified conclusion",detail:"Do not publish"}};
  assert.equal(buildExecutivePulse(posts,[],draft).insight,null);
});
test("reviewed insights are not borrowed from other weeks",()=>{
  const posts=[post("r1","Instagram","@opusplasticsurgery","Reel",100)];
  const oldOverview={statement:"Scar Reel",summary:"Past 3-second hold",action:"Review",
    indicators:[],reviewedAt:"2026-11-20",
    insight:{headline:"Scar content held attention longer",
      detail:"Nov 9–15: 63.3% vs 53.2%"}};
  // The caller supplies the currently selected week's overview; a week with
  // no reviewed overview must stay empty rather than reusing another period.
  assert.match(buildExecutivePulse(posts,[],oldOverview).insight.headline,/Scar/);
  assert.equal(buildExecutivePulse(posts,[]).insight,null);
});
