import Link from "next/link";
import {requestOwnerLink} from "../actions";
import "../../frew.css";
import "../owner.css";

export const dynamic="force-dynamic";
export const metadata={title:"Owner access · OPUS",robots:{index:false,follow:false,nocache:true}};
export default async function OwnerLogin({searchParams}:{
  searchParams:Promise<{sent?:string;error?:string}>
}){
  const query=await searchParams;
  return <div className="executive-shell pulse-owner">
    <header className="executive-masthead">
      <div className="executive-brand"><span className="executive-logomark">O.</span><span>OPUS<span className="executive-word-divider">/</span> OWNER ACCESS</span></div>
      <Link className="pulse-owner-back" href="/frew">← Weekly Pulse</Link>
    </header>
    <main className="executive-main">
      <section className="pulse-owner-login">
        <span className="pulse-decision-kicker">PRIVATE REPORTING</span>
        <h1>Owner sign-in</h1>
        <p>Verified consultation reporting is restricted to authorized OPUS owners. Sign in using the email already registered with OPUS SIGNAL.</p>
        {query.sent==="1"?<p role="status">If this is an authorized account, check your email for the sign-in link.</p>:null}
        {query.error?<p role="alert">Unable to send the link. Check your address and account access, then retry.</p>:null}
        <form action={requestOwnerLink}>
          <label>Authorized email address<input name="email" type="email" autoComplete="email" required maxLength={250} placeholder="you@practice.com"/></label>
          <button type="submit">Email sign-in link</button>
        </form>
        <small>No patient or CRM data is available on the public Weekly Pulse.</small>
      </section>
    </main>
  </div>;
}
