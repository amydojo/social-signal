/**
 * Pure, source-safe identifiers for durable SIGNAL media.
 * Preserve exact Instagram IDs; never manufacture a filename from a title.
 */
import crypto from "node:crypto";

export function isPublishedWeek(value){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+"T12:00:00Z");
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value&&date.getUTCDay()===1;
}

export function archivedFilenameForPost(post){
  const url=post.url||"";
  const u=new URL(url);
  if(u.hostname==="instagram.com"||u.hostname==="www.instagram.com"){
    const story=u.pathname.match(/^\/stories\/[^/]+\/(\d+)\/?$/);
    if(story)return "story-"+story[1]+".jpg";
    const postId=u.pathname.match(/^\/(?:p|reel)\/([a-zA-Z0-9_-]{5,35})\/?$/);
    if(postId)return "ig-"+postId[1]+".jpg";
  }
  const hash=crypto.createHash("sha256").update(post.platform+"|"+url).digest("hex").slice(0,18);
  return "social-"+hash+".jpg";
}
