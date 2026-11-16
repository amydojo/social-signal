"use client";

import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowUpRight,Download,FileText,ExternalLink,ChevronDown,CalendarDays,Eye,CheckCircle2,AlertCircle,ImageIcon,ClipboardList} from "lucide-react";
import {posts as metricoolPosts, stories as metricoolStories, snapshot as metricoolSnapshot} from "../report-data";
import {historicalPosts} from "../history-data";
import archiveIndex from "../../public/media/archive/index.json";
import {nov2Channels,nov2Log,nov2Notes,reportingSources,type LeadershipLog,type LeadershipChannel} from "./frew-data";

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
function Badge({children,variant="muted"}:{children:React.ReactNode;variant?:"muted"|"good"|"warn"}){
  return <span className={"frew-chip frew-chip-"+variant}>{children}</span>;
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
    const head=["Date","Platform","Account","Format","Title","URL","Views / Story Impressions","Likes","Comments","Shares","Saves","Status","CTA Check","Compliance Check"];
    const body=rows.map(r=>[r.date,r.platform,r.account,r.format,r.title,r.url,r.views,r.likes,r.comments,r.shares,r.saves,r.status??"Not recorded",r.ctaChecked==null?"Not recorded":r.ctaChecked?"Yes":"No",r.complianceChecked==null?"Not recorded":r.complianceChecked?"Yes":"No"]);
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
  const filtered=useMemo(()=>rows.filter(r=>filter==="all"||r.platform===filter),[rows,filter]);
  const visible=showAllPosts?filtered:filtered.slice(0,7);
  const statusMissing=rows.filter(r=>r.status==null).length;
  const ctaMissing=rows.filter(r=>r.ctaChecked==null).length;
  const complianceMissing=rows.filter(r=>r.complianceChecked==null).length;
  const sourceLabel=sheetWeek?"Original Google Sheet · values entered by Nov 10":"Metricool export · compiled Nov 16";
  const headline=sheetWeek?
    [{name:"OPUS Instagram reach",value:1112,detail:"Nov 2–6 · account-level"},{name:"Accounts engaged",value:85,detail:"@opusplasticsurgery"},{name:"GBP website clicks",value:4,detail:"Nov 2–6"},{name:"GBP calls",value:1,detail:"Nov 2–6"}]:
    [{name:"Instagram feed views",value:2501,detail:"3 posts · cumulative at export"},{name:"Instagram interactions",value:47,detail:"3 feed posts"},{name:"Story impressions",value:3254,detail:"12 Stories · repeat exposures included"},{name:"Story replies",value:6,detail:"Across 12 Stories"}];
  const lead=sheetWeek?nov2Log.find(r=>r.id==="n2-ig-tamara")!:week9Log.find(r=>r.id==="ig-reel-scar")!;
  const other=sheetWeek?nov2Log.find(r=>r.id==="n2-ig-lipo")!:week9Log.find(r=>r.id==="ig-reel-keep")!;
  const outstanding=sheetWeek?[
    {label:"Publishing checks",text:"Status, CTA and compliance were not recorded for the logged posts.",type:"needs"},
    {label:"Story details",text:"Links for three Nov 6 Stories and reach for two Nov 8 Stories were requested.",type:"needs"},
    {label:"SEO reporting",text:"Search Console and GA4 exports for the last 28 days versus the previous period were requested; not present in this report.",type:"needs"}
  ]:[
    {label:"Posting checks",text:"On-time status, CTA and compliance checks are not returned by Metricool.",type:"needs"},
    {label:"Other accounts",text:"Dr. Frew, OPUS results, TikTok, YouTube and GBP data require their own verified reporting source for this period.",type:"needs"},
    {label:"Paid attribution",text:"Meta Ads returned seven zero-spend days; Google Ads only returned Nov 15, so its weekly total is unknown.",type:"needs"}
  ];

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
            <p className="frew-neutral">Common questions from comments and DMs were not yet documented.</p>
          </>:<>
            <p><b>What a scar can’t show</b> had the most feed-post views (1,309). <b>What you want to keep</b> had more interactions (23 vs. 17).</p>
            <p className="frew-neutral">These totals do not establish consultation requests or bookings.</p>
          </>}
          <div className="frew-readout-footer"><Eye size={15}/> Saved source metrics, not a live feed</div>
        </section>
      </div>

      <section className="frew-panel frew-channels">
        <div className="frew-panel-head"><h2>Performance by account</h2><span>Each account shown separately</span></div>
        <div className="frew-channel-grid">{channels.map((ch,i)=><article className="frew-channel" key={ch.platform+ch.account}>
          <div className="frew-channel-top"><b>{ch.platform}</b><span>{ch.account}</span></div>
          {ch.metrics.length>0?<div className="frew-channel-metrics">{ch.metrics.map(m=><div key={m.label}><span>{m.label}</span><strong>{fmt(m.value)}{m.unit&&m.value!=null?" "+m.unit:""}</strong></div>)}</div>:<p className="frew-channel-missing">No verified figures for this reporting week.</p>}
          {ch.note&&<p className="frew-channel-note">{ch.note}</p>}
        </article>)}</div>
      </section>

      <section className="frew-panel frew-postlog">
        <div className="frew-panel-head"><h2>Posts log</h2><span>{rows.length} recorded items · source snapshots</span></div>
        <div className="frew-log-tools">
          <div className="frew-segments">{(["all","Instagram","Facebook","Google Business Profile"] as PlatformFilter[]).map(x=><button key={x} type="button" aria-pressed={filter===x} onClick={()=>{setFilter(x);setShowAllPosts(false)}}>{x==="all"?"All":x==="Google Business Profile"?"GBP":x}</button>)}</div>
          <p>On-time, CTA and compliance are shown only when verified.</p>
        </div>
        <div className="frew-table-scroll"><table className="frew-table">
          <thead><tr><th>Date</th><th>Post</th><th>Platform</th><th>Views / impr.</th><th>Status</th><th>CTA</th><th>Compliance</th></tr></thead>
          <tbody>{visible.map(p=><tr key={p.id}>
            <td>{day(p.date)}</td>
            <td><div className="frew-postcell">{p.url?<a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}<ExternalLink size={12}/></a>:<span>{p.title}</span>}<small>{p.format}</small></div></td>
            <td><span className="frew-platform-label">{p.platform}</span></td>
            <td className="frew-num">{fmt(p.views)}</td>
            <td><Badge>{p.status??"Not recorded"}</Badge></td>
            <td><Badge>{p.ctaChecked==null?"Not recorded":p.ctaChecked?"Yes":"No"}</Badge></td>
            <td><Badge>{p.complianceChecked==null?"Not recorded":p.complianceChecked?"Yes":"No"}</Badge></td>
          </tr>)}</tbody>
        </table></div>
        {filtered.length>7&&<button type="button" className="frew-show" onClick={()=>setShowAllPosts(v=>!v)}>{showAllPosts?"Show fewer":"Show all "+filtered.length+" records"}<ChevronDown size={14}/></button>}
      </section>

      <div className="frew-two frew-final">
        <section className="frew-panel">
          <div className="frew-panel-head"><h2>Reporting completeness</h2><Badge variant="warn">Needs verification</Badge></div>
          <div className="frew-checks">
            <div><span>Publishing status</span><b>{statusMissing} not recorded</b></div>
            <div><span>CTA check</span><b>{ctaMissing} not recorded</b></div>
            <div><span>Compliance check</span><b>{complianceMissing} not recorded</b></div>
          </div>
          <p className="frew-fine">Blank fields aren't failures. They mean the information hasn't been verified in this reporting source.</p>
        </section>
        <section className="frew-panel">
          <div className="frew-panel-head"><h2>Follow-up</h2><span>Source-backed</span></div>
          <div className="frew-todo">{outstanding.map((x,i)=><div key={x.label}><span>{String(i+1).padStart(2,"0")}</span><div><b>{x.label}</b><p>{x.text}</p></div></div>)}</div>
        </section>
      </div>

      <section className="frew-evidence">
        <div><h2>Source & evidence</h2><p>Numbers reflect the recorded reporting period. Screenshot files remain in the restricted OPUS Drive folder.</p></div>
        <div className="frew-evidence-links">
          <a target="_blank" rel="noopener noreferrer" href={reportingSources.sheet}>Original sheet <ExternalLink size={14}/></a>
          <a target="_blank" rel="noopener noreferrer" href={sheetWeek?reportingSources.nov2Evidence:reportingSources.screenshotsRoot}>Screenshot folders <ExternalLink size={14}/></a>
        </div>
      </section>
      {sheetWeek&&<details className="frew-data-notes"><summary>Data notes <ChevronDown size={14}/></summary><p>{nov2Notes.discrepancy}</p><p>{nov2Notes.completeness}</p></details>}
      <footer className="frew-footer"><span>SIGNAL / OPUS · Read-only leadership report</span><span>Public link · No patient data · Not live synced</span></footer>
    </main>
  </div>;
}
