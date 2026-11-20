import type {LeadershipLog,LeadershipChannel} from "./frew-data";

export type PulseIndicator={label:string;value:number|null;detail:string;unit?:"USD"};
export type CadenceItem={label:string;observed:number|null;target:number;detail:string;key:string};
export type ExecutivePulse={
  metrics:PulseIndicator[];
  primary:CadenceItem[];
  secondary:CadenceItem[];
  creative:{headline:string;evidence:string;interpretation:string};
  published:{headline:string;detail:string};
  conversation:{headline:string;detail:string};
  action:string|null;
  verification:{observed:number;checked:number;sourceAvailable:boolean};
  comparisonNote:string;
};
const label=(s:string)=>s.trim().toLowerCase();
const metric=(channel:LeadershipChannel|undefined,name:string)=>
  channel?.metrics.find(m=>m.label===name)?.value??null;
const interactions=(p:LeadershipLog):number|null=>{
  if(p.interactions!=null&&Number.isFinite(p.interactions))return p.interactions;
  const parts=[p.likes,p.comments,p.shares,p.saves];
  return parts.every(x=>x!=null&&Number.isFinite(x))?
    parts.reduce<number>((sum,x)=>sum+(x??0),0):null;
};
const sumIfComplete=(rows:LeadershipLog[]):number|null=>
  rows.length>0&&rows.every(p=>p.views!=null)?
    rows.reduce((n,p)=>n+(p.views??0),0):null;
const isInstagram=(p:LeadershipLog)=>p.platform==="Instagram"&&p.account.toLowerCase()==="@opusplasticsurgery";
const isStory=(p:LeadershipLog)=>label(p.format)==="story";

export function buildExecutivePulse(rows:LeadershipLog[],channels:LeadershipChannel[]):ExecutivePulse{
  const ig=rows.filter(isInstagram);
  const feed=ig.filter(p=>!isStory(p));
  const reels=feed.filter(p=>label(p.format)==="reel");
  const carousels=feed.filter(p=>label(p.format)==="carousel");
  const stories=ig.filter(isStory);
  const storyDates=new Set(stories.filter(p=>{
    const day=new Date(p.date+"T12:00:00Z").getUTCDay();
    return day>=1&&day<=5;
  }).map(p=>p.date));
  const google=channels.find(c=>c.platform==="Google Ads"&&metric(c,"Conversions")!=null);
  const meta=channels.find(c=>c.platform==="Meta Ads"&&metric(c,"Leads")!=null);
  const paid=google&&(metric(google,"Conversions")??0)>0?google:
    meta&&(metric(meta,"Leads")??0)>0?meta:
    google??meta;
  const paidValue=paid?metric(paid,paid.platform==="Google Ads"?"Conversions":"Leads"):null;
  const metrics:PulseIndicator[]=[
    {label:"CONSULTS BOOKED",value:null,detail:"Private · see owner report"},
    {label:"INQUIRIES CONFIRMED",value:null,detail:"Check in Aesthetix"},
    {label:"POSTS DOCUMENTED",value:feed.length||null,detail:"OPUS Instagram · feed posts"},
    {label:paid?.platform==="Google Ads"?"GOOGLE AD ACTIONS":paid?.platform==="Meta Ads"?"META LEADS":"AD RESULTS",value:paidValue,
      detail:paid?.period??"Not available"}
  ];
  const count=(platform:string,format:string,account?:string):number|null=>{
    const candidates=rows.filter(p=>p.platform===platform&&(!account||p.account.toLowerCase()===account.toLowerCase())&&label(p.format)===format);
    // With no matching post-level evidence, zero publication cannot be asserted.
    return candidates.length?candidates.length:null;
  };
  const primary:CadenceItem[]=[
    {key:"ig-reels",label:"Reels",observed:reels.length,target:3,detail:"Instagram"},
    {key:"ig-carousels",label:"Carousels",observed:carousels.length,target:2,detail:"Instagram"},
    {key:"ig-story-days",label:"Story days",observed:storyDates.size,target:5,detail:stories.length+" Stories · Mon–Fri"}
  ];
  const secondary:CadenceItem[]=[
    {key:"tiktok",label:"TikToks",observed:count("TikTok","video","@opusplasticsurgery"),target:4,detail:"Post list not fully connected"},
    {key:"youtube",label:"YouTube Shorts",observed:count("YouTube","short"),target:3,detail:"OPUS channel not linked"},
    {key:"results",label:"Results posts",observed:rows.filter(p=>p.platform==="Instagram"&&p.account.toLowerCase()==="@opusresults").length||null,target:2,detail:"@opusresults not linked"},
    {key:"gbp",label:"Google Business posts",observed:count("Google Business Profile","post"),target:1,detail:"Post count not available"}
  ];
  // No "winner" inferred from views: this is about what was published.
  const published={
    headline:feed.length?
      feed.length+" Instagram "+(feed.length===1?"post":"posts")+" recorded, including "+
      reels.length+" "+(reels.length===1?"Reel":"Reels")+" and "+
      carousels.length+" "+(carousels.length===1?"carousel":"carousels")+"."
      :"No OPUS Instagram feed posts recorded for these dates.",
    detail:feed.length?
      "Recent topics: "+[...feed].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,2).map(p=>p.title).join(" · ")+"."
      :"A missing post list isn't proof that nothing was published."
  };
  const igChannel=channels.find(c=>c.platform==="Instagram"&&c.account.toLowerCase()==="@opusplasticsurgery");
  const replies=metric(igChannel,"Story replies");
  const conversation={
    headline:replies==null?"Story replies aren't available for this week.":
      replies+" "+(replies===1?"Story reply":"Story replies")+" recorded.",
    detail:"We still need the actual questions from comments, DMs and Aesthetix to understand patient intent."
  };
  const creative={
    headline:published.headline,
    evidence:published.detail,
    interpretation:"Review audience questions and booked inquiries before calling any post a success."
  };
  const checked=feed.filter(p=>p.status!=null&&p.ctaChecked!=null&&p.complianceChecked!=null).length;
  const action="Check booked consults with Tamara and confirm what still needs Frew's approval.";
  return {
    metrics,primary,secondary,creative,published,conversation,action,
    verification:{observed:feed.length,checked,sourceAvailable:checked>0},
    comparisonNote:"These numbers come from different dates and sources. We shouldn’t call it a week-over-week increase or decrease until the time ranges match."
  };
}
