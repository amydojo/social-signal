import type {LeadershipLog,LeadershipChannel} from "./frew-data";

type WeekIntro={headline:string;summary:string;next:string};
const fmt=(n:number)=>n.toLocaleString("en-US");
const namedMetric=(channels:LeadershipChannel[],platform:string,name:string)=>{
  const found=channels.find(c=>c.platform===platform&&c.metrics.some(m=>m.label===name&&m.value!==null));
  return {value:found?.metrics.find(m=>m.label===name)?.value??null,period:found?.period??null};
};
const topPosts=(rows:LeadershipLog[],platform:string)=>rows
  .filter(p=>p.platform===platform&&
    (platform!=="Instagram"&&platform!=="TikTok"||p.account.toLowerCase()==="@opusplasticsurgery")&&
    p.format.trim().toLowerCase()!=="story"&&
    p.views!==null&&Number.isFinite(p.views)&&p.views>0)
  .sort((a,b)=>(b.views??0)-(a.views??0));

function creativeHeadline(p:LeadershipLog,platform:string):string{
  const title=p.title.trim();
  if(platform==="Instagram"&&/frew/i.test(title)&&/tamara/i.test(title)&&/q&a/i.test(title))
    return "Frew and Tamara’s Q&A got the most Instagram views.";
  if(/^meet\s+/i.test(title))
    return "“"+title+"” got the most views.";
  if(p.format.toLowerCase()==="reel"&&/\bscar\b/i.test(title))
    return "The scar Reel got the most Instagram views.";
  return "“"+title+"” was our most-viewed "+platform+" post.";
}
function adsNote(channels:LeadershipChannel[]):{note:string;next:string}|null{
  const search=namedMetric(channels,"Google Ads","Conversions");
  const meta=namedMetric(channels,"Meta Ads","Leads");
  // A source-reported zero is not a booked consult, but neither is it
  // necessarily the week's lead story when real content results exist.
  if(search.value!==null&&search.value>0){
    return {
      note:"Google Ads also recorded "+fmt(search.value)+" "+
        (search.value===1?"conversion":"conversions")+
        (search.period?" ("+search.period+")":"")+
        ". Booked consults still need to be checked.",
      next:"Check in Aesthetix whether any of those ad conversions became inquiries or booked consults."
    };
  }
  if(meta.value!==null&&meta.value>0){
    return {
      note:"Meta Ads reported "+fmt(meta.value)+" "+(meta.value===1?"lead":"leads")+
        (meta.period?" ("+meta.period+")":"")+
        ". That isn't a confirmed booking count.",
      next:"Check whether the Meta leads replied or booked in Aesthetix."
    };
  }
  if(search.value===0)
    return {note:"Google Ads reported no conversions for the dates available.",next:"Check the posts and any new inquiries."};
  if(meta.value===0)
    return {note:"Meta Ads reported no leads for the dates available.",next:"Check the posts and any new inquiries."};
  return null;
}

/** The lead is the strongest *known* content story in this week's report.
 * Ads support the story; they only headline if no measured content exists.
 * Never compare post views across platforms as though their definitions match.
 */
export function writeWeekIntro(rows:LeadershipLog[],channels:LeadershipChannel[]):WeekIntro{
  const paid=adsNote(channels);
  const instagram=topPosts(rows,"Instagram");
  const tiktok=instagram.length?[]:topPosts(rows,"TikTok");
  const available=instagram.length?instagram:tiktok;
  const platform=instagram.length?"Instagram":"TikTok";
  const top=available[0],second=available[1];
  if(top){
    const secondText=second?" “"+second.title+"” followed with "+fmt(second.views??0)+".":"";
    const first=fmt(top.views??0)+" views so far among the "+platform+
      " posts we have numbers for."+secondText;
    return {
      headline:creativeHeadline(top,platform),
      summary:first+(paid?" "+paid.note:""),
      next:paid?.next??"Check replies and questions alongside the view counts."
    };
  }
  const ig=channels.find(c=>c.platform==="Instagram"&&c.account.toLowerCase()==="@opusplasticsurgery");
  const replies=ig?.metrics.find(m=>m.label==="Story replies")?.value??null;
  if(replies!==null&&replies>0){
    return {
      headline:"Our Instagram Stories got "+fmt(replies)+" "+
        (replies===1?"reply.":"replies."),
      summary:"That's a real response, not just a view."+(paid?" "+paid.note:""),
      next:"Look at what people replied to and what they wanted to know."
    };
  }
  if(paid){
    return {
      headline:paid.note.split(". ")[0]+".",
      summary:"We don't have enough post results to pick a content highlight yet. These ad results aren't confirmed bookings.",
      next:paid.next
    };
  }
  return {
    headline:"We're still gathering this week's numbers.",
    summary:"Some results haven't come through yet. Missing numbers aren't the same as zero.",
    next:"Check the latest posts and any outstanding inquiries."
  };
}
