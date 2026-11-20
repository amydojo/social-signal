"use client";

import {useEffect,useRef,useState} from "react";
import {Download,FileText,ExternalLink,ChevronDown,ChevronLeft,ChevronRight,CalendarDays,ImageIcon,Images,X} from "lucide-react";
import {posts as metricoolPosts, stories as metricoolStories, snapshot} from "../report-data";
import {historicalPosts} from "../history-data";
import archiveIndex from "../../public/media/archive/index.json";
import {nov2Channels,nov2Log,type LeadershipLog,type LeadershipChannel} from "./frew-data";
import {currentLog,currentChannels,currentCoverFallbacks} from "./frew-current-data";
import FrewStamp from "./frew-stamp";
import FrewAccounts from "./frew-accounts";
import {performanceByWeek} from "./frew-performance";
import {frewStoryCovers,frewCarouselCovers} from "./frew-media";
import {formatCaptureDate} from "../../lib/signal/reporting-time";
import {chooseWeeklySpotlights,groupPostsByWeek,channelOverviewFromPosts,labelWeek,isStory,interactionCount} from "./frew-selection";
import type {PublicWeek} from "../../lib/signal/publication";
import type {PublicReadState} from "../../lib/signal/read-public";
import {buildExecutivePulse} from "./frew-insights";
import FrewExecutiveBrief from "./frew-executive";
import {writeWeekIntro} from "./frew-voice";

type Period=string;
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

const latestLog:LeadershipLog[]=[
  ...allRecentLog.filter(p=>p.date>="2026-11-09"&&p.date<="2026-11-15"),
  {
    id:"tt-opus-team-humor-1113",
    date:"2026-11-13",
    platform:"TikTok",account:"@opusplasticsurgery",format:"Video",
    title:"Tamara disagrees with this interpretation",
    url:"https://www.tiktok.com/@opusplasticsurgery/video/7707778082836385046",
    views:829,likes:60,comments:0,shares:2,saves:null,
    status:null,ctaChecked:null,complianceChecked:null
  }
].sort((a,b)=>b.date.localeCompare(a.date));
// A new captured post automatically belongs to its Monday–Sunday reporting week.
// Source refreshes still populate the data modules; the viewer does not hardcode
// post IDs, format placements, or a separate list of selectable week dates.
const reportRowsByWeek=groupPostsByWeek([...currentLog,...latestLog,...nov2Log]);
const reportWeeks=Object.keys(reportRowsByWeek).sort((a,b)=>b.localeCompare(a));
const newestWeek=reportWeeks[0]??"2026-11-16";

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
  {platform:"TikTok",account:"@opusplasticsurgery",period:"Nov 13 video · at capture",source:"metricool",
    metrics:[
      {label:"Video views",value:829},
      {label:"Interactions",value:62}
    ]},
  {platform:"Google Business Profile",account:"OPUS · Upland",period:"Nov 9–15 · recorded days",source:"metricool",
    metrics:[
      {label:"Maps views",value:13},
      {label:"Search views",value:15},
      {label:"Directions",value:15},
      {label:"Call clicks",value:2},
      {label:"Website clicks",value:11}
    ],note:"Sum of reported daily values; not all dates returned all measures"},
  {platform:"Google Ads",account:"OPUS Search · Upland",period:"Nov 10–15 · partial",source:"metricool",
    metrics:[
      {label:"Conversions",value:2},
      {label:"Impressions",value:1428},
      {label:"Clicks",value:66},
      {label:"Spend",value:87.41,unit:"USD"},
      {label:"Cost / conversion",value:43.71,unit:"USD"}
    ],note:"Nov 9 missing; do not compare as a complete prior week"}
];
// Keep accounts discoverable without silently reusing Nov 2–6 statistics.
const otherAccounts=[
  {platform:"Instagram",account:"@dr.frew"},
  {platform:"Instagram",account:"@opusresults"},
  {platform:"TikTok",account:"@drtylerfrew"},
  {platform:"YouTube",account:"OPUS channel"}
];
function Cover({url,alt}:{url:string|null;alt:string}){
  const [broken,setBroken]=useState(false);
  useEffect(()=>setBroken(false),[url]);
  return url&&!broken?<img src={url} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setBroken(true)}/>:<span className="frew-cover-empty"><ImageIcon size={23}/><span className="frew-cover-label">No preview</span></span>;
}
function coverFor(p:LeadershipLog){
  if(p.thumbnailPath&&savedCovers.has(p.thumbnailPath))return p.thumbnailPath;
  if(!p.url)return p.coverUrl??null;
  const existing=historicalPosts.find(x=>x.permalink===p.url);
  if(existing?.thumbnail_path&&savedCovers.has(existing.thumbnail_path))return existing.thumbnail_path;
  const code=p.url.match(/instagram\.com\/(?:reel|p)\/([^/]+)/)?.[1];
  if(code&&savedCovers.has("/media/archive/ig-"+code+".jpg"))return "/media/archive/ig-"+code+".jpg";
  if(p.platform==="Facebook"){
    const key=p.title.toLowerCase().includes("scar")?"DfqeQMZMKqR":
      p.title.toLowerCase().includes("bulging")?"DftDagtkR6i":null;
    if(key&&savedCovers.has("/media/archive/ig-"+key+".jpg"))return "/media/archive/ig-"+key+".jpg";
  }
  return p.coverUrl??frewCarouselCovers[p.url]??currentCoverFallbacks[p.url]??null;
}
function storyCoverFor(story:LeadershipLog){
  // Prefer immutable saved files. Source thumbnails can expire and must never
  // be replaced with another story's creative.
  if(story.thumbnailPath&&savedCovers.has(story.thumbnailPath))return story.thumbnailPath;
  if(story.coverUrl)return story.coverUrl;
  const storyId=story.url?.match(/\/stories\/[^/]+\/(\d+)/)?.[1]??"";
  if(!storyId)return null;
  const archived="/media/archive/story-"+storyId+".jpg";
  if(savedCovers.has(archived))return archived;
  return frewStoryCovers[storyId]??null;
}
function CarouselShowcase({posts}:{posts:LeadershipLog[]}){
  const groups:{key:string;cover:LeadershipLog;versions:LeadershipLog[]}[]=[];
  posts.filter(p=>p.format.toLowerCase()==="carousel").forEach(p=>{
    const key=p.date+"|"+p.title.trim().toLowerCase().replace(/\s+/g," ");
    const existing=groups.find(g=>g.key===key);
    if(existing){existing.versions.push(p);if(p.platform==="Instagram")existing.cover=p;}
    else groups.push({key,cover:p,versions:[p]});
  });
  if(!groups.length)return null;
  return <section className="pulse-carousels" aria-label="Carousels published this week">
    <div className="pulse-carousels-heading">
      <h2>Carousels</h2>
      <span>{groups.length} {groups.length===1?"creative":"creatives"}</span>
    </div>
    <div className="pulse-carousels-list">
      {groups.map(group=><article className="pulse-carousel-entry" key={group.key}>
        {group.cover.url?<a className="pulse-carousel-cover" href={group.cover.url} target="_blank" rel="noopener noreferrer"
          aria-label={"Open carousel: "+group.cover.title}>
          <Cover url={coverFor(group.cover)} alt={"First slide of "+group.cover.title}/>
          <span className="pulse-carousel-corner"><Images size={13}/></span>
        </a>:<div className="pulse-carousel-cover"><Cover url={coverFor(group.cover)} alt={group.cover.title}/></div>}
        <div className="pulse-carousel-info">
          <small>CAROUSEL · {day(group.cover.date)}</small>
          <h3>{group.cover.title}</h3>
          <div className="pulse-carousel-platforms">
            {group.versions.map(p=><div key={p.id}>
              <span>{p.platform}</span>
              <strong>{fmt(p.views??p.impressions)}</strong>
              <small>{p.views!=null?"views":p.impressions!=null?"impressions":"not reported"}</small>
            </div>)}
          </div>
          {group.versions.length>1&&<span className="pulse-crosspost-note">Shared creative · separate account results</span>}
        </div>
      </article>)}
    </div>
  </section>;
}
function StoryGallery({stories,period}:{stories:LeadershipLog[];period:string}){
  const [selected,setSelected]=useState<LeadershipLog|null>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const dialogRef=useRef<HTMLDivElement>(null);
  const filmstripRef=useRef<HTMLDivElement>(null);
  const openerRef=useRef<HTMLButtonElement|null>(null);
  const touchStartX=useRef<number|null>(null);
  const isOpen=selected!==null;
  const activeIndex=selected?stories.findIndex(p=>p.id===selected.id):-1;
  const move=(step:1|-1)=>{
    setSelected(prev=>{
      if(!prev||!stories.length)return prev;
      const index=stories.findIndex(p=>p.id===prev.id);
      return stories[((index<0?0:index)+step+stories.length)%stories.length];
    });
  };
  useEffect(()=>{setSelected(null);filmstripRef.current?.scrollTo({left:0,behavior:"auto"});},[period]);
  useEffect(()=>{
    if(!isOpen)return;
    const originalOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    closeRef.current?.focus();
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==="Escape"){e.preventDefault();setSelected(null);return;}
      if(e.key==="ArrowRight"){e.preventDefault();move(1);return;}
      if(e.key==="ArrowLeft"){e.preventDefault();move(-1);return;}
      if(e.key==="Tab"&&dialogRef.current){
        const focusable=[...dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )].filter(el=>el.getClientRects().length>0);
        if(!focusable.length)return;
        const first=focusable[0],last=focusable[focusable.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    window.addEventListener("keydown",onKey);
    return ()=>{
      window.removeEventListener("keydown",onKey);
      document.body.style.overflow=originalOverflow;
      openerRef.current?.focus();
    };
    // Re-establish navigation only when viewer opens/closes, not on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isOpen]);
  if(!stories.length)return null;
  const preview=stories.filter(p=>!!storyCoverFor(p)).slice(0,3);
  const scrollFrames=(direction:-1|1)=>{
    const node=filmstripRef.current;
    if(!node)return;
    const frame=node.querySelector<HTMLElement>(".pulse-story-item");
    const distance=frame?frame.getBoundingClientRect().width+12:128;
    node.scrollBy({left:direction*distance*2,behavior:"smooth"});
  };
  return <>
    <details className="executive-detail pulse-story-detail">
      <summary>
        <span className="pulse-story-summary-title">Instagram Stories</span>
        <span className="pulse-story-summary-right">
          <span className="pulse-story-peek" aria-hidden="true">
            {preview.map(p=><span key={p.id}><Cover url={storyCoverFor(p)} alt=""/></span>)}
          </span>
          <span>{stories.length} recorded</span>
        </span>
        <ChevronDown size={17}/>
      </summary>
      <div className="pulse-story-gallery">
        <div className="pulse-story-gallery-head">
          <p className="pulse-story-gallery-hint">Select a frame to inspect the actual Story.</p>
          {stories.length>3&&<div className="pulse-story-gallery-controls" aria-label="Browse stories">
            <button type="button" aria-label="Scroll to previous Stories" onClick={()=>scrollFrames(-1)}><ChevronLeft size={17}/></button>
            <button type="button" aria-label="Scroll to next Stories" onClick={()=>scrollFrames(1)}><ChevronRight size={17}/></button>
          </div>}
        </div>
        <div ref={filmstripRef} className="pulse-story-filmstrip" role="list" aria-label="Story thumbnails">
          {stories.map(p=><div className="pulse-story-item" key={p.id} role="listitem">
            <button className="pulse-story-frame" type="button" onClick={e=>{openerRef.current=e.currentTarget;setSelected(p);}}
              aria-label={"Preview Story from "+day(p.date)+": "+p.title}>
              <Cover url={storyCoverFor(p)} alt={p.title==="Instagram Story"?"Story from "+day(p.date):p.title}/>
            </button>
            <span className="pulse-story-caption-date">{day(p.date)}</span>
            <span className="pulse-story-caption-title" title={p.title}>{p.title==="Instagram Story"?"Untitled Story":p.title}</span>
            <span className="pulse-story-caption-views">{fmt(p.views)} <small>impressions</small></span>
          </div>)}
        </div>
        <p className="pulse-story-availability">Some original Stories have expired; unavailable frames are labeled rather than replaced.</p>
      </div>
    </details>
    {selected&&<div className="pulse-media-shade" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
      <div ref={dialogRef} className="pulse-story-dialog" role="dialog" aria-modal="true" aria-label={"Story "+(activeIndex+1)+" of "+stories.length+": "+selected.title}>
        <button ref={closeRef} className="pulse-story-close" type="button" aria-label="Close preview" onClick={()=>setSelected(null)}><X size={19}/></button>
        <div className="pulse-story-dialog-media"
          onTouchStart={e=>{touchStartX.current=e.touches[0]?.clientX??null;}}
          onTouchEnd={e=>{
            const start=touchStartX.current;
            touchStartX.current=null;
            if(start==null||!e.changedTouches[0])return;
            const dx=e.changedTouches[0].clientX-start;
            if(Math.abs(dx)>52)move(dx<0?1:-1);
          }}>
          <Cover url={storyCoverFor(selected)} alt={selected.title}/>
        </div>
        <div className="pulse-story-dialog-nav" aria-label="Story navigation">
          <button type="button" aria-label="Previous Story" onClick={()=>move(-1)}><ChevronLeft size={21}/></button>
          <span>{activeIndex+1} <span aria-hidden="true">/</span> {stories.length}</span>
          <button type="button" aria-label="Next Story" onClick={()=>move(1)}><ChevronRight size={21}/></button>
        </div>
        <div className="pulse-story-dialog-copy">
          <span>{day(selected.date)} · {fmt(selected.views)} impressions</span>
          <strong>{selected.title==="Instagram Story"?"Instagram Story":selected.title}</strong>
          {selected.url&&<a href={selected.url} target="_blank" rel="noopener noreferrer">Original Story <ExternalLink size={12}/></a>}
        </div>
      </div>
    </div>}
  </>;
}
function DownloadCsv({rows,period}:{rows:LeadershipLog[];period:string}){
  return <button type="button" className="executive-export" onClick={()=>{
    const head=["Date","Platform","Account","Format","Post","Post link","Views / story impressions","Post impressions","Interactions","Likes","Comments","Shares","Saves"];
    const data=rows.map(p=>[p.date,p.platform,p.account,p.format,p.title,p.url,p.views,p.impressions,p.interactions,p.likes,p.comments,p.shares,p.saves]);
    const blob=new Blob([csv([head,...data])],{type:"text/csv;charset=utf-8"});
    const file=URL.createObjectURL(blob);
    const link=document.createElement("a");link.href=file;link.download="OPUS_Weekly_Results_"+period+".csv";link.click();URL.revokeObjectURL(file);
  }}><Download size={15}/> Export CSV</button>;
}
function Feature({post,rank}:{post:LeadershipLog;rank:string}){
  const media=coverFor(post);
  return <article className="executive-feature">
    <a className="executive-feature-media" href={post.url||undefined} target="_blank" rel="noopener noreferrer" aria-label={"Open original "+post.title}>
      <Cover url={media} alt={post.title}/>
      <span className="executive-media-link"><ExternalLink size={17}/></span>
    </a>
    <div className="executive-feature-body">
      <span className="executive-rank">{rank}</span>
      <h3>{post.title}</h3>
      <p>{post.format} · {day(post.date)}</p>
      <div className="executive-feature-action">
        {post.url?<a href={post.url} target="_blank" rel="noopener noreferrer">Open post <ExternalLink size={13}/></a>:
          <span>Post recorded</span>}
      </div>
    </div>
  </article>;
}

export default function FrewDashboard({published=[],readState="live"}:{published?:PublicWeek[];readState?:PublicReadState}){
  const reportIndex=new Map(published.map(report=>[report.weekStart,report]));
  const availableWeeks=[...new Set([...reportWeeks,...published.map(report=>report.weekStart)])].sort((a,b)=>b.localeCompare(a));
  const mostRecent=availableWeeks[0]??newestWeek;
  const [period,setPeriod]=useState<Period>(mostRecent);
  useEffect(()=>{
    const q=new URLSearchParams(window.location.search).get("week");
    if(q&&availableWeeks.includes(q))setPeriod(q);
  },[]);
  const changePeriod=(p:Period)=>{
    setPeriod(p);
    const u=new URL(window.location.href);
    u.searchParams.set("week",p);
    window.history.replaceState(null,"",u.pathname+u.search);
  };
  const old=period==="2026-11-02";
  const current=period==="2026-11-16";
  const previous=period==="2026-11-09";
  const live=reportIndex.get(period);
  const rows=live?.posts??reportRowsByWeek[period]??[];
  const channels=live?.channels??(old?nov2Channels:current?currentChannels:previous?latestChannels:channelOverviewFromPosts(rows,period));
  const posts=rows.filter(p=>!isStory(p));
  const stories=rows.filter(isStory);
  // Published reporting never borrows diagnostics from a different, static capture.
  const detail=live?(live.diagnostics??null):(period in performanceByWeek?performanceByWeek[period as keyof typeof performanceByWeek]:null);
  const reviewedOverview=live?.overview?.reviewedAt?live.overview:undefined;
  const brief=buildExecutivePulse(rows,channels,reviewedOverview,live?.acquisition);
  const featured=chooseWeeklySpotlights(rows);
  const first=featured[0]?.post;
  const second=featured[1]?.post;
  const partial=live?.status==="in_progress"||(!live&&current);
  const periodLabel=labelWeek(period).toUpperCase()+", "+period.slice(0,4)+(partial?" · WEEK TO DATE":"");
  const fallbackIntro=writeWeekIntro(rows,channels);
  // A reviewed insight alone must not overwrite an older week's existing
  // headline or summary; only an explicitly authored short hero deck does.
  const intro=reviewedOverview?.deck?{
    headline:reviewedOverview.statement,
    summary:reviewedOverview.deck??reviewedOverview.summary,
    next:reviewedOverview.action
  }:fallbackIntro;
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
              {availableWeeks.map(w=><option key={w} value={w}>{labelWeek(w)}{w===mostRecent&&(reportIndex.get(w)?.status==="in_progress"||(!reportIndex.has(w)&&w===newestWeek))?" · WTD":""}</option>)}
            </select>
          </label>
        </div>
        <p className={"pulse-freshness"+(readState!=="live"?" pulse-freshness-warning":"")} role="status">
          {readState==="unavailable"?"Live numbers aren’t loading. Showing the last saved report.":
            readState==="invalid"?"Some numbers couldn’t be checked. Showing the saved report instead.": 
            readState==="partial"?"Some results couldn’t be checked and were left out.": 
            readState==="empty"?"No live update yet. Showing the saved numbers.":
            live?"Updated "+(live.dataThrough?day(live.dataThrough):day(live.weekStart))+" · live report":
            "Saved report · not live"}
        </p>
        <div className={"executive-hero-grid"+(brief.insight?"":" is-solo")}>
          <div className="executive-hero-copy">
            <div className="executive-dispatch-kicker" aria-hidden="true">OPUS <span> / </span> {"THIS WEEK"}</div>
            <h1>{intro.headline}</h1>
            <p>{intro.summary}</p>
          </div>
          {brief.insight&&<div className="executive-hero-aside" aria-label="Weekly insight">
            <div className="executive-aside-label">WEEKLY INSIGHT</div>
            <strong>{brief.insight.headline}</strong>
            <p>{brief.insight.detail}</p>
          </div>}
        </div>
      </section>

      <section className="executive-indicators" aria-label="Business outcomes and paid acquisition">
        {brief.metrics.map(m=><div key={m.label} className="executive-indicator">
          <div className="executive-indicator-label">{m.label}</div>
          <strong>{m.value==null?"—":m.unit==="USD"?"$"+m.value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):fmt(m.value)}</strong>
          <small>{m.detail}</small>
        </div>)}
        <div className="executive-indicator executive-paid-split">
          <div className="executive-indicator-label">PAID ACQUISITION</div>
          <div className="executive-paid-row">
            <span>GOOGLE <strong>{fmt(brief.paid.google.value)}</strong><small>reported actions</small></span>
            <span>META <strong>{fmt(brief.paid.meta.value)}</strong><small>form leads</small></span>
          </div>
          <small>{brief.paid.google.period??"Google period unknown"} · {brief.paid.meta.period??"Meta period unknown"}</small>
          <small>{brief.paid.meta.note}. Ad events are not confirmed appointments.</small>
        </div>
      </section>

      <FrewExecutiveBrief pulse={brief} partial={partial}/>
      <section className="executive-creative-section">
        <div className="executive-section-heading">
          <h2>From this week’s posts</h2>
        </div>
        <div className="executive-creative-grid">
          {featured.map(item=><Feature key={item.post.id} post={item.post} rank={item.label}/> )}
          {!featured.length&&<p className="executive-feature-empty">No posts recorded yet for this week.</p>}
        </div>
      </section>

      <CarouselShowcase posts={posts}/>

      <FrewAccounts
        period={period}
        channels={channels}
        otherAccounts={live?.coverage?live.coverage.filter(c=>!c.linked).map(({platform,account})=>({platform,account})):old?[]:otherAccounts}
      />

      <section className="executive-bottom">
        <h2 className="executive-bottom-title">All the numbers</h2>
        <div className="executive-detail-controls">
          {reviewedOverview?.deck&&<details className="executive-detail pulse-context-detail">
            <summary>Patient interest &amp; consultations <span>Full readout</span><ChevronDown size={17}/></summary>
            <div className="pulse-context-body"><p>{reviewedOverview.summary}</p></div>
          </details>}
          {detail&&<details className="executive-detail">
            <summary>Video and Story details <span>Video · Stories{detail.keyword?" · Search":""}</span><ChevronDown size={17}/></summary>
            <div className="executive-signal-details">
              <div className="executive-signal-section">
                <h3>Reel attention</h3>
                <div className="executive-signal-table">
                  <div className="executive-signal-row executive-signal-labels">
                    <span>Reel</span><span>Avg watch</span><span>Past 3s</span><span>Shares / saves</span>
                  </div>
                  {detail.reels.map(r=><div key={r.id} className="executive-signal-row">
                    <strong>{r.title}</strong>
                    <span>{r.avgWatchSeconds.toFixed(1)}s</span>
                    <span>{r.past3SecondsPct.toFixed(1)}%</span>
                    <span>{r.shares} / {r.saves}</span>
                  </div>)}
                </div>
                <small>Per-Reel metrics at capture, not weekly watch time. Video lengths differ.</small>
              </div>
              <div className="executive-signal-section">
                <h3>Story behavior</h3>
                <div className="executive-signal-stats">
                  <div><strong>{fmt(detail.stories.impressions)}</strong><span>Impressions</span></div>
                  <div><strong>{detail.stories.replies}</strong><span>Replies</span></div>
                  <div><strong>{detail.stories.backTaps}</strong><span>Back taps</span></div>
                  <div><strong>{detail.stories.forwardTaps}</strong><span>Forward taps</span></div>
                  <div><strong>{detail.stories.exits}</strong><span>Exits</span></div>
                </div>
                <small>{detail.stories.count} Stories · taps and exits are navigation events, not sentiment or unique people.</small>
              </div>
              {detail.keyword&&<div className="executive-signal-section">
                <h3>What drove search conversions</h3>
                <p className="executive-signal-keyword">
                  <strong>{detail.keyword.term}</strong>
                  <span>{detail.keyword.conversions} reported conversions</span>
                  <span>{detail.keyword.clicks} clicks</span>
                  <span>${detail.keyword.spend.toFixed(2)} spent</span>
                </p>
                <small>Keyword attribution in Google Ads · Nov 16–18. Consult bookings not confirmed.</small>
              </div>}
              {detail.audience&&<div className="executive-signal-section">
                <h3>Audience snapshot</h3>
                <p className="executive-signal-keyword">
                  <strong>{fmt(detail.audience.instagramFollowers)} Instagram followers</strong>
                  <span>{detail.audience.asOf}</span>
                </p>
                <small>Accounts engaged: {detail.audience.engagedByDay.map(x=>x.accounts+" on "+x.date).join(" · ")}. Daily unique counts cannot be added to obtain a weekly unique audience.</small>
              </div>}
            </div>
          </details>}
          <details className="executive-detail">
            <summary>Every post · all platforms <span>{posts.length} records including Facebook</span><ChevronDown size={17}/></summary>
            <div className="executive-detail-list">{posts.map(p=><div key={p.id}>
              <span>{day(p.date)}</span>
              <div>{p.url?<a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}<ExternalLink size={12}/></a>:p.title}<small>{p.platform} · {p.format}</small></div>
              <strong>{fmt(p.views??p.impressions)}{p.views==null&&p.impressions!=null?<small> impressions</small>:null}</strong>
            </div>)}</div>
          </details>
          <StoryGallery period={period} stories={stories}/>
          <details className="executive-detail">
            <summary>Export this week <ChevronDown size={17}/></summary>
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
          <span>{live?`Captured ${formatCaptureDate(live.capturedAt)}${partial?" · In progress":""}`:current?"Updated Nov 19, 2026 · In progress":previous?"Updated Nov 19, 2026":old?"Historical report":"Week data as captured"}</span>
        </div>
      </footer>
    </main>
  </div>;
}
