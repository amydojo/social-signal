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

test("completed surgical consultation stage replaces empty conversations card",()=>{
  const reviewed={
    statement:"Consultation progress",summary:"Progress in consultation pipeline",
    action:"Review appointments",reviewedAt:"2026-11-20",
    indicators:[
      {label:"New CRM lead contacts",value:15,detail:"Nov 16–19"},
      {label:"Surgical consultations in booked stage",value:12,
        detail:"As of Nov 20 · current stage, not weekly bookings"},
      {label:"Surgical consultations complete stage",value:15,
        detail:"As of Nov 20 · current Consult Complete stage, not weekly completions"}
    ]
  };
  const pulse=buildExecutivePulse([],[
    channel("Instagram",{"Feed interactions":76},"@opusplasticsurgery")
  ],reviewed);
  assert.deepEqual(pulse.metrics.map(x=>x.value),[15,12,15]);
  assert.equal(pulse.metrics[2].label,"SURGICAL CONSULTS · COMPLETE STAGE");
  assert.match(pulse.metrics[2].detail,/not weekly completions/);
  assert.equal(pulse.metrics.some(x=>x.label==="QUALIFIED CONVERSATIONS"),false);
});
test("older weeks do not inherit another week's completed consultations",()=>{
  const pulse=buildExecutivePulse([],[
    channel("Instagram",{"Feed interactions":55},"@opusplasticsurgery"),
    channel("Instagram",{"Feed interactions":888},"@dr.frew")
  ],{statement:"Scar content",summary:"Reviewed",action:"Check replies",
     reviewedAt:"2026-11-20",indicators:[]});
  assert.equal(pulse.metrics[2].label,"INSTAGRAM FEED INTERACTIONS");
  assert.equal(pulse.metrics[2].value,55);
  assert.match(pulse.metrics[2].detail,/Nov 16–18/);
});
test("no third KPI is rendered when neither outcomes nor interactions exist",()=>{
  const pulse=buildExecutivePulse([],[]);
  assert.equal(pulse.metrics.length,2);
});

test("weekly executive highlights report patient demand, strongest content, and intake quality without tasks",()=>{
  const overview={statement:"Inquiries",summary:"Intake",action:"Follow up",
    reviewedAt:"2026-11-20",indicators:[
      {label:"New CRM lead contacts",value:15,
       detail:"Nov 16–19 · First Access 10 · Instagram DM 3 · Direct 2"}
    ]};
  const acquisition={asOf:"2026-11-20",scope:"historical_cohort",
    analysis:{opportunityGroups:[
      {name:"Website First Access",opportunities:29,advancedStage:14},
      {name:"Meta native forms",opportunities:16,advancedStage:1}
    ]}};
  const posts=[
    post("Frew + Tamara Q&A","Instagram","@opusplasticsurgery","Reel",1458,"2026-11-18"),
    post("How do breast implants fit?","Instagram","@opusplasticsurgery","Reel",1039,"2026-11-17"),
    post("Other account","Instagram","@dr.frew","Reel",9999,"2026-11-18")
  ];
  const pulse=buildExecutivePulse(posts,[],overview,acquisition);
  assert.deepEqual(pulse.highlights.map(x=>x.label),["PATIENT DEMAND","CONTENT SIGNAL","INTAKE QUALITY"]);
  assert.match(pulse.highlights[0].headline,/First Access accounted/);
  assert.match(pulse.highlights[0].detail,/10 First Access · 3 Instagram DMs · 2 direct/);
  assert.match(pulse.highlights[1].detail,/1,458 cumulative views/);
  assert.doesNotMatch(pulse.highlights[1].headline,/Other account/);
  assert.match(pulse.highlights[2].detail,/14 of 29.*1 of 16/);
  assert.match(pulse.highlights[2].detail,/not a controlled test/);
  assert.doesNotMatch(pulse.highlights.map(x=>x.headline+" "+x.detail).join(" "),/review messages|follow up|confirm appointments|next action/i);
});
test("historical weeks do not inherit new CRM or First Access cohort highlights",()=>{
  const posts=[post("Historic Reel","Instagram","@opusplasticsurgery","Reel",123,"2026-11-10")];
  const p=buildExecutivePulse(posts,[]);
  assert.deepEqual(p.highlights.map(x=>x.label),["CONTENT SIGNAL"]);
  assert.match(p.highlights[0].detail,/lifetime post counts/);
  assert.equal(buildExecutivePulse([],[]).highlights.length,0);
});

test("reconstructed contact dates fill older weeks without inventing consultation bookings",()=>{
  for(const [week,total,website,meta,direct4d] of [
    ["2026-11-02",22,4,4,7],
    ["2026-11-09",19,5,0,9],
    ["2026-11-16",15,10,0,2]
  ]){
    const crm={
      weekStart:week,dataThrough:week==="2026-11-16"?"2026-11-19":"2026-11-15",
      snapshotDate:"2026-11-20",total,website,meta,direct4d,
      instagram:week==="2026-11-16"?3:4,other:total-website-meta-direct4d-(week==="2026-11-16"?3:4),
      paidSearch:0,paidSocial:0,organicSearch:0,socialMedia:0,directTraffic:0,referral:0,
      unattributed:total,backdatedImports:0
    };
    const pulse=buildExecutivePulse([],[],undefined,undefined,crm);
    assert.equal(pulse.metrics[0].value,total);
    assert.equal(pulse.metrics[0].label,"CRM CONTACTS RECORDED");
    assert.match(pulse.metrics[0].detail,/4D scheduling/);
    assert.match(pulse.metrics[0].detail,/not bookings/);
    assert.equal(pulse.metrics[1].value,null);
    assert.equal(pulse.highlights[0].label,"CRM INTAKE");
    assert.doesNotMatch(pulse.highlights[0].detail,/consultations booked/i);
  }
});
test("reviewed narrative remains separate from contact-event backfill",()=>{
  const crm={weekStart:"2026-11-16",dataThrough:"2026-11-19",snapshotDate:"2026-11-20",
    total:15,website:10,meta:0,instagram:3,direct4d:2,other:0,
    paidSearch:8,paidSocial:0,organicSearch:0,socialMedia:1,directTraffic:1,referral:0,
    unattributed:5,backdatedImports:0};
  const reviewed={statement:"New inquiries",summary:"Sourced CRM",
    action:"Review",reviewedAt:"2026-11-20",
    indicators:[{label:"New CRM lead contacts",value:15,
      detail:"Nov 16–19 · First Access 10 · Instagram DM 3 · Direct 2"}]};
  const p=buildExecutivePulse([],[],reviewed,undefined,crm);
  assert.equal(p.metrics[0].value,15);
  assert.equal(p.metrics[0].label,"CRM CONTACTS RECORDED");
  assert.equal(p.highlights[0].label,"PATIENT DEMAND");
  assert.match(p.highlights[0].detail,/CRM intake routes/);
});
