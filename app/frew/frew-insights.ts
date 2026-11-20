import type {LeadershipLog,LeadershipChannel} from "./frew-data";

export type PulseIndicator={label:string;value:number|null;detail:string;unit?:"USD"};
export type ExecutivePulse={
  metrics:PulseIndicator[];
  published:{headline:string;detail:string};
  conversation:{headline:string;detail:string};
  action:string;
};
const label=(s:string)=>s.trim().toLowerCase();
const metric=(channel:LeadershipChannel|undefined,name:string)=>
  channel?.metrics.find(m=>m.label===name)?.value??null;
const isInstagram=(p:LeadershipLog)=>p.platform==="Instagram"&&p.account.toLowerCase()==="@opusplasticsurgery";
const isStory=(p:LeadershipLog)=>label(p.format)==="story";

export function buildExecutivePulse(rows:LeadershipLog[],channels:LeadershipChannel[]):ExecutivePulse{
  const feed=rows.filter(p=>isInstagram(p)&&!isStory(p));
  const reels=feed.filter(p=>label(p.format)==="reel");
  const carousels=feed.filter(p=>label(p.format)==="carousel");
  const google=channels.find(c=>c.platform==="Google Ads"&&metric(c,"Conversions")!=null);
  const meta=channels.find(c=>c.platform==="Meta Ads"&&metric(c,"Leads")!=null);
  const paid=google&&(metric(google,"Conversions")??0)>0?google:
    meta&&(metric(meta,"Leads")??0)>0?meta:
    google??meta;
  const paidValue=paid?metric(paid,paid.platform==="Google Ads"?"Conversions":"Leads"):null;

  // No posting targets, punctuality statuses, inferred absences, or grades.
  const metrics:PulseIndicator[]=[
    {label:"CONSULTS BOOKED",value:null,detail:"Private · see owner report"},
    {label:"INQUIRIES CONFIRMED",value:null,detail:"Check in Aesthetix"},
    {label:"POSTS DOCUMENTED",value:feed.length||null,detail:"OPUS Instagram · feed posts"},
    {label:paid?.platform==="Google Ads"?"GOOGLE AD ACTIONS":paid?.platform==="Meta Ads"?"META LEADS":"AD RESULTS",
      value:paidValue,detail:paid?.period??"Not available"}
  ];
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
  const igChannel=channels.find(c=>c.platform==="Instagram"&&c.account.toLowerCase()==="@opusplasticsurgery");
  const replies=metric(igChannel,"Story replies");
  const conversation={
    headline:replies==null?"Story replies aren't available for this week.":
      replies+" "+(replies===1?"Story reply":"Story replies")+" recorded.",
    detail:"The actual questions in comments, DMs and Aesthetix still need to be reviewed before we can describe patient intent."
  };
  return {
    metrics,published,conversation,
    action:"Confirm inquiries and booked consults in Aesthetix, then review decisions that need Frew."
  };
}
