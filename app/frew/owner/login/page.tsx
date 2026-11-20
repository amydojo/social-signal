import Link from "next/link";
import {requestOwnerLink} from "../actions";
import "../../frew.css";
import "../../frew-executive.css";
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
        <span className="pulse-decision-kicker">PRIVATE ACCESS</span>
        <h1>Sign in to check bookings</h1>
        <p>This page is only for authorized OPUS owners. Use the email linked to your SIGNAL account.</p>
        {query.sent==="1"?<p role="status">Check your email for a sign-in link if your account has access.</p>:null}
        {query.error?<p role="alert">Unable to send the link. Check your address and account access, then retry.</p>:null}
        <form action={requestOwnerLink}>
          <label>Your work email<input name="email" type="email" autoComplete="email" required maxLength={250} placeholder="you@practice.com"/></label>
          <button type="submit">Send sign-in link</button>
        </form>
        <small>The public report doesn’t show private consultation counts.</small>
      </section>
    </main>
  </div>;
}
