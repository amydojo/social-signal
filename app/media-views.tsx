"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ExternalLink, ImageOff, Play, X, Images } from "lucide-react";
import type { Post, Story } from "./dashboard";
import { postCoverUrls, storyCoverUrls } from "./media-source";
import archiveIndex from "../public/media/archive/index.json";
const savedImagePaths=new Set(archiveIndex.assets.filter(a=>a.status==="saved").map(a=>a.file));

const fmt=(n:number|null|undefined)=>n==null?"—":n.toLocaleString("en-US");
const date=(d:string)=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});

const postCode=(post:Post)=>post.permalink.match(/instagram\.com\/(?:reel|p)\/([^/]+)/)?.[1]??"";
const storyId=(story:Story)=>story.permalink.match(/\/stories\/[^/]+\/(\d+)/)?.[1]??"";

function getPostCover(post:Post){
  if(post.thumbnail_original_url)return post.thumbnail_original_url;
  const code=postCode(post);
  if(code&&postCoverUrls[code]) return postCoverUrls[code];
  // These are the same named creative concepts cross-posted on Facebook.
  // Reuse the Instagram cover only as a visual reference, not as a Facebook analytics source.
  if(post.platform==="facebook"&&post.id==="fb-reel-scar") return postCoverUrls["DfqeQMZMKqR"]??"";
  if(post.platform==="facebook"&&post.id==="fb-carousel-bulge") return postCoverUrls["DftDagtkR6i"]??"";
  return "";
}
function getStoryCover(story:Story){return story.thumbnail_original_url??storyCoverUrls[storyId(story)]??""}
function localPostCover(post:Post) {
  const code=postCode(post) || (post.id==="fb-reel-scar"?"DfqeQMZMKqR":post.id==="fb-carousel-bulge"?"DftDagtkR6i":"");
  const archived=code?"/media/archive/ig-"+code+".jpg":"";
  if(archived&&savedImagePaths.has(archived))return archived;
  if(post.thumbnail_path&&savedImagePaths.has(post.thumbnail_path))return post.thumbnail_path;
  return code?"/media/p-"+encodeURIComponent(code):"";
}
function localStoryCover(story:Story) {
  const id=storyId(story);
  const archived=id?"/media/archive/story-"+id+".jpg":"";
  if(archived&&savedImagePaths.has(archived))return archived;
  if(story.thumbnail_path&&savedImagePaths.has(story.thumbnail_path))return story.thumbnail_path;
  return id?"/media/s-"+encodeURIComponent(id):"";
}

function snapshotCover(post:Post|null,story:Story|null){
 const id=post?.id??story?.id??"";
 return id.startsWith("hist-")?"/media/history/"+encodeURIComponent(id):"";
}
function Cover({src,localSrc,snapshotSrc,alt,mode,loading="lazy"}:{src:string;localSrc?:string;snapshotSrc?:string;alt:string;mode:"reel"|"carousel"|"story";loading?:"lazy"|"eager"}) {
 const paths=[...new Set([localSrc,snapshotSrc,src].filter((p):p is string=>!!p))];
 const [step,setStep]=useState(0);
 useEffect(()=>setStep(0),[src,localSrc,snapshotSrc]);
 const current=paths[step];
 return <div className={"real-cover real-cover-"+mode}>
  {current?
   <img src={current} alt={alt} loading={loading} referrerPolicy="no-referrer"
    onError={()=>setStep(i=>i+1)}/>:
   <div className="cover-missing"><ImageOff size={26}/><span>Preview unavailable</span></div>}
 </div>;
}

export function PostVisual({post,onOpen,featured=false}:{post:Post;onOpen:(post:Post)=>void;featured?:boolean}){
  const isReel=post.format==="Reel";
  const cover=getPostCover(post);
  return <article className={"visual-card "+(featured?"visual-card-featured":"")}>
    <button type="button" className="visual-poster" onClick={()=>onOpen(post)} aria-label={"Preview "+post.title}>
      <Cover src={cover} localSrc={localPostCover(post)} snapshotSrc={snapshotCover(post,null)} alt={"Actual cover for "+post.title} mode={isReel?"reel":"carousel"}/>
      <span className="poster-format">{isReel?<Play size={12} fill="currentColor"/>:<Images size={12}/>} {isReel?"Reel":"Carousel"}</span>
      <span className="poster-open"><ArrowUpRight size={19}/></span>
    </button>
    <div className="visual-copy">
      <div className="visual-topline">{post.platform} <span>·</span> {date(post.published_on)}</div>
      <button type="button" onClick={()=>onOpen(post)} className="visual-name">{post.title}</button>
      <div className="visual-stats">
        <div><strong>{fmt(post.views??post.impressions)}</strong><span>{post.views==null?"Impr.":"Views"}</span></div>
        <div><strong>{fmt(post.interactions)}</strong><span>Interactions</span></div>
      </div>
      {post.platform==="facebook"&&<span className="visual-caveat">Image from Instagram version</span>}
    </div>
  </article>;
}

export function StoryVisual({story,onOpen,compact=false}:{story:Story;onOpen:(story:Story)=>void;compact?:boolean}){
  const cover=getStoryCover(story);
  const name=story.descriptor==="(no story text)"?"Story · "+String(story.published_at_raw).slice(6,8)+" Nov":story.descriptor;
  return <button type="button" className={"story-visual "+(compact?"story-visual-compact":"")} onClick={()=>onOpen(story)} aria-label={"View story preview: "+name}>
    <Cover src={cover} localSrc={localStoryCover(story)} snapshotSrc={snapshotCover(null,story)} alt={"Metricool image from "+name} mode="story"/>
    <span className="story-visual-info"><strong>{fmt(story.impressions)}</strong><span>impr.</span></span>
    <span className="story-visual-name">{name}</span>
    {!compact&&<span className="story-visual-replies">{fmt(story.replies)} replies</span>}
  </button>;
}

export function MediaPreviewModal({post,story,onClose}:{post:Post|null;story:Story|null;onClose:()=>void}){
  const closeRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!post&&!story)return;
    const handler=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};
    window.addEventListener("keydown",handler);
    const original=document.body.style.overflow;
    document.body.style.overflow="hidden";
    closeRef.current?.focus();
    return ()=>{window.removeEventListener("keydown",handler);document.body.style.overflow=original};
  },[post,story,onClose]);
  if(!post&&!story)return null;
  const cover=post?getPostCover(post):getStoryCover(story!);
  const name=post?.title??(story?.descriptor==="(no story text)"?"Instagram Story":story?.descriptor??"Instagram Story");
  const external=post?.permalink??story?.permalink??"";

  return <div className="media-shade" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="media-dialog" role="dialog" aria-modal="true" aria-label={"Preview: "+name}>
      <button className="media-close" type="button" ref={closeRef} onClick={onClose} aria-label="Close preview"><X size={20}/></button>
      <div className="media-large">
        <Cover src={cover} localSrc={post?localPostCover(post):localStoryCover(story!)} snapshotSrc={snapshotCover(post,story)} alt={"Original Metricool cover: "+name} mode={post?(post.format==="Reel"?"reel":"carousel"):"story"} loading="eager"/>
      </div>
      <div className="media-details">
        <span className="media-eyebrow">{post?(post.platform+" / "+(post.format??"post")):"Instagram / Story"}</span>
        <h2>{name}</h2>
        {post?<div className="modal-stat-grid">
          <div><strong>{fmt(post.views??post.impressions)}</strong><span>{post.views==null?"Impressions":"Views"}</span></div>
          <div><strong>{fmt(post.reach)}</strong><span>Reach</span></div>
          <div><strong>{fmt(post.interactions)}</strong><span>Interactions</span></div>
          <div><strong>{post.skip_3s_pct==null?"—":post.skip_3s_pct.toFixed(1)+"%"}</strong><span>3s skip</span></div>
          <div><strong>{fmt(post.saves)}</strong><span>Saves</span></div>
          <div><strong>{fmt(post.shares)}</strong><span>Shares</span></div>
        </div>:story?<div className="modal-stat-grid">
          <div><strong>{fmt(story.impressions)}</strong><span>Impressions</span></div>
          <div><strong>{fmt(story.reach)}</strong><span>Reach</span></div>
          <div><strong>{fmt(story.replies)}</strong><span>Replies</span></div>
        </div>:null}
        <div className="media-modal-actions">
          {external&&<a className="source-button" href={external} target="_blank" rel="noopener noreferrer">Open original post <ExternalLink size={14}/></a>}
        </div>
        {story&&<p className="media-note">Story previews are from the saved Metricool export. Instagram's original Story link may have expired.</p>}
        {post?.platform==="facebook"&&cover&&<p className="media-note">Preview image from the same-titled Instagram creative; Facebook metrics shown separately.</p>}
      </div>
    </section>
  </div>;
}
