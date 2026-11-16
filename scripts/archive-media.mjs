/**
 * Archive published Instagram thumbnails from the reviewed Metricool manifest.
 * Images are committed to the repository, so UI never relies on expiring
 * CDN URLs after a successful archive. Only public provider originals.
 *
 * Run: node scripts/archive-media.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const manifest=JSON.parse(await fs.readFile("media-archive-manifest.json","utf8"));
const assets=manifest.assets;
if(!Array.isArray(assets)||assets.length>500)throw new Error("Unexpected archive manifest");
const root=path.resolve("public/media/archive");
await fs.mkdir(root,{recursive:true});
const output=[];
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

function allowedSource(value){
 const u=new URL(value);
 return u.protocol==="https:" &&
   (u.hostname==="social-signal-amy-dos-projects.vercel.app" ||
    u.hostname==="social-signal-iota.vercel.app" ||
    u.hostname.endsWith(".cdninstagram.com"));
}
function validJPEG(buffer){
 return buffer.length>400 && buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff;
}
async function getImage(url){
 for(let i=0;i<3;i++){
  try{
   const resp=await fetch(url,{redirect:"follow",signal:AbortSignal.timeout(25000),
    headers:{"user-agent":"Mozilla/5.0 (compatible; SIGNAL-Archive/1.0)","accept":"image/jpeg,image/*;q=0.9","referer":"https://www.instagram.com/"}});
   if(!resp.ok)throw new Error("HTTP "+resp.status);
   const length=Number(resp.headers.get("content-length")||0);
   if(length>12_000_000)throw new Error("Image too large");
   const buffer=Buffer.from(await resp.arrayBuffer());
   if(buffer.length>12_000_000||!validJPEG(buffer))throw new Error("Invalid JPEG response");
   return buffer;
  }catch(err){
   if(i===2)throw err;
   await sleep((i+1)*1500);
  }
 }
 throw new Error("All attempts failed");
}
for(const asset of assets){
 const file=asset.path;
 if(!/^public\/media\/archive\/[a-zA-Z0-9_-]+\.jpg$/.test(file))
  throw new Error("Unsafe destination path: "+file);
 if(!allowedSource(asset.url))throw new Error("Unsafe source: "+asset.url);
 const outPath=path.resolve(file);
 if(!outPath.startsWith(root+path.sep))throw new Error("Invalid archive path");
 try{
  let buffer;
  try{
   const existing=await fs.readFile(outPath);
   if(validJPEG(existing))buffer=existing;
  }catch{ /* missing is normal */ }
  if(!buffer){
   buffer=await getImage(asset.url);
   const temporary=outPath+".tmp";
   await fs.writeFile(temporary,buffer);
   await fs.rename(temporary,outPath);
  }
  const sha256=crypto.createHash("sha256").update(buffer).digest("hex");
  output.push({id:asset.id,source_link:asset.post_url||null,path:"/"+file.slice("public/".length),status:"saved",bytes:buffer.length,sha256});
  console.log("SAVED "+file+" ("+buffer.length+" bytes)");
 }catch(error){
  output.push({id:asset.id,source_link:asset.post_url||null,path:"/"+file.slice("public/".length),status:"unavailable",error:String(error.message||error).slice(0,250)});
  console.warn("UNAVAILABLE "+file+": "+String(error.message||error));
 }
}
const report={archived_on:new Date().toISOString(),source:"Metricool image URLs and previously cached SIGNAL post thumbnails",
 total:output.length,saved:output.filter(x=>x.status==="saved").length,
 unavailable:output.filter(x=>x.status!=="saved").length,files:output};
await fs.writeFile(path.join(root,"index.json"),JSON.stringify(report,null,2)+"\n");
console.log("Archive summary: "+report.saved+"/"+report.total+" saved");
