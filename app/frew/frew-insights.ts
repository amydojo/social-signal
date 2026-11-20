import type {LeadershipLog,LeadershipChannel} from "./frew-data";
import type {PublicOverview} from "../../lib/signal/publication";
import type {PublicAcquisition} from "../../lib/signal/acquisition";

export type PulseIndicator={label:string;value:number|null;detail:string;unit?:"USD"};
export type PaidIndicator={value:number|null;period:string|null;note:string};
export type ExecutiveHighlight={label:string;headline:string;detail:string};
export type ExecutivePulse={
  metrics:PulseIndicator[];
  paid:{google:PaidIndicator;meta:PaidIndicator};
  published:{headline:string;detail:string};
  conversation:{headline:string;detail:string};
  highlights:ExecutiveHighlight[];
  insight:{headline:string;detail:string}|null;
  action:string;
};
const label=(s:string)=>s.trim().toLowerCase();
const metric=(channel:LeadershipChannel|undefined,name:string)=>
  channel?.metrics.find(m=>m.label===name)?.value??null;
const isInstagram=(p:LeadershipLog)=>p.platform==="Instagram"&&p.account.toLowerCase()==="@opusplasticsurgery";
const isStory=(p:LeadershipLog)=>label(p.format)==="story";

export function buildExecutivePulse(rows:LeadershipLog[],channels:LeadershipChannel[],reviewed?:PublicOverview,acquisition?:PublicAcquisition):ExecutivePulse{
  const feed=rows.filter(p=>isInstagram(p)&&!isStory(p));
  const reels=feed.filter(p=>label(p.format)==="reel");
  const carousels=feed.filter(p=>label(p.format)==="carousel");
  const google=channels.find(c=>c.platform==="Google Ads");
  const meta=channels.find(c=>c.platform==="Meta Ads");
  const googleActions=metric(google,"Conversions");
  const metaLeads=metric(meta,"Leads");
  const metaImpressions=metric(meta,"Impressions");

  // Only use a formally reviewed contact-created aggregate for this *selected*
  // published week; do not substitute opportunity counts, Meta leads, or an
  // earlier historical cohort. The aggregate has no names, IDs, or contact info.
  const newLeadEvidence=reviewed?.reviewedAt
    ?reviewed.indicators.find(x=>x.label==="New CRM lead contacts")
    :undefined;
  const surgicalBooked=reviewed?.reviewedAt
    ?reviewed.indicators.find(x=>x.label==="Surgical consultations in booked stage")
    :undefined;
  const surgicalComplete=reviewed?.reviewedAt
    ?reviewed.indicators.find(x=>x.label==="Surgical consultations complete stage")
    :undefined;
  const ig=channels.find(c=>c.platform==="Instagram"&&c.account.toLowerCase()==="@opusplasticsurgery");
  const igInteractions=metric(ig,"Feed interactions");
  const firstAccess=acquisition?.analysis?.opportunityGroups.find(g=>g.name==="Website First Access");
  const firstAccessAsOf=acquisition?.asOf
    ?new Date(acquisition.asOf+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"})
    :"latest reviewed snapshot";
  // Use a verified current-stage consultation snapshot when available. Older
  // weeks have no point-in-time surgical snapshot: show their own recorded
  // feed interactions instead of borrowing the latest week's completions or
  // publishing an empty, unhelpful card.
  const thirdMetric:PulseIndicator|null=firstAccess&&firstAccess.opportunities>0?
    {label:"FIRST ACCESS CONSULT PROGRESS",value:firstAccess.advancedStage,
      detail:`${firstAccess.advancedStage} of ${firstAccess.opportunities} website opportunities · ${(100*firstAccess.advancedStage/firstAccess.opportunities).toFixed(1)}% at booked-or-later stages · CRM snapshot ${firstAccessAsOf}, not weekly bookings`}:
    surgicalComplete?.value!=null?
    {label:"SURGICAL CONSULTS · COMPLETE STAGE",value:surgicalComplete.value,
      detail:surgicalComplete.detail}:
    igInteractions!=null?
      {label:"INSTAGRAM FEED INTERACTIONS",value:igInteractions,
        detail:(ig?.period??"Selected reporting week")+" · recorded interactions"}
      :null;
  const metrics:PulseIndicator[]=[
    {label:"NEW INQUIRIES",value:newLeadEvidence?.value??null,
      detail:newLeadEvidence?.value!=null
        ?newLeadEvidence.detail
        :"Not yet available for this week"},
    {label:"SURGICAL CONSULTS · BOOKED STAGE",value:surgicalBooked?.value??null,
      detail:surgicalBooked?.value!=null
        ?surgicalBooked.detail
        :"Current consultation stage count not yet available"},
    ...(thirdMetric?[thirdMetric]:[])
  ];
  const paid:{
    google:PaidIndicator;meta:PaidIndicator
  }={
    google:{value:googleActions,period:google?.period??null,
      note:googleActions==null?"Conversions unverified":"Platform actions · not booked consults"},
    meta:{value:metaLeads,period:meta?.period??null,
      note:metaLeads!=null?"Native form leads · not appointments":
        metaImpressions===0?"0 reported impressions · lead count unknown":"Lead count not available"}
  };
  const latest=[...feed].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)).slice(0,2);
  const published={
    headline:feed.length?
      feed.length+" Instagram "+(feed.length===1?"post":"posts")+" recorded, including "+
      reels.length+" "+(reels.length===1?"Reel":"Reels")+" and "+
      carousels.length+" "+(carousels.length===1?"carousel":"carousels")+"."
      :"No OPUS Instagram feed posts recorded for these dates.",
    detail:latest.length?
      "Recent: "+latest.map(p=>p.date+" · "+p.title).join(" / ")+". Open the posts and dates below."
      :"The available records may be incomplete. Check source accounts before drawing conclusions."
  };
  const replies=metric(ig,"Story replies");
  const conversation={
    headline:replies==null?"Story replies aren't available for this week.":
      replies+" "+(replies===1?"Story reply":"Story replies")+" recorded.",
    detail:"Follow up on comments and direct messages to identify meaningful patient questions."
  };
  // The executive sidebar deserves a material, week-specific finding.
  // Do not manufacture a filler view-share or infer causality from incomplete
  // performance data. Unreviewed weeks simply have no insight sidebar.
  const insight=reviewed?.reviewedAt&&reviewed.insight?reviewed.insight:null;
  // Historical insight review must not accidentally replace the action copy
  // with a legacy incomplete question from an old source snapshot.
  const action=reviewed?.reviewedAt&&reviewed.deck?reviewed.action:
    metaLeads!=null&&metaLeads>0?
      "Check whether Meta submissions turned into real replies and consultation requests.":
    googleActions!=null&&googleActions>0?
      "Match Google conversion actions with new CRM inquiries and appointment requests.":
      "Confirm weekly CRM outcomes before changing acquisition investment.";
  // Executive readout: recorded results, not internal reminders or follow-up tasks.
  // Historical snapshots remain explicitly labeled; do not confuse them with this week's activity.
  const highlights:ExecutiveHighlight[]=[];
  if(newLeadEvidence?.value!=null){
    const first=newLeadEvidence.detail.match(/First Access\s+(\d+)\b/i);
    const dm=newLeadEvidence.detail.match(/Instagram DM\s+(\d+)\b/i);
    const direct=newLeadEvidence.detail.match(/\bDirect\s+(\d+)\b/i);
    const breakdown=first&&dm&&direct
      ?[Number(first[1]),Number(dm[1]),Number(direct[1])]:null;
    const verifiedBreakdown=breakdown&&breakdown.reduce((n,x)=>n+x,0)===newLeadEvidence.value;
    highlights.push({
      label:"PATIENT DEMAND",
      headline:verifiedBreakdown&&breakdown![0]>newLeadEvidence.value/2
        ?"First Access accounted for most new inquiries."
        :"New inquiries entered through the CRM.",
      detail:verifiedBreakdown
        ?`${breakdown![0]} First Access · ${breakdown![1]} Instagram DMs · ${breakdown![2]} direct. ${newLeadEvidence.detail.split("·")[0].trim()}. CRM intake routes, not confirmed first-touch attribution.`
        :`${newLeadEvidence.value} contacts · ${newLeadEvidence.detail}. CRM intake, not verified bookings.`
    });
  }
  const rankedFeed=[...feed].filter(p=>p.views!=null&&p.views>0)
    .sort((a,b)=>(b.views??0)-(a.views??0)||b.date.localeCompare(a.date));
  if(rankedFeed.length){
    const top=rankedFeed[0];
    const runnerUp=rankedFeed[1];
    highlights.push({
      label:"CONTENT SIGNAL",
      headline:`“${top.title}” led recorded Instagram views.`,
      detail:`${(top.views??0).toLocaleString("en-US")} cumulative views at capture${runnerUp?`, ahead of “${runnerUp.title}” at ${(runnerUp.views??0).toLocaleString("en-US")}`:""}. These are lifetime post counts; publication dates differ.`
    });
  }
  const metaNative=acquisition?.analysis?.opportunityGroups.find(g=>g.name==="Meta native forms");
  if(firstAccess&&metaNative&&firstAccess.opportunities>0&&metaNative.opportunities>0){
    highlights.push({
      label:"INTAKE QUALITY",
      headline:"Website First Access is further along in the recorded pipeline.",
      detail:`${firstAccess.advancedStage} of ${firstAccess.opportunities} website opportunities are booked-or-later, versus ${metaNative.advancedStage} of ${metaNative.opportunities} Meta-native. CRM stage snapshot as of ${firstAccessAsOf}; different cohort ages, not a controlled test.`
    });
  }
  return {metrics,paid,published,conversation,highlights,insight,action};
}
