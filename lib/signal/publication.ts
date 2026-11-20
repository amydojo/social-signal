import type {LeadershipChannel,LeadershipLog} from "../../app/frew/frew-data";
import type {PerformanceWeek} from "../../app/frew/frew-performance";

/** Public-safe projection: never hydrate arbitrary private source records into pages. */
export type PublicOverview={
  statement:string;summary:string;action:string;
  indicators:{label:string;value:number|null;detail:string}[];
};
export type PublicWeek={
  weekStart:string;weekEnd:string;status:"in_progress"|"complete";
  capturedAt:string;dataThrough:string|null;revision:number;
  posts:LeadershipLog[];channels:LeadershipChannel[];
  overview?:PublicOverview;diagnostics?:PerformanceWeek;
  coverage?:{platform:string;account:string;linked:boolean;note?:string}[];
};
const string=(x:unknown,n=500)=>typeof x==="string"&&x.length>0&&x.length<=n;
const finiteNonnegative=(x:unknown)=>typeof x==="number"&&Number.isFinite(x)&&x>=0;
const nonnegative=(x:unknown)=>x===null||finiteNonnegative(x);
const safeURL=(x:unknown)=>x==null||(string(x,2048)&&/^https:\/\//i.test(x as string));
const safePath=(x:unknown)=>x==null||(string(x,400)&&/^\/media\/archive\/[a-zA-Z0-9_.-]+$/.test(x as string));
const dateValid=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&
  !Number.isNaN(Date.parse(v+"T12:00:00Z"))&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v;
const mondayOf=(v:string):string=>{
  const dt=new Date(v+"T12:00:00Z");
  dt.setUTCDate(dt.getUTCDate()-((dt.getUTCDay()+6)%7));
  return dt.toISOString().slice(0,10);
};
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const attrs=(x:Record<string,unknown>,keys:string[])=>
  Object.keys(x).every(key=>keys.includes(key));
const postFields=["id","date","platform","account","format","title","url","views","likes","comments","shares","saves","interactions","impressions","status","ctaChecked","complianceChecked","thumbnailPath","coverUrl"];
const channelFields=["platform","account","metrics","note","source","period"];
const metricFields=["label","value","unit"];

function parsePost(x:unknown,week:string):LeadershipLog|null{
  if(!obj(x)||!attrs(x,postFields)||
    !string(x.id,130)||!dateValid(x.date)||mondayOf(x.date as string)!==week||
    !string(x.platform,80)||!string(x.account,180)||
    !string(x.format,80)||!string(x.title,500)||
    !safeURL(x.url)||!safeURL(x.coverUrl)||
    !safePath(x.thumbnailPath))return null;
  const keys=["views","likes","comments","shares","saves","interactions","impressions"];
  if(keys.some(k=>!nonnegative(x[k])))return null;
  return {
    id:x.id as string,date:x.date as string,platform:x.platform as string,
    account:x.account as string,format:x.format as string,title:x.title as string,
    url:(x.url as string|null|undefined)??null,
    views:(x.views as number|null|undefined)??null,
    likes:(x.likes as number|null|undefined)??null,
    comments:(x.comments as number|null|undefined)??null,
    shares:(x.shares as number|null|undefined)??null,
    saves:(x.saves as number|null|undefined)??null,
    interactions:(x.interactions as number|null|undefined)??null,
    impressions:(x.impressions as number|null|undefined)??null,
    thumbnailPath:(x.thumbnailPath as string|null|undefined)??null,
    coverUrl:(x.coverUrl as string|null|undefined)??null,
    status:null,ctaChecked:null,complianceChecked:null
  };
}
function parseChannel(x:unknown):LeadershipChannel|null{
  if(!obj(x)||!attrs(x,channelFields)||!string(x.platform,90)||
    !string(x.account,180)||!string(x.period,140)||
    !Array.isArray(x.metrics)||x.metrics.length>28)return null;
  const metrics=[];
  for(const m of x.metrics){
    if(!obj(m)||!attrs(m,metricFields)||!string(m.label,120)||
      !nonnegative(m.value)||!(m.unit==null||string(m.unit,15)))return null;
    metrics.push({label:m.label as string,value:(m.value as number|null|undefined)??null,
      ...(m.unit?{unit:m.unit as string}:{})});
  }
  if(x.note!=null&&!string(x.note,460))return null;
  return {
    platform:x.platform as string,account:x.account as string,
    period:x.period as string,source:"derived",metrics,
    ...(x.note?{note:x.note as string}:{})
  };
}
function parseOverview(x:unknown):PublicOverview|null{
  if(!obj(x)||!attrs(x,["statement","summary","action","indicators"])||
    !string(x.statement,250)||!string(x.summary,800)||!string(x.action,500)||
    !Array.isArray(x.indicators)||x.indicators.length>5)return null;
  const indicators:PublicOverview["indicators"]=[];
  for(const v of x.indicators){
    if(!obj(v)||!attrs(v,["label","value","detail"])||!string(v.label,100)||
      !nonnegative(v.value)||!string(v.detail,300))return null;
    indicators.push({label:v.label as string,value:(v.value as number|null)??null,
      detail:v.detail as string});
  }
  return {statement:x.statement as string,summary:x.summary as string,
    action:x.action as string,indicators};
}
function parseDiagnostics(x:unknown):PerformanceWeek|null{
  if(!obj(x)||!attrs(x,["reels","stories","keyword","audience"])||
    !Array.isArray(x.reels)||x.reels.length>40||!obj(x.stories))return null;
  const reels=[];
  for(const item of x.reels){
    const fields=["id","title","views","reach","interactions","avgWatchSeconds",
      "past3SecondsPct","skip3SecondsPct","shares","saves"];
    if(!obj(item)||!attrs(item,fields)||!string(item.id,130)||!string(item.title,250)||
      fields.slice(2).some(k=>!finiteNonnegative(item[k]))||
      (item.past3SecondsPct as number)>100||(item.skip3SecondsPct as number)>100)return null;
    reels.push(item as unknown as PerformanceWeek["reels"][number]);
  }
  const stories=x.stories as Record<string,unknown>;
  const keys=["count","impressions","replies","exits","backTaps","forwardTaps"];
  if(!attrs(stories,keys)||keys.some(k=>!finiteNonnegative(stories[k])))return null;
  const keyword=x.keyword;
  if(keyword!=null){
    if(!obj(keyword)||!attrs(keyword,["term","conversions","clicks","spend","impressions"])||
      !string(keyword.term,160)||["conversions","clicks","spend","impressions"].some(k=>!finiteNonnegative(keyword[k])))return null;
  }
  const audience=x.audience;
  if(audience!=null){
    if(!obj(audience)||!attrs(audience,["instagramFollowers","asOf","engagedByDay"])||
      !nonnegative(audience.instagramFollowers)||!string(audience.asOf,100)||
      !Array.isArray(audience.engagedByDay)||audience.engagedByDay.length>35||
      audience.engagedByDay.some(v=>!obj(v)||!attrs(v,["date","accounts"])||
        !string(v.date,30)||!finiteNonnegative(v.accounts)))return null;
  }
  return {
    reels,stories:stories as unknown as PerformanceWeek["stories"],
    ...(keyword?{keyword:keyword as PerformanceWeek["keyword"]}:{}),
    ...(audience?{audience:audience as PerformanceWeek["audience"]}:{})
  };
}
function parseCoverage(x:unknown):PublicWeek["coverage"]|null{
  if(!Array.isArray(x)||x.length>30)return null;
  const out:NonNullable<PublicWeek["coverage"]>=[];
  for(const item of x){
    if(!obj(item)||!attrs(item,["platform","account","linked","note"])||
      !string(item.platform,90)||!string(item.account,180)||
      typeof item.linked!=="boolean"||!(item.note==null||string(item.note,400)))return null;
    out.push({platform:item.platform as string,account:item.account as string,
      linked:item.linked as boolean,...(item.note?{note:item.note as string}:{})});
  }
  return out;
}
export function parsePublishedReport(row:unknown):PublicWeek|null{
  if(!obj(row)||!dateValid(row.week_start)||mondayOf(row.week_start as string)!==row.week_start||
    !dateValid(row.week_end)||row.week_end!==new Date(Date.parse((row.week_start as string)+"T12:00:00Z")+6*86400000).toISOString().slice(0,10)||
    (row.status!=="complete"&&row.status!=="in_progress")||
    (row.data_through!=null&&(!dateValid(row.data_through)||(row.data_through as string)<(row.week_start as string)||(row.data_through as string)>(row.week_end as string)))||
    !string(row.captured_at,55)||!Number.isFinite(Date.parse(row.captured_at as string))||
    row.schema_version!==1||typeof row.revision!=="number"||row.revision<1||!obj(row.payload)
  )return null;
  const payload=row.payload as Record<string,unknown>;
  if(!attrs(payload,["posts","channels","overview","diagnostics","coverage"])||
    !Array.isArray(payload.posts)||!Array.isArray(payload.channels)||
    payload.posts.length>400||payload.channels.length>40)return null;
  const posts=payload.posts.map(post=>parsePost(post,row.week_start as string));
  const channels=payload.channels.map(parseChannel);
  if(posts.some(p=>!p)||channels.some(c=>!c))return null;
  const unique=new Set(posts.map(post=>post?.id));
  if(unique.size!==posts.length)return null;
  const overview=payload.overview==null?undefined:parseOverview(payload.overview);
  const diagnostics=payload.diagnostics==null?undefined:parseDiagnostics(payload.diagnostics);
  const coverage=payload.coverage==null?undefined:parseCoverage(payload.coverage);
  if((payload.overview!=null&&!overview)||
    (payload.diagnostics!=null&&!diagnostics)||
    (payload.coverage!=null&&!coverage))return null;
  // Only reviewed overview/diagnostic keys can reach public UI; never forward
  // arbitrary raw source data or private account exports.
  return {
    weekStart:row.week_start as string,weekEnd:row.week_end as string,
    status:row.status as PublicWeek["status"],capturedAt:row.captured_at as string,
    dataThrough:(row.data_through as string|null)??null,revision:row.revision as number,
    posts:posts as LeadershipLog[],channels:channels as LeadershipChannel[],
    ...(overview?{overview}:{}),
    ...(diagnostics?{diagnostics}:{}),
    ...(coverage?{coverage}:{})
  };
}
