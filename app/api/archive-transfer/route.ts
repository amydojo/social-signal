import manifest from "../../../media-archive-manifest.json";
import {createHash} from "node:crypto";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/**
 * One-time archive transfer, restricted to identifiers in the checked-in
 * public-media manifest. No user input is used as a fetch URL.
 * Remove this route after the archival commit is verified.
 */
export async function GET(request:Request){
 const query=new URL(request.url).searchParams;
 const treeSha=query.get("commit");
 if(treeSha){
  if(!/^[0-9a-f]{40}$/.test(treeSha))return Response.json({error:"Invalid commit"},{status:400});
  const u="https://api.github.com/repos/amydojo/social-signal/git/commits/"+treeSha;
  try{
   const r=await fetch(u,{headers:{"Accept":"application/vnd.github+json","User-Agent":"SIGNAL-Archive/1.0"},cache:"no-store"});
   if(!r.ok)return Response.json({error:"Commit lookup unavailable",status:r.status},{status:502});
   const d=await r.json();
   return Response.json({commit:treeSha,tree_sha:d.tree?.sha??null},{headers:{"Cache-Control":"no-store"}});
  }catch{return Response.json({error:"Commit lookup failed"},{status:502})}
 }
 const id=query.get("id");
 const entry=manifest.assets.find(a=>a.id===id);
 if(!entry)return Response.json({error:"Unknown media"},{status:404});
 try{
  const u=new URL(entry.url);
  if(u.protocol!=="https:"||!(u.hostname.endsWith(".cdninstagram.com")||u.hostname==="social-signal-amy-dos-projects.vercel.app"))
    return Response.json({error:"Origin denied"},{status:403});
  const r=await fetch(entry.url,{signal:AbortSignal.timeout(25000),headers:{
   "User-Agent":"Mozilla/5.0 SIGNAL-Archive/1.0","Accept":"image/jpeg,image/*"
  },cache:"no-store"});
  if(!r.ok)return Response.json({error:"Origin returned "+r.status},{status:502});
  const b=Buffer.from(await r.arrayBuffer());
  if(b.length<400||b.length>8_000_000||b[0]!==255||b[1]!==216||b[2]!==255)
   return Response.json({error:"Not a valid JPEG",bytes:b.length},{status:502});
  return Response.json({id,path:entry.path,bytes:b.length,sha256:createHash("sha256").update(b).digest("hex"),base64:b.toString("base64")},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return Response.json({error:String(e).slice(0,240)},{status:502})}
}
