"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PostVisual, StoryVisual, MediaPreviewModal } from "./media-views";
import { historicalPosts, historicalStories, historicalDaily } from "./history-data";
import archiveIndex from "../public/media/archive/index.json";
import {
  BarChart3, Download, ExternalLink, FileText, Grid2X2, Instagram,
  Database, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Eye, Layers, Check, AlertCircle, PanelLeftClose, PanelLeftOpen, Menu, CalendarDays, ClipboardList
} from "lucide-react";

export type Snapshot = {
  id:string; week_start:string; week_end:string; captured_at:string; source:string;
  reel_views:number|null; reel_interactions:number|null; feed_views?:number|null;
  feed_interactions?:number|null; feed_pieces?:number|null; story_count:number|null;
  story_impressions?:number|null; story_replies:number|null;
  account_data_through:string|null; coverage_notes:string|null;
};
export type Post = {
  id:string; published_on:string; title:string; permalink:string; platform:string;
  format?:string; views:number|null; impressions?:number|null; reach:number|null;
  likes:number|null; comments:number|null; shares:number|null; saves:number|null;
  interactions:number|null; skip_3s_pct:number|null; avg_watch_seconds:number|null;
  raw_timestamp?:string; thumbnail_path?:string; thumbnail_original_url?:string;
  metrics_basis?:string; metrics_captured_at?:string;
};
export type Story = {
  id:string; published_at_raw:string; descriptor:string; impressions:number|null;
  reach:number|null; replies:number|null; exits:number|null; back_taps:number|null;
  forward_taps:number|null; permalink:string; thumbnail_path?:string|null;
  thumbnail_original_url?:string|null;
};
export type Coverage = {
  channel:string; account:string; status:string; data:string; limitation:string;
};
export type DailySocial = {
  date:string; followers:number|null; account_views:number|null; reach:number|null
};
export type AdsDay = {
  date:string; meta_spend:number|null; meta_impressions:number|null; meta_clicks:number|null;
  google_spend:number|null; google_impressions:number|null; google_clicks:number|null;
};
export type Insight = {
  id:string; kind:"finding"|"action"|"caveat"; position:number; title:string; body:string;
};
export type Experiment = {
  id:string; title:string; hypothesis:string; status:string; notes:string|null;
};

type Props = {
  snapshot:Snapshot; weeks:Snapshot[]; posts:Post[]; stories:Story[];
  coverage:Coverage[]; socialDaily:DailySocial[]; adsDaily:AdsDay[];
  insights:Insight[]; experiments:Experiment[];
};
type Tab = "overview"|"posts"|"stories"|"archive"|"sources";
type Platform = "instagram"|"facebook"|"all";

const num = (n:number|null|undefined) => n==null ? "—" : n.toLocaleString("en-US");
const date = (s:string) => new Date(s+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
const storyDate = (s:string) => s.length>=8 ? date(s.slice(0,4)+"-"+s.slice(4,6)+"-"+s.slice(6,8)) : "—";
const money = (n:number|null) => n==null ? "—" : "$"+n.toFixed(2);
const weekOf = (day:string) => {
  const d=new Date(day.slice(0,10)+"T12:00:00Z");
  d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
  return d.toISOString().slice(0,10);
};
const endOfWeek=(start:string)=>{
  const d=new Date(start+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+6);
  return d.toISOString().slice(0,10);
};
const weekFromStory=(s:Story)=>weekOf(s.published_at_raw.slice(0,4)+"-"+s.published_at_raw.slice(4,6)+"-"+s.published_at_raw.slice(6,8));
const csv = (rows:(string|number|null|undefined)[][]) =>
  rows.map(row=>row.map(value=>'"'+String(value??"").replaceAll('"','""')+'"').join(",")).join("\r\n");

function Stat({label,value,note}:{label:string;value:string;note?:string}) {
  return <div className="stat">
    <span className="stat-label">{label}</span>
    <strong className="stat-number">{value}</strong>
    {note && <span className="stat-note">{note}</span>}
  </div>;
}
function SectionHead({title,meta}:{title:string;meta?:string}) {
  return <div className="section-head"><h2>{title}</h2>{meta && <span>{meta}</span>}</div>;
}
function BarRow({label,value,max,suffix}:{label:string;value:number;max:number;suffix?:string}) {
  return <div className="ranking-row">
    <span className="ranking-label">{label}</span>
    <div className="ranking-track"><div style={{width:String(max>0?value/max*100:0)+"%"}}/></div>
    <strong>{num(value)}{suffix??""}</strong>
  </div>;
}
function PostRow({post}:{post:Post}) {
  return <article className="item-row post-row">
    <div className="item-name">
      <div className="item-meta">{post.platform==="instagram"?"Instagram":"Facebook"} · {post.format??"Post"} · {date(post.published_on)}</div>
      <a className="item-title" href={post.permalink} target="_blank" rel="noopener noreferrer">
        {post.title}<ExternalLink size={13}/>
      </a>
    </div>
    <div className="item-numbers">
      <div><b>{num(post.views??post.impressions)}</b><small>{post.views==null?"Impr.":"Views"}</small></div>
      <div><b>{num(post.interactions)}</b><small>Interactions</small></div>
      <div><b>{post.skip_3s_pct==null?"—":post.skip_3s_pct.toFixed(1)+"%"}</b><small>3s skip</small></div>
    </div>
    <details className="item-detail">
      <summary>More metrics <ChevronDown size={13}/></summary>
      <div className="detail-metrics">
        <span>Reach <b>{num(post.reach)}</b></span>
        <span>Likes <b>{num(post.likes)}</b></span>
        <span>Comments <b>{num(post.comments)}</b></span>
        <span>Shares <b>{num(post.shares)}</b></span>
        <span>Saves <b>{num(post.saves)}</b></span>
        <span>Avg watch <b>{post.avg_watch_seconds==null?"—":post.avg_watch_seconds.toFixed(1)+"s"}</b></span>
      </div>
    </details>
  </article>;
}
function StoryRow({story}:{story:Story}) {
  const name=story.descriptor==="(no story text)"?"Story without caption":story.descriptor;
  return <div className="item-row story-row">
    <div className="item-name">
      <div className="item-meta">{storyDate(story.published_at_raw)}</div>
      <span className="item-title">{name}</span>
    </div>
    <div className="item-numbers story-numbers">
      <div><b>{num(story.impressions)}</b><small>Impressions</small></div>
      <div><b>{num(story.replies)}</b><small>Replies</small></div>
    </div>
  </div>;
}
function ExportActions({posts,period}:{posts:Post[];period:string}) {
  function exportPosts() {
    const head=["Date","Platform","Format","Title","URL","Views","Impressions","Reach","Interactions","Likes","Comments","Shares","Saves","3s skip %","Avg watch seconds"];
    const rows=posts.map(p=>[p.raw_timestamp??p.published_on,p.platform,p.format,p.title,p.permalink,p.views,p.impressions,p.reach,p.interactions,p.likes,p.comments,p.shares,p.saves,p.skip_3s_pct,p.avg_watch_seconds]);
    const blob=new Blob([csv([head,...rows])],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="SIGNAL_OPUS_"+period+".csv";anchor.click();
    URL.revokeObjectURL(url);
  }
  return <div className="export-actions">
    <button type="button" onClick={exportPosts}><Download size={15}/> CSV</button>
    <button type="button" onClick={()=>window.print()}><FileText size={15}/> PDF</button>
  </div>;
}

export default function SignalDashboard({snapshot,weeks,posts,stories,coverage,socialDaily,adsDaily,insights,experiments}:Props) {
  const [tab,setTab]=useState<Tab>("overview");
  const [navCollapsed,setNavCollapsed]=useState(false);
  const [mobileNavOpen,setMobileNavOpen]=useState(false);
  const [selectedWeek,setSelectedWeek]=useState<string>(snapshot.week_start);
  const [platform,setPlatform]=useState<Platform>("instagram");
  const [search,setSearch]=useState("");
  const [archiveMonth,setArchiveMonth]=useState<"all"|"2026-09"|"2026-10"|"2026-11">("all");
  const [archiveSearch,setArchiveSearch]=useState("");
  const [selectedPost,setSelectedPost]=useState<Post|null>(null);
  const [selectedStory,setSelectedStory]=useState<Story|null>(null);
  const setView=(next:Tab)=>{setTab(next);setMobileNavOpen(false);};
  const changeWeek=(next:string)=>{
    setSelectedWeek(next);
    const url=new URL(window.location.href);
    if(next===snapshot.week_start)url.searchParams.delete("week");
    else url.searchParams.set("week",next);
    window.history.replaceState(null,"",url.pathname+url.search+url.hash);
  };
  useEffect(()=>{
    try{setNavCollapsed(window.localStorage.getItem("signal-nav-collapsed")==="yes")}catch{}
  },[]);
  const toggleNav=()=>{
    setNavCollapsed(prev=>{
      const next=!prev;
      try{window.localStorage.setItem("signal-nav-collapsed",next?"yes":"no")}catch{}
      return next;
    });
  };
  const closeMedia=useCallback(()=>{setSelectedPost(null);setSelectedStory(null)},[]);
  const openPost=useCallback((p:Post)=>{setSelectedStory(null);setSelectedPost(p)},[]);
  const openStory=useCallback((s:Story)=>{setSelectedPost(null);setSelectedStory(s)},[]);
  const allPosts:Post[]=[...new Map(
    [...historicalPosts,...posts].map(p=>[p.platform+"|"+(p.permalink||p.id),p])
  ).values()];
  const allStories:Story[]=[...new Map(
    [...historicalStories,...stories].map(story=>[story.permalink||story.id,story])
  ).values()];
  const allDaily=[...historicalDaily,...socialDaily];
  const availableWeeks=[...new Set([
    snapshot.week_start,
    ...weeks.map(w=>w.week_start),
    ...allDaily.map(d=>weekOf(d.date)),
    ...allPosts.map(p=>weekOf(p.published_on)),
    ...allStories.map(weekFromStory),
  ])].sort();
  useEffect(()=>{
    const query=new URLSearchParams(window.location.search).get("week");
    if(query&&availableWeeks.includes(query))setSelectedWeek(query);
  // Only read the browser's deep link on mount; subsequent changes use local state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const latestWeek=selectedWeek===snapshot.week_start;
  const periodPosts=allPosts.filter(p=>weekOf(p.published_on)===selectedWeek);
  const periodStories=allStories.filter(story=>weekFromStory(story)===selectedWeek);
  const periodDaily=allDaily.filter(d=>weekOf(d.date)===selectedWeek);
  const reportedViewDays=periodDaily.filter(d=>d.account_views!=null);
  const periodAccountViews=reportedViewDays.length
    ?reportedViewDays.reduce((n,d)=>n+(d.account_views??0),0):null;
  const periodIgPosts=periodPosts.filter(p=>p.platform==="instagram");
  const reels=periodIgPosts.filter(p=>p.format==="Reel"&&p.skip_3s_pct!=null);
  const sortedPosts=[...periodIgPosts].sort((a,b)=>(b.views??0)-(a.views??0));
  const sortedStories=[...periodStories].sort((a,b)=>(b.impressions??0)-(a.impressions??0));
  const periodStoryImpressions=latestWeek?snapshot.story_impressions:
    periodStories.some(s=>s.impressions!=null)?
      periodStories.reduce((n,s)=>n+(s.impressions??0),0):
    periodDaily.some(d=>("story_impressions" in d)&&d.story_impressions!=null)?
      periodDaily.reduce((n,d)=>n+Number("story_impressions" in d?(d.story_impressions??0):0),0):null;
  const periodStoryReplies=latestWeek?snapshot.story_replies:
    periodStories.some(s=>s.replies!=null)?
      periodStories.reduce((n,s)=>n+(s.replies??0),0):null;
  const savedHistoricalFiles=new Set(archiveIndex.assets.filter(a=>a.status==="saved").map(a=>a.file));
  const storyHasCover=(story:Story)=>{
    const id=story.permalink?.split("/stories/")[1]?.split("/")[1];
    const path=story.thumbnail_path||(id?"/media/archive/story-"+id+".jpg":"");
    return !!path&&savedHistoricalFiles.has(path);
  };
  const visualStories=sortedStories.filter(storyHasCover);
  const storyWithoutCover=sortedStories.filter(s=>!storyHasCover(s));
  const shownPosts=periodPosts.filter(p=>(platform==="all"||p.platform===platform)&&p.title.toLowerCase().includes(search.toLowerCase()));
  const allInstagramPosts=[...historicalPosts,...posts.filter(p=>p.platform==="instagram")].sort((a,b)=>b.published_on.localeCompare(a.published_on));
  const archivePosts=allInstagramPosts.filter(p=>(archiveMonth==="all"||p.published_on.startsWith(archiveMonth))&&p.title.toLowerCase().includes(archiveSearch.toLowerCase()));
  const historyVisualStories=historicalStories.filter(s=>Boolean(s.thumbnail_path)&&savedHistoricalFiles.has(s.thumbnail_path!));
  const weeklyHistory=useMemo(()=>{
    const viewDays=allDaily
      .filter(d=>d.account_views!=null&&(!archiveMonth||archiveMonth==="all"||d.date.startsWith(archiveMonth)));
    const groups=new Map<string,{start:string,views:number,days:number}>();
    for(const d of viewDays){
      const x=new Date(d.date+"T12:00:00Z");
      x.setUTCDate(x.getUTCDate()-(x.getUTCDay()+6)%7);
      const k=x.toISOString().slice(0,10);
      const v=groups.get(k)??{start:k,views:0,days:0};
      v.views+=d.account_views??0;v.days+=1;groups.set(k,v);
    }
    return [...groups.values()].sort((a,b)=>a.start.localeCompare(b.start));
  },[archiveMonth,allDaily]);
  const maxHistoryViews=Math.max(1,...weeklyHistory.map(w=>w.views));
  const tabs = [
    {id:"overview" as Tab,name:"Overview",icon:Grid2X2},
    {id:"posts" as Tab,name:"Posts",icon:Layers},
    {id:"stories" as Tab,name:"Stories",icon:Instagram},
    {id:"archive" as Tab,name:"Archive",icon:BarChart3},
    {id:"sources" as Tab,name:"Data & ads",icon:Database}
  ];
  const findings=insights.filter(i=>i.kind==="finding");
  const actions=insights.filter(i=>i.kind==="action");
  const limitations=coverage.filter(c=>c.limitation);
  const metaDays=adsDaily.filter(d=>d.meta_spend!==null);
  const googleDays=adsDaily.filter(d=>d.google_spend!==null);
  const metaTotal=metaDays.reduce((n,d)=>n+(d.meta_spend??0),0);
  const selectedIndex=availableWeeks.indexOf(selectedWeek);
  const strongestPost=sortedPosts[0]??null;
  const mostInteractive=[...periodIgPosts].sort((a,b)=>(b.interactions??0)-(a.interactions??0))[0]??null;
  const bestStory=sortedStories[0]??null;
  const maxViews=Math.max(1,...sortedPosts.map(p=>p.views??0));
  const maxStories=Math.max(1,...sortedStories.map(s=>s.impressions??0));

  return <div className={"app-shell"+(navCollapsed?" nav-collapsed":"")+(mobileNavOpen?" nav-mobile-open":"")}>
    <aside className="app-sidebar">
      <div className="sidebar-top">
        <div className="logo"><span className="logo-symbol">S<span>.</span></span><span className="logo-word">SIGNAL<small>OPUS / SOCIAL</small></span></div>
        <span className="mobile-current-view">{tabs.find(t=>t.id===tab)?.name}</span>
        <button type="button" className="sidebar-toggle" onClick={toggleNav}
          title={navCollapsed?"Expand sidebar":"Collapse sidebar"}
          aria-label={navCollapsed?"Expand sidebar":"Collapse sidebar"}>
          {navCollapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}
        </button>
        <button type="button" className="mobile-nav-toggle"
          onClick={()=>setMobileNavOpen(v=>!v)} aria-expanded={mobileNavOpen}
          aria-controls="signal-main-nav" aria-label={mobileNavOpen?"Close navigation":"Open navigation"}>
          {mobileNavOpen?<ChevronDown size={21}/>:<Menu size={21}/>}
        </button>
      </div>
      <nav id="signal-main-nav" aria-label="Dashboard views" className="app-nav">
        {tabs.map(t=><button type="button" key={t.id} title={t.name}
          onClick={()=>setView(t.id)} aria-pressed={tab===t.id} className={tab===t.id?"active":""}>
          <t.icon size={17}/><span className="nav-label">{t.name}</span>
        </button>)}
        <a href="/frew" className="frew-nav-link" title="Weekly Pulse" aria-label="Open OPUS Weekly Pulse leadership brief">
          <ClipboardList size={17}/><span className="nav-label">Weekly Pulse</span>
        </a>
      </nav>
      <div className="sidebar-foot"><span className="status-dot"/><span className="sidebar-foot-label">Read-only snapshot</span></div>
    </aside>

    <main className="app-main">
      <header className="app-header">
        <div className="heading-wrap">
          <div className="eyeline">OPUS PLASTIC SURGERY <span>/</span> SIGNAL</div>
          <h1>{tabs.find(t=>t.id===tab)?.name}</h1>
          <div className="header-sub">
            {tab==="archive"?"Sep–Nov 2026":date(selectedWeek)+"–"+date(endOfWeek(selectedWeek))+", 2026"}
            <span>·</span> Updated {new Date(snapshot.captured_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
          </div>
        </div>
        <div className="app-header-actions">
          <div className="week-picker" role="group" aria-label="Choose reporting week">
            <button type="button" aria-label="Previous available week"
              disabled={selectedIndex<=0}
              onClick={()=>{changeWeek(availableWeeks[Math.max(0,selectedIndex-1)]);if(tab==="archive")setView("overview")}}>
              <ChevronLeft size={17}/>
            </button>
            <label className="week-select-label" htmlFor="reporting-week">
              <CalendarDays size={15}/>
              <select id="reporting-week" value={selectedWeek}
                onChange={e=>{changeWeek(e.target.value);if(tab==="archive")setView("overview")}}>
                {availableWeeks.map(w=><option key={w} value={w}>
                  {date(w)} – {date(endOfWeek(w))}
                </option>)}
              </select>
            </label>
            <button type="button" aria-label="Next available week"
              disabled={selectedIndex>=availableWeeks.length-1}
              onClick={()=>{changeWeek(availableWeeks[Math.min(availableWeeks.length-1,selectedIndex+1)]);if(tab==="archive")setView("overview")}}>
              <ChevronRight size={17}/>
            </button>
          </div>
          <ExportActions posts={tab==="archive"?archivePosts:periodPosts}
            period={tab==="archive"?archiveMonth:selectedWeek}/>
        </div>
      </header>
      {!latestWeek&&tab!=="archive"&&<p className="period-note">
        Post counts are cumulative as of their last recorded capture, not traffic earned during this week. Account views are counted only on reporting days.
      </p>}

      {tab==="overview" && <>
        <section className="stats-grid" aria-label="Weekly Instagram statistics">
          {latestWeek ? <>
            <Stat label="Feed views" value={num(snapshot.feed_views)} note={periodIgPosts.length+" posts · lifetime views at export"}/>
            <Stat label="Interactions" value={num(snapshot.feed_interactions)} note="Instagram feed"/>
            <Stat label="Story impressions" value={num(snapshot.story_impressions)} note={periodStories.length+" Stories"}/>
            <Stat label="Story replies" value={num(snapshot.story_replies)} note="Across published Stories"/>
          </> : <>
            <Stat label="Account views" value={num(periodAccountViews)} note={reportedViewDays.length+"/7 days recorded"}/>
            <Stat label="Feed posts" value={num(periodIgPosts.length)} note="Published this week"/>
            <Stat label="Story impressions" value={num(periodStoryImpressions)} note="From available records"/>
            <Stat label="Story replies" value={num(periodStoryReplies)} note="Not reported = —"/>
          </>}
        </section>
        <div className="content-columns">
          <section className="surface rankings">
            <SectionHead title="Posts published" meta={latestWeek?"Views at export":"Lifetime views · Nov 16"}/>
            {sortedPosts.length ? <div className="featured-media">
              {sortedPosts.slice(0,4).map(p=><PostVisual key={p.id} post={p} featured onOpen={openPost}/>)}
            </div> : <p className="empty-state">No Instagram feed posts recorded this week.</p>}
            <button className="inline-action" type="button" onClick={()=>setView("posts")}>All posts <ArrowUpRight size={14}/></button>
          </section>
          <section className="surface compact-findings">
            <SectionHead title="Reel retention" meta="3-second skip"/>
            {reels.length ? <div className="retention-list">
              {reels.slice(0,4).map(p=><div key={p.id} className="retention-list-item">
                <span>{p.title}</span><strong>{p.skip_3s_pct?.toFixed(1)}%</strong>
              </div>)}
            </div> : <p className="empty-state">No Reel retention data for this week.</p>}
            <p className="small-note">Lower skip is better. Not a controlled comparison.</p>
          </section>
        </div>
        <div className="content-columns">
          <section className="surface">
            <SectionHead title="Story previews" meta={visualStories.length+" saved covers"}/>
            {visualStories.length ? <div className="story-filmstrip">
              {visualStories.slice(0,4).map(s=><StoryVisual key={s.id} story={s} compact onOpen={openStory}/>)}
            </div> : <p className="empty-state">No saved Story covers for this week.</p>}
            <button className="inline-action" type="button" onClick={()=>setView("stories")}>Story details <ArrowUpRight size={14}/></button>
          </section>
          <section className="surface facts-panel">
            <SectionHead title="At a glance"/>
            <div className="fact"><strong>{num(strongestPost?.views)}</strong>
              <span>Most viewed published post (lifetime)</span></div>
            <div className="fact"><strong>{num(mostInteractive?.interactions)}</strong>
              <span>Highest post interactions (lifetime)</span></div>
            <div className="fact"><strong>{num(bestStory?.impressions)}</strong>
              <span>Most impressions on one recorded Story</span></div>
          </section>
        </div>
      </>}

      {tab==="posts" && <section className="surface">
        <div className="section-head"><h2>Content performance</h2><span>{shownPosts.length} posts</span></div>
        <div className="filter-line">
          <div className="segmented">
            {(["instagram","facebook","all"] as Platform[]).map(v=><button type="button" key={v} aria-pressed={platform===v} onClick={()=>setPlatform(v)}>{v==="all"?"All":v==="instagram"?"Instagram":"Facebook"}</button>)}
          </div>
          <label className="search-wrap"><span className="sr-only">Search posts</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts"/></label>
        </div>
        <div className="media-grid">{shownPosts.map(p=><PostVisual key={p.id} post={p} onOpen={openPost}/>)}</div>
        {shownPosts.length===0&&<div className="empty-state">No posts for this week or filter.</div>}
      </section>}

      {tab==="stories" && <>
        <section className="stats-grid stats-grid-three">
          <Stat label="Stories logged" value={num(periodStories.length)}/>
          <Stat label="Impressions" value={num(periodStoryImpressions)}/>
          <Stat label="Replies" value={num(periodStoryReplies)}/>
        </section>
        <section className="surface">
          <SectionHead title="Story gallery" meta={visualStories.length+" saved covers"}/>
          {visualStories.length>0&&<div className="story-gallery">
            {visualStories.map(s=><StoryVisual key={s.id} story={s} onOpen={openStory}/>)}
          </div>}
          {storyWithoutCover.length>0&&<details className="missing-stories">
            <summary>{storyWithoutCover.length} Stories · metrics only <ChevronDown size={15}/></summary>
            <p className="small-note">Their original images are unavailable; performance records remain intact.</p>
            <div className="item-list">{storyWithoutCover.map(s=><StoryRow key={s.id} story={s}/>)}</div>
          </details>}
          {periodStories.length===0&&<p className="empty-state">No Story records for this week.</p>}
        </section>
      </>}

      {tab==="archive"&&<>
        <section className="stats-grid stats-grid-three">
          <Stat label="Instagram posts" value={num(allInstagramPosts.length)} note="Since Sep 2 · 2 sources merged"/>
          <Stat label="Historical view days" value={num(historicalDaily.filter(d=>d.account_views!=null).length)} note="Before Nov 9"/>
          <Stat label="Older Stories logged" value={num(historicalStories.length)} note="Original images expired for this period"/>
        </section>
        <section className="surface archive-controls">
          <div className="section-head"><h2>Published content</h2><span>Saved post images</span></div>
          <div className="filter-line">
            <div className="segmented archive-months">
              {([["all","All"],["2026-09","Sep"],["2026-10","Oct"],["2026-11","Nov"]] as const).map(([v,label])=><button type="button" key={v} aria-pressed={archiveMonth===v} onClick={()=>setArchiveMonth(v)}>{label}</button>)}
            </div>
            <label className="search-wrap"><span className="sr-only">Search historical content</span><input value={archiveSearch} onChange={e=>setArchiveSearch(e.target.value)} placeholder="Search content"/></label>
          </div>
          <div className="archive-info"><span>{archivePosts.length} posts</span><span>Views shown are cumulative as of Nov 16—not views earned during the posting week</span></div>
          <div className="media-grid">{archivePosts.map(p=><PostVisual key={p.id} post={p} onOpen={openPost}/>)}</div>
          {archivePosts.length===0&&<p className="small-note">No posts for that filter.</p>}
        </section>
        <section className="surface archive-trends">
          <SectionHead title="Account views over time" meta="Recorded daily views · grouped by week"/>
          <p className="small-note">These are day-level account views, not post lifetime views. Incomplete weeks are labeled.</p>
          <div className="bar-list history-bar-list">
            {weeklyHistory.map(w=><div className="history-bar" key={w.start}>
              <BarRow label={date(w.start)} value={w.views} max={maxHistoryViews}/>
              <span>{w.days}/7 days</span>
            </div>)}
          </div>
        </section>
        {historyVisualStories.length>0&&<section className="surface archive-stories">
          <SectionHead title="Early Stories" meta="Saved previews"/>
          <div className="story-filmstrip">{historyVisualStories.map(s=><StoryVisual key={s.id} story={s} onOpen={openStory} compact/>)}</div>
          <p className="small-note">Three other early Story records have no recoverable image or original link. Their metrics remain stored.</p>
        </section>}
      </>}

      {tab==="sources" && (latestWeek ? <>
        <div className="content-columns">
          <section className="surface ad-card">
            <SectionHead title="Meta Ads"/>
            <strong className="ad-value">{money(metaTotal)}</strong>
            <span className="ad-caption">Reported spend · {metaDays.length}/7 days</span>
            <div className="source-status"><Check size={14}/> Data returned for all 7 days</div>
          </section>
          <section className="surface ad-card">
            <SectionHead title="Google Ads"/>
            <strong className="ad-value incomplete">Incomplete</strong>
            <span className="ad-caption">Spend unknown · {googleDays.length}/7 days</span>
            <div className="source-status warning"><AlertCircle size={14}/> Only Nov 15 returned a value of $0</div>
          </section>
        </div>
        <section className="surface coverage-surface">
          <SectionHead title="Source coverage" meta="@opusplasticsurgery"/>
          <div className="coverage-list">
            {coverage.map(c=><details key={c.channel} className="coverage-row">
              <summary><span>{c.channel}</span><span className="coverage-summary">{c.data}</span><ChevronDown size={15}/></summary>
              <p>{c.limitation}</p>
            </details>)}
          </div>
        </section>
        <details className="surface expandable-block">
          <summary>Full daily ad records <ChevronDown size={16}/></summary>
          <div className="table-scroll"><table className="report-table"><thead><tr><th>Day</th><th>Meta spend</th><th>Meta clicks</th><th>Google spend</th><th>Google clicks</th></tr></thead>
            <tbody>{adsDaily.map(d=><tr key={d.date}><td>{date(d.date)}</td><td>{money(d.meta_spend)}</td><td>{num(d.meta_clicks)}</td><td>{money(d.google_spend)}</td><td>{num(d.google_clicks)}</td></tr>)}</tbody>
          </table></div>
        </details>
        <details className="surface expandable-block">
          <summary>Notes & next tests <ChevronDown size={16}/></summary>
          <div className="notes-list">
            {findings.map(x=><div key={x.id}><b>{x.title}</b><p>{x.body}</p></div>)}
            {actions.map(x=><div key={x.id}><b>{x.title}</b><p>{x.body}</p></div>)}
            {experiments.map(x=><div key={x.id}><b>{x.title}</b><p>{x.hypothesis}</p></div>)}
          </div>
        </details>
        <details className="surface expandable-block">
          <summary>Data notes <ChevronDown size={16}/></summary>
          <p className="small-note">{snapshot.coverage_notes}</p>
          <p className="small-note">— means no data returned, not zero. Story impressions count repeat exposure. Views and interactions do not measure consultations. This is a saved export, not live sync.</p>
        </details>
      </> : <section className="surface period-unavailable">
        <SectionHead title="Paid data" meta={date(selectedWeek)+" – "+date(endOfWeek(selectedWeek))}/>
        <p>Earlier ad records aren't available here. Choose Nov 9–15 for the available data.</p>
        <button type="button" className="inline-action" onClick={()=>changeWeek(snapshot.week_start)}>View latest ad data <ArrowUpRight size={14}/></button>
      </section>)}

      <MediaPreviewModal key={selectedPost?.id??selectedStory?.id??"none"} post={selectedPost} story={selectedStory} onClose={closeMedia}/>
      <footer className="app-footer">
        <span>OPUS / SIGNAL · Updated Nov 17, 2026</span>
        <span>Read-only public snapshot · Not live</span>
      </footer>
    </main>
  </div>;
}
