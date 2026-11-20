"use client";

import {useEffect,useRef,useState} from "react";
import {ChevronDown,ChevronLeft,ChevronRight} from "lucide-react";
import type {LeadershipChannel,LeadershipMetric} from "./frew-data";

type Account={platform:string;account:string};
type View="list"|"compare";

const formatNumber=(n:number|null,unit?:string)=>{
  if(n==null)return "—";
  if(unit==="USD")return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2,minimumFractionDigits:2}).format(n);
  const value=new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n);
  return unit==="%"?value+"%":unit?value+" "+unit:value;
};
const keyOf=(c:Account)=>c.platform+"|"+c.account;

function highlights(c:LeadershipChannel):LeadershipMetric[]{
  // Do not compare unlike platforms under a single artificial "views" KPI.
  const preferred=c.platform==="Instagram"?["Feed views","Feed interactions","Reach","Engaged","Followers","Story views"]:
    c.platform==="Facebook"?["Page media views","Reel views","Posts","Followers"]:
    c.platform==="TikTok"?["Video views","Interactions","Followers","Account likes","Profile views"]:
    c.platform==="Google Business Profile"?["Directions","Call clicks","Maps views","Search views","Website clicks","Calls","Profile views"]:
    c.platform==="Google Ads"?["Conversions","Cost / conversion","Spend","Clicks"]:
    c.platform==="Meta Ads"?["Spend","Impressions","Clicks"]:
    c.platform==="YouTube"?["Views","Subscribers","Watch time"]:
    c.metrics.map(m=>m.label);
  const ordered=preferred.map(label=>c.metrics.find(metric=>metric.label===label))
    .filter((m):m is LeadershipMetric=>Boolean(m));
  const available=ordered.filter(m=>m.value!=null);
  if(available.length>=2)return available.slice(0,2);
  const rest=ordered.filter(m=>!available.includes(m));
  return [...available,...rest].slice(0,2);
}

function FullMetrics({c}:{c:LeadershipChannel}){
  return <>
    <div className="pulse-account-metrics">
      {c.metrics.length?c.metrics.map(m=><div className="pulse-account-metric" key={m.label}>
        <strong className={m.value==null?"pulse-missing":""}>{formatNumber(m.value,m.unit)}</strong>
        <span>{m.label}</span>
      </div>):<p className="pulse-no-data">No numbers available for these dates.</p>}
    </div>
    {c.note&&<p className="pulse-account-note">{c.note}</p>}
  </>;
}

export default function FrewAccounts({
  channels,otherAccounts,period
}:{
  channels:LeadershipChannel[];
  otherAccounts:Account[];
  period:string;
}){
  const [view,setView]=useState<View>("list");
  const [expanded,setExpanded]=useState<string[]>([]);
  const compareRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{setExpanded([]);},[period]);
  useEffect(()=>{compareRef.current?.scrollTo({left:0,behavior:"auto"});},[period,view]);
  const allOpen=channels.length>0&&channels.every(c=>expanded.includes(keyOf(c)));
  const toggle=(key:string)=>setExpanded(prev=>prev.includes(key)?prev.filter(v=>v!==key):[...prev,key]);
  const scrollCompare=(direction:-1|1)=>{
    const node=compareRef.current;
    if(!node)return;
    const card=node.querySelector<HTMLElement>(".pulse-compare-card");
    node.scrollBy({left:direction*((card?.getBoundingClientRect().width??node.clientWidth)+11),behavior:"smooth"});
  };

  return <section className="executive-platform-section pulse-accounts-section">
    <div className="executive-section-heading pulse-accounts-heading">
      <h2>Results by account</h2>
      <div className="pulse-view-switch" role="group" aria-label="Account display">
        <button type="button" aria-pressed={view==="list"}
          onClick={()=>setView("list")}>List</button>
        <button type="button" aria-pressed={view==="compare"}
          onClick={()=>setView("compare")}>Compare</button>
      </div>
    </div>

    {view==="list"?<>
      <div className="pulse-account-tools">
        <span>{channels.length} accounts</span>
        <button type="button" onClick={()=>setExpanded(allOpen?[]:channels.map(keyOf))}>
          {allOpen?"Collapse all":"Expand all"}
        </button>
      </div>
      <div className="pulse-account-list">
        {channels.map((c,i)=>{
          const key=keyOf(c);
          const isOpen=expanded.includes(key);
          const top=highlights(c);
          return <article className={"pulse-account-row"+(isOpen?" is-open":"")} key={key}>
            <button className="pulse-account-trigger" type="button"
              aria-expanded={isOpen} aria-controls={"pulse-account-panel-"+i}
              onClick={()=>toggle(key)}>
              <span className="pulse-account-identity">
                <strong>{c.platform}</strong>
                <span>{c.account}</span>
                <small>{c.period}</small>
              </span>
              <span className="pulse-account-preview">
                {top.length?top.map(m=><span className="pulse-preview-item" key={m.label}>
                  <b className={m.value==null?"pulse-missing":""}>{formatNumber(m.value,m.unit)}</b>
                  <small>{m.label}</small>
                </span>):<span className="pulse-preview-unavailable">Not reported</span>}
              </span>
              <ChevronDown size={17} strokeWidth={1.8} className="pulse-account-chevron" aria-hidden="true"/>
            </button>
            <div className="pulse-account-detail" id={"pulse-account-panel-"+i} hidden={!isOpen}>
              <FullMetrics c={c}/>
            </div>
          </article>;
        })}
      </div>
    </>:<>
      <div className="pulse-compare-head">
        <p className="pulse-compare-hint">Each platform measures things differently. Swipe to see more.</p>
        <div className="pulse-compare-controls" aria-label="Browse comparison cards">
          <button type="button" aria-label="Previous account" onClick={()=>scrollCompare(-1)}><ChevronLeft size={17}/></button>
          <button type="button" aria-label="Next account" onClick={()=>scrollCompare(1)}><ChevronRight size={17}/></button>
        </div>
      </div>
      <div ref={compareRef} className="pulse-compare-scroll" tabIndex={0} role="region" aria-label="Account comparison cards">
        {channels.map(c=><article key={keyOf(c)} className="pulse-compare-card">
          <div className="pulse-compare-card-heading">
            <strong>{c.platform}</strong>
            <span>{c.account}</span>
            <small>{c.period}</small>
          </div>
          <FullMetrics c={c}/>
        </article>)}
      </div>
    </>}

    {otherAccounts.length>0&&<details className="pulse-extra-accounts">
      <summary>Other accounts <span>{otherAccounts.length} not connected</span><ChevronDown size={15} aria-hidden="true"/></summary>
      <div className="pulse-extra-list">
        {otherAccounts.map(c=><span key={keyOf(c)}><small>{c.platform}</small><strong>{c.account}</strong></span>)}
      </div>
    </details>}
  </section>;
}
