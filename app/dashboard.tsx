"use client";
import {useMemo,useState} from "react";
import {Activity,ArrowUpRight,CalendarDays,Download,ExternalLink,FileText,Layers,Search,Target,TrendingDown,Eye,BarChart3,BookOpen,ShieldCheck} from "lucide-react";

export type Snapshot = {
  id:string;week_start:string;week_end:string;captured_at:string;source:string;
  reel_views:number|null;reel_interactions:number|null;feed_views?:number|null;
  feed_interactions?:number|null;feed_pieces?:number|null;story_count:number|null;
  story_impressions?:number|null;story_replies:number|null;
  account_data_through:string|null;coverage_notes:string|null;
};
export type Post = {
  id:string;published_on:string;title:string;permalink:string;platform:string;
  format?:string;views:number|null;impressions?:number|null;reach:number|null;
  likes:number|null;comments:number|null;shares:number|null;saves:number|null;
  interactions:number|null;skip_3s_pct:number|null;avg_watch_seconds:number|null;raw_timestamp?:string;
};
export type Story = {
  id:string;published_at_raw:string;descriptor:string;impressions:number|null;
  reach:number|null;replies:number|null;exits:number|null;back_taps:number|null;
  forward_taps:number|null;permalink:string;
};
export type Coverage = {
  channel:string;account:string;status:string;data:string;limitation:string;
};
export type DailySocial = {date:string;followers:number|null;account_views:number|null;reach:number|null};
export type AdsDay = {
  date:string;meta_spend:number|null;meta_impressions:number|null;meta_clicks:number|null;
  google_spend:number|null;google_impressions:number|null;google_clicks:number|null;
};
export type Insight = {id:string;kind:"finding"|"action"|"caveat";position:number;title:string;body:string};
export type Experiment = {id:string;title:string;hypothesis:string;status:string;notes:string|null};
type Props = {
  snapshot:Snapshot;weeks:Snapshot[];posts:Post[];stories:Story[];coverage:Coverage[];
  socialDaily:DailySocial[];adsDaily:AdsDay[];insights:Insight[];experiments:Experiment[];
};
type Section = "overview"|"posts"|"stories"|"channels"|"ads"|"weekly"|"experiments";

const fmt = (n:number|null|undefined)=>n==null?"—":Number(n).toLocaleString("en-US");
const dateLabel = (d:string)=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
const rawDate = (d:string)=>d.length>=8?dateLabel(d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8)):"Date unknown";
const dollars = (n:number|null)=>n==null?"—":"$"+n.toFixed(2);
const toCsv=(rows:(string|number|null|undefined)[][])=>rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");

function Metric({label,value,detail}:{label:string;value:string;detail:string}){
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}
function PostCard({p}:{p:Post}) {
  return <article className="post">
    <div className="postmeta"><span>{rawDate(p.raw_timestamp??p.published_on.replaceAll("-",""))} / {p.platform.toUpperCase()} {p.format?.toUpperCase()}</span>
      <a href={p.permalink} target="_blank" rel="noopener noreferrer" aria-label="Open original post"><ExternalLink size={16}/></a>
    </div>
    <h3>{p.title}</h3>
    <div className="poststats">
      <div><b>{fmt(p.views??p.impressions)}</b><small>{p.views!=null?"Views":"Impressions"}</small></div>
      <div><b>{fmt(p.reach)}</b><small>Reach</small></div>
      <div><b>{fmt(p.interactions)}</b><small>Interactions</small></div>
      <div><b>{p.skip_3s_pct==null?"—":Number(p.skip_3s_pct).toFixed(1)+"%"}</b><small>3s skip</small></div>
    </div>
    <div className="postbottom">{fmt(p.likes)} likes · {fmt(p.comments)} comments · {fmt(p.shares)} shares · {p.saves==null?"Saves unreported":fmt(p.saves)+" saves"}{p.avg_watch_seconds!=null?" · "+Number(p.avg_watch_seconds).toFixed(2)+"s avg watch":""}</div>
  </article>;
}
function StoryCard({story,index}:{story:Story;index:number}){
  return <article className="story">
    <div className="postmeta"><span>{String(index+1).padStart(2,"0")} / {rawDate(story.published_at_raw)}</span>
      <a href={story.permalink} target="_blank" rel="noopener noreferrer" aria-label="Original story"><ExternalLink size={15}/></a></div>
    <h3>{story.descriptor}</h3>
    <div className="story-stats"><b>{fmt(story.impressions)} <span>impressions</span></b><b>{fmt(story.replies)} <span>replies</span></b><b>{fmt(story.reach)} <span>reach</span></b></div>
  </article>;
}
export default function SignalDashboard({snapshot,posts,stories,coverage,socialDaily,adsDaily,insights,experiments}:Props) {
  const [tab,setTab]=useState<Section>("overview");
  const [search,setSearch]=useState("");
  const [platform,setPlatform]=useState("all");
  const filtered=useMemo(()=>posts.filter(p=>(platform==="all"||p.platform===platform)&&p.title.toLowerCase().includes(search.toLowerCase())),[posts,platform,search]);
  const findings=insights.filter(i=>i.kind==="finding");
  const actions=insights.filter(i=>i.kind==="action");
  const caveats=insights.filter(i=>i.kind==="caveat");
  const igPosts=posts.filter(p=>p.platform==="instagram");
  const reels=igPosts.filter(p=>p.format==="Reel");
  const visibleStories=[...stories].sort((a,b)=>(b.impressions??0)-(a.impressions??0));
  const tabs = [
    {id:"overview",label:"Overview",icon:Activity},
    {id:"posts",label:"Content library",icon:Layers},
    {id:"stories",label:"Stories",icon:Eye},
    {id:"channels",label:"Coverage",icon:ShieldCheck},
    {id:"ads",label:"Paid delivery",icon:BarChart3},
    {id:"weekly",label:"Intelligence",icon:BookOpen},
    {id:"experiments",label:"Experiments",icon:Target}
  ] as const;
  function exportCsv(){
    const head=["Metricool date raw","Network","Format","Title","Link","Views","Impressions","Reach","Interactions","Likes","Comments","Shares","Saves","3s skip %","Avg watch sec"];
    const rows=posts.map(p=>[p.raw_timestamp??p.published_on,p.platform,p.format??"",p.title,p.permalink,p.views,p.impressions,p.reach,p.interactions,p.likes,p.comments,p.shares,p.saves,p.skip_3s_pct,p.avg_watch_seconds]);
    const blob=new Blob([toCsv([head,...rows])],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="SIGNAL_OPUS_Posts_2026-11-09_15.csv";a.click();URL.revokeObjectURL(url);
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brandmark">S<span>.</span></span><div><strong>SIGNAL</strong><small>CREATIVE INTELLIGENCE</small></div></div>
      <div className="client"><span className="clienticon">O</span><div><b>OPUS</b><small>Plastic Surgery</small></div></div>
      <nav>{tabs.map(x=><button key={x.id} className={tab===x.id?"selected":""} onClick={()=>setTab(x.id)}><x.icon size={17}/>{x.label}</button>)}</nav>
      <div className="sidefoot"><Eye size={15}/><span>PUBLIC SNAPSHOT · READ-ONLY</span></div>
    </aside>

    <main>
      <header>
        <div><div className="eyebrow">OPUS / SIGNAL / VERIFIED SOCIAL PERFORMANCE</div>
          <h1>{tab==="overview"?"The pulse":tab==="posts"?"Content library":tab==="stories"?"Story signals":tab==="channels"?"What's covered":tab==="ads"?"Paid delivery":tab==="weekly"?"The weekly read":"Creative experiments"}</h1>
          <p>{dateLabel(snapshot.week_start)} – {dateLabel(snapshot.week_end)}, 2026 <span className="dot">·</span> Export compiled Nov 16</p>
        </div>
        <div className="actions"><button onClick={exportCsv}><Download size={16}/> Posts CSV</button><button onClick={()=>window.print()}><FileText size={16}/> PDF</button></div>
      </header>
      <div className="notice"><span className="notice-dot"/><b>Real Metricool export, not live sync.</b> Snapshot retrieved Nov 16, 2026. Only @opusplasticsurgery brand data is included. Missing observations are never treated as zero.</div>

      {tab==="overview"&&<>
        <section className="kpis">
          <Metric label="Instagram feed views" value={fmt(snapshot.feed_views)} detail="2 Reels + 1 carousel · not unique people"/>
          <Metric label="Feed interactions" value={fmt(snapshot.feed_interactions)} detail="Likes, comments, saves and shares"/>
          <Metric label="Stories published" value={fmt(snapshot.story_count)} detail={fmt(snapshot.story_impressions)+" total impressions"}/>
          <Metric label="Story replies" value={fmt(snapshot.story_replies)} detail="Across 12 story-level records"/>
        </section>
        <div className="two">
          <section className="panel">
            <div className="sectiontop"><span>01 / THIS WEEK, IN ONE READ</span><ArrowUpRight size={17}/></div>
            <h2>Visibility rose.<br/><em>Response needs work.</em></h2>
            <p>The scar Reel led individual Instagram posts on views: 1,309. The consultation Reel drew more interactions—23 versus 17—despite having fewer views.</p>
            <div className="takeaway"><b>Interpretation</b><p>Specific surgical-detail framing is promising for early attention. Don't confuse views with stronger intent or consultations; there is no booking attribution in this export.</p></div>
          </section>
          <section className="panel">
            <div className="sectiontop"><span>02 / INSTAGRAM FEED VIEWS</span><BarChart3 size={17}/></div>
            <h3>What people actually watched</h3>
            <p className="muted">Views per published item, not unique reach</p>
            <div className="bars">{[...igPosts].sort((a,b)=>(b.views??0)-(a.views??0)).map(p=>
              <div className="barrow barrow-wide" key={p.id}><span>{p.title}</span><div className="bartrack"><div style={{width:Math.max(0,(p.views??0)/1309*100)+"%"}}/></div><b>{fmt(p.views)}</b></div>
            )}</div>
            <p className="fine">The source reports organic post-level results. Published dates retain Metricool's unconverted timestamps.</p>
          </section>
        </div>
        <div className="two">
          <section className="panel">
            <div className="sectiontop"><span>03 / EARLY RETENTION</span><TrendingDown size={17}/></div>
            <h3>3-second skip rate</h3>
            <p className="muted">Lower is better; only Reels with reported skip data</p>
            <div className="bars">{reels.map(p=><div className="barrow" key={p.id}>
              <span>{rawDate(p.raw_timestamp??"")}</span><div className="bartrack"><div style={{width:(p.skip_3s_pct??0)+"%"}}/></div><b>{p.skip_3s_pct?.toFixed(1)}%</b>
            </div>)}</div>
            <p className="fine">Not a controlled experiment. Sample size: two Reels.</p>
          </section>
          <section className="panel">
            <div className="sectiontop"><span>04 / DATA CONFIDENCE</span><ShieldCheck size={17}/></div>
            <h3>Coverage, not assumptions</h3>
            <div className="priority"><span>✓</span><div><b>Instagram feed and Stories</b><p>Complete post-level rows returned for this export window.</p></div></div>
            <div className="priority"><span>!</span><div><b>Account daily metrics</b><p>Missing for November 14–15; daily reach cannot be deduplicated into weekly reach.</p></div></div>
            <div className="priority"><span>—</span><div><b>Paid and other networks</b><p>Meta reported seven zero days; Google Ads and several social networks are incomplete.</p></div></div>
          </section>
        </div>
        <section className="panel"><div className="sectiontop"><span>05 / CONTENT THAT DROVE THE WEEK</span><button className="textbutton" onClick={()=>setTab("posts")}>Full content library <ArrowUpRight size={15}/></button></div><div className="postgrid">{igPosts.map(p=><PostCard key={p.id} p={p}/>)}</div></section>
      </>}

      {tab==="posts"&&<section className="panel">
        <div className="sectiontop"><span>EVERY VERIFIED FEED POST</span><span className="muted">3 Instagram · 2 Facebook</span></div>
        <div className="filter-row"><div className="search"><Search size={16}/><input placeholder="Find a topic" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select value={platform} onChange={e=>setPlatform(e.target.value)}><option value="all">Both networks</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></div>
        <div className="postgrid">{filtered.map(p=><PostCard key={p.id} p={p}/>)}</div>
        <p className="fine">Facebook's one carousel impression and one Reel's 17 views measure different things. Reported zero reach for the Facebook Reel is preserved exactly as returned.</p>
      </section>}

      {tab==="stories"&&<>
        <section className="kpis">
          <Metric label="Published Stories" value={fmt(stories.length)} detail="Verified story records"/>
          <Metric label="Story impressions" value={fmt(stories.reduce((n,s)=>n+(s.impressions??0),0))} detail="Repeat exposures included"/>
          <Metric label="Story replies" value={fmt(stories.reduce((n,s)=>n+(s.replies??0),0))} detail="Explicit replies, not reactions"/>
          <Metric label="Taps back" value={fmt(stories.reduce((n,s)=>n+(s.back_taps??0),0))} detail="Across 12 Story records"/>
        </section>
        <section className="panel"><div className="sectiontop"><span>ALL 12 STORIES / BY IMPRESSIONS</span><span className="muted">High to low</span></div>
          <p>Birthday content reached the highest individual Story impressions (603) and generated two replies. Total impressions cannot be interpreted as unique viewers.</p>
          <div className="story-grid">{visibleStories.map((s,i)=><StoryCard story={s} key={s.id} index={i}/>)}</div>
        </section>
      </>}

      {tab==="channels"&&<section className="panel">
        <div className="sectiontop"><span>CONNECTED BRANDS AND MISSING DATA</span><ShieldCheck size={17}/></div>
        <h2>Connected does not<br/><em>mean complete.</em></h2>
        <p>These eight rows reproduce the source workbook's coverage assessment. Blank or absent data is not proof of zero activity.</p>
        <div className="channel-grid">{coverage.map(c=><div className="channel" key={c.channel}>
          <div className="channel-header"><b>{c.channel}</b><span>{c.status}</span></div><small>{c.account}</small><strong>{c.data}</strong><p>{c.limitation}</p>
        </div>)}</div>
        <div className="takeaway"><b>Scope boundary</b><p>Dr. Frew's separate Instagram account and the OPUS results account are not linked to this Metricool brand.</p></div>
      </section>}

      {tab==="ads"&&<>
        <div className="two"><section className="panel">
          <div className="sectiontop"><span>01 / META ADS</span><BarChart3 size={17}/></div><h2>$0.00</h2><p>Seven daily observations, each reporting zero spend, impressions and clicks for November 9–15.</p>
          <p className="fine">This is the connected Metricool source's reported delivery, not an independent Meta Ads account audit.</p>
        </section>
        <section className="panel"><div className="sectiontop"><span>02 / GOOGLE ADS</span><ShieldCheck size={17}/></div><h2><em>Unknown</em></h2><p>Only November 15 returned a zero row. November 9–14 were missing, so the weekly total must not be reported as $0.</p>
          <p className="fine">Neither ad connector returned campaign/keyword-level rows for the selected week.</p>
        </section></div>
        <section className="panel"><div className="sectiontop"><span>DAILY EVIDENCE</span><span className="muted">USD · — means no observation</span></div>
          <div className="table-scroll"><table className="report-table"><thead><tr><th>Day</th><th>Meta spend</th><th>Meta impressions</th><th>Meta clicks</th><th>Google spend</th><th>Google impressions</th><th>Google clicks</th></tr></thead>
            <tbody>{adsDaily.map(d=><tr key={d.date}><td>{dateLabel(d.date)}</td><td>{dollars(d.meta_spend)}</td><td>{fmt(d.meta_impressions)}</td><td>{fmt(d.meta_clicks)}</td><td>{dollars(d.google_spend)}</td><td>{fmt(d.google_impressions)}</td><td>{fmt(d.google_clicks)}</td></tr>)}</tbody>
          </table></div>
        </section>
      </>}

      {tab==="weekly"&&<div className="two">
        <section className="panel"><div className="sectiontop"><span>01 / WHAT WE KNOW</span><BookOpen size={17}/></div><h2>The weekly read</h2>
          {findings.map(i=><div className="insight" key={i.id}><h3>{i.title}</h3><p>{i.body}</p></div>)}
          <h3>Limitations that matter</h3>{caveats.map(i=><p key={i.id}>{i.body}</p>)}
        </section>
        <section className="panel"><div className="sectiontop"><span>02 / NEXT ACTIONS</span><Target size={17}/></div>
          {actions.map((i,n)=><div className="priority" key={i.id}><span>{String(n+1).padStart(2,"0")}</span><div><b>{i.title}</b><p>{i.body}</p></div></div>)}
          <div className="takeaway"><b>Decision framework</b><p>Prioritize retention, saves/shares, and tracked qualified conversations—not views alone.</p></div>
        </section>
      </div>}

      {tab==="experiments"&&<section className="panel">
        <div className="sectiontop"><span>CREATIVE MEMORY</span><span className="muted">Proposed tests, not proven results</span></div>
        {experiments.map(e=><div className="experiment-card" key={e.id}><div className="status">{e.status}</div><h2>{e.title}</h2><p>{e.hypothesis}</p><p className="fine">{e.notes}</p></div>)}
      </section>}

      <footer>OPUS / SIGNAL <span>Source: Metricool export compiled Nov 16, 2026 · Public historical snapshot · No private CRM or patient data · Not live synced</span></footer>
    </main>
  </div>;
}
