/** Public-safe, aggregate-only CRM evidence. No patient records, names or IDs. */
export type AttributionEvidence="campaign_tag"|"google_click_id"|"tracked_link"|"first_session";
export type AcquisitionRouteName="Meta First Access"|"Google Ads"|"Instagram bio link"|"Website First Access";
export type AcquisitionStage="Cold"|"Lead"|"Replied"|"Consultation stage";
export type AcquisitionChannel="Paid Search"|"Social media"|"Organic Search"|"Direct traffic";
export type PublicOpportunityGroupName=
  "Website First Access"|"Meta native forms"|"4D Direct"|"Other intake";
export type PublicOpportunityChannel=
  "Social media"|"Organic Search"|"Paid Search"|"Unattributed";
export type PublicAdPlatform="Meta Ads"|"Google Ads";
export type PublicAcquisitionAnalysis={
  contactCoverage:{
    total:number; sourceRecorded:number; firstSessionRecorded:number;
    utmSourceRecorded:number; metaNativeSource:number; instagramDM:number;
    instagramDMWithoutStatus:number;
  };
  opportunityCoverage:{
    total:number; distinctContactIds:number; adSourceMissing:number;
    nonSurgicalTotal:number; nonSurgicalAdSourceMissing:number;
  };
  opportunityGroups:{
    name:PublicOpportunityGroupName;opportunities:number;advancedStage:number;
    replied:number;lead:number;cancelNoShow:number;
  }[];
  websiteOpportunityChannels:{
    channel:PublicOpportunityChannel;opportunities:number;advancedStage:number;
  }[];
  campaigns:{
    platform:PublicAdPlatform;period:string;reportedEvents:number;
    spendUSD:number;contactEvidence:number;openOpportunities:number;
    note:string;
  }[];
  operations:{
    metaLeadStage:number;metaEngagementZero:number;metaSmsInvalid:number;
    newestWebsiteMissingAdSource:number;newestWebsiteOpportunities:number;
    moreInformationOpportunities:number;
  };
  findings:{title:string;evidence:string;decision:string}[];
};
export type PublicAcquisition={
  asOf:string;
  scope:"historical_cohort";
  source:string;
  routes:{route:AcquisitionRouteName;evidence:AttributionEvidence;contacts:number;
    stages?:{stage:AcquisitionStage;contacts:number}[]}[];
  websiteFirstTouch:{channel:AcquisitionChannel;contacts:number}[];
  analysis?:PublicAcquisitionAnalysis;
  finding:string;decision:string;
};
const routes=new Set<AcquisitionRouteName>(["Meta First Access","Google Ads","Instagram bio link","Website First Access"]);
const evidence=new Set<AttributionEvidence>(["campaign_tag","google_click_id","tracked_link","first_session"]);
const stages=new Set<AcquisitionStage>(["Cold","Lead","Replied","Consultation stage"]);
const channels=new Set<AcquisitionChannel>(["Paid Search","Social media","Organic Search","Direct traffic"]);
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,allowed:string[])=>Object.keys(x).every(k=>allowed.includes(k));
const date=(x:unknown)=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T12:00:00Z"))&&
  new Date(x+"T12:00:00Z").toISOString().slice(0,10)===x;
const count=(x:unknown)=>typeof x==="number"&&Number.isSafeInteger(x)&&x>=0&&x<=1000000;
const text=(x:unknown,max:number)=>typeof x==="string"&&x.length>0&&x.length<=max&&
  !/[<>@]/.test(x)&&!/(https?:\/\/|\b\d{3}[-. ]\d{3}[-. ]\d{4}\b)/i.test(x);

const groupNames=new Set<PublicOpportunityGroupName>([
  "Website First Access","Meta native forms","4D Direct","Other intake"
]);
const oppChannelNames=new Set<PublicOpportunityChannel>([
  "Social media","Organic Search","Paid Search","Unattributed"
]);
const paidNames=new Set<PublicAdPlatform>(["Meta Ads","Google Ads"]);

function parseAnalysis(x:unknown):PublicAcquisitionAnalysis|null{
  if(!obj(x)||!keys(x,["contactCoverage","opportunityCoverage","opportunityGroups",
    "websiteOpportunityChannels","campaigns","operations","findings"]))return null;
  const cc=x.contactCoverage,oc=x.opportunityCoverage,operations=x.operations;
  const ccKeys=["total","sourceRecorded","firstSessionRecorded","utmSourceRecorded",
    "metaNativeSource","instagramDM","instagramDMWithoutStatus"];
  const ocKeys=["total","distinctContactIds","adSourceMissing","nonSurgicalTotal",
    "nonSurgicalAdSourceMissing"];
  const opKeys=["metaLeadStage","metaEngagementZero","metaSmsInvalid",
    "newestWebsiteMissingAdSource","newestWebsiteOpportunities","moreInformationOpportunities"];
  if(!obj(cc)||!keys(cc,ccKeys)||ccKeys.some(k=>!count(cc[k]))||
    !obj(oc)||!keys(oc,ocKeys)||ocKeys.some(k=>!count(oc[k]))||
    !obj(operations)||!keys(operations,opKeys)||opKeys.some(k=>!count(operations[k])))
    return null;
  if(ccKeys.some(k=>k!=="total"&&(cc[k] as number)>(cc.total as number))||
    (cc.instagramDMWithoutStatus as number)>(cc.instagramDM as number)||
    ocKeys.some(k=>k!=="total"&&(oc[k] as number)>(oc.total as number))||
    (oc.nonSurgicalAdSourceMissing as number)>(oc.nonSurgicalTotal as number)||
    !Array.isArray(x.opportunityGroups)||x.opportunityGroups.length!==4||
    !Array.isArray(x.websiteOpportunityChannels)||x.websiteOpportunityChannels.length!==4||
    !Array.isArray(x.campaigns)||x.campaigns.length!==2||
    !Array.isArray(x.findings)||x.findings.length>5||x.findings.length<1)return null;
  const groups:PublicAcquisitionAnalysis["opportunityGroups"]=[];
  const seenGroup=new Set<string>();
  for(const g of x.opportunityGroups){
    const nums=["opportunities","advancedStage","replied","lead","cancelNoShow"];
    if(!obj(g)||!keys(g,["name",...nums])||
      !groupNames.has(g.name as PublicOpportunityGroupName)||seenGroup.has(g.name as string)||
      nums.some(k=>!count(g[k])))return null;
    seenGroup.add(g.name as string);
    if((g.advancedStage as number)+(g.replied as number)+(g.lead as number)+
      (g.cancelNoShow as number)!==(g.opportunities as number))return null;
    groups.push(g as PublicAcquisitionAnalysis["opportunityGroups"][number]);
  }
  if(groups.reduce((n,g)=>n+g.opportunities,0)!==(oc.total as number))return null;
  const opportunityChannels:PublicAcquisitionAnalysis["websiteOpportunityChannels"]=[];
  const seenChannel=new Set<string>();
  for(const c of x.websiteOpportunityChannels){
    if(!obj(c)||!keys(c,["channel","opportunities","advancedStage"])||
      !oppChannelNames.has(c.channel as PublicOpportunityChannel)||
      seenChannel.has(c.channel as string)||!count(c.opportunities)||
      !count(c.advancedStage)||(c.advancedStage as number)>(c.opportunities as number))return null;
    seenChannel.add(c.channel as string);
    opportunityChannels.push(c as PublicAcquisitionAnalysis["websiteOpportunityChannels"][number]);
  }
  const web=groups.find(g=>g.name==="Website First Access");
  if(!web||
    opportunityChannels.reduce((n,c)=>n+c.opportunities,0)!==web.opportunities||
    opportunityChannels.reduce((n,c)=>n+c.advancedStage,0)!==web.advancedStage)
    return null;
  const campaigns:PublicAcquisitionAnalysis["campaigns"]=[];
  const seenPaid=new Set<string>();
  for(const c of x.campaigns){
    if(!obj(c)||!keys(c,["platform","period","reportedEvents","spendUSD",
      "contactEvidence","openOpportunities","note"])||
      !paidNames.has(c.platform as PublicAdPlatform)||seenPaid.has(c.platform as string)||
      !text(c.period,70)||!text(c.note,240)||!count(c.reportedEvents)||
      !count(c.contactEvidence)||!count(c.openOpportunities)||
      typeof c.spendUSD!=="number"||!Number.isFinite(c.spendUSD)||
      c.spendUSD<0||c.spendUSD>100000000)return null;
    seenPaid.add(c.platform as string);
    campaigns.push(c as PublicAcquisitionAnalysis["campaigns"][number]);
  }
  const meta=groups.find(g=>g.name==="Meta native forms");
  if(!meta||(operations.metaLeadStage as number)>meta.opportunities||
    (operations.metaEngagementZero as number)>meta.opportunities||
    (operations.metaSmsInvalid as number)>meta.opportunities||
    (operations.newestWebsiteMissingAdSource as number)>
      (operations.newestWebsiteOpportunities as number))return null;
  const findings:PublicAcquisitionAnalysis["findings"]=[];
  for(const finding of x.findings){
    if(!obj(finding)||!keys(finding,["title","evidence","decision"])||
      !text(finding.title,90)||!text(finding.evidence,460)||
      !text(finding.decision,260))return null;
    findings.push(finding as PublicAcquisitionAnalysis["findings"][number]);
  }
  return {
    contactCoverage:cc as PublicAcquisitionAnalysis["contactCoverage"],
    opportunityCoverage:oc as PublicAcquisitionAnalysis["opportunityCoverage"],
    opportunityGroups:groups,websiteOpportunityChannels:opportunityChannels,
    campaigns,operations:operations as PublicAcquisitionAnalysis["operations"],
    findings
  };
}

export function parsePublicAcquisition(x:unknown):PublicAcquisition|null{
  if(!obj(x)||!keys(x,["asOf","scope","source","routes","websiteFirstTouch","analysis","finding","decision"])||
    !date(x.asOf)||x.scope!=="historical_cohort"||!text(x.source,120)||
    !text(x.finding,320)||!text(x.decision,320)||
    !Array.isArray(x.routes)||x.routes.length<1||x.routes.length>4||
    !Array.isArray(x.websiteFirstTouch)||x.websiteFirstTouch.length>4)return null;
  const used=new Set<string>();
  const out:PublicAcquisition["routes"]=[];
  for(const route of x.routes){
    if(!obj(route)||!keys(route,["route","evidence","contacts","stages"])||
      !routes.has(route.route as AcquisitionRouteName)||!evidence.has(route.evidence as AttributionEvidence)||
      !count(route.contacts)||used.has(route.route as string))return null;
    used.add(route.route as string);
    const correctEvidence:Record<AcquisitionRouteName,AttributionEvidence>={
      "Meta First Access":"campaign_tag","Google Ads":"google_click_id",
      "Instagram bio link":"tracked_link","Website First Access":"first_session"};
    if(correctEvidence[route.route as AcquisitionRouteName]!==route.evidence)return null;
    const progress:NonNullable<PublicAcquisition["routes"][number]["stages"]>=[];
    if(route.stages!=null){
      if(!Array.isArray(route.stages)||route.stages.length>4)return null;
      const uniqueStage=new Set<string>();
      for(const st of route.stages){
        if(!obj(st)||!keys(st,["stage","contacts"])||!stages.has(st.stage as AcquisitionStage)||
          !count(st.contacts)||uniqueStage.has(st.stage as string))return null;
        uniqueStage.add(st.stage as string);
        progress.push({stage:st.stage as AcquisitionStage,contacts:st.contacts as number});
      }
      if(progress.reduce((n,st)=>n+st.contacts,0)>(route.contacts as number))return null;
    }
    out.push({route:route.route as AcquisitionRouteName,evidence:route.evidence as AttributionEvidence,
      contacts:route.contacts as number,...(route.stages!=null?{stages:progress}:{})});
  }
  const firstTouch:PublicAcquisition["websiteFirstTouch"]=[];
  const usedChannel=new Set<string>();
  for(const item of x.websiteFirstTouch){
    if(!obj(item)||!keys(item,["channel","contacts"])||
      !channels.has(item.channel as AcquisitionChannel)||!count(item.contacts)||
      usedChannel.has(item.channel as string))return null;
    usedChannel.add(item.channel as string);
    firstTouch.push({channel:item.channel as AcquisitionChannel,contacts:item.contacts as number});
  }
  const website=out.find(r=>r.route==="Website First Access");
  if(firstTouch.length&&(!website||firstTouch.reduce((n,v)=>n+v.contacts,0)>website.contacts))return null;
  const analysis=x.analysis==null?undefined:parseAnalysis(x.analysis);
  if(x.analysis!=null&&!analysis)return null;
  return {asOf:x.asOf as string,scope:"historical_cohort",source:x.source as string,
    routes:out,websiteFirstTouch:firstTouch,
    ...(analysis?{analysis}:{}),
    finding:x.finding as string,decision:x.decision as string};
}
