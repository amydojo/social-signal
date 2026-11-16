"use client";

import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,Download,FileText,ExternalLink,ChevronDown,CalendarDays,Eye,ImageIcon} from "lucide-react";
import {posts as metricoolPosts, stories as metricoolStories, snapshot as metricoolSnapshot} from "../report-data";
import {historicalPosts} from "../history-data";
import archiveIndex from "../../public/media/archive/index.json";
import {nov2Channels,nov2Log,reportingSources,type LeadershipLog,type LeadershipChannel} from "./frew-data";

type Period = "2026-11-09"|"2026-11-02";
type PlatformFilter="all"|"Instagram"|"Facebook"|"Google Business Profile";
const savedCovers=new Set(archiveIndex.assets.filter(x=>x.status==="saved").map(x=>x.file));
const fmt=(value:number|null|undefined)=>value==null?"—":value.toLocaleString("en-US");
const day=(d:string)=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
const safeCsv=(rows:(number|string|null|undefined)[][])=>rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");

const week9Log:LeadershipLog[]=[
  ...metricoolPosts.map(p=>({
    id:p.id,date:p.published_on,platform:p.platform==="instagram"?"Instagram":"Facebook",
    account:p.platform==="instagram"?"@opusplasticsurgery":"OPUS Plastic Surgery",
    format:p.format??"Post",title:p.title,url:p.permalink,
    views:p.views??p.impressions??null,likes:p.likes,comments:p.comments,shares:p.shares,saves:p.saves,
    status:null as LeadershipLog["status"],ctaChecked:null,complianceChecked:null
  })),
  ...metricoolStories.map(story=>({
    id:story.id,date:story.published_at_raw.slice(0,4)+"-"+story.published_at_raw.slice(4,6)+"-"+story.published_at_raw.slice(6,8),
    platform:"Instagram",account:"@opusplasticsurgery",format:"Story",
    title:story.descriptor==="(no story text)"?"Instagram Story":story.descriptor,
    url:story.permalink||null,views:story.impressions,likes:null,comments:null,shares:null,saves:null,
    status:null as LeadershipLog["status"],ctaChecked:null,complianceChecked:null
  })),
].sort((a,b)=>b.date.localeCompare(a.date));

const week9Channels:LeadershipChannel[]=[
  {platform:"Instagram",account:"@opusplasticsurgery",period:"Nov 9–15",source:"metricool",
    metrics:[
      {label:"Feed posts",value:3},{label:"Feed views",value:metricoolSnapshot.feed_views??null},
      {label:"Feed interactions",value:metricoolSnapshot.feed_interactions??null},
      {label:"Stories",value:metricoolSnapshot.story_count},{label:"Story impressions",value:metricoolSnapshot.story_impressions??null},{label:"Story replies",value:metricoolSnapshot.story_replies},
    ]},
  {platform:"Facebook",account:"OPUS Plastic Surgery",period:"Nov 9–15",source:"metricool",
    metrics:[{label:"Posts",value:2},{label:"Reel views",value:17},{label:"Carousel impressions",value:1}],
    note:"Facebook Reel views and carousel impressions are different metrics, so they aren't added together."},
  {platform:"TikTok",account:"@opusplasticsurgery / @drtylerfrew",period:"Nov 9–15",source:"metricool",
    metrics:[],note:"Post-level coverage unavailable in this export; not evidence of zero activity."},
  {platform:"YouTube",account:"OPUS channel",period:"Nov 9–15",source:"metricool",
    metrics:[],note:"Video-level coverage unavailable in this export."},
  {platform:"Google Business Profile",account:"OPUS Upland",period:"Nov 9–15",source:"metricool",
    metrics:[],note:"Weekly GBP Performance figures not available in this export."},
];

function MiniMetric({name,value,detail}:{name:string;value:number|null;detail:string}){
  return <div className="frew-kpi"><span>{name}</span><strong>{fmt(value)}</strong><small>{detail}</small></div>;
}
function ImageCover({url,alt}:{url:string|null;alt:string}){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[url]);
  if(!url||failed)return <span className="frew-thumb-fallback"><ImageIcon size={23}/></span>;
  return <img src={url} alt={alt} loading="lazy" onError={()=>setFailed(true)}/>;
}
function getCover(log:LeadershipLog){
  if(!log.url)return null;
  const hist=historicalPosts.find(p=>p.permalink===log.url);
  if(hist?.thumbnail_path&&savedCovers.has(hist.thumbnail_path))return hist.thumbnail_path;
  const code=log.url.match(/instagram\.com\/(?:reel|p)\/([^/]+)/)?.[1];
  if(code&&savedCovers.has("/media/archive/ig-"+code+".jpg"))return "/media/archive/ig-"+code+".jpg";
  if(log.platform==="Facebook"){
    const counterpart=log.title.toLowerCase().includes("scar")?"DfqeQMZMKqR":log.title.toLowerCase().includes("bulging")?"DftDagtkR6i":null;
    if(counterpart&&savedCovers.has("/media/archive/ig-"+counterpart+".jpg"))return "/media/archive/ig-"+counterpart+".jpg";
  }
  return null;
}
function DownloadButton({rows,period}:{rows:LeadershipLog[];period:Period}){
  return <button type="button" className="frew-action" onClick={()=>{
    const head=["Date","Platform","Account","Format","Title","URL","Views / Story Impressions","Likes","Comments","Shares","Saves"];
    const body=rows.map(r=>[r.date,r.platform,r.account,r.format,r.title,r.url,r.views,r.likes,r.comments,r.shares,r.saves]);
    const blob=new Blob([safeCsv([head,...body])],{type:"text/csv;charset=utf-8"});
    const obj=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=obj;a.download="SIGNAL_Frew_PostLog_"+period+".csv";a.click();URL.revokeObjectURL(obj);
  }}><Download size={15}/> CSV</button>;
}

export default function FrewDashboard(){
  const [period,setPeriod]=useState<Period>("2026-11-09");
  const [filter,setFilter]=useState<PlatformFilter>("all");
  const [showAllPosts,setShowAllPosts]=useState(false);
  useEffect(()=>{const q=new URLSearchParams(window.location.search).get("week");if(q==="2026-11-02"||q==="2026-11-09")setPeriod(q)},[]);
  const changePeriod=(p:Period)=>{
    setPeriod(p);setShowAllPosts(false);
    const u=new URL(window.location.href);u.searchParams.set("week",p);window.history.replaceState(null,"",u.pathname+u.search);
  };
  const sheetWeek=period==="2026-11-02";
  const rows=sheetWeek?nov2Log:week9Log;
  const channels=sheetWeek?nov2Channels:week9Channels;
  const feedRows=rows.filter(r=>r.format!=="Story");
  const storyRows=rows.filter(r=>r.format==="Story");
  const platforms:PlatformFilter[]=["all",...new Set(feedRows.map(r=>r.platform as PlatformFilter))];
  const filtered=useMemo(()=>feedRows.filter(r=>filter==="all"||r.platform===filter),[rows,filter]);
  const visible=showAllPosts?filtered:filtered.slice(0,7);
  const sourceLabel=sheetWeek?"Original Google Sheet · values entered by Nov 10":"Metricool export · compiled Nov 16";
  const headline=sheetWeek?
    [{name:"OPUS Instagram reach",value:1112,detail:"Nov 2–6 · account-level"},{name:"Accounts engaged",value:85,detail:"@opusplasticsurgery"},{name:"GBP website clicks",value:4,detail:"Nov 2–6"},{name:"GBP calls",value:1,detail:"Nov 2–6"}]:
    [{name:"Instagram feed views",value:2501,detail:"3 posts · cumulative at export"},{name:"Instagram interactions",value:47,detail:"3 feed posts"},{name:"Story impressions",value:3254,detail:"12 Stories · repeat exposures included"},{name:"Story replies",value:6,detail:"Across 12 Stories"}];
  const lead=sheetWeek?nov2Log.find(r=>r.id==="n2-ig-tamara")!:week9Log.find(r=>r.id==="ig-reel-scar")!;
  const other=sheetWeek?nov2Log.find(r=>r.id==="n2-ig-lipo")!:week9Log.find(r=>r.id==="ig-reel-keep")!;
  const weekLabel=sheetWeek?"Nov 2–8, 2026":"Nov 9–15, 2026";
  return <div className="frew-shell">
    <div className="frew-topbar">
      <div className="frew-brand"><span>S<span className="frew-brand-dot">.</span></span><b>SIGNAL</b><em>/</em><small>LEADERSHIP</small></div>
      <a className="frew-back" href="/"><ArrowLeft size={15}/> Creative dashboard</a>
    </div>
    <main className="frew-main">
      <header className="frew-header">
        <div>
          <div className="frew-eyebrow">OPUS PLASTIC SURGERY / WEEKLY REVIEW</div>
          <h1>Performance overview</h1>
          <p>For Dr. Frew <span>·</span> {sourceLabel}</p>
        </div>
        <div className="frew-toolbar">
          <label className="frew-period"><CalendarDays size={16}/><span className="sr-only">Reporting week</span>
            <select value={period} onChange={e=>changePeriod(e.target.value as Period)}>
              <option value="2026-11-09">Week of Nov 9</option>
              <option value="2026-11-02">Week of Nov 2</option>
            </select>
          </label>
          <DownloadButton rows={rows} period={period}/>
          <button type="button" className="frew-action" onClick={()=>window.print()}><FileText size={15}/> PDF</button>
        </div>
      </header>

      <div className="frew-period-caption">
        <span className="frew-status-light"/><b>{weekLabel}</b>
        <span>{sheetWeek?"Weekly totals cover Nov 2–6; Posts Log also includes Nov 8 Stories":"Published-content snapshot captured Nov 16 · not live"}</span>
      </div>
      <section className="frew-kpis" aria-label="Weekly performance">
        {headline.map(x=><MiniMetric key={x.name} {...x}/>)}
      </section>

      <div className="frew-two">
        <section className="frew-panel frew-highlights">
          <div className="frew-panel-head"><h2>Posts worth reviewing</h2><span>Actual content</span></div>
          <div className="frew-featured">
            {[lead,other].map(p=><article key={p.id} className="frew-feature">
              <a className="frew-feature-img" href={p.url??"#"} target="_blank" rel="noopener noreferrer" aria-label={"Open "+p.title}>
                <ImageCover url={getCover(p)} alt={p.title}/><span className="frew-play-link"><ExternalLink size={15}/></span>
              </a>
              <div><span className="frew-item-label">{p.format} · {day(p.date)}</span>
                <h3>{p.title}</h3><strong>{fmt(p.views)}</strong><small>Views in {sheetWeek?"Posts Log":"Metricool snapshot"}</small>
              </div>
            </article>)}
          </div>
        </section>
        <section className="frew-panel frew-readout">
          <div className="frew-panel-head"><h2>Weekly read</h2></div>
          {sheetWeek?<>
            <p>Team and educational posts led the source notes. <b>Meet Tamara</b> recorded 1,422 views in Posts Log; <b>Lipo + tummy tuck</b> recorded 1,052.</p>
            <p className="frew-neutral">The weekly notes highlighted team introductions and straightforward surgical explanations.</p>
          </>:<>
            <p><b>What a scar can’t show</b> had the most feed-post views (1,309). <b>What you want to keep</b> had more interactions (23 vs. 17).</p>
            <p className="frew-neutral">The most-viewed Reel was not the most-interacted-with Reel.</p>
          </>}
          <div className="frew-readout-footer"><Eye size={15}/> Saved source metrics, not a live feed</div>
        </section>
      </div>

      <section className="frew-panel frew-channels">
        <div className="frew-panel-head"><h2>Performance by account</h2><span>Each account shown separately</span></div>
        <div className="frew-channel-grid">{channels.filter(ch=>ch.metrics.some(m=>m.value!=null)).map(ch=><article className="frew-channel" key={ch.platform+ch.account}>
          <div className="frew-channel-top"><b>{ch.platform}</b><span>{ch.account}</span></div>
          <div className="frew-channel-metrics">{ch.metrics.filter(m=>m.value!=null).map(m=><div key={m.label}><span>{m.label}</span><strong>{fmt(m.value)}{m.unit?" "+m.unit:""}</strong></div>)}</div>
          {ch.note&&<p className="frew-channel-note">{ch.note}</p>}
        </article>)}</div>
      </section>

      <section className="frew-panel frew-postlog">
        <div className="frew-panel-head"><h2>Published content</h2><span>{feedRows.length} posts · {storyRows.length} Stories</span></div>
        <div className="frew-log-tools">
          <div className="frew-segments">{platforms.map(x=><button key={x} type="button"
            aria-pressed={filter===x} onClick={()=>{setFilter(x);setShowAllPosts(false)}}>
            {x==="all"?"All":x==="Google Business Profile"?"GBP":x}
          </button>)}</div>
        </div>
        <div className="frew-table-scroll"><table className="frew-table">
          <thead><tr><th>Date</th><th>Post</th><th>Platform</th><th>Views / impressions</th><th>Likes</th><th>Shares</th></tr></thead>
          <tbody>{visible.map(p=><tr key={p.id}>
            <td>{day(p.date)}</td>
            <td><div className="frew-postcell">{p.url?
              <a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}<ExternalLink size={12}/></a>:
              <span>{p.title}</span>}<small>{p.format}</small></div></td>
            <td><span className="frew-platform-label">{p.platform}</span></td>
            <td className="frew-num">{fmt(p.views)}</td>
            <td className="frew-num">{fmt(p.likes)}</td>
            <td className="frew-num">{fmt(p.shares)}</td>
          </tr>)}</tbody>
        </table></div>
        {filtered.length===0&&<p className="frew-empty">No published posts for this platform in this reporting period.</p>}
        {filtered.length>7&&<button type="button" className="frew-show" onClick={()=>setShowAllPosts(v=>!v)}>
          {showAllPosts?"Show fewer":"Show all "+filtered.length+" posts"}<ChevronDown size={14}/>
        </button>}
        {storyRows.length>0&&<details className="frew-stories-details">
          <summary>Instagram Stories <span>{storyRows.length} recorded</span><ChevronDown size={15}/></summary>
          <div className="frew-stories-list">{storyRows.map(story=><div key={story.id}>
            <span>{day(story.date)}</span>
            <div>{story.url?<a href={story.url} target="_blank" rel="noopener noreferrer">{story.title}<ExternalLink size={12}/></a>:<span>{story.title}</span>}</div>
            <b>{fmt(story.views)} <small>impressions</small></b>
          </div>)}</div>
        </details>}
      </section>

      <details className="frew-source-details">
        <summary>Sources & report details <ChevronDown size={15}/></summary>
        <p>Read-only snapshots, not live analytics. Views and impressions measure different things; individual post counts can reflect cumulative performance.</p>
        {sheetWeek&&<p>Original sheet values for some posts differ from its notes because they were captured at different points. This report uses Posts Log values.</p>}
        <div className="frew-evidence-links">
          <a target="_blank" rel="noopener noreferrer" href={reportingSources.sheet}>Original data source <ExternalLink size={14}/></a>
          <a target="_blank" rel="noopener noreferrer" href={sheetWeek?reportingSources.nov2Evidence:reportingSources.screenshotsRoot}>Screenshot archive <ExternalLink size={14}/></a>
        </div>
      </details>
      <footer className="frew-footer"><span>SIGNAL / OPUS · Read-only leadership report</span><span>Public link · No patient data · Not live synced</span></footer>
    </main>
  </div>;
}
