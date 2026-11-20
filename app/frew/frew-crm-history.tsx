"use client";

import {useState} from "react";
import type {CRMWeek} from "../../lib/signal/read-crm-weekly";

type View="intake"|"first";
const intake=[
  {key:"website",label:"Website First Access"},
  {key:"meta",label:"Meta instant form"},
  {key:"instagram",label:"Instagram DM"},
  {key:"direct4d",label:"4D scheduling"},
  {key:"other",label:"Other / unknown intake"}
] as const;
const first=[
  {key:"paidSocial",label:"Paid social"},
  {key:"paidSearch",label:"Paid search"},
  {key:"organicSearch",label:"Organic search"},
  {key:"socialMedia",label:"Social media"},
  {key:"directTraffic",label:"Direct traffic"},
  {key:"referral",label:"Referral"},
  {key:"unattributed",label:"Not recorded"}
] as const;
const fmt=(n:number)=>n.toLocaleString("en-US");
const period=(date:string)=>new Date(date+"T12:00:00Z").toLocaleDateString(
  "en-US",{month:"short",day:"numeric",timeZone:"UTC"});
export default function FrewCRMHistory({weeks,state}:{weeks:CRMWeek[];state:"live"|"unavailable"|"empty"|"partial"}){
  const [view,setView]=useState<View>("intake");
  const [showAll,setShowAll]=useState(false);
  if(!weeks.length)return <section className="crm-history" aria-label="Historical CRM contact intake">
    <span className="crm-history-kicker">CRM / HISTORICAL INTAKE</span>
    <h2>Contact history</h2>
    <p className="crm-history-warning">{state==="unavailable"?"Historical CRM records are temporarily unavailable.": "No verified weekly contact history has been published."}</p>
  </section>;
  const all=weeks.reduce((sum,w)=>sum+w.total,0);
  const backdated=weeks.reduce((sum,w)=>sum+w.backdatedImports,0);
  const attributed=weeks.reduce((sum,w)=>sum+w.total-w.unattributed,0);
  const last=weeks[weeks.length-1];
  const shown=showAll?weeks:weeks.slice(-8);
  const peak=Math.max(1,...shown.map(w=>w.total));
  const categories=view==="intake"?intake:first;
  const description=view==="intake"
    ?"This is the source where a CRM contact entered. 4D Direct is scheduling or administrative intake—not proof of direct website traffic."
    :`First-session channel is recorded for ${fmt(attributed)} of ${fmt(all)} contacts. Unrecorded attribution is not assumed to be organic or direct.`;
  return <section className="crm-history" aria-label="Historical CRM contact intake by week">
    <div className="crm-history-head">
      <div>
        <span className="crm-history-kicker">HISTORICAL CRM INTAKE</span>
        <h2>When contacts entered the pipeline</h2>
        <p>Event-dated weekly contact records · {fmt(all)} total · {fmt(backdated)} original lead dates restored from imports</p>
      </div>
      <div className="crm-history-total" aria-label={fmt(all)+" recorded contacts"}>
        <strong>{fmt(all)}</strong>
        <span>CONTACT RECORDS</span>
      </div>
    </div>
    <div className="crm-history-controls">
      <div className="crm-history-tabs" role="group" aria-label="Breakdown type">
        <button type="button" className={view==="intake"?"is-active":""} aria-pressed={view==="intake"} onClick={()=>setView("intake")}>Intake route</button>
        <button type="button" className={view==="first"?"is-active":""} aria-pressed={view==="first"} onClick={()=>setView("first")}>First-session attribution</button>
      </div>
      <button type="button" className="crm-history-expand" aria-expanded={showAll} onClick={()=>setShowAll(!showAll)}>
        {showAll?"Last 8 weeks":"View all "+weeks.length+" weeks"}
      </button>
    </div>
    <p className="crm-history-description">{description}</p>
    <div className="crm-history-legend" aria-label="Category legend">
      {categories.map(c=><span key={c.key}><i className={"crm-segment-"+c.key}/>{c.label}</span>)}
    </div>
    <div className="crm-history-bars" role="group" aria-label={"Weekly contact totals by "+(view==="intake"?"CRM intake route":"first-session attribution")}}>
      {shown.map(w=><div className="crm-history-row" key={w.weekStart}>
        <div className="crm-history-period">
          <span>{period(w.weekStart)}</span>
          {w.weekStart===last.weekStart&&w.dataThrough<new Date(Date.parse(w.weekStart+"T12:00:00Z")+6*86400000).toISOString().slice(0,10)?<small>THROUGH {period(w.dataThrough).toUpperCase()}</small>:null}
        </div>
        <div className="crm-history-track" role="img"
          aria-label={period(w.weekStart)+": "+w.total+" contact records; "+categories.map(c=>c.label+" "+w[c.key]).join(", ")}>
          {categories.map(c=>w[c.key]>0?
            <span key={c.key} className={"crm-segment crm-segment-"+c.key}
              style={{width:(100*w[c.key]/peak)+"%"}}
              title={c.label+": "+w[c.key]}/>:null)}
        </div>
        <strong className="crm-history-count">{fmt(w.total)}</strong>
      </div>)}
    </div>
    <p className="crm-history-foot">
      Aesthetix contact export · snapshot {period(last.snapshotDate)} · weeks Monday–Sunday, Pacific time.
      Contact records include existing patients and 4D scheduling entries; they are not confirmed new patients, bookings, or ad conversions.
      No consultation booking-date history was present in the exports.
      {state==="partial"?" Some invalid weekly records were excluded.":""}
    </p>
  </section>;
}
