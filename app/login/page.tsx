"use client";
import { useEffect, useState, type FormEvent } from "react";
import { createSignalBrowserClient } from "../../lib/supabase/browser";
import { LockKeyhole, ArrowRight, Mail, KeyRound, CheckCircle2 } from "lucide-react";

const CANONICAL = "https://social-signal-amy-dos-projects.vercel.app";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"magic" | "password">("magic");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error) {
      setMessage("That sign-in link couldn't complete. Please request a fresh link, then open it in the same browser you used to request it. Older links only work once.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createSignalBrowserClient();
      if (method === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.replace("/");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: CANONICAL + "/auth/callback",
            shouldCreateUser: false,
          },
        });
        if (error) throw error;
        setSent(true);
        setMessage("Email sent. Open the newest SIGNAL sign-in link in this same browser. Once you are signed in, your session stays remembered.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-shell"><div className="auth-card">
    <div className="auth-top"><span className="auth-logo">S<span>.</span></span>
      <div><strong>SIGNAL</strong><small>PRIVATE INTELLIGENCE</small></div>
    </div>
    <div className="auth-kicker"><LockKeyhole size={14}/> OPUS / PRIVATE WORKSPACE</div>
    <h1>Sign in once.<br/><em>Stay connected.</em></h1>
    <p>SIGNAL remembers your sign-in on this device. A one-time email verification is needed to activate your session.</p>
    <form onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com" autoComplete="email" required />
      {method === "password" && <>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          autoComplete="current-password" required />
      </>}
      <button type="submit" disabled={busy}>
        {method === "magic" ? <Mail size={17}/> : <KeyRound size={17}/>}
        {busy ? "Connecting…" : method === "magic" ? (sent ? "Resend new sign-in link" : "Email my sign-in link") : "Sign in"}
        <ArrowRight size={16}/>
      </button>
    </form>
    {message && <div className="auth-message" role="status">{message}</div>}
    {method === "magic" && <p className="auth-hint">Tip: If you're using Safari, open the email link in Safari—not Gmail's in-app browser or Chrome. Switching browsers can break the one-time sign-in.</p>}
    <button type="button" className="auth-switch" onClick={() => {
      setMethod(method === "magic" ? "password" : "magic");
      setMessage("");
    }}>{method === "magic" ? "Use password instead" : "Use email link instead"}</button>
    <div className="auth-footer"><CheckCircle2 size={14}/> Approved accounts only. Session is remembered until you sign out or the device clears its cookies.</div>
  </div></div>;
}
