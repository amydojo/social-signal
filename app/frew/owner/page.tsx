import Link from "next/link";
import {loadPublishedWeeksWithState} from "../../../lib/signal/read-public";
import OwnerPreview from "./owner-preview";
import "../frew.css";
import "../frew-executive.css";
import "./owner.css";

export const dynamic="force-dynamic";
export const metadata={
  title:"Outcomes preview · OPUS SIGNAL",
  description:"Public, read-only testing preview of OPUS marketing outcomes. No private CRM data.",
  robots:{index:false,follow:false,nocache:true}
};

function mondayWeek(v:string):boolean{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
  const date=new Date(v+"T12:00:00Z");
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===v&&date.getUTCDay()===1;
}
function periodMetric(
  channels:{platform:string;period:string;metrics:{label:string;value:number|null}[]}[],
  platform:string,label:string
):{value:number|null;period:string|null}{
  const ch=channels.find(c=>c.platform===platform);
  return {value:ch?.metrics.find(m=>m.label===label)?.value??null,period:ch?.period??null};
}
function weekLabel(date:string){
  return new Date(date+"T12:00:00Z").toLocaleDateString("en-US",{
    month:"short",day:"numeric",year:"numeric",timeZone:"UTC"
  });
}

/**
 * PUBLIC PREVIEW ONLY. Do not fetch signal_owner_outcomes or private CRM.
 * Privileged edits remain in the separately owner-gated server action,
 * which is never imported by this page or the preview component.
 */
export default async function OwnerPreviewPage({searchParams}:{
  searchParams:Promise<{week?:string}>
}){
  const {weeks,state}=await loadPublishedWeeksWithState();
  const query=await searchParams;
  const selected=query.week&&mondayWeek(query.week)&&weeks.some(w=>w.weekStart===query.week)
    ?query.week:(weeks[0]?.weekStart??"2026-11-16");
  const published=weeks.find(w=>w.weekStart===selected);
  const channels=published?.channels??[];
  const google=periodMetric(channels,"Google Ads","Conversions");
  const meta=periodMetric(channels,"Meta Ads","Leads");
  const metaImpressions=periodMetric(channels,"Meta Ads","Impressions").value;

  return <div className="executive-shell pulse-owner">
    <header className="executive-masthead">
      <div className="executive-brand">
        <span className="executive-logomark">O.</span>
        <span>OPUS<span className="executive-word-divider">/</span> OUTCOMES PREVIEW</span>
      </div>
      <Link href="/frew" className="pulse-owner-back">← Weekly Pulse</Link>
    </header>
    <main className="executive-main">
      <section className="pulse-owner-head">
        <span className="pulse-decision-kicker">OPEN PREVIEW · NO SIGN-IN REQUIRED</span>
        <h1>Are inquiries becoming consultations?</h1>
        <p>Test the executive outcomes layout without connecting or publishing private Aesthetix records. Google and Meta figures below come from the approved public weekly report. CRM numbers are yours to simulate locally.</p>
      </section>
      <div className="pulse-owner-form-head pulse-preview-selector">
        <h2>Reporting week</h2>
        <nav className="pulse-owner-week-picker" aria-label="Select reporting week">
          {weeks.length?weeks.map(w=><Link
            href={"/frew/owner?week="+encodeURIComponent(w.weekStart)}
            aria-current={selected===w.weekStart?"page":undefined}
            className={selected===w.weekStart?"is-selected":""}
            key={w.weekStart}>{weekLabel(w.weekStart)}</Link>)
            :<span>Nov 16, 2026</span>}
        </nav>
      </div>
      <OwnerPreview key={selected}
        week={selected}
        google={google}
        meta={meta}
        metaImpressions={metaImpressions}
      />
      <footer className="pulse-owner-foot">
        <span>Data status: {state==="live"?"verified public reporting":state}</span>
        <span>Preview values are not stored, sent or published.</span>
      </footer>
    </main>
  </div>;
}
