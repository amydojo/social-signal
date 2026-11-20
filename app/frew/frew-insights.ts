import type {LeadershipLog,LeadershipChannel} from "./frew-data";

export type PulseIndicator={label:string;value:number|null;detail:string;unit?:"USD"};
export type CadenceItem={label:string;observed:number|null;target:number;detail:string;key:string};
export type ExecutivePulse={
  metrics:PulseIndicator[];
  primary:CadenceItem[];
  secondary:CadenceItem[];
  creative:{headline:string;evidence:string;interpretation:string};
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
  const paid=google??meta;
  const paidValue=google?metric(google,"Conversions"):meta?metric(meta,"Leads"):null;
  const cost=google?metric(google,"Cost / conversion"):
    meta&&paidValue!=null&&paidValue>0&&metric(meta,"Spend")!=null?
    (metric(meta,"Spend") as number)/paidValue:null;
  const paidKind=google?"SEARCH ACTIONS":meta?"META REPORTED LEADS":"PAID ACTIONS";
  const reelViews=sumIfComplete(reels)??metric(channels.find(c=>c.platform==="Instagram"&&c.account==="@opusplasticsurgery"),"Reel views");
  const metrics:PulseIndicator[]=[
    {label:paidKind,value:paidValue,detail:paid?.period??"No verified paid activity"},
    {label:"COST / TRACKED ACTION",value:cost,detail:cost==null?"Not available":(meta&&!google?"Derived from reported lead count":"Platform-reported conversion cost"),unit:"USD"},
    {label:"CONSULTS VERIFIED",value:null,detail:"Private CRM outcome not connected"},
    {label:"INSTAGRAM REEL VIEWS",value:reelViews,detail:reels.length+" captured Reels · cumulative"}
  ];
  const count=(platform:string,format:string,account?:string):number|null=>{
    const candidates=rows.filter(p=>p.platform===platform&&(!account||p.account.toLowerCase()===account.toLowerCase())&&label(p.format)===format);
    // With no matching post-level evidence, zero publication cannot be asserted.
    return candidates.length?candidates.length:null;
  };
  const primary:CadenceItem[]=[
    {key:"ig-reels",label:"IG Reels",observed:reels.length,target:3,detail:"@opusplasticsurgery · captured"},
    {key:"ig-carousels",label:"IG carousels",observed:carousels.length,target:2,detail:"@opusplasticsurgery · captured"},
    {key:"ig-story-days",label:"IG Story days",observed:storyDates.size,target:5,detail:stories.length+" frames · weekday coverage"}
  ];
  const secondary:CadenceItem[]=[
    {key:"tiktok",label:"TikTok videos",observed:count("TikTok","video","@opusplasticsurgery"),target:4,detail:"No complete linked post log"},
    {key:"youtube",label:"YouTube Shorts",observed:count("YouTube","short"),target:3,detail:"OPUS channel not independently linked"},
    {key:"results",label:"Results posts",observed:rows.filter(p=>p.platform==="Instagram"&&p.account.toLowerCase()==="@opusresults").length||null,target:2,detail:"@opusresults not independently linked"},
    {key:"gbp",label:"Google Business posts",observed:count("Google Business Profile","post"),target:1,detail:"Analytics activity ≠ published posts"}
  ];
  const ranked=feed.filter(p=>p.views!=null).sort((a,b)=>(b.views??0)-(a.views??0));
  const bestViewed=ranked[0];
  const eligible=feed.filter(p=>p.views!=null&&p.views>=100&&interactions(p)!=null);
  const mostEngaging=[...eligible].sort((a,b)=>
    (interactions(b)??0)/(b.views??1)-(interactions(a)??0)/(a.views??1))[0];
  let creative:ExecutivePulse["creative"];
  if(bestViewed&&mostEngaging&&bestViewed.id!==mostEngaging.id){
    const rate=(p:LeadershipLog)=>((interactions(p)??0)/(p.views??1)*100).toFixed(1);
    creative={
      headline:bestViewed.title+" led views; "+mostEngaging.title+" led interactions per view.",
      evidence:bestViewed.views?.toLocaleString("en-US")+" views versus "+rate(mostEngaging)+"% interaction/view on the second creative (vs "+rate(bestViewed)+"%).",
      interpretation:"An early creative signal, not proof of patient intent. Test both approaches before changing the content mix."
    };
  }else if(bestViewed){
    creative={
      headline:bestViewed.title+" led captured post views.",
      evidence:bestViewed.views?.toLocaleString("en-US")+" cumulative views at source capture.",
      interpretation:"Compare patient questions, saves and qualified inquiries before drawing a repeatable creative conclusion."
    };
  }else{
    creative={
      headline:"No comparable creative winner can be verified yet.",
      evidence:"Post-level measurements are missing or incomplete for this selection.",
      interpretation:"Capture post-level results and review qualitative audience questions before recommending a change."
    };
  }
  const checked=feed.filter(p=>p.status!=null&&p.ctaChecked!=null&&p.complianceChecked!=null).length;
  const action=paidValue!=null&&paidValue>0?
    "Reconcile reported ad actions with Aesthetix inquiries before the next budget decision.":
    "Confirm consultation outcomes privately, then review next week's content for Friday approval.";
  return {
    metrics,primary,secondary,creative,action,
    verification:{observed:feed.length,checked,sourceAvailable:checked>0},
    comparisonNote:"Paid windows and cumulative post captures differ across weeks; a like-for-like weekly trend is not yet validated."
  };
}
