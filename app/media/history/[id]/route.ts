import manifest from "../../../../media-archive-manifest.json";

/**
 * Temporary build-time image snapshot for historical content.
 * Prefer committed /media/archive/ assets. This static fallback is
 * generated while originals remain reachable and never acts as a proxy.
 */
export const dynamic="force-static";
export const dynamicParams=false;
const urls=Object.fromEntries(
 manifest.assets
 .filter(asset=>asset.id?.startsWith("hist-")&&asset.url?.startsWith("https://"))
 .map(asset=>[asset.id,asset.url])
);
export function generateStaticParams(){return Object.keys(urls).map(id=>({id}));}
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const src=urls[id];
 if(!src)return new Response("Not found",{status:404});
 try{
  const url=new URL(src);
  if(url.protocol!=="https:"||!url.hostname.endsWith(".cdninstagram.com"))
   return new Response("Not found",{status:404});
  const r=await fetch(src,{headers:{Accept:"image/jpeg,image/*"}});
  if(!r.ok)return new Response("Source unavailable",{status:404});
  const type=r.headers.get("content-type")??"";
  if(!type.startsWith("image/"))return new Response("Not an image",{status:404});
  const b=await r.arrayBuffer();
  if(b.byteLength===0||b.byteLength>10_000_000)return new Response("Image limit",{status:404});
  return new Response(b,{headers:{"Content-Type":type,"Cache-Control":"public,max-age=31536000,immutable","X-Content-Type-Options":"nosniff"}});
 }catch{return new Response("Source unavailable",{status:404});}
}
