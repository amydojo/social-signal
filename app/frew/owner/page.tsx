import Link from "next/link";
import {loadPublishedWeeksWithState} from "../../../lib/signal/read-public";
import AcquisitionView from "../../acquisition-view";
import "../frew.css";
import "../frew-executive.css";
import "./owner.css";

export const dynamic="force-dynamic";
export const metadata={title:"Acquisition & outcomes · OPUS",robots:{index:false,follow:false,nocache:true}};
const fmt=(v:number|null|undefined)=>v==null?"—":v.toLocaleString("en-US");
function validWeek(s:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const d=new Date(s+"T12:00:00Z");
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s&&d.getUTCDay()===1;
}
const date=(s:string)=>new Date(s+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
export default async function PublicOutcomes({searchParams}:{searchParams:Promise<{week?:string}>}){
 // Anonymous, public-safe report ONLY. Never read protected CRM/owner tables.
 const {weeks,state}=await loadPublishedWeeksWithState();
 const q=await searchParams;
 const selected=q.week&&validWeek(q.week)&&weeks.some(w=>w.weekStart===q.week)?q.week:(weeks[0]?.weekStart??"2026-11-16");
 const week=weeks.find(w=>w.weekStart===selected);
 const counts=week?.outcomes;
 const history=weeks.find(w=>w.acquisition)?.acquisition??null;
 const google=week?.channels.find(c=>c.platform==="Google Ads");
 const meta=week?.channels.find(c=>c.platform==="Meta Ads");
 const g=google?.metrics.find(m=>m.label==="Conversions")?.value??null;
 const m=meta?.metrics.find(m=>m.label==="Leads")?.value??null;
 const metaImpressions=meta?.metrics.find(m=>m.label==="Impressions")?.value??null;
 const measures=[
  {label:"NEW CRM INQUIRIES",value:counts?.inquiriesReceived??null},
  {label:"QUALIFIED INQUIRIES",value:counts?.qualifiedInquiries??null},
  {label:"CONSULTS REQUESTED",value:counts?.consultationsRequested??null},
  {label:"CONSULTS BOOKED",value:counts?.consultationsBooked??null}
 ];
 return <div className="executive-shell pulse-owner pulse-outcomes">
  <header className="executive-masthead">
   <div className="executive-brand"><span className="executive-logomark">O.</span><span>OPUS<span className="executive-word-divider">/</span> OUTCOMES</span></div>
   <nav className="pulse-public-nav" aria-label="Reports"><Link className="pulse-owner-back" href="/frew">Weekly Pulse</Link><Link className="pulse-owner-back" href="/">SIGNAL</Link></nav>
  </header>
  <main className="executive-main">
   <div className="pulse-owner-head">
    <span className="pulse-decision-kicker">PUBLIC REPORT · READ ONLY</span>
    <h1>Is marketing bringing people into the practice?</h1>
    <p>Track verified inquiries and consultations alongside Google and Meta activity. No login required, and no private contact records are exposed.</p>
   </div>
   <div className="pulse-owner-form-head pulse-public-week-heading">
    <h2>Weekly outcomes</h2>
    <nav className="pulse-owner-week-picker" aria-label="Reporting week">
     {weeks.length?weeks.map(w=><Link key={w.weekStart} href={"/frew/owner?week="+encodeURIComponent(w.weekStart)}
       aria-current={selected===w.weekStart?"page":undefined} className={selected===w.weekStart?"is-selected":""}>
        {date(w.weekStart)}{w.status==="in_progress"?" · WTD":""}
       </Link>):<span>Week of {date(selected)}</span>}
    </nav>
   </div>
   <section className="pulse-owner-summary" aria-label="Published weekly CRM outcomes">
    {measures.map(x=><div key={x.label}><span>{x.label}</span><strong>{fmt(x.value)}</strong><small>{counts?"Reviewed Aesthetix aggregate":"Not yet verified"}</small></div>)}
   </section>
   <p className="pulse-owner-caveat">{counts?
    "Verified "+date(counts.verifiedAt)+" · Aesthetix aggregate. These four measurements do not automatically form a contact-matched conversion funnel.":
    "No confirmed CRM outcome totals have been published for this week. A dash means unknown, not zero. Historical lead stages are not confirmed appointments."}</p>
   <section className="pulse-public-paid" aria-label="Paid acquisition activity">
    <div className="pulse-public-paid-head"><span className="pulse-decision-kicker">AD PLATFORM REPORTING</span>
     <h2>What the ads reported</h2><p>Platform events are different from inquiries and bookings. Date coverage can vary.</p></div>
    <div className="pulse-public-paid-grid">
     <div className="pulse-public-paid-tile"><span>GOOGLE ADS</span><strong>{fmt(g)}</strong><p>Conversion actions · {google?.period??"Period not verified"}</p></div>
     <div className="pulse-public-paid-tile"><span>META ADS</span><strong>{fmt(m)}</strong><p>Native form leads · {meta?.period??"Period not verified"}</p>
      {m==null&&metaImpressions===0&&<small>0 observed impressions; submitted-lead count not verified.</small>}</div>
    </div>
   </section>
   <section className="pulse-public-history" aria-label="Dated historical acquisition baseline">
    <AcquisitionView snapshot={history}/>
   </section>
   <footer className="pulse-owner-foot">
    <span>{week?"Week of "+date(week.weekStart)+(week.status==="in_progress"?" · in progress":" · complete"):"No current published snapshot"}</span>
    <span>Reporting feed: {state==="live"?"available":state} · Aggregate data only</span>
   </footer>
  </main>
 </div>;
}
