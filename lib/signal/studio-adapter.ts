import type {Snapshot,Post,Story,Coverage,Insight} from "../../app/dashboard";
import type {PublicWeek} from "./publication";
import {interactionCount,isStory} from "../../app/frew/frew-selection";

/** Consistent data derivation for SIGNAL Studio + PULSE from ONE published feed. */
const sumIfComplete=(values:(number|null|undefined)[]):number|null=>
  values.length&&values.every(n=>n!==null&&n!==undefined)?
    values.reduce<number>((s,n)=>s+(n??0),0):null;

export function studioSnapshots(weeks:PublicWeek[]):Snapshot[]{
  return weeks.map(w=>{
    const channel=w.channels.find(c=>c.platform==="Instagram"&&c.account==="@opusplasticsurgery");
    const source=(label:string)=>channel?.metrics.find(m=>m.label===label)?.value??null;
    const ig=w.posts.filter(p=>p.platform==="Instagram"&&!isStory(p));
    const reels=ig.filter(p=>p.format.trim().toLowerCase()==="reel");
    const stories=w.posts.filter(p=>p.platform==="Instagram"&&isStory(p));
    return {
      id:"opus-public-"+w.weekStart,
      week_start:w.weekStart,week_end:w.weekEnd,captured_at:w.capturedAt,
      source:"OPUS SIGNAL · curated reporting snapshot",
      reel_views:source("Reel views")??sumIfComplete(reels.map(p=>p.views)),
      reel_interactions:source("Reel interactions")??sumIfComplete(reels.map(interactionCount)),
      feed_views:source("Feed views")??sumIfComplete(ig.map(p=>p.views)),
      feed_interactions:source("Feed interactions")??sumIfComplete(ig.map(interactionCount)),
      feed_pieces:ig.length,story_count:stories.length,
      story_impressions:source("Story impressions")??sumIfComplete(stories.map(p=>p.views)),
      story_replies:source("Story replies"),
      account_data_through:w.dataThrough,
      coverage_notes:w.status==="in_progress"?
        "Week to date. Metrics represent latest published captures; unavailable fields are not zero.":
        "Published cumulative post metrics, not period-earned exposure or unique account reach."
    };
  });
}
export function studioPosts(weeks:PublicWeek[]):Post[]{
  const items=new Map<string,Post>();
  // Newest snapshot wins; a repeated permalink is one creative, not a new post.
  for(const w of [...weeks].reverse()){
    for(const p of w.posts.filter(v=>!isStory(v))){
      const key=p.platform+"|"+(p.url||p.id);
      items.set(key,{
        id:p.id,published_on:p.date,title:p.title,permalink:p.url??"",
        platform:p.platform.toLowerCase(),format:p.format,views:p.views,
        reach:null,likes:p.likes,comments:p.comments,shares:p.shares,saves:p.saves,
        impressions:p.impressions??null,interactions:interactionCount(p),
        skip_3s_pct:null,avg_watch_seconds:null,
        thumbnail_path:p.thumbnailPath??undefined,
        thumbnail_original_url:p.coverUrl??undefined,
        metrics_basis:"cumulative_as_of_capture",metrics_captured_at:w.capturedAt
      });
    }
  }
  return [...items.values()];
}
export function studioStories(weeks:PublicWeek[]):Story[]{
  const items=new Map<string,Story>();
  for(const w of [...weeks].reverse()){
    for(const p of w.posts.filter(isStory)){
      const key=p.url??p.id;
      items.set(key,{
        id:p.id,published_at_raw:p.date.replaceAll("-","")+"120000",
        descriptor:p.title,impressions:p.views,reach:null,replies:null,exits:null,
        back_taps:null,forward_taps:null,permalink:p.url??"",
        thumbnail_path:p.thumbnailPath??null,thumbnail_original_url:p.coverUrl??null
      });
    }
  }
  return [...items.values()];
}
export function studioCoverage(week:PublicWeek):Coverage[]{
  return week.channels.map(ch=>{
    const reported=ch.metrics.filter(m=>m.value!=null);
    return {
      channel:ch.platform,account:ch.account,
      status:reported.length?"Reported":"Unverified",
      data:reported.length?reported.map(m=>m.label+": "+m.value+(m.unit??"")).join(" · "):"No verified metrics returned",
      limitation:[ch.period,ch.note].filter(Boolean).join(" · ")
    };
  });
}
export function studioInsights(week:PublicWeek):Insight[]{
  const overview=week.overview;
  if(!overview)return [];
  return [
    {id:week.weekStart+"-finding",kind:"finding",position:1,title:overview.statement,body:overview.summary},
    {id:week.weekStart+"-action",kind:"action",position:1,title:"Try next",body:overview.action}
  ];
}
