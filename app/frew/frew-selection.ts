import type {LeadershipLog,LeadershipChannel} from "./frew-data";

export type WeeklyFeature={
  post:LeadershipLog;
  label:"MOST VIEWED"|"STRONG ENGAGEMENT"|"NEXT MOST VIEWED";
  metricLabel:string;
};

/** ISO Monday start derived from the source publication date (not a fixed week list). */
export function weekStartFor(date:string):string|null{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
  const dt=new Date(date+"T12:00:00Z");
  if(Number.isNaN(dt.getTime())||dt.toISOString().slice(0,10)!==date)return null;
  dt.setUTCDate(dt.getUTCDate()-((dt.getUTCDay()+6)%7));
  return dt.toISOString().slice(0,10);
}

export function groupPostsByWeek(posts:LeadershipLog[]):Record<string,LeadershipLog[]>{
  const weeks:Record<string,LeadershipLog[]>={};
  for(const post of posts){
    const week=weekStartFor(post.date);
    if(!week)continue;
    (weeks[week]??=[]).push(post);
  }
  for(const items of Object.values(weeks)){
    items.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  }
  return weeks;
}

export function labelWeek(start:string):string{
  const date=new Date(start+"T12:00:00Z");
  date.setUTCDate(date.getUTCDate()+6);
  const fmt=(dt:Date)=>dt.toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
  return fmt(new Date(start+"T12:00:00Z"))+"–"+fmt(date);
}
export function isStory(post:LeadershipLog):boolean{
  return post.format.trim().toLowerCase()==="story";
}
export function interactionCount(post:LeadershipLog):number|null{
  const metrics=[post.likes,post.comments,post.shares,post.saves];
  if(metrics.some(m=>m===null||m===undefined||!Number.isFinite(m)))return null;
  return (metrics as number[]).reduce((sum,n)=>sum+n,0);
}
function mostViewed(a:LeadershipLog,b:LeadershipLog):number{
  return (b.views??-1)-(a.views??-1)||b.date.localeCompare(a.date)||a.id.localeCompare(b.id);
}
/**
 * Pick creative features from actual posts.
 * The two comparison slots are within one platform to avoid equating TikTok and
 * Instagram view attribution. First slot = most viewed; second = strongest
 * interaction-per-view signal among other posts with >=100 cumulative views.
 * If interaction fields are missing, use the next-highest viewed post.
 * Carousels and video are both eligible. Stories have their own strip.
 */
export function chooseWeeklyFeatures(rows:LeadershipLog[],max=2):WeeklyFeature[]{
  const candidates=rows.filter(post=>!isStory(post)&&post.views!=null&&Number.isFinite(post.views)&&post.views>=0);
  const instagram=candidates.filter(post=>post.platform==="Instagram");
  const pool=(instagram.length?instagram:candidates).sort(mostViewed);
  const first=pool[0];
  if(!first||max<1)return [];
  const result:WeeklyFeature[]=[{post:first,label:"MOST VIEWED",metricLabel:"views"}];
  if(max===1||pool.length<2)return result;
  const available=pool.slice(1);
  const engaging=available.filter(post=>post.views!=null&&post.views>=100&&interactionCount(post)!=null);
  engaging.sort((a,b)=>{
    const ra=interactionCount(a)!/(a.views||1),rb=interactionCount(b)!/(b.views||1);
    return rb-ra||mostViewed(a,b);
  });
  const second=engaging[0]??available.sort(mostViewed)[0];
  if(!second)return result;
  const interactions=interactionCount(second);
  result.push({
    post:second,
    label:engaging.length?"STRONG ENGAGEMENT":"NEXT MOST VIEWED",
    metricLabel:interactions===null?"views":`views · ${interactions.toLocaleString("en-US")} interactions`
  });
  return result;
}
/** Safe fallback when no period-specific account totals have been ingested. */
export function channelOverviewFromPosts(rows:LeadershipLog[],period:string):LeadershipChannel[]{
  const groups=new Map<string,LeadershipLog[]>();
  for(const p of rows){
    const key=p.platform+"|"+p.account;
    const items=groups.get(key)??[];items.push(p);groups.set(key,items);
  }
  return [...groups].map(([key,items])=>{
    const [platform,account]=key.split("|");
    const feed=items.filter(item=>!isStory(item));
    const stories=items.filter(isStory);
    const total=(a:LeadershipLog[])=>a.length&&a.every(p=>p.views!=null)?a.reduce((s,p)=>s+(p.views??0),0):null;
    const count=feed.map(interactionCount);
    const interactions=count.length&&count.every(n=>n!=null)?count.reduce<number>((s,n)=>s+(n??0),0):null;
    return {platform,account,period:labelWeek(period),source:"metricool",
      metrics:[
        {label:"Posts",value:feed.length},
        {label:"Feed views",value:total(feed)},
        {label:"Feed interactions",value:interactions},
        {label:"Stories",value:stories.length},
        {label:"Story impressions",value:total(stories)}
      ],
      note:"Cumulative figures for posts published in this week; not account-wide weekly reach"
    };
  });
}
