"use client";
import { useState, type FormEvent } from "react";
import { createSignalBrowserClient } from "../../lib/supabase/browser";
import { LockKeyhole, ArrowRight, Mail, KeyRound, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"magic" | "password">("magic");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createSignalBrowserClient();

      if (method === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Supabase stores refresh credentials in cookies. Server middleware
        // then recognizes the returning user without another login.
        window.location.replace("/");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback",
            shouldCreateUser: true,
          },
        });
        if (error) throw error;
        setMessage("Check your email for a one-time sign-in link. Once you're in, SIGNAL remembers this device.");
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
    <p>One-time access for your private OPUS intelligence workspace. Returning to this app on the same device won't require daily sign-ins.</p>
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
        {busy ? "Connecting…" : method === "magic" ? "Email my sign-in link" : "Sign in"}
        <ArrowRight size={16}/>
      </button>
    </form>
    {message && <div className="auth-message" role="status">{message}</div>}
    <button type="button" className="auth-switch" onClick={() => {
      setMethod(method === "magic" ? "password" : "magic");
      setMessage("");
    }}>{method === "magic" ? "Use password instead" : "Use email link instead"}</button>
    <div className="auth-footer"><CheckCircle2 size={14}/> Session stays remembered on this device. Sign out whenever you want. Access requires approval.</div>
  </div></div>;
}
