/**
 * Archive only already-published OPUS creative imagery.
 * Runs without vendor credentials; private reporting/CRM data is unreachable.
 * Pulls the public-safe /api/publications projection with exact story/post URLs.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const feed=process.env.SIGNAL_PUBLICATION_FEED||"https://opussignal.vercel.app/api/publications";
const target=path.resolve("public/media/archive");
const indexPath=path.join(target,"index.json");
await fs.mkdir(target,{recursive:true});

function trusted(url){
  try{
    const u=new URL(url);
    return u.protocol==="https:"&&
      (u.hostname.endsWith(".cdninstagram.com")||
       u.hostname.endsWith(".fbcdn.net"));
  }catch{return false;}
}
function pathFor(post){
  const url=post.url||"";
  const match=url.match(/instagram\\.com\\/(?:p|reel)\\/([^/]+)/);
  const story=url.match(/instagram\\.com\\/stories\\/[^/]+\\/(\\d+)/);
  if(story)return "story-"+story[1]+".jpg";
  if(match&&/^[a-zA-Z0-9_-]{5,35}$/.test(match[1]))return "ig-"+match[1]+".jpg";
  const hash=crypto.createHash("sha256").update(post.platform+"|"+url).digest("hex").slice(0,18);
  return "social-"+hash+".jpg";
}
function validJpeg(b){return b.length>400&&b[0]===255&&b[1]===216&&b[2]===255;}
async function getImage(url){
  let current=url;
  for(let redirect=0;redirect<4;redirect++){
    if(!trusted(current))throw Error("Untrusted media host");
    const res=await fetch(current,{
      redirect:"manual",
      signal:AbortSignal.timeout(15000),
      headers:{accept:"image/jpeg,image/*;q=0.9","user-agent":"Mozilla/5.0 (compatible; OPUS-SIGNAL/1.0)"}
    });
    if([301,302,303,307,308].includes(res.status)){
      current=new URL(res.headers.get("location")??"",current).href;
      continue;
    }
    if(!res.ok)throw Error("Source HTTP "+res.status);
    const size=Number(res.headers.get("content-length")||0);
    if(size>12000000)throw Error("Media too large");
    const bytes=Buffer.from(await res.arrayBuffer());
    if(bytes.length>12000000||!validJpeg(bytes))throw Error("Expected bounded JPEG image");
    return bytes;
  }
  throw Error("Too many redirects");
}
const res=await fetch(feed,{signal:AbortSignal.timeout(15000)});
if(!res.ok)throw Error("Published reporting feed unavailable: "+res.status);
const raw=await res.json();
if(raw.schemaVersion!==1||!Array.isArray(raw.weeks)||raw.weeks.length>80)
  throw Error("Unexpected public publication feed");
const manifest=JSON.parse(await fs.readFile(indexPath,"utf8").catch(()=>"{}"));
const byFile=new Map((manifest.assets??[]).filter(a=>typeof a.file==="string").map(a=>[a.file,a]));
const candidate=new Map();
for(const week of raw.weeks){
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(week.weekStart)||!Array.isArray(week.posts))continue;
 for(const post of week.posts){
   if(!post.url||!post.coverUrl||!trusted(post.coverUrl))continue;
   const name=pathFor(post);
   const file="/media/archive/"+name;
   if(!candidate.has(file))candidate.set(file,{name,file,post});
 }
}
if(candidate.size>500)throw Error("Too many images queued");
let added=0,failures=0;
for(const {name,file,post} of candidate.values()){
 const out=path.resolve(target,name);
 if(!out.startsWith(target+path.sep))throw Error("Unsafe archive path");
 try{
   const existing=await fs.readFile(out).catch(()=>null);
   if(existing&&validJpeg(existing))continue;
   const image=await getImage(post.coverUrl);
   await fs.writeFile(out+".tmp",image);
   await fs.rename(out+".tmp",out);
   byFile.set(file,{
     id:post.id,file,status:"saved",bytes:image.length,
     sha256:crypto.createHash("sha256").update(image).digest("hex")
   });
   added++;
   console.log("ARCHIVED "+file);
 }catch(e){
   failures++;
   console.warn("Could not archive "+name+": "+String(e.message).slice(0,100));
 }
}
if(added){
 const assets=[...byFile.values()].sort((a,b)=>a.file.localeCompare(b.file));
 const output={
   archived_at:new Date().toISOString(),source:"Approved published OPUS media URLs",
   total:assets.length,saved:assets.filter(a=>a.status==="saved").length,
   unavailable:assets.filter(a=>a.status!=="saved").length,assets
 };
 await fs.writeFile(indexPath,JSON.stringify(output,null,2)+"\n");
}
console.log("New media: "+added+"; unavailable at source: "+failures+"; indexed: "+byFile.size);
