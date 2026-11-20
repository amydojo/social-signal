import type {LeadershipLog,LeadershipChannel} from "./frew-data";
import type {PublicOverview} from "../../lib/signal/publication";

export type PulseIndicator={label:string;value:number|null;detail:string;unit?:"USD"};
export type PaidIndicator={value:number|null;period:string|null;note:string};
export type ExecutivePulse={
  metrics:PulseIndicator[];
  paid:{google:PaidIndicator;meta:PaidIndicator};
  published:{headline:string;detail:string};
  conversation:{headline:string;detail:string};
  insight:{headline:string;detail:string}|null;
  action:string;
};
const label=(s:string)=>s.trim().toLowerCase();
const metric=(channel:LeadershipChannel|undefined,name:string)=>
  channel?.metrics.find(m=>m.label===name)?.value??null;
const isInstagram=(p:LeadershipLog)=>p.platform==="Instagram"&&p.account.toLowerCase()==="@opusplasticsurgery";
const isStory=(p:LeadershipLog)=>label(p.format)==="story";

export function buildExecutivePulse(rows:LeadershipLog[],channels:LeadershipChannel[],reviewed?:PublicOverview):ExecutivePulse{
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
  const metrics:PulseIndicator[]=[
    {label:"NEW INQUIRIES",value:newLeadEvidence?.value??null,
      detail:newLeadEvidence?.value!=null
        ?newLeadEvidence.detail
        :"Not yet available for this week"},
    {label:"SURGICAL CONSULTS · BOOKED STAGE",value:surgicalBooked?.value??null,
      detail:surgicalBooked?.value!=null
        ?surgicalBooked.detail
        :"Current consultation stage count not yet available"},
    {label:"QUALIFIED CONVERSATIONS",value:null,
      detail:"Patient conversations have not yet been counted"}
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
  const ig=channels.find(c=>c.platform==="Instagram"&&c.account.toLowerCase()==="@opusplasticsurgery");
  const replies=metric(ig,"Story replies");
  const conversation={
    headline:replies==null?"Story replies aren't available for this week.":
      replies+" "+(replies===1?"Story reply":"Story replies")+" recorded.",
    detail:"Follow up on comments and direct messages to identify meaningful patient questions."
  };
  // Historical reports may not have a reviewed insight. In that case use
  // comparable views of posts published in this *selected* week, not a
  // cross-week total or a claim about views earned during the week.
  const observed=feed.filter(p=>p.views!=null);
  const totalViews=observed.reduce((sum,p)=>sum+(p.views??0),0);
  const reelViews=observed.filter(p=>label(p.format)==="reel")
    .reduce((sum,p)=>sum+(p.views??0),0);
  const fallbackInsight=feed.length>=3&&reels.length>0&&reels.length<feed.length&&
    observed.length===feed.length&&totalViews>0&&reelViews>0?
    {headline:"Reels accounted for "+Math.round(100*reelViews/totalViews)+"% of Instagram feed views.",
      detail:reels.length+" Reels contributed "+reelViews.toLocaleString("en-US")+
        " of "+totalViews.toLocaleString("en-US")+" recorded views across "+feed.length+
        " feed posts. Totals reflect the latest capture."}
    :null;
  const insight=reviewed?.reviewedAt&&reviewed.insight?reviewed.insight:fallbackInsight;
  const action=reviewed?.reviewedAt?reviewed.action:
    metaLeads!=null&&metaLeads>0?
      "Check whether Meta submissions turned into real replies and consultation requests.":
    googleActions!=null&&googleActions>0?
      "Match Google conversion actions with new CRM inquiries and appointment requests.":
      "Confirm weekly CRM outcomes before changing acquisition investment.";
  return {metrics,paid,published,conversation,insight,action};
}
