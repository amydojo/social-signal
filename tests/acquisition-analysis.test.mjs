import test from "node:test";
import assert from "node:assert/strict";
import {parsePublicAcquisition} from "../lib/signal/acquisition.ts";

const source=()=>({
  asOf:"2026-11-20",scope:"historical_cohort",
  source:"Aesthetix contacts and open opportunity audit, November 20",
  routes:[
    {route:"Meta First Access",evidence:"campaign_tag",contacts:36,
      stages:[{stage:"Cold",contacts:21},{stage:"Lead",contacts:15}]},
    {route:"Google Ads",evidence:"google_click_id",contacts:11,
      stages:[{stage:"Lead",contacts:7},{stage:"Replied",contacts:4}]},
    {route:"Instagram bio link",evidence:"tracked_link",contacts:6,
      stages:[{stage:"Consultation stage",contacts:6}]},
    {route:"Website First Access",evidence:"first_session",contacts:32}
  ],
  websiteFirstTouch:[
    {channel:"Paid Search",contacts:12},{channel:"Social media",contacts:9},
    {channel:"Organic Search",contacts:9},{channel:"Direct traffic",contacts:2}
  ],
  finding:"The CRM source audit finds different progression patterns.",
  decision:"Reconcile CRM intake and verify replies.",
  analysis:{
    contactCoverage:{total:240,sourceRecorded:233,firstSessionRecorded:94,
      utmSourceRecorded:69,metaNativeSource:51,instagramDM:44,instagramDMWithoutStatus:41},
    opportunityCoverage:{total:78,distinctContactIds:76,adSourceMissing:44,
      nonSurgicalTotal:20,nonSurgicalAdSourceMissing:20},
    opportunityGroups:[
      {name:"Website First Access",opportunities:29,advancedStage:14,replied:5,lead:9,cancelNoShow:1},
      {name:"Meta native forms",opportunities:16,advancedStage:1,replied:0,lead:15,cancelNoShow:0},
      {name:"4D Direct",opportunities:21,advancedStage:14,replied:0,lead:0,cancelNoShow:7},
      {name:"Other intake",opportunities:12,advancedStage:6,replied:0,lead:5,cancelNoShow:1}
    ],
    websiteOpportunityChannels:[
      {channel:"Social media",opportunities:6,advancedStage:6},
      {channel:"Organic Search",opportunities:7,advancedStage:5},
      {channel:"Paid Search",opportunities:4,advancedStage:1},
      {channel:"Unattributed",opportunities:12,advancedStage:2}
    ],
    campaigns:[
      {platform:"Meta Ads",reportedEvents:37,period:"Oct 20 - Nov 19, 2026",
        spendUSD:559.82,contactEvidence:36,openOpportunities:16,
        note:"Platform leads, campaign-tagged contacts and open CRM opportunities are distinct."},
      {platform:"Google Ads",reportedEvents:8,period:"Oct 20 - Nov 19, 2026",
        spendUSD:456.17,contactEvidence:11,openOpportunities:4,
        note:"Events, click ID contacts and Paid Search-labeled open opportunities differ."}
    ],
    operations:{metaLeadStage:15,metaEngagementZero:11,metaSmsInvalid:2,
      newestWebsiteMissingAdSource:10,newestWebsiteOpportunities:12,
      moreInformationOpportunities:3},
    findings:[
      {title:"Source propagation gap",evidence:"Website contact attribution is recorded.",
        decision:"Repair CRM opportunity source mapping."}
    ]
  }
});
test("parses full analysis as four distinct, consistent opportunity cohorts",()=>{
  const p=parsePublicAcquisition(source());
  assert.ok(p);
  assert.equal(p.analysis.opportunityCoverage.total,78);
  assert.equal(p.analysis.opportunityGroups[0].advancedStage,14);
  assert.equal(p.analysis.campaigns[0].reportedEvents,37);
});
test("rejects mislabeled contact-level fields and identifiable patient data",()=>{
  const x=source();x.analysis.contactCoverage.contactId="private-id";
  assert.equal(parsePublicAcquisition(x),null);
  const y=source();y.analysis.findings[0].evidence="Contact john@example.com";
  assert.equal(parsePublicAcquisition(y),null);
  const z=source();z.analysis.campaigns[0].notes="unreviewed";
  assert.equal(parsePublicAcquisition(z),null);
});
test("rejects false opportunity progression or wrong arithmetic",()=>{
  const x=source();x.analysis.opportunityGroups[0].advancedStage=28;
  assert.equal(parsePublicAcquisition(x),null);
  const y=source();y.analysis.websiteOpportunityChannels[0].opportunities=12;
  assert.equal(parsePublicAcquisition(y),null);
  const z=source();z.analysis.opportunityCoverage.total=77;
  assert.equal(parsePublicAcquisition(z),null);
});
test("rejects impossible coverage and workflow counts",()=>{
  const x=source();x.analysis.contactCoverage.firstSessionRecorded=241;
  assert.equal(parsePublicAcquisition(x),null);
  const y=source();y.analysis.operations.newestWebsiteMissingAdSource=13;
  assert.equal(parsePublicAcquisition(y),null);
  const z=source();z.analysis.operations.metaLeadStage=20;
  assert.equal(parsePublicAcquisition(z),null);
});
test("previous minimal acquisition cohort remains accepted",()=>{
  const x=source();delete x.analysis;
  const p=parsePublicAcquisition(x);
  assert.ok(p);assert.equal(p.analysis,undefined);
});
