"use client";

import { useCallback, useMemo, useState } from "react";
import { PostVisual, StoryVisual, MediaPreviewModal } from "./media-views";
import { historicalPosts, historicalStories, historicalDaily } from "./history-data";
import archiveIndex from "../public/media/archive/index.json";
import {
  BarChart3, Download, ExternalLink, FileText, Grid2X2, Instagram,
  Database, ArrowUpRight, ChevronDown, Eye, Layers, Check, AlertCircle
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
function ExportActions({posts}:{posts:Post[]}) {
  function exportPosts() {
    const head=["Date","Platform","Format","Title","URL","Views","Impressions","Reach","Interactions","Likes","Comments","Shares","Saves","3s skip %","Avg watch seconds"];
    const rows=posts.map(p=>[p.raw_timestamp??p.published_on,p.platform,p.format,p.title,p.permalink,p.views,p.impressions,p.reach,p.interactions,p.likes,p.comments,p.shares,p.saves,p.skip_3s_pct,p.avg_watch_seconds]);
    const blob=new Blob([csv([head,...rows])],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="SIGNAL_OPUS_Nov_09-15_2026.csv";anchor.click();
    URL.revokeObjectURL(url);
  }
  return <div className="export-actions">
    <button type="button" onClick={exportPosts}><Download size={15}/> CSV</button>
    <button type="button" onClick={()=>window.print()}><FileText size={15}/> PDF</button>
  </div>;
}

export default function SignalDashboard({snapshot,posts,stories,coverage,socialDaily,adsDaily,insights,experiments}:Props) {
  const [tab,setTab]=useState<Tab>("overview");
  const [platform,setPlatform]=useState<Platform>("instagram");
  const [search,setSearch]=useState("");
  const [archiveMonth,setArchiveMonth]=useState<"all"|"2026-09"|"2026-10"|"2026-11">("all");
  const [archiveSearch,setArchiveSearch]=useState("");
  const [selectedPost,setSelectedPost]=useState<Post|null>(null);
  const [selectedStory,setSelectedStory]=useState<Story|null>(null);
  const closeMedia=useCallback(()=>{setSelectedPost(null);setSelectedStory(null)},[]);
  const openPost=useCallback((p:Post)=>{setSelectedStory(null);setSelectedPost(p)},[]);
  const openStory=useCallback((s:Story)=>{setSelectedPost(null);setSelectedStory(s)},[]);
  const igPosts=posts.filter(p=>p.platform==="instagram");
  const reels=igPosts.filter(p=>p.format==="Reel");
  const sortedPosts=[...igPosts].sort((a,b)=>(b.views??0)-(a.views??0));
  const sortedStories=[...stories].sort((a,b)=>(b.impressions??0)-(a.impressions??0));
  // Archived source-image URLs verified from the November 16 build.
  // Older story objects are retained as metric records, not fabricated covers.
  const archivedStoryIds=new Set(["story-07","story-08","story-09","story-10","story-11","story-12"]);
  const visualStories=sortedStories.filter(s=>archivedStoryIds.has(s.id));
  const storyWithoutCover=sortedStories.filter(s=>!archivedStoryIds.has(s.id));
  const shownPosts=useMemo(()=>posts.filter(p=>(platform==="all"||p.platform===platform)&&p.title.toLowerCase().includes(search.toLowerCase())),[posts,platform,search]);
  const allInstagramPosts=[...historicalPosts,...igPosts].sort((a,b)=>b.published_on.localeCompare(a.published_on));
  const archivePosts=allInstagramPosts.filter(p=>(archiveMonth==="all"||p.published_on.startsWith(archiveMonth))&&p.title.toLowerCase().includes(archiveSearch.toLowerCase()));
  const savedHistoricalFiles=new Set(archiveIndex.assets.filter(a=>a.status==="saved").map(a=>a.file));
  const historyVisualStories=historicalStories.filter(s=>Boolean(s.thumbnail_path)&&savedHistoricalFiles.has(s.thumbnail_path!));
  const weeklyHistory=useMemo(()=>{
    const viewDays=[...historicalDaily,...socialDaily]
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
  },[archiveMonth,socialDaily]);
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
  const firstReel=reels.find(p=>p.id==="ig-reel-scar");
  const secondReel=reels.find(p=>p.id==="ig-reel-keep");
  const maxViews=Math.max(1,...sortedPosts.map(p=>p.views??0));
  const maxStories=Math.max(1,...sortedStories.map(s=>s.impressions??0));

  return <div className="app-shell">
    <aside className="app-sidebar">
      <div className="logo"><span className="logo-symbol">S<span>.</span></span><span className="logo-word">SIGNAL<small>OPUS / SOCIAL</small></span></div>
      <nav aria-label="Dashboard views" className="app-nav">
        {tabs.map(t=><button type="button" key={t.id} onClick={()=>setTab(t.id)} aria-pressed={tab===t.id} className={tab===t.id?"active":""}><t.icon size={17}/>{t.name}</button>)}
      </nav>
      <div className="sidebar-foot"><span className="status-dot"/> Read-only snapshot</div>
    </aside>

    <main className="app-main">
      <header className="app-header">
        <div className="heading-wrap">
          <div className="eyeline">OPUS PLASTIC SURGERY <span>/</span> WEEKLY REPORT</div>
          <h1>{tab==="overview"?"Overview":tab==="posts"?"Posts":tab==="stories"?"Stories":tab==="archive"?"Archive":"Data & ads"}</h1>
          <div className="header-sub">{tab==="archive"?"Sep–Nov 2026":date(snapshot.week_start)+"–"+date(snapshot.week_end)+", 2026"} <span>·</span> Metricool export, Nov 16</div>
        </div>
        <ExportActions posts={posts}/>
      </header>

      {tab==="overview" && <>
        <section className="stats-grid" aria-label="Weekly Instagram statistics">
          <Stat label="Feed views" value={num(snapshot.feed_views)} note="3 posts"/>
          <Stat label="Interactions" value={num(snapshot.feed_interactions)} note="Instagram feed"/>
          <Stat label="Story impressions" value={num(snapshot.story_impressions)} note="12 stories"/>
          <Stat label="Story replies" value={num(snapshot.story_replies)} note="Across 12 stories"/>
        </section>
        <div className="content-columns">
          <section className="surface rankings">
            <SectionHead title="Top Instagram posts" meta="Views"/>
            <div className="featured-media">
              {sortedPosts.map(p=><PostVisual key={p.id} post={p} featured onOpen={openPost}/>)}
            </div>
            <button className="inline-action" type="button" onClick={()=>setTab("posts")}>All posts <ArrowUpRight size={14}/></button>
          </section>
          <section className="surface compact-findings">
            <SectionHead title="Reel retention" meta="3-second skip"/>
            {firstReel&&secondReel&&<div className="retention-comparison">
              <div className="retention-stat"><span>Scar</span><strong>{firstReel.skip_3s_pct?.toFixed(1)}%</strong></div>
              <div className="versus">vs</div>
              <div className="retention-stat"><span>Consultation</span><strong>{secondReel.skip_3s_pct?.toFixed(1)}%</strong></div>
            </div>}
            <p className="small-note">Lower skip is better. Two Reels, not a controlled test.</p>
          </section>
        </div>
        <div className="content-columns">
          <section className="surface">
            <SectionHead title="Story previews" meta="From saved posts"/>
            <div className="story-filmstrip">
              {visualStories.slice(0,4).map(s=><StoryVisual key={s.id} story={s} compact onOpen={openStory}/>)}
            </div>
            <button className="inline-action" type="button" onClick={()=>setTab("stories")}>All 12 stories <ArrowUpRight size={14}/></button>
          </section>
          <section className="surface facts-panel">
            <SectionHead title="This week"/>
            <div className="fact"><strong>1,309</strong><span>Views on the scar Reel (highest)</span></div>
            <div className="fact"><strong>23</strong><span>Interactions on the consultation Reel (highest)</span></div>
            <div className="fact"><strong>603</strong><span>Birthday Story impressions (highest)</span></div>
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
        {shownPosts.length===0&&<div className="empty-state">No matching posts.</div>}
      </section>}

      {tab==="stories" && <>
        <section className="stats-grid stats-grid-three">
          <Stat label="Stories" value={num(stories.length)}/>
          <Stat label="Impressions" value={num(snapshot.story_impressions)}/>
          <Stat label="Replies" value={num(snapshot.story_replies)}/>
        </section>
        <section className="surface">
          <SectionHead title="Story gallery" meta={visualStories.length+" available previews"}/>
          <div className="story-gallery">{visualStories.map(s=><StoryVisual key={s.id} story={s} onOpen={openStory}/>)}</div>
          {storyWithoutCover.length>0&&<details className="missing-stories">
            <summary>{storyWithoutCover.length} older Stories · metrics only <ChevronDown size={15}/></summary>
            <p className="small-note">The original images expired. Their Metricool results are still included.</p>
            <div className="item-list">{storyWithoutCover.map(s=><StoryRow key={s.id} story={s}/>)}</div>
          </details>}
        </section>
      </>}

      {tab==="archive"&&<>
        <section className="stats-grid stats-grid-three">
          <Stat label="Instagram posts" value={num(allInstagramPosts.length)} note="Since Sep 2 · 2 sources merged"/>
          <Stat label="Historical view days" value={num(historicalDaily.filter(d=>d.account_views!=null).length)} note="Before Nov 9"/>
          <Stat label="Older Stories logged" value={num(historicalStories.length)} note="Original images expired for this period"/>
        </section>
        <section className="surface archive-controls">
          <div className="section-head"><h2>Published content</h2><span>Images from Metricool</span></div>
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

      {tab==="sources" && <>
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
          <SectionHead title="Source coverage" meta="Metricool / @opusplasticsurgery"/>
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
      </>}

      <MediaPreviewModal key={selectedPost?.id??selectedStory?.id??"none"} post={selectedPost} story={selectedStory} onClose={closeMedia}/>
      <footer className="app-footer">
        <span>Source: Metricool · Export Nov 16, 2026</span>
        <span>Read-only public snapshot · Not live</span>
      </footer>
    </main>
  </div>;
}
