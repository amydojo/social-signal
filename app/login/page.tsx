"use client";
import { useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { LockKeyhole, ArrowRight, Mail, KeyRound } from "lucide-react";
export default function LoginPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [method,setMethod]=useState<"magic"|"password">("magic");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessage("");
    try {
      const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if(!url||!key) throw new Error("Database authentication is not configured yet.");
      const supabase=createBrowserClient(url,key);
      if(method==="password") {
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        window.location.assign("/");
      } else {
        const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+"/auth/callback",shouldCreateUser:true}});
        if(error) throw error;
        setMessage("Check your email for the sign-in link. New accounts remain locked until approved.");
      }
    }catch(error){setMessage(error instanceof Error?error.message:"Sign-in failed. Please try again.");}
    finally{setBusy(false);}
  }
  return <div className="auth-shell"><div className="auth-card">
    <div className="auth-top"><span className="auth-logo">S<span>.</span></span><div><strong>SIGNAL</strong><small>PRIVATE INTELLIGENCE</small></div></div>
    <div className="auth-kicker"><LockKeyhole size={14}/> OPUS / PRIVATE WORKSPACE</div>
    <h1>Your intelligence,<br/><em>under your control.</em></h1>
    <p>Sign in to view OPUS social performance, weekly decisions, and creative experiments.</p>
    <form onSubmit={submit}><label htmlFor="email">Work email</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/>
    {method==="password"&&<><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></>}
    <button type="submit" disabled={busy}>{method==="magic"?<Mail size={17}/>:<KeyRound size={17}/>} {busy?"Connecting…":method==="magic"?"Email sign-in link":"Sign in"} <ArrowRight size={16}/></button></form>
    {message&&<div className="auth-message" role="status">{message}</div>}
    <button type="button" className="auth-switch" onClick={()=>{setMethod(method==="magic"?"password":"magic");setMessage("")}}>{method==="magic"?"Use password instead":"Use email link instead"}</button>
    <div className="auth-footer">Access by approval only. New sign-ups have no reporting permissions.</div>
  </div></div>;
}
