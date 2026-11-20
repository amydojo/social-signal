import {notFound,redirect} from "next/navigation";
import Link from "next/link";
import {createSignalServerClient} from "../../../lib/supabase/server";
import {loadPublishedWeeksWithState} from "../../../lib/signal/read-public";
import {saveOwnerCounts} from "./actions";
import "../frew.css";
import "../frew-executive.css";
import "./owner.css";

export const dynamic="force-dynamic";
export const metadata={title:"Owner reconciliation · OPUS",robots:{index:false,follow:false,nocache:true}};

type Outcome={
  week_start:string;inquiries_received:number|null;qualified_inquiries:number|null;
  consultations_requested:number|null;consultations_booked:number|null;
  checked_at:string;
};
const fields=[
  {key:"inquiries_received",label:"Inquiries received",detail:"All inbound sources · confirmed in CRM"},
  {key:"qualified_inquiries",label:"Qualified inquiries",detail:"Meets the practice's criteria"},
  {key:"consultations_requested",label:"Consultations requested",detail:"An explicit patient request, not a form event"},
  {key:"consultations_booked",label:"Consultations booked",detail:"Confirmed appointment on the schedule"}
] as const;
function weekValid(v:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
  const d=new Date(v+"T12:00:00Z");
  return d.getUTCDay()===1&&d.toISOString().slice(0,10)===v;
}
export default async function OwnerPage({searchParams}:{
  searchParams:Promise<{week?:string;saved?:string}>
}){
  const supabase=await createSignalServerClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)redirect("/frew/owner/login");
  const {data:membership,error:memberError}=await supabase.from("signal_members")
    .select("role").eq("user_id",user.id).maybeSingle();
  if(memberError||membership?.role!=="owner")notFound();

  const {weeks,state}=await loadPublishedWeeksWithState();
  const query=await searchParams;
  const selected=query.week&&weekValid(query.week)?query.week:(weeks[0]?.weekStart??"2026-11-16");
  const published=weeks.find(w=>w.weekStart===selected);
  const {data:record,error}=await supabase.from("signal_owner_outcomes")
    .select("week_start,inquiries_received,qualified_inquiries,consultations_requested,consultations_booked,checked_at")
    .eq("week_start",selected).maybeSingle();
  const outcome=record as Outcome|null;
  const ads=published?.channels.find(c=>c.platform==="Google Ads");
  const actions=ads?.metrics.find(m=>m.label==="Conversions")?.value??null;

  return <div className="executive-shell pulse-owner">
    <header className="executive-masthead">
      <div className="executive-brand"><span className="executive-logomark">O.</span><span>OPUS<span className="executive-word-divider">/</span> OWNER REVIEW</span></div>
      <Link href="/frew" className="pulse-owner-back">← Weekly Pulse</Link>
    </header>
    <main className="executive-main">
      <div className="pulse-owner-head">
        <span className="pulse-decision-kicker">PRIVATE / AUTHORIZED OWNER ONLY</span>
        <h1>Consultation reconciliation</h1>
        <p>Marketing actions only matter when they become genuine conversations and scheduled consultations. Enter verified, aggregate counts from Aesthetix. No patient identifiers are stored here.</p>
      </div>
      <div className="pulse-owner-summary">
        <div><span>GOOGLE ADS ACTIONS</span><strong>{actions===null?"—":actions.toLocaleString("en-US")}</strong><small>{ads?.period??"No matching published ad record"}</small></div>
        <div><span>BOOKED CONSULTATIONS</span><strong>{outcome?.consultations_booked==null?"—":outcome.consultations_booked.toLocaleString("en-US")}</strong><small>{outcome?"Manually verified CRM count":"Not verified"}</small></div>
      </div>
      <p className="pulse-owner-caveat">These figures may cover different source populations or attribution windows. Do not divide ad actions by bookings to calculate a lead-to-booking rate unless individual inquiries and windows have been reconciled.</p>
      <form action={saveOwnerCounts} className="pulse-owner-form">
        <div className="pulse-owner-form-head">
          <h2>Reconcile a reporting week</h2>
          <label>Reporting week
            <select name="week_start" defaultValue={selected} key={selected}>
              {[selected,...weeks.map(w=>w.weekStart).filter(w=>w!==selected)].map(w=><option value={w} key={w}>{w}</option>)}
            </select>
          </label>
        </div>
        {query.saved==="1"&&<p role="status" className="pulse-owner-success">Saved to the owner-only reporting table.</p>}
        {record===null&&error&&<p role="alert" className="pulse-owner-error">Unable to load saved counts. Do not enter values until the private table is available.</p>}
        <div className="pulse-owner-fields">
          {fields.map(f=><label key={f.key}>
            <strong>{f.label}</strong>
            <small>{f.detail}</small>
            <input disabled={Boolean(error)} name={f.key} type="number" min="0" max="1000000" step="1" inputMode="numeric" defaultValue={outcome?.[f.key]??""} placeholder="Not verified"/>
          </label>)}
        </div>
        <div className="pulse-owner-form-footer">
          <p>Blank means unknown, not zero. Verify counts in Aesthetix first. This form is not connected to CRM or the public report.</p>
          <button disabled={Boolean(error)} type="submit">Save verified counts</button>
        </div>
      </form>
      <footer className="pulse-owner-foot">
        <span>{outcome?"Last checked "+new Date(outcome.checked_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Los_Angeles"}):"No CRM reconciliation saved for this week"}</span>
        <span>Public reporting: {state==="live"?"available":state}</span>
      </footer>
    </main>
  </div>;
}
