"use client";

import {useEffect,useState} from "react";
import {Download,FileText,ExternalLink,ChevronDown,CalendarDays,ImageIcon} from "lucide-react";
import {posts as metricoolPosts, stories as metricoolStories, snapshot} from "../report-data";
import {historicalPosts} from "../history-data";
import archiveIndex from "../../public/media/archive/index.json";
import {nov2Channels,nov2Log,type LeadershipLog,type LeadershipChannel} from "./frew-data";
import FrewStamp from "./frew-stamp";

type Period="2026-11-16"|"2026-11-09"|"2026-11-02";
const savedCovers=new Set(archiveIndex.assets.filter(a=>a.status==="saved").map(a=>a.file));
const fmt=(n:number|null|undefined)=>n==null?"—":n.toLocaleString("en-US");
const day=(d:string)=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
const csv=(rows:(number|string|null|undefined)[][])=>rows.map(row=>row.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");

const allRecentLog:LeadershipLog[]=[
  ...metricoolPosts.map(p=>({
    id:p.id,date:p.published_on,
    platform:p.platform==="instagram"?"Instagram":"Facebook",
    account:p.platform==="instagram"?"@opusplasticsurgery":"OPUS Plastic Surgery",
    format:p.format??"Post",title:p.title,url:p.permalink,
    views:p.views??p.impressions??null,likes:p.likes,comments:p.comments,shares:p.shares,saves:p.saves,
    status:null,ctaChecked:null,complianceChecked:null
  })),
  ...metricoolStories.map(story=>({
    id:story.id,
    date:story.published_at_raw.slice(0,4)+"-"+story.published_at_raw.slice(4,6)+"-"+story.published_at_raw.slice(6,8),
    platform:"Instagram",account:"@opusplasticsurgery",format:"Story",
    title:story.descriptor==="(no story text)"?"Instagram Story":story.descriptor,
    url:story.permalink||null,views:story.impressions,
    likes:null,comments:null,shares:null,saves:null,
    status:null,ctaChecked:null,complianceChecked:null
  }))
].sort((a,b)=>b.date.localeCompare(a.date));

const latestLog=allRecentLog.filter(p=>p.date>="2026-11-09"&&p.date<="2026-11-15");
const currentLog=allRecentLog.filter(p=>p.date>="2026-11-16"&&p.date<="2026-11-22");
// Period scoped: never mix historical account metrics into a different week.
const latestChannels:LeadershipChannel[]=[
  {platform:"Instagram",account:"@opusplasticsurgery",period:"Nov 9–15",source:"metricool",metrics:[
    {label:"Feed views",value:snapshot.feed_views??null},
    {label:"Feed interactions",value:snapshot.feed_interactions??null},
    {label:"Stories",value:snapshot.story_count},
    {label:"Story impressions",value:snapshot.story_impressions??null},
    {label:"Story replies",value:snapshot.story_replies}
  ]},
  {platform:"Facebook",account:"OPUS Plastic Surgery",period:"Nov 9–15",source:"metricool",
    metrics:[{label:"Posts",value:2},{label:"Reel views",value:17},{label:"Carousel impressions",value:1}]},
  {platform:"TikTok",account:"@opusplasticsurgery",period:"Nov 9–15",source:"metricool",
    metrics:[],note:"Video stats not reporting"},
  {platform:"Google Business Profile",account:"OPUS · Upland",period:"Nov 9–15",source:"metricool",
    metrics:[],note:"Weekly totals unavailable"}
];
// Keep accounts discoverable without silently reusing Nov 2–6 statistics.
const currentChannels:LeadershipChannel[]=[
  {platform:"Instagram",account:"@opusplasticsurgery",period:"Nov 16–22",source:"metricool",metrics:[],note:"Account totals unavailable"},
  {platform:"Facebook",account:"OPUS Plastic Surgery",period:"Nov 16–22",source:"metricool",metrics:[],note:"Weekly totals unavailable"},
  {platform:"TikTok",account:"@opusplasticsurgery",period:"Nov 16–22",source:"metricool",metrics:[],note:"Video stats unavailable"},
  {platform:"Google Business Profile",account:"OPUS · Upland",period:"Nov 16–22",source:"metricool",metrics:[],note:"Weekly totals unavailable"}
];
const otherAccounts=[
  {platform:"Instagram",account:"@dr.frew"},
  {platform:"Instagram",account:"@opusresults"},
  {platform:"TikTok",account:"@drtylerfrew"},
  {platform:"YouTube",account:"OPUS channel"}
];
function Cover({url,alt}:{url:string|null;alt:string}){
  const [broken,setBroken]=useState(false);
  useEffect(()=>setBroken(false),[url]);
  return url&&!broken?<img src={url} alt={alt} loading="lazy" onError={()=>setBroken(true)}/>:<span className="frew-cover-empty"><ImageIcon size={30}/></span>;
}
function coverFor(p:LeadershipLog){
  if(!p.url)return null;
  const existing=historicalPosts.find(x=>x.permalink===p.url);
  if(existing?.thumbnail_path&&savedCovers.has(existing.thumbnail_path))return existing.thumbnail_path;
  const code=p.url.match(/instagram\.com\/(?:reel|p)\/([^/]+)/)?.[1];
  if(code&&savedCovers.has("/media/archive/ig-"+code+".jpg"))return "/media/archive/ig-"+code+".jpg";
  if(p.platform==="Facebook"){
    const key=p.title.toLowerCase().includes("scar")?"DfqeQMZMKqR":
      p.title.toLowerCase().includes("bulging")?"DftDagtkR6i":null;
    if(key&&savedCovers.has("/media/archive/ig-"+key+".jpg"))return "/media/archive/ig-"+key+".jpg";
  }
  return null;
}
function extract(ch:LeadershipChannel){
  const priority=ch.platform==="Google Business Profile"?["Website clicks","Calls","Directions"]:
    ch.platform==="Instagram"?(ch.account==="@opusresults"?["Followers","Reach","Engaged"]:["Feed views","Feed interactions","Reach","Engaged","Followers","Story impressions"]):
    ch.platform==="TikTok"?["Video views","Profile views","Followers"]:
    ch.platform==="YouTube"?["Views","Subscribers","Watch time"]:
    ["Reel views","Carousel impressions","Posts"];
  const chosen=priority.map(label=>ch.metrics.find(m=>m.label===label)).filter((m):m is NonNullable<typeof m>=>!!m&&m.value!=null);
  return chosen.length?chosen.slice(0,3):ch.metrics.filter(m=>m.value!=null).slice(0,3);
}
function DownloadCsv({rows,period}:{rows:LeadershipLog[];period:Period}){
  return <button type="button" className="executive-export" onClick={()=>{
    const head=["Date","Platform","Account","Format","Post","Post link","Views / story impressions","Likes","Comments","Shares","Saves"];
    const data=rows.map(p=>[p.date,p.platform,p.account,p.format,p.title,p.url,p.views,p.likes,p.comments,p.shares,p.saves]);
    const blob=new Blob([csv([head,...data])],{type:"text/csv;charset=utf-8"});
    const file=URL.createObjectURL(blob);
    const link=document.createElement("a");link.href=file;link.download="OPUS_Weekly_Results_"+period+".csv";link.click();URL.revokeObjectURL(file);
  }}><Download size={15}/> Export CSV</button>;
}
function Feature({post,rank,metricLabel}:{post:LeadershipLog;rank:string;metricLabel:string}){
  const media=coverFor(post);
  return <article className="executive-feature">
    <a className="executive-feature-media" href={post.url||undefined} target="_blank" rel="noopener noreferrer" aria-label={"View original "+post.title}>
      <Cover url={media} alt={post.title}/>
      <span className="executive-media-link"><ExternalLink size={17}/></span>
    </a>
    <div className="executive-feature-body">
      <span className="executive-rank">{rank}</span>
      <h3>{post.title}</h3>
      <p>{post.format} · {day(post.date)}</p>
      <div className="executive-feature-number">{fmt(post.views)}<small>{metricLabel}</small></div>
    </div>
  </article>;
}

export default function FrewDashboard(){
  const [period,setPeriod]=useState<Period>("2026-11-16");
  useEffect(()=>{
    const q=new URLSearchParams(window.location.search).get("week");
    if(q==="2026-11-02"||q==="2026-11-09"||q==="2026-11-16")setPeriod(q);
  },[]);
  const changePeriod=(p:Period)=>{
    setPeriod(p);
    const u=new URL(window.location.href);
    u.searchParams.set("week",p);
    window.history.replaceState(null,"",u.pathname+u.search);
  };
  const old=period==="2026-11-02";
  const current=period==="2026-11-16";
  const rows=old?nov2Log:current?currentLog:latestLog;
  const channels=old?nov2Channels:current?currentChannels:latestChannels;
  const posts=rows.filter(p=>p.format!=="Story");
  const stories=rows.filter(p=>p.format==="Story");
  const first=old?rows.find(p=>p.id==="n2-ig-tamara"):current?rows.find(p=>p.id==="ig-reel-implants-fit"):rows.find(p=>p.id==="ig-reel-scar");
  const second=old?rows.find(p=>p.id==="n2-ig-lipo"):current?undefined:rows.find(p=>p.id==="ig-reel-keep");
  const periodLabel=old?"NOV 2–8, 2026":current?"NOV 16–22, 2026":"NOV 9–15, 2026";
  const report=old?{
    statement:"People and practical advice led the week.",
    summary:"Meet Tamara and the lipo + tummy tuck Reel drew the most views.",
    indicators:[
      {label:"INSTAGRAM REACH",value:1112,detail:"OPUS account"},
      {label:"ENGAGED",value:85,detail:"OPUS Instagram"},
      {label:"WEBSITE CLICKS",value:4,detail:"Google Business"},
      {label:"CALLS",value:1,detail:"Google Business"}
    ],
    action:"Pair another team introduction with a simple procedure explainer."
  }:current?{
    statement:"A new surgical explainer is live.",
    summary:"The implant-fit Reel has 846 cumulative views at the November 18 capture. Account-wide weekly totals are not yet verified.",
    indicators:[
      {label:"REEL VIEWS",value:846,detail:"Nov 17 Reel · cumulative at capture"},
      {label:"REEL INTERACTIONS",value:24,detail:"Nov 17 Reel"},
      {label:"STORY IMPRESSIONS",value:224,detail:"Nov 16 Stories · not unique viewers"},
      {label:"ACCOUNT REACH",value:null,detail:"Period total unavailable"}
    ],
    action:"Keep the next surgical explanation specific and patient-centered."
  }:{
    statement:"The scar Reel led in views.",
    summary:"The consultation Reel earned more interactions.",
    indicators:[
      {label:"FEED VIEWS",value:snapshot.feed_views??null,detail:"3 posts · at export"},
      {label:"INTERACTIONS",value:snapshot.feed_interactions??null,detail:"Instagram feed"},
      {label:"STORY IMPRESSIONS",value:snapshot.story_impressions??null,detail:"12 Stories"},
      {label:"STORY REPLIES",value:snapshot.story_replies,detail:"12 Stories"}
    ],
    action:"Open with a surgical detail. End with a patient question."
  };
  return <div className="executive-shell">
    <header className="executive-masthead">
      <div className="executive-brand"><span className="executive-logomark">O.</span><span>OPUS<span className="executive-word-divider">/</span> WEEKLY PULSE</span></div>
 
    </header>
    <main className="executive-main">
      <section className="executive-intro">
        <div className="executive-edition">
          <span>{periodLabel}</span>
          <label className="executive-week-control"><CalendarDays size={15}/><span className="sr-only">Choose reporting week</span>
            <select value={period} onChange={e=>changePeriod(e.target.value as Period)}>
              <option value="2026-11-16">Nov 16–22</option>
              <option value="2026-11-09">Nov 9–15</option>
              <option value="2026-11-02">Nov 2–8</option>
            </select>
          </label>
        </div>
        <div className="executive-hero-grid">
          <div className="executive-hero-copy">
            <h1>{report.statement}</h1>
            <p>{report.summary}</p>
          </div>
          <div className="executive-hero-aside">
            <div className="executive-aside-label">TRY NEXT</div>
            <strong>{report.action}</strong>
          </div>
        </div>
      </section>

      <section className="executive-indicators" aria-label="Key weekly metrics">
        {report.indicators.map(m=><div key={m.label} className="executive-indicator">
          <div className="executive-indicator-label">{m.label}</div>
          <strong>{fmt(m.value)}</strong>
          <small>{m.detail}</small>
        </div>)}
      </section>

      <section className="executive-creative-section">
        <div className="executive-section-heading">
          <h2>Top posts</h2>
        </div>
        <div className="executive-creative-grid">
          {first&&<Feature post={first} rank="MOST VIEWED" metricLabel="views"/>}
          {second&&<Feature post={second} rank={old?"MOST VIEWED · NEXT":"MOST INTERACTIONS"} metricLabel={old?"views":"views · 23 interactions"}/>}
        </div>
      </section>

      <section className="executive-platform-section">
        <div className="executive-section-heading">
          <h2>By account</h2>
        </div>
        <div className="executive-platform-list">
          {channels.map(c=><div className={"executive-platform-row"+(extract(c).length?"":" executive-channel-empty")} key={c.platform+c.account}>
            <div className="executive-account-title"><b>{c.platform}</b><span>{c.account}</span><small>{c.period}</small></div>
            <div className="executive-account-numbers">
              {extract(c).length?extract(c).map(m=><div key={m.label}><strong>{fmt(m.value)}{m.unit?" "+m.unit:""}</strong><span>{m.label}</span></div>):<span className="executive-data-unavailable">{c.note||"No verified weekly figures"}</span>}
            </div>
          </div>)}
        </div>
        {!old&&<div className="executive-other-accounts">
          <div className="executive-other-head"><b>Other accounts</b><span>Not connected to reporting</span></div>
          <div className="executive-other-list">
            {otherAccounts.map(c=><span key={c.platform+c.account}>{c.platform} <b>{c.account}</b></span>)}
          </div>
        </div>}
      </section>

      <section className="executive-bottom">
        <h2 className="executive-bottom-title">More details</h2>
        <div className="executive-detail-controls">
          <details className="executive-detail">
            <summary>All published posts <span>{posts.length} posts</span><ChevronDown size={17}/></summary>
            <div className="executive-detail-list">{posts.map(p=><div key={p.id}>
              <span>{day(p.date)}</span>
              <div>{p.url?<a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}<ExternalLink size={12}/></a>:p.title}<small>{p.platform} · {p.format}</small></div>
              <strong>{fmt(p.views)}</strong>
            </div>)}</div>
          </details>
          <details className="executive-detail">
            <summary>Instagram Stories <span>{stories.length} recorded</span><ChevronDown size={17}/></summary>
            <div className="executive-detail-list">{stories.map(p=><div key={p.id}>
              <span>{day(p.date)}</span><div>{p.title}<small>Instagram Story</small></div><strong>{fmt(p.views)}</strong>
            </div>)}</div>
          </details>
          <details className="executive-detail">
            <summary>Download report <ChevronDown size={17}/></summary>
            <div className="executive-source-body">
              <div className="executive-source-actions">
                <DownloadCsv rows={rows} period={period}/>
                <button type="button" onClick={()=>window.print()} className="executive-export"><FileText size={15}/> Save PDF</button>
              </div>
            </div>
          </details>
        </div>
      </section>
      <footer className="executive-footer">
        <span>OPUS / WEEKLY PULSE</span>
        <div className="executive-footer-actions">
          <FrewStamp
            weekStart={period}
            featured={[first,second].filter((p):p is LeadershipLog=>Boolean(p)).map(p=>({id:p.id,title:p.title}))}
          />
          <span>Updated Nov 17, 2026</span>
        </div>
      </footer>
    </main>
  </div>;
}
