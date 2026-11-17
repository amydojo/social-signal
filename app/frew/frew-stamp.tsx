"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ChevronDown,Check} from "lucide-react";

type Reaction="seen"|"more"|"discuss";
type Choice=Reaction|"clear";
type EventRow={id:number;week_start:string;post_key:string;session_key:string;reaction:Choice};
type Featured={id:string;title:string};
const STICKERS:{key:Reaction;emoji:string;label:string}[]=[
  {key:"seen",emoji:"👀",label:"Seen"},
  {key:"more",emoji:"🔥",label:"More of this"},
  {key:"discuss",emoji:"💬",label:"Discuss"}
];
function getBrowserKey(week:string):string{
  const storageKey="opus-weekly-stamp:"+week;
  try{
    const stored=window.localStorage.getItem(storageKey);
    if(stored&&/^[0-9a-f-]{36}$/i.test(stored))return stored;
    const id=crypto.randomUUID();
    window.localStorage.setItem(storageKey,id);
    return id;
  }catch{return crypto.randomUUID();}
}
function latestRows(rows:EventRow[]):EventRow[]{
  const used=new Set<string>();
  return [...rows].sort((a,b)=>b.id-a.id).filter(row=>{
    const key=row.post_key+"|"+row.session_key;
    if(used.has(key))return false;
    used.add(key);
    return row.reaction!=="clear";
  });
}

export default function FrewStamp({weekStart,featured}:{weekStart:string;featured:Featured[]}){
  // A separate anonymous-only client; never use the previous private Frew sign-in.
  const supabase=useMemo(()=>{
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url&&key?createClient(url,key,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    }):null;
  },[]);
  const [browserKey,setBrowserKey]=useState("");
  const [events,setEvents]=useState<EventRow[]>([]);
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [showPosts,setShowPosts]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{
    let active=true;
    const token=getBrowserKey(weekStart);
    setBrowserKey(token);setEvents([]);setReady(false);setShowPosts(false);setError("");
    if(!supabase){setError("Reactions are unavailable.");return;}
    void supabase.from("signal_public_stickers")
      .select("id,week_start,post_key,session_key,reaction")
      .eq("week_start",weekStart)
      .order("id",{ascending:false})
      .limit(1000)
      .then(({data,error:readError})=>{
        if(!active)return;
        if(readError)setError("Reactions couldn't load.");
        else setEvents((data??[]) as EventRow[]);
        setReady(true);
      });
    return ()=>{active=false};
  },[weekStart,supabase]);
  const latest=useMemo(()=>latestRows(events),[events]);
  const counts=(postKey:string)=>
    STICKERS.map(x=>latest.filter(row=>row.post_key===postKey&&row.reaction===x.key).length);
  const selected=(postKey:string):Reaction|null=>
    (latest.find(row=>row.post_key===postKey&&row.session_key===browserKey)?.reaction as Reaction|null)??null;

  async function stamp(postKey:string,reaction:Reaction){
    if(!supabase||!browserKey||busy)return;
    setBusy(true);setError("");
    const next:Choice=selected(postKey)===reaction?"clear":reaction;
    const {error:writeError}=await supabase.from("signal_public_stickers")
      .insert({week_start:weekStart,post_key:postKey,session_key:browserKey,reaction:next});
    if(writeError){setError("Couldn't save. Try again.");setBusy(false);return;}
    const {data,error:readError}=await supabase.from("signal_public_stickers")
      .select("id,week_start,post_key,session_key,reaction")
      .eq("week_start",weekStart)
      .order("id",{ascending:false})
      .limit(1000);
    if(readError)setError("Saved, but counts couldn't refresh.");
    else setEvents((data??[]) as EventRow[]);
    setBusy(false);
  }

  const weekly=counts("week");
  const chosen=selected("week");
  return <div className="stamp-inline" aria-label="React to this report" title="One sticker per browser, per week. Shared counts; no sign-in.">
    <span className="stamp-caption">STAMP THE WEEK</span>
    <div className="stamp-buttons" role="group" aria-label="Choose a sticker for this week">
      {STICKERS.map((x,i)=><button key={x.key} type="button"
        className={"stamp-emoji-btn"+(chosen===x.key?" is-selected":"")}
        title={x.label+(chosen===x.key?" — tap again to remove":"")}
        aria-label={x.label+(ready?" — "+weekly[i]+" stickers":"")}
        aria-pressed={chosen===x.key}
        disabled={!ready||busy}
        onClick={()=>void stamp("week",x.key)}>
        <span aria-hidden="true">{x.emoji}</span>
        {weekly[i]>0&&<small>{weekly[i]}</small>}
      </button>)}
    </div>
    {featured.length>0&&<div className="stamp-posts">
      <button className="stamp-posts-toggle" type="button"
        aria-expanded={showPosts} onClick={()=>setShowPosts(v=>!v)}>
        Posts <ChevronDown size={11} className={showPosts?"stamp-rotate":""}/>
      </button>
      {showPosts&&<div className="stamp-post-popover">
        <strong>More of this?</strong>
        {featured.map(post=>{
          const postKey="post:"+post.id;
          const picked=selected(postKey)==="more";
          const total=counts(postKey)[1];
          return <div key={post.id} className="stamp-post-item">
            <span>{post.title}</span>
            <button type="button" disabled={!ready||busy} aria-pressed={picked}
              title={picked?"Remove sticker":"Stamp this post"}
              onClick={()=>void stamp(postKey,"more")}>
              {picked&&<Check size={11}/>} 🔥{total>0?" "+total:""}
            </button>
          </div>;
        })}
        <p>Stickers are anonymous.</p>
      </div>}
    </div>}
    {error&&<span className="stamp-error" role="status">{error}</span>}
  </div>;
}
