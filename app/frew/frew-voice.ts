import type {LeadershipLog,LeadershipChannel} from "./frew-data";

type WeekIntro={headline:string;summary:string;next:string};
const fmt=(n:number)=>n.toLocaleString("en-US");

/** Plain-language weekly brief, computed from the selected week's data.
 * Do not render automated overview prose in the Frew hero: refreshed
 * publications can carry an older or overlong editorial tone.
 * Missing metrics are not zero; paid actions are not booked consults.
 */
export function writeWeekIntro(rows:LeadershipLog[],channels:LeadershipChannel[]):WeekIntro{
  const top=[...rows].filter(p=>p.platform==="Instagram"&&
    p.account.toLowerCase()==="@opusplasticsurgery"&&
    p.format.toLowerCase()!=="story"&&p.views!==null)
    .sort((a,b)=>(b.views??0)-(a.views??0))[0];
  const topCopy=top?
    " On Instagram, "+top.title+" has the most views so far ("+fmt(top.views??0)+").":"";
  const google=channels.find(c=>c.platform==="Google Ads"&&c.metrics.some(m=>m.label==="Conversions"&&m.value!=null));
  const conversions=google?.metrics.find(m=>m.label==="Conversions")?.value??null;
  if(conversions!==null){
    return {
      headline:"Google Ads recorded "+fmt(conversions)+" "+(conversions===1?"conversion.":"conversions."),
      summary:"These are Google Ads results"+(google?.period?" for "+google.period:"")+
        ", not confirmed consult bookings."+topCopy,
      next:"Match the Google Ads conversions to actual inquiries and booked consults in Aesthetix."
    };
  }
  const meta=channels.find(c=>c.platform==="Meta Ads"&&c.metrics.some(m=>m.label==="Leads"&&m.value!=null));
  const leads=meta?.metrics.find(m=>m.label==="Leads")?.value??null;
  if(leads!==null){
    return {
      headline:"Meta Ads reported "+fmt(leads)+" "+(leads===1?"lead.":"leads."),
      summary:"That's the number Meta reported"+(meta?.period?" for "+meta.period:"")+
        ", not a count of booked consults."+topCopy,
      next:"Check how many reported leads turned into actual inquiries and bookings."
    };
  }
  if(top){
    return {
      headline:top.title+" had the most Instagram views.",
      summary:fmt(top.views??0)+" views so far for that post. We don't have confirmed consultation numbers in this report.",
      next:"Review replies and inquiries alongside the post numbers."
    };
  }
  return {
    headline:"We're still gathering this week's numbers.",
    summary:"Some results haven't come through yet. Missing numbers aren't the same as zero.",
    next:"Check the latest posts and any outstanding inquiries."
  };
}
