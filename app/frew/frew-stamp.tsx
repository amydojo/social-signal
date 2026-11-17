"use client";

import {useEffect,useMemo,useState,type FormEvent} from "react";
import {createBrowserClient} from "@supabase/ssr";
import {Check,ChevronDown,Mail,X} from "lucide-react";

type Reaction="seen"|"more"|"discuss";
type Access="loading"|"guest"|"frew"|"owner"|"unapproved"|"unavailable";
type Stamp={post_key:string;reaction:Reaction|null;note:string;updated_at:string};
type Featured={id:string;title:string};
const FREW_EMAIL="drfrew@opusplasticsurgery.ai";
const reactions:{id:Reaction;icon:string;label:string}[]=[
  {id:"seen",icon:"👀",label:"Seen"},
  {id:"more",icon:"🔥",label:"More of this"},
  {id:"discuss",icon:"💬",label:"Discuss"}
];
const reactionText=(r:Reaction|null)=>reactions.find(x=>x.id===r)?.label??"";
const reactionIcon=(r:Reaction|null)=>reactions.find(x=>x.id===r)?.icon??"";

export default function FrewStamp({weekStart,featured}:{weekStart:string;featured:Featured[]}){
  const supabase=useMemo(()=>{
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url&&key?createBrowserClient(url,key):null;
  },[]);
  const [access,setAccess]=useState<Access>("loading");
  const [userId,setUserId]=useState<string|null>(null);
  const [stamps,setStamps]=useState<Stamp[]>([]);
  const [open,setOpen]=useState(false);
  const [showNote,setShowNote]=useState(false);
  const [showPosts,setShowPosts]=useState(false);
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [draft,setDraft]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [sessionEpoch,setSessionEpoch]=useState(0);
  useEffect(()=>{
    let active=true;
    if(!supabase){setAccess("unavailable");return;}
    void(async()=>{
      const {data,error:authError}=await supabase.auth.getUser();
      if(!active)return;
      if(authError||!data.user){setAccess("guest");setUserId(null);return;}
      const user=data.user;
      setUserId(user.id);
      if(user.email?.toLowerCase()===FREW_EMAIL&&!!user.email_confirmed_at){
        setAccess("frew");return;
      }
      const {data:member}=await supabase.from("signal_members")
        .select("role").eq("user_id",user.id).maybeSingle();
      if(active)setAccess(member?.role==="owner"?"owner":"unapproved");
    })();
    return ()=>{active=false;};
  },[supabase,sessionEpoch]);
  useEffect(()=>{
    let active=true;
    setStamps([]);setError("");
    if(!supabase||(access!=="owner"&&access!=="frew"))return;
    void supabase.from("signal_frew_stamps")
      .select("post_key,reaction,note,updated_at")
      .eq("week_start",weekStart)
      .then(({data,error:readError})=>{
        if(!active)return;
        if(readError){setError("Couldn't load feedback.");return;}
        setStamps((data??[]) as Stamp[]);
      });
    return ()=>{active=false;};
  },[supabase,access,weekStart]);
  const weekly=stamps.find(s=>s.post_key==="week")??null;
  const postStamps=stamps.filter(s=>s.post_key.startsWith("post:"));
  useEffect(()=>{
    setDraft(weekly?.note??"");
  },[weekly?.note,weekStart]);
  useEffect(()=>{
    setOpen(false);setShowNote(false);setShowPosts(false);setSent(false);
  },[weekStart]);

  async function save(postKey:string,reaction:Reaction|null,note:string){
    if(!supabase||access!=="frew"||!userId)return;
    setBusy(true);setError("");
    const trimmed=note.trim();
    const result=!reaction&&!trimmed
      ?await supabase.from("signal_frew_stamps").delete()
        .eq("user_id",userId).eq("week_start",weekStart).eq("post_key",postKey)
      :await supabase.from("signal_frew_stamps")
        .upsert({user_id:userId,week_start:weekStart,post_key:postKey,reaction,note:trimmed},
          {onConflict:"user_id,week_start,post_key"});
    if(result.error){setError("Couldn't save. Try again.");setBusy(false);return;}
    const {data,error:readError}=await supabase.from("signal_frew_stamps")
      .select("post_key,reaction,note,updated_at")
      .eq("week_start",weekStart);
    if(readError)setError("Saved, but couldn't refresh.");
    else setStamps((data??[]) as Stamp[]);
    setBusy(false);
  }

  async function login(event:FormEvent){
    event.preventDefault();
    if(!supabase||!email.trim())return;
    setBusy(true);setError("");
    const normalized=email.trim().toLowerCase();
    const redirect=window.location.origin+"/auth/callback?next="+encodeURIComponent("/frew?week="+weekStart);
    const {error:signInError}=await supabase.auth.signInWithOtp({
      email:normalized,
      options:{emailRedirectTo:redirect,shouldCreateUser:normalized===FREW_EMAIL}
    });
    setBusy(false);
    if(signInError){setError("Couldn't send the link.");return;}
    setSent(true);
  }
  async function signOut(){
    if(!supabase)return;
    await supabase.auth.signOut();
    setStamps([]);setUserId(null);setAccess("guest");setOpen(false);
    setSessionEpoch(x=>x+1);
  }

  const mark=weekly?.reaction?reactionIcon(weekly.reaction):"✳";
  const hasFeedback=Boolean(weekly||postStamps.length);
  return <div className="stamp-inline" aria-label="Frew's feedback">
    <button className="stamp-trigger" type="button" aria-expanded={open}
      onClick={()=>setOpen(o=>!o)}>
      <span aria-hidden="true">{access==="frew"&&weekly?.reaction?mark:"✳"}</span>
      <span>{access==="owner"&&hasFeedback?"Frew left a mark":access==="frew"&&hasFeedback?"Your stamp":"Leave a stamp"}</span>
      <ChevronDown size={12} className={open?"stamp-rotate":""}/>
    </button>
    {open&&<div className="stamp-popover" role="region" aria-label="Stamp this week's report">
      <div className="stamp-popover-head"><strong>{access==="owner"?"Frew's take":"One little stamp"}</strong>
        <button type="button" aria-label="Close stamps" onClick={()=>setOpen(false)}><X size={15}/></button>
      </div>
      {access==="loading"?<p className="stamp-muted">Opening…</p>:
      access==="frew"?<>
        <div className="stamp-choices">
          {reactions.map(item=><button key={item.id} type="button" disabled={busy}
            aria-pressed={weekly?.reaction===item.id}
            className={weekly?.reaction===item.id?"is-selected":""}
            onClick={()=>void save("week",weekly?.reaction===item.id?null:item.id,draft)}>
            <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
          </button>)}
        </div>
        <div className="stamp-inline-tools">
          <button type="button" onClick={()=>setShowNote(v=>!v)}>{weekly?.note?"Edit note":"+ Add a note"}</button>
          {weekly&&<span><Check size={12}/> Saved</span>}
        </div>
        {showNote&&<div className="stamp-note">
          <textarea maxLength={350} rows={2} value={draft}
            onChange={e=>setDraft(e.target.value)} aria-label="Note for Amy"
            placeholder="A quick thought…"/>
          <button type="button" disabled={busy||draft.trim()===(weekly?.note??"")}
            onClick={()=>void save("week",weekly?.reaction??null,draft)}>Save note</button>
        </div>}
        {featured.length>0&&<div className="stamp-posts">
          <button type="button" className="stamp-posts-toggle" onClick={()=>setShowPosts(v=>!v)}>
            Stamp a post <ChevronDown size={12} className={showPosts?"stamp-rotate":""}/>
          </button>
          {showPosts&&featured.map(p=>{
            const selected=postStamps.some(s=>s.post_key==="post:"+p.id&&s.reaction==="more");
            return <div key={p.id} className="stamp-post-item">
              <span>{p.title}</span>
              <button type="button" disabled={busy} aria-pressed={selected}
                onClick={()=>void save("post:"+p.id,selected?null:"more","")}>{selected?"🔥 Saved":"🔥"}</button>
            </div>;
          })}
        </div>}
        <button className="stamp-signout" type="button" onClick={()=>void signOut()}>Sign out</button>
      </>:
      access==="owner"?<>
        {hasFeedback?<div className="stamp-owner">
          {weekly?.reaction&&<strong>{reactionIcon(weekly.reaction)} {reactionText(weekly.reaction)}</strong>}
          {weekly?.note&&<p>“{weekly.note}”</p>}
          {postStamps.map(stamp=><small key={stamp.post_key}>
            🔥 {featured.find(p=>"post:"+p.id===stamp.post_key)?.title??"Post"}
          </small>)}
        </div>:<p className="stamp-muted">Nothing yet.</p>}
        <button className="stamp-signout" type="button" onClick={()=>void signOut()}>Sign out</button>
      </>:
      access==="guest"?sent?<p className="stamp-muted"><Mail size={14}/> Check your inbox.</p>:
        <form onSubmit={e=>void login(e)} className="stamp-login-inline">
          <label htmlFor="stamp-email">Sign in to stamp</label>
          <input id="stamp-email" type="email" value={email} autoComplete="email"
            placeholder="Work email" required onChange={e=>setEmail(e.target.value)}/>
          <button type="submit" disabled={busy}>{busy?"Sending…":"Send link"}</button>
        </form>:
      access==="unapproved"?<p className="stamp-muted">For Dr. Frew only.</p>:
        <p className="stamp-muted">Unavailable for now.</p>}
      {error&&<p className="stamp-error" role="alert">{error}</p>}
    </div>}
  </div>;
}
