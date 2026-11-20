import type {LeadershipLog,LeadershipChannel} from "./frew-data";

type WeekIntro={headline:string;summary:string;next:string};
const fmt=(n:number)=>n.toLocaleString("en-US");
const isOpus=(p:LeadershipLog)=>p.platform==="Instagram"&&p.account.toLowerCase()==="@opusplasticsurgery";
const value=(channels:LeadershipChannel[],platform:string,field:string)=>{
  const ch=channels.find(c=>c.platform===platform&&c.metrics.some(m=>m.label===field&&m.value!=null));
  return {n:ch?.metrics.find(m=>m.label===field)?.value??null,period:ch?.period??null};
};

/** The lead is a real weekly work/status update, NOT a ranking of post views
 * or a default Google Ads headline. Metrics and attribution stay in supporting
 * copy. Neither advertising events nor social engagement imply booked consults.
 */
export function writeWeekIntro(rows:LeadershipLog[],channels:LeadershipChannel[]):WeekIntro{
  const feed=rows.filter(p=>isOpus(p)&&p.format.toLowerCase()!=="story");
  const titles=feed.map(p=>p.title.toLowerCase());
  const teamIntro=titles.some(t=>/meet tamara/.test(t));
  const teamQA=titles.some(t=>/frew/.test(t)&&/tamara/.test(t)&&/q\s*&\s*a/.test(t));
  const implant=titles.filter(t=>/implant/.test(t));
  const scar=titles.some(t=>/scar/.test(t));
  const belly=titles.some(t=>/belly|bulging/.test(t));
  const educational=titles.some(t=>/implant|scar|belly|bulging|tummy tuck|lipo|skin|breast|recovery/.test(t));
  const reels=feed.filter(p=>p.format.toLowerCase()==="reel").length;
  const carousels=feed.filter(p=>p.format.toLowerCase()==="carousel").length;

  let headline:string;
  if(teamQA&&implant.length>=2){
    headline="An office Q&A and two implant explainers went out this week.";
  }else if(teamIntro){
    headline="We introduced Tamara and kept the procedure content going.";
  }else if(scar&&belly){
    headline="This week we covered scars and why the belly can still bulge.";
  }else if(teamQA&&educational){
    headline="We shared an office Q&A and answered a surgery question.";
  }else if(educational){
    headline="This week's posts focused on questions patients ask about surgery.";
  }else if(teamQA||titles.some(t=>/meet |team|office/.test(t))){
    headline="This week we showed more of the people behind OPUS.";
  }else if(feed.length){
    headline="This week's posts are out. Now we need the follow-through numbers.";
  }else{
    headline="We still need a clear update on inquiries and bookings.";
  }

  const search=value(channels,"Google Ads","Conversions");
  const meta=value(channels,"Meta Ads","Leads");
  // Prioritize a measured positive result over an unrelated zero,
  // particularly when platforms cover different partial date windows.
  const paid=meta.n!=null&&meta.n>0?{
    text:"Meta reported "+fmt(meta.n)+" "+(meta.n===1?"lead":"leads")+
      (meta.period?" ("+meta.period+")":""),
  }:search.n!=null&&search.n>0?{
    text:"Google Ads recorded "+fmt(search.n)+" "+(search.n===1?"conversion":"conversions")+
      (search.period?" ("+search.period+")":""),
  }:null;
  const known=feed.length?
    "We have "+reels+" "+(reels===1?"Reel":"Reels")+" and "+
    carousels+" "+(carousels===1?"carousel":"carousels")+" recorded for OPUS Instagram.":
    "We don't have a complete OPUS Instagram post list for this week.";
  const summary=known+" "+(paid?paid.text+". ":"")+
    "This public report doesn't show how many inquiries actually booked.";
  return {
    headline,summary,
    next:"Check confirmed inquiries and booked consults with Tamara in Aesthetix. Then review anything Frew needs to approve."
  };
}
