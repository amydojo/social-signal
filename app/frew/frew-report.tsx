"use client";

import {useEffect,useState} from "react";
import {Download,FileText,ExternalLink,ChevronDown,CalendarDays,ImageIcon} from "lucide-react";
import {posts as metricoolPosts, stories as metricoolStories, snapshot} from "../report-data";
import {historicalPosts} from "../history-data";
import archiveIndex from "../../public/media/archive/index.json";
import {nov2Channels,nov2Log,reportingSources,type LeadershipLog,type LeadershipChannel} from "./frew-data";

type Period="2026-11-09"|"2026-11-02";
const savedCovers=new Set(archiveIndex.assets.filter(a=>a.status==="saved").map(a=>a.file));
const fmt=(n:number|null|undefined)=>n==null?"—":n.toLocaleString("en-US");
const day=(d:string)=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
const csv=(rows:(number|string|null|undefined)[][])=>rows.map(row=>row.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");

const latestLog:LeadershipLog[]=[
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

const latestChannels:LeadershipChannel[]=[
  {platform:"Instagram",account:"@opusplasticsurgery",period:"Nov 9–15",source:"metricool",metrics:[
    {label:"Feed posts",value:3},{label:"Feed views",value:snapshot.feed_views??null},
    {label:"Feed interactions",value:snapshot.feed_interactions??null},
    {label:"Stories",value:snapshot.story_count},
    {label:"Story impressions",value:snapshot.story_impressions??null},
    {label:"Story replies",value:snapshot.story_replies}
  ]},
  {platform:"Facebook",account:"OPUS Plastic Surgery",period:"Nov 9–15",source:"metricool",
    metrics:[{label:"Posts",value:2},{label:"Reel views",value:17},{label:"Carousel impressions",value:1}]}
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
    ch.platform==="Instagram"?["Reach","Engaged","Followers","Feed views","Feed interactions","Story impressions"]:
    ch.platform==="TikTok"?["Video views","Profile views","Followers"]:
    ch.platform==="YouTube"?["Views","Subscribers","Watch time"]:
    ["Reel views","Carousel impressions","Posts"];
  const chosen=priority.map(label=>ch.metrics.find(m=>m.label===label)).filter((m):m is NonNullable<typeof m>=>!!m&&m.value!=null);
  return chosen.length?chosen.slice(0,3):ch.metrics.filter(m=>m.value!=null).slice(0,3);
}
function DownloadCsv({rows,period}:{rows:LeadershipLog[];period:Period}){
  return <button type="button" className="executive-export" onClick={()=>{
    const head=["Date","Platform","Account","Format","Post","Original URL","Views / story impressions","Likes","Comments","Shares","Saves"];
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
  const [period,setPeriod]=useState<Period>("2026-11-09");
  useEffect(()=>{
    const q=new URLSearchParams(window.location.search).get("week");
    if(q==="2026-11-02"||q==="2026-11-09")setPeriod(q);
  },[]);
  const changePeriod=(p:Period)=>{
    setPeriod(p);
    const u=new URL(window.location.href);
    u.searchParams.set("week",p);
    window.history.replaceState(null,"",u.pathname+u.search);
  };
  const old=period==="2026-11-02";
  const rows=old?nov2Log:latestLog;
  const channels=(old?nov2Channels:latestChannels).filter(c=>c.metrics.some(m=>m.value!=null));
  const posts=rows.filter(p=>p.format!=="Story");
  const stories=rows.filter(p=>p.format==="Story");
  const first=old?rows.find(p=>p.id==="n2-ig-tamara"):rows.find(p=>p.id==="ig-reel-scar");
  const second=old?rows.find(p=>p.id==="n2-ig-lipo"):rows.find(p=>p.id==="ig-reel-keep");
  const periodLabel=old?"NOV 2–8, 2026":"NOV 9–15, 2026";
  const report=old?{
    statement:"The people behind OPUS got attention. Clear explanations did too.",
    summary:"Meet Tamara recorded the highest views in the original Posts Log. Lipo + tummy tuck followed. These are useful creative directions, not proof of what caused the results.",
    indicators:[
      {label:"OPUS INSTAGRAM REACH",value:1112,detail:"Nov 2–6 · account-level"},
      {label:"ACCOUNTS ENGAGED",value:85,detail:"@opusplasticsurgery"},
      {label:"GBP WEBSITE CLICKS",value:4,detail:"Nov 2–6"},
      {label:"GBP CALLS",value:1,detail:"Nov 2–6"}
    ],
    action:"Compare another staff introduction with a straightforward procedure explainer.",
    actionDetail:"Use similarly sized posting windows before drawing a conclusion about which format performs better.",
    context:"Source: Weekly Social Insights · Nov 2–6 totals; the publication log also includes Nov 8 Stories."
  }:{
    statement:"One Reel drew more attention. Another drew more interaction.",
    summary:"What a scar can't show led the week's Instagram posts in views. What you want to keep generated more interactions despite fewer views. Different exposures mean this is directional, not a controlled comparison.",
    indicators:[
      {label:"FEED VIEWS",value:snapshot.feed_views??null,detail:"3 Instagram posts · at export"},
      {label:"FEED INTERACTIONS",value:snapshot.feed_interactions??null,detail:"3 Instagram posts"},
      {label:"STORY IMPRESSIONS",value:snapshot.story_impressions??null,detail:"12 Stories · repeated views possible"},
      {label:"STORY REPLIES",value:snapshot.story_replies,detail:"12 Instagram Stories"}
    ],
    action:"Test a surgical-detail opening followed by a specific patient question.",
    actionDetail:"Track 3-second skips and interactions per view on the next comparable Reels. Hypothesis, not a guaranteed winner.",
    context:"Source: Metricool · Nov 16 snapshot. Feed views are cumulative for the posts published that week."
  };
  return <div className="executive-shell">
    <header className="executive-masthead">
      <div className="executive-brand"><span className="executive-logomark">O.</span><span>OPUS<span className="executive-word-divider">/</span> WEEKLY PULSE</span></div>
      <span className="executive-audience">PREPARED FOR DR. FREW</span>
    </header>
    <main className="executive-main">
      <section className="executive-intro">
        <div className="executive-edition">
          <span>REPORT / {periodLabel}</span>
          <label className="executive-week-control"><CalendarDays size={15}/><span className="sr-only">Choose reporting week</span>
            <select value={period} onChange={e=>changePeriod(e.target.value as Period)}>
              <option value="2026-11-09">Nov 9–15</option>
              <option value="2026-11-02">Nov 2–8</option>
            </select>
          </label>
        </div>
        <div className="executive-hero-grid">
          <div className="executive-hero-copy">
            <div className="executive-kicker">THE WEEK IN ONE MINUTE</div>
            <h1>{report.statement}</h1>
            <p>{report.summary}</p>
          </div>
          <div className="executive-hero-aside">
            <div className="executive-aside-label">NEXT CREATIVE TEST</div>
            <strong>{report.action}</strong>
            <p>{report.actionDetail}</p>
            <span>Recommendation · not a proven result</span>
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
          <div><span className="executive-section-no">01 / CONTENT</span><h2>What earned attention</h2></div>
          <p>Two posts worth discussing</p>
        </div>
        <div className="executive-creative-grid">
          {first&&<Feature post={first} rank="01 · MOST VIEWED" metricLabel="views at source capture"/>}
          {second&&<Feature post={second} rank={old?"02 · NEXT HIGHEST VIEWS":"02 · MOST INTERACTIONS"} metricLabel={old?"views at source capture":"views · 23 interactions"}/>}
        </div>
      </section>

      <section className="executive-platform-section">
        <div className="executive-section-heading">
          <div><span className="executive-section-no">02 / DISTRIBUTION</span><h2>Across the accounts</h2></div>
          <p>Verified source data only</p>
        </div>
        <div className="executive-platform-list">
          {channels.map(c=><div className="executive-platform-row" key={c.platform+c.account}>
            <div className="executive-account-title"><b>{c.platform}</b><span>{c.account}</span></div>
            <div className="executive-account-numbers">
              {extract(c).map(m=><div key={m.label}><strong>{fmt(m.value)}{m.unit?" "+m.unit:""}</strong><span>{m.label}</span></div>)}
            </div>
          </div>)}
        </div>
      </section>

      <section className="executive-bottom">
        <div className="executive-bottom-copy">
          <span className="executive-section-no">03 / RECORD</span>
          <h2>See the details only when you need them.</h2>
          <p>The post-by-post log and original sources are kept here, not in the main briefing.</p>
        </div>
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
            <summary>Sources & downloads <span>Read-only</span><ChevronDown size={17}/></summary>
            <div className="executive-source-body">
              <p>{report.context} These snapshots are not yet a verified live sync. Views, impressions, reach and clicks measure different things.</p>
              <div className="executive-source-actions">
                <DownloadCsv rows={rows} period={period}/>
                <button type="button" onClick={()=>window.print()} className="executive-export"><FileText size={15}/> Save PDF</button>
                <a href={reportingSources.sheet} target="_blank" rel="noopener noreferrer">Original source <ExternalLink size={14}/></a>
              </div>
            </div>
          </details>
        </div>
      </section>
      <footer className="executive-footer"><span>OPUS / WEEKLY PULSE</span><span>Public, read-only snapshot · no patient data</span></footer>
    </main>
  </div>;
}
