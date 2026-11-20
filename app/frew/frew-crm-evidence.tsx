import type {CRMClinicalSnapshot,CRMConsultWeek} from "../../lib/signal/read-crm-evidence";

const n=(v:number)=>v.toLocaleString("en-US");
const day=(date:string)=>new Date(date+"T12:00:00Z").toLocaleDateString("en-US",{
  month:"short",day:"numeric",timeZone:"UTC"});
const weekEnd=(date:string)=>new Date(Date.parse(date+"T12:00:00Z")+6*86400000)
  .toISOString().slice(0,10);

export default function FrewCRMClinicalEvidence({snapshot,weeks}:{
  snapshot:CRMClinicalSnapshot;weeks:CRMConsultWeek[];
}){
  const largest=Math.max(1,...weeks.map(w=>w.scheduled));
  const sourceDate=new Date(snapshot.snapshotDate+"T12:00:00Z");
  const currentWeek=new Date(sourceDate.getTime()-((sourceDate.getUTCDay()+6)%7)*86400000)
    .toISOString().slice(0,10);
  return <section className="crm-clinical" aria-labelledby="crm-clinical-title">
    <div className="crm-clinical-titlebar">
      <div>
        <span className="crm-clinical-eyebrow">APPOINTMENT & ACQUISITION EVIDENCE</span>
        <h2 id="crm-clinical-title">The next consultations, in context</h2>
      </div>
      <span className="crm-clinical-asof">AESTHETIX EXPORT · {day(snapshot.snapshotDate).toUpperCase()}, 2026</span>
    </div>
    <div className="crm-clinical-columns">
      <article className="crm-clinical-panel">
        <div className="crm-clinical-panel-top">
          <span>01 / SCHEDULED NEW-PATIENT CONSULTATIONS</span>
          <span>APPOINTMENT DATES</span>
        </div>
        <div className="crm-clinical-headline">
          <strong>{n(snapshot.upcomingConsults)}</strong>
          <p>Upcoming in the November 20 export, across three appointment weeks.</p>
        </div>
        <div className="crm-clinical-statusline">
          <span><i className="crm-clinical-dot confirmed" aria-hidden="true"/>{n(snapshot.upcomingConfirmed)} marked confirmed</span>
          <span><i className="crm-clinical-dot unconfirmed" aria-hidden="true"/>{n(snapshot.upcomingUnconfirmed)} marked unconfirmed</span>
        </div>
        <div className="crm-clinical-weeks" role="group" aria-label="Scheduled consultation dates and latest confirmation statuses">
          {weeks.map(w=><div key={w.weekStart} className="crm-clinical-week">
            <div className="crm-clinical-week-header">
              <span>{day(w.weekStart)}–{day(weekEnd(w.weekStart))}</span>
              <strong>{n(w.scheduled)}</strong>
            </div>
            <div className="crm-clinical-track" role="img" aria-label={w.scheduled+" consultations; "+w.confirmed+" marked confirmed; "+w.unconfirmed+" marked unconfirmed"}>
              {w.confirmed>0&&<span className="confirmed" style={{width:(100*w.confirmed/largest)+"%"}}/>}
              {w.unconfirmed>0&&<span className="unconfirmed" style={{width:(100*w.unconfirmed/largest)+"%"}}/>}
            </div>
          </div>)}
        </div>
        <p className="crm-clinical-small">
          {n(snapshot.upcomingWebsiteRoute)} of {n(snapshot.upcomingConsults)} came through Website First Access.
          Confirmation labels come from latest appointment notes, not verified patient attendance.
          These are appointment dates, not dates when bookings were made.
        </p>
      </article>
      <article className="crm-clinical-panel">
        <div className="crm-clinical-panel-top">
          <span>02 / GOOGLE SEARCH · CONTACT MATCHING</span>
          <span>CAMPAIGN V02</span>
        </div>
        <div className="crm-clinical-headline">
          <strong>{n(snapshot.googleMatchedContacts)}</strong>
          <p>CRM contacts with Google click ID, Google UTM source and matching OPUS Search campaign.</p>
        </div>
        <div className="crm-clinical-google-grid">
          <div><strong>{n(snapshot.googleMatchedWeekContacts)}</strong><span>Created week of {day(currentWeek)}</span></div>
          <div><strong>{n(snapshot.googleMatchedLeadStage)}</strong><span>Currently labeled Lead</span></div>
          <div><strong>{n(snapshot.googleMatchedRepliedStage)}</strong><span>Currently labeled Replied</span></div>
          <div><strong>{n(snapshot.googleMatchedDatedConsults)}</strong><span>Dated new-patient consultations</span></div>
        </div>
        <p className="crm-clinical-small">
          {n(snapshot.paidSearchFirstSession)} contacts have the broader “Paid Search” first-session label; {n(snapshot.googleMatchedContacts)} meet the stronger multi-field match.
          CRM matched contacts are not Google Ads conversion actions or proof of booked consultations.
        </p>
      </article>
    </div>
    <div className="crm-clinical-reconciliation">
      <div className="crm-clinical-reconciliation-title">
        <span>03 / STAGE RECONCILIATION</span>
        <p>CRM pipeline stage compared with independently recorded date fields.</p>
      </div>
      <div className="crm-clinical-recon-grid">
        <div>
          <span>CONSULT BOOKED STAGE</span>
          <div className="crm-clinical-recon-numbers"><strong>{n(snapshot.consultBookedStage)}</strong><span>{n(snapshot.consultBookedDated)} with a dated new-patient consultation</span></div>
          <p>{n(snapshot.consultBookedWithoutDated)} booked-stage records lack a matching dated new-patient appointment in this export.</p>
        </div>
        <div>
          <span>CONSULT COMPLETE STAGE</span>
          <div className="crm-clinical-recon-numbers"><strong>{n(snapshot.consultCompleteStage)}</strong><span>{n(snapshot.consultCompleteLastVisit)} have a Last Visit Date</span></div>
          <p>A dated last visit supports a visit occurring; it does not independently verify the consultation type.</p>
        </div>
        <div>
          <span>SURGERY SCHEDULED STAGE</span>
          <div className="crm-clinical-recon-numbers"><strong>{n(snapshot.surgeryScheduledStage)}</strong><span>{n(snapshot.surgeryScheduledDated)} have a dated surgery appointment</span></div>
          <p>These are currently scheduled pipeline stages, not surgeries performed.</p>
        </div>
      </div>
      <p className="crm-clinical-foot">
        Across {n(snapshot.appointmentFieldRecords)} dated appointment records, {n(snapshot.appointmentDateDisagreements)} have a date disagreement between fields; none are among the dated new-patient consultations.
        Current-stage snapshots cannot reconstruct when bookings, completions or cancellations actually happened.
        No individual patient details appear here.
      </p>
    </div>
  </section>;
}
