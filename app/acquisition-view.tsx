import type {PublicAcquisition,AttributionEvidence} from "../lib/signal/acquisition";
import "./acquisition.css";
import AcquisitionAnalysis from "./acquisition-analysis";

const label:Record<AttributionEvidence,string>={
  campaign_tag:"Campaign-tagged contact",
  google_click_id:"Google click ID",
  tracked_link:"Tracked link attribution",
  first_session:"First-session channel"
};
const fmt=(n:number)=>n.toLocaleString("en-US");
function date(d:string){return new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"});}
export default function AcquisitionView({snapshot}:{snapshot:PublicAcquisition|null}){
  return <section className="acq-surface" aria-labelledby="acq-heading">
    <header className="acq-head">
      <div><span className="acq-kicker">CRM EVIDENCE / ACQUISITION &amp; OUTCOMES</span>
        <h2 id="acq-heading">Where interest came from—and what happened next</h2>
      </div>
      <span className="acq-dateline">{snapshot?"AS OF "+date(snapshot.asOf):"AWAITING VERIFIED IMPORT"}</span>
    </header>
    {!snapshot?<p className="acq-missing">No reviewed, aggregate CRM acquisition snapshot has been published. This is not a claim that no inquiries occurred.</p>:<>
      <p className="acq-context"><strong>Historical contact cohort, not this week's new inquiries.</strong>
        {" "}Source categories can overlap across contacts. Counts below are different attribution-evidence sets—not a single funnel or total.</p>
      <div className="acq-cards">
        {snapshot.routes.map(r=><article key={r.route} className="acq-card">
          <div className="acq-route">{r.route}</div>
          <div className="acq-quantity"><strong>{fmt(r.contacts)}</strong><span>tracked contacts</span></div>
          <p className="acq-evidence">{label[r.evidence]}</p>
          {r.stages?.length?<div className="acq-stages">
            {r.stages.map(s=><span key={s.stage}>{s.stage}: <strong>{fmt(s.contacts)}</strong></span>)}
          </div>:<div className="acq-unconfirmed">No verified stage progression in this snapshot</div>}
        </article>)}
      </div>
      {!!snapshot.websiteFirstTouch.length&&<div className="acq-split">
        <div>
          <h3>Website First Access · first recorded session</h3>
          <p>These channels classify the website cohort only. They aren't additional contacts.</p>
        </div>
        <div className="acq-channels">
          {snapshot.websiteFirstTouch.map(c=><div key={c.channel}><span>{c.channel}</span><strong>{fmt(c.contacts)}</strong></div>)}
        </div>
      </div>}
      {snapshot.analysis&&<AcquisitionAnalysis analysis={snapshot.analysis}/>}
      <div className="acq-findings">
        <div><span>WHAT THE EVIDENCE SUGGESTS</span><p>{snapshot.finding}</p></div>
        <div><span>NEXT INVESTIGATION</span><p>{snapshot.decision}</p></div>
      </div>
      <p className="acq-caveat">{snapshot.source} · Contacts, open opportunities, ad-reported events and appointments are different units.
        A CRM stage does not independently verify an actual booked or attended appointment.
        Comparisons of source quality require comparable cohort age, eligibility and verified follow-up.</p>
    </>}
  </section>;
}
