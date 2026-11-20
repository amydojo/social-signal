import {notFound,redirect} from "next/navigation";
import Link from "next/link";
import {createSignalServerClient} from "../../../lib/supabase/server";
import {loadPublishedWeeksWithState} from "../../../lib/signal/read-public";
import {saveOwnerCounts} from "./actions";
import "../frew.css";
import "../frew-executive.css";
import "./owner.css";

export const dynamic="force-dynamic";
export const metadata={title:"Consultation numbers · OPUS",robots:{index:false,follow:false,nocache:true}};

type Outcome={
  week_start:string;inquiries_received:number|null;qualified_inquiries:number|null;
  consultations_requested:number|null;consultations_booked:number|null;
  checked_at:string;
};
const fields=[
  {key:"inquiries_received",label:"New inquiries",detail:"Count confirmed in Aesthetix"},
  {key:"qualified_inquiries",label:"Qualified inquiries",detail:"Of the new inquiries, how many were a fit?"},
  {key:"consultations_requested",label:"Consults requested",detail:"People who actually asked for an appointment"},
  {key:"consultations_booked",label:"Consults booked",detail:"Appointments confirmed on the calendar"}
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
      <div className="executive-brand"><span className="executive-logomark">O.</span><span>OPUS<span className="executive-word-divider">/</span> PRIVATE NUMBERS</span></div>
      <Link href="/frew" className="pulse-owner-back">← Weekly Pulse</Link>
    </header>
    <main className="executive-main">
      <div className="pulse-owner-head">
        <span className="pulse-decision-kicker">OWNER ONLY</span>
        <h1>How many people actually booked?</h1>
        <p>Google Ads tells us when someone converts. Aesthetix tells us whether anyone actually requested or booked a consultation. Add those weekly totals here—no patient names or details.</p>
      </div>
      <div className="pulse-owner-summary">
        <div><span>GOOGLE ADS CONVERSIONS</span><strong>{actions===null?"—":actions.toLocaleString("en-US")}</strong><small>{ads?.period??"No matching published ad record"}</small></div>
        <div><span>CONSULTS BOOKED</span><strong>{outcome?.consultations_booked==null?"—":outcome.consultations_booked.toLocaleString("en-US")}</strong><small>{outcome?"Checked in Aesthetix":"Not checked yet"}</small></div>
      </div>
      <p className="pulse-owner-caveat">These two numbers may cover different people or dates. Don't treat them as a conversion rate until the records match.</p>
      <div className="pulse-owner-form-head">
        <h2>Update this week</h2>
        <nav className="pulse-owner-week-picker" aria-label="Select a reporting week">
          {weeks.length?weeks.map(w=><Link href={"/frew/owner?week="+encodeURIComponent(w.weekStart)}
            aria-current={selected===w.weekStart?"page":undefined}
            className={selected===w.weekStart?"is-selected":""} key={w.weekStart}>{w.weekStart}</Link>):<span>{selected}</span>}
        </nav>
      </div>
      <form action={saveOwnerCounts} className="pulse-owner-form">
        <input type="hidden" name="week_start" value={selected}/>
        {query.saved==="1"&&<p role="status" className="pulse-owner-success">Saved.</p>}
        {record===null&&error&&<p role="alert" className="pulse-owner-error">Couldn’t load the saved numbers. Please don’t enter new ones yet.</p>}
        <div className="pulse-owner-fields">
          {fields.map(f=><label key={f.key}>
            <strong>{f.label}</strong>
            <small>{f.detail}</small>
            <input disabled={Boolean(error)} name={f.key} type="number" min="0" max="1000000" step="1" inputMode="numeric" defaultValue={outcome?.[f.key]??""} placeholder="Not checked"/>
          </label>)}
        </div>
        <div className="pulse-owner-form-footer">
          <p>Only enter numbers you've checked in Aesthetix. Leave the rest blank—blank is not zero.</p>
          <button disabled={Boolean(error)} type="submit">Save numbers</button>
        </div>
      </form>
      <footer className="pulse-owner-foot">
        <span>{outcome?"Last checked "+new Date(outcome.checked_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Los_Angeles"}):"No Aesthetix numbers saved this week"}</span>
        <span>Public report: {state==="live"?"available":state}</span>
      </footer>
    </main>
  </div>;
}
