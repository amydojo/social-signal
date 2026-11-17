"use client";

import {useEffect,useMemo,useState,type FormEvent} from "react";
import {createBrowserClient} from "@supabase/ssr";
import {Check,ChevronDown,LockKeyhole,Mail,MessageCircle} from "lucide-react";

type Reaction="seen"|"more"|"discuss";
type Access="loading"|"guest"|"frew"|"owner"|"unapproved"|"unavailable";
type Stamp={post_key:string;reaction:Reaction|null;note:string;updated_at:string};
type Featured={id:string;title:string};
const FREW_EMAIL="drfrew@opusplasticsurgery.ai";
const reactions:{id:Reaction;icon:string;label:string}[]=[
  {id:"seen",icon:"👀",label:"Seen"},
  {id:"more",icon:"🔥",label:"More like this"},
  {id:"discuss",icon:"💬",label:"Let's talk"}
];
const reactionText=(reaction:Reaction|null)=>reactions.find(x=>x.id===reaction)?.label??"";
const reactionIcon=(reaction:Reaction|null)=>reactions.find(x=>x.id===reaction)?.icon??"";
const conciseDate=(value:string)=>new Date(value).toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"America/Los_Angeles"});

export default function FrewStamp({weekStart,featured}:{weekStart:string;featured:Featured[]}){
  const supabase=useMemo(()=>{
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url&&key?createBrowserClient(url,key):null;
  },[]);
  const [access,setAccess]=useState<Access>("loading");
  const [userId,setUserId]=useState<string|null>(null);
  const [stamps,setStamps]=useState<Stamp[]>([]);
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [draft,setDraft]=useState("");
  const [noteOpen,setNoteOpen]=useState(false);
  const [postOpen,setPostOpen]=useState(false);
  const [loginOpen,setLoginOpen]=useState(false);
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [sessionEpoch,setSessionEpoch]=useState(0);
  useEffect(()=>{
    let active=true;
    if(!supabase){setAccess("unavailable");return;}
    void (async()=>{
      const {data,error:authError}=await supabase.auth.getUser();
      if(!active)return;
      if(authError||!data.user){setAccess("guest");setUserId(null);return;}
      const u=data.user;
      setUserId(u.id);
      if(u.email?.toLowerCase()===FREW_EMAIL&&!!u.email_confirmed_at){setAccess("frew");return;}
      const {data:member}=await supabase.from("signal_members").select("role").eq("user_id",u.id).maybeSingle();
      if(active)setAccess(member?.role==="owner"?"owner":"unapproved");
    })();
    return ()=>{active=false};
  },[supabase,sessionEpoch]);
  useEffect(()=>{
    let active=true;
    if(!supabase||(access!=="owner"&&access!=="frew")){setStamps([]);return;}
    setStamps([]);setLoading(true);setError("");
    void supabase.from("signal_frew_stamps")
      .select("post_key,reaction,note,updated_at")
      .eq("week_start",weekStart)
      .order("updated_at",{ascending:false})
      .then(({data,error:readError})=>{
        if(!active)return;
        setLoading(false);
        if(readError){setError("Couldn't load the stamps.");return;}
        setStamps((data??[]) as Stamp[]);
      });
    return ()=>{active=false};
  },[supabase,access,weekStart]);
  const weekly=stamps.find(s=>s.post_key==="week")??null;
  useEffect(()=>{
    setDraft(weekly?.note??"");
    setNoteOpen(Boolean(weekly?.note));
  },[weekStart,weekly?.note]);
  const postStamps=stamps.filter(s=>s.post_key.startsWith("post:"));
  const save=async(postKey:string,reaction:Reaction|null,note:string)=>{
    if(!supabase||access!=="frew"||!userId)return;
    const trimmed=note.trim();
    setError("");setBusy(postKey);
    let saveError;
    if(!reaction&&!trimmed){
      const out=await supabase.from("signal_frew_stamps").delete()
        .eq("user_id",userId).eq("week_start",weekStart).eq("post_key",postKey);
      saveError=out.error;
    }else{
      const out=await supabase.from("signal_frew_stamps")
        .upsert({user_id:userId,week_start:weekStart,post_key:postKey,reaction,note:trimmed},
          {onConflict:"user_id,week_start,post_key"})
        .select("post_key,reaction,note,updated_at").single();
      saveError=out.error;
    }
    if(saveError){setError("Couldn't save. Please try again.");setBusy(null);return;}
    const {data,error:readError}=await supabase.from("signal_frew_stamps")
      .select("post_key,reaction,note,updated_at").eq("week_start",weekStart).order("updated_at",{ascending:false});
    if(readError)setError("Saved, but couldn't refresh the view.");
    else setStamps((data??[]) as Stamp[]);
    setBusy(null);
  };
  const login=async(e:FormEvent)=>{
    e.preventDefault();
    if(!supabase||!email.trim())return;
    setError("");setBusy("login");
    const normalized=email.trim().toLowerCase();
    const redirect=window.location.origin+"/auth/callback?next="+encodeURIComponent("/frew?week="+weekStart);
    const {error:loginError}=await supabase.auth.signInWithOtp({
      email:normalized,
      options:{emailRedirectTo:redirect,shouldCreateUser:normalized===FREW_EMAIL}
    });
    setBusy(null);
    if(loginError){setError("Couldn't send the sign-in link. Try again.");return;}
    setSent(true);
  };
  const signOut=async()=>{
    if(!supabase)return;
    await supabase.auth.signOut();
    setStamps([]);setUserId(null);setAccess("guest");setLoginOpen(false);
    setSessionEpoch(x=>x+1);
  };
  return <section className="stamp-wrap" aria-label="Frew's Stamp">
    <div className="stamp-heading">
      <div><span className="stamp-small">A LITTLE SOMETHING FROM FREW</span><h2>Frew's stamp <span aria-hidden="true">✳</span></h2></div>
      {access==="frew"&&<span className="stamp-private"><LockKeyhole size={12}/> Only you and Amy <button type="button" className="stamp-account-link stamp-signout" onClick={()=>void signOut()}>Sign out</button></span>}
      {access==="owner"&&<span className="stamp-private"><LockKeyhole size={12}/> Private feedback</span>}
    </div>
    {access==="loading"?<p className="stamp-soft"> </p>:
     access==="frew"?<>
       <div className="stamp-reactions" role="group" aria-label="Mark this week's report">
         {reactions.map(x=><button type="button" key={x.id}
           className={"stamp-choice"+(weekly?.reaction===x.id?" stamp-chosen":"")}
           aria-pressed={weekly?.reaction===x.id}
           disabled={busy!==null}
           onClick={()=>void save("week",weekly?.reaction===x.id?null:x.id,draft)}>
           <span className="stamp-emoji" aria-hidden="true">{x.icon}</span><span>{x.label}</span>
           {weekly?.reaction===x.id&&<Check size={13} className="stamp-check"/>}
         </button>)}
       </div>
       <div className="stamp-under">
         <button className="stamp-note-toggle" type="button" onClick={()=>setNoteOpen(x=>!x)}>
           <MessageCircle size={14}/>{weekly?.note?"Edit your note":"Add a thought (optional)"}
         </button>
         {weekly&&!busy&&<span className="stamp-saved"><Check size={13}/> Stamped</span>}
       </div>
       {noteOpen&&<div className="stamp-note-panel">
         <textarea value={draft} onChange={e=>setDraft(e.target.value.slice(0,350))}
           rows={2} maxLength={350} placeholder="One thought for the next shoot…" aria-label="Optional note for Amy"/>
         <div className="stamp-note-actions">
           <span>{draft.length}/350</span>
           <button type="button" disabled={busy!==null||draft.trim()===(weekly?.note??"")}
             onClick={()=>void save("week",weekly?.reaction??null,draft)}>
             {busy==="week"?"Saving…":"Save note"}
           </button>
         </div>
       </div>}
       <details className="stamp-post-details" open={postOpen} onToggle={e=>setPostOpen(e.currentTarget.open)}>
         <summary>Stamp a specific post <ChevronDown size={14}/></summary>
         <div className="stamp-post-list">{featured.map(p=>{
           const row=stamps.find(x=>x.post_key==="post:"+p.id);
           return <div className="stamp-post-row" key={p.id}>
             <span>{p.title}</span>
             <button type="button" disabled={busy!==null}
               className={row?.reaction==="more"?"stamp-mini-active":""}
               aria-pressed={row?.reaction==="more"}
               onClick={()=>void save("post:"+p.id,row?.reaction==="more"?null:"more","")}>
               🔥 {row?.reaction==="more"?"Stamped":"More of this"}
             </button>
           </div>;
         })}</div>
       </details>
     </>:
     access==="owner"?<>
       {loading?<p className="stamp-soft">Loading…</p>:
        weekly?<div className="stamp-owner-view">
          {weekly.reaction&&<span className="stamp-owner-symbol">{reactionIcon(weekly.reaction)} {reactionText(weekly.reaction)}</span>}
          {weekly.note&&<p>“{weekly.note}”</p>}
          <small>{conciseDate(weekly.updated_at)}</small>
        </div>:
        <p className="stamp-soft">No stamp yet.</p>}
       {postStamps.length>0&&<div className="stamp-owner-posts">{postStamps.map(p=><span key={p.post_key}>
         🔥 {featured.find(x=>"post:"+x.id===p.post_key)?.title??"Post"}
       </span>)}</div>}
       <button type="button" className="stamp-account-link" onClick={()=>void signOut()}>Sign out</button>
     </>:
     access==="unapproved"?<div className="stamp-auth"><p>This space is reserved for Dr. Frew.</p><button type="button" onClick={()=>void signOut()}>Sign out</button></div>:
     access==="unavailable"?<p className="stamp-soft">Stamps are temporarily unavailable.</p>:
     <div className="stamp-guest">
       {!loginOpen?<div className="stamp-guest-row">
         <div className="stamp-preview" aria-hidden="true">👀 <span>🔥</span> 💬</div>
         <button type="button" onClick={()=>setLoginOpen(true)}>Leave a stamp</button>
       </div>:sent?<div className="stamp-sent">
         <Mail size={16}/><span>Check your inbox for the sign-in link.</span>
         <button type="button" onClick={()=>setSent(false)}>Resend</button>
       </div>:<form className="stamp-login" onSubmit={e=>void login(e)}>
         <label htmlFor="stamp-email">Your email</label>
         <div><input id="stamp-email" type="email" autoComplete="email" required value={email}
           placeholder="Work email" onChange={e=>setEmail(e.target.value)}/>
           <button type="submit" disabled={busy!==null}>{busy==="login"?"Sending…":"Email me a sign-in link"}</button>
         </div>
         <small>No password. Only Dr. Frew can leave a stamp.</small>
       </form>}
     </div>}
    {error&&<p className="stamp-error" role="alert">{error}</p>}
  </section>;
}
