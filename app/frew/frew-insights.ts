import type {LeadershipLog,LeadershipChannel} from "./frew-data";
import type {PublicOverview} from "../../lib/signal/publication";

export type PulseIndicator={label:string;value:number|null;detail:string;unit?:"USD"};
export type PaidIndicator={value:number|null;period:string|null;note:string};
export type ExecutivePulse={
  metrics:PulseIndicator[];
  paid:{google:PaidIndicator;meta:PaidIndicator};
  published:{headline:string;detail:string};
  conversation:{headline:string;detail:string};
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

  // Anonymous public page has no owner-only Aesthetix numbers. Never use ad
  // events or old cohorts as this week's qualified inquiries or bookings.
  const metrics:PulseIndicator[]=[
    {label:"NEW CRM INQUIRIES",value:null,detail:"Weekly CRM count to verify"},
    {label:"CONSULTS BOOKED",value:null,detail:"Private appointment totals not published"},
    {label:"QUALIFIED CONVERSATIONS",value:null,detail:"Human reply review needed"}
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
    detail:"The actual questions in comments, DMs and Aesthetix still need review before drawing conclusions about patient intent."
  };
  const action=reviewed?.reviewedAt?reviewed.action:
    metaLeads!=null&&metaLeads>0?
      "Check whether Meta submissions turned into real replies and consultation requests.":
    googleActions!=null&&googleActions>0?
      "Match Google conversion actions with new CRM inquiries and appointment requests.":
      "Confirm weekly CRM outcomes before changing acquisition investment.";
  return {metrics,paid,published,conversation,action};
}
