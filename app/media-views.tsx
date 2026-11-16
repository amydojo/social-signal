"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ExternalLink, ImageOff, Play, X, Images } from "lucide-react";
import type { Post, Story } from "./dashboard";
import { postCoverUrls, storyCoverUrls } from "./media-source";

const fmt=(n:number|null|undefined)=>n==null?"—":n.toLocaleString("en-US");
const date=(d:string)=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});

const postCode=(post:Post)=>post.permalink.match(/instagram\.com\/(?:reel|p)\/([^/]+)/)?.[1]??"";
const storyId=(story:Story)=>story.permalink.match(/\/stories\/[^/]+\/(\d+)/)?.[1]??"";

function getPostCover(post:Post){
  const code=postCode(post);
  if(code&&postCoverUrls[code]) return postCoverUrls[code];
  // These are the same named creative concepts cross-posted on Facebook.
  // Reuse the Instagram cover only as a visual reference, not as a Facebook analytics source.
  if(post.platform==="facebook"&&post.id==="fb-reel-scar") return postCoverUrls["DfqeQMZMKqR"]??"";
  if(post.platform==="facebook"&&post.id==="fb-carousel-bulge") return postCoverUrls["DftDagtkR6i"]??"";
  return "";
}
function getStoryCover(story:Story){return storyCoverUrls[storyId(story)]??""}
function localPostCover(post:Post) {
  const code=postCode(post) || (post.id==="fb-reel-scar"?"DfqeQMZMKqR":post.id==="fb-carousel-bulge"?"DftDagtkR6i":"");
  return code?"/media/p-"+encodeURIComponent(code):"";
}
function localStoryCover(story:Story) {
  const id=storyId(story);
  return id?"/media/s-"+encodeURIComponent(id):"";
}

function Cover({src,localSrc,alt,mode,loading="lazy"}:{src:string;localSrc?:string;alt:string;mode:"reel"|"carousel"|"story";loading?:"lazy"|"eager"}) {
  const initial=localSrc||src;
  const [current,setCurrent]=useState(initial);
  const [failed,setFailed]=useState(!initial);
  useEffect(()=>{setCurrent(localSrc||src);setFailed(!(localSrc||src))},[localSrc,src]);
  return <div className={"real-cover real-cover-"+mode}>
    {!failed?
      <img
        src={current}
        alt={alt}
        loading={loading}
        referrerPolicy="no-referrer"
        onError={()=>{
          // If the build-time cached cover isn't available, fall back to the
          // original Metricool URL while it remains valid.
          if(localSrc&&current===localSrc&&src&&src!==localSrc){setCurrent(src)}
          else setFailed(true)
        }}
      />:
      <div className="cover-missing"><ImageOff size={26}/><span>Preview unavailable</span></div>
    }
  </div>;
}

export function PostVisual({post,onOpen,featured=false}:{post:Post;onOpen:(post:Post)=>void;featured?:boolean}){
  const isReel=post.format==="Reel";
  const cover=getPostCover(post);
  return <article className={"visual-card "+(featured?"visual-card-featured":"")}>
    <button type="button" className="visual-poster" onClick={()=>onOpen(post)} aria-label={"Preview "+post.title}>
      <Cover src={cover} localSrc={localPostCover(post)} alt={"Actual cover for "+post.title} mode={isReel?"reel":"carousel"}/>
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
      {featured&&post.platform==="facebook"&&<span className="visual-caveat">Cover shown from Instagram version</span>}
    </div>
  </article>;
}

export function StoryVisual({story,onOpen,compact=false}:{story:Story;onOpen:(story:Story)=>void;compact?:boolean}){
  const cover=getStoryCover(story);
  const name=story.descriptor==="(no story text)"?"Story · "+String(story.published_at_raw).slice(6,8)+" Nov":story.descriptor;
  return <button type="button" className={"story-visual "+(compact?"story-visual-compact":"")} onClick={()=>onOpen(story)} aria-label={"View story preview: "+name}>
    <Cover src={cover} localSrc={localStoryCover(story)} alt={"Metricool image from "+name} mode="story"/>
    <span className="story-visual-info"><strong>{fmt(story.impressions)}</strong><span>impr.</span></span>
    <span className="story-visual-name">{name}</span>
    {!compact&&<span className="story-visual-replies">{fmt(story.replies)} replies</span>}
  </button>;
}

export function MediaPreviewModal({post,story,onClose}:{post:Post|null;story:Story|null;onClose:()=>void}){
  const [player,setPlayer]=useState(false);
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
  const instagram=post?.platform==="instagram";
  const code=post?postCode(post):"";
  const embedUrl=instagram&&code?
    "https://www.instagram.com/"+(post!.format==="Reel"?"reel":"p")+"/"+encodeURIComponent(code)+"/embed/":"";
  const external=post?.permalink??story?.permalink??"";

  return <div className="media-shade" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="media-dialog" role="dialog" aria-modal="true" aria-label={"Preview: "+name}>
      <button className="media-close" type="button" ref={closeRef} onClick={onClose} aria-label="Close preview"><X size={20}/></button>
      <div className="media-large">
        {player&&embedUrl?
          <iframe key={embedUrl} title={"Instagram "+name} src={embedUrl} loading="lazy" allow="fullscreen; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin"/>:
          <Cover src={cover} localSrc={post?localPostCover(post):localStoryCover(story!)} alt={"Original Metricool cover: "+name} mode={post?(post.format==="Reel"?"reel":"carousel"):"story"} loading="eager"/>
        }
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
          {embedUrl&&!player&&<button className="watch-button" type="button" onClick={()=>setPlayer(true)}><Play size={15} fill="currentColor"/>{post?.format==="Reel"?"Watch Reel":"Browse carousel"}</button>}
          {external&&<a className="source-button" href={external} target="_blank" rel="noopener noreferrer">Open original <ExternalLink size={14}/></a>}
        </div>
        {player&&<p className="media-note">Instagram controls this player. If it doesn't load, use Open original.</p>}
        {story&&<p className="media-note">Story previews are from the saved Metricool export. Instagram's original Story link may have expired.</p>}
        {post?.platform==="facebook"&&cover&&<p className="media-note">Preview image from the same-titled Instagram creative; Facebook metrics shown separately.</p>}
      </div>
    </section>
  </div>;
}
