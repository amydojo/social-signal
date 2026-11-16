import { postCoverUrls, storyCoverUrls } from "../../media-source";

/**
 * Snapshot Instagram media at build time.
 * Metricool's social CDN URLs are time-limited, so the production build
 * stores response bytes as static route output when the origin is accessible.
 * Public image IDs are allowlisted; this route is not a URL proxy.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

const images: Record<string,string> = {
  ...Object.fromEntries(Object.entries(postCoverUrls).map(([id,url]) => ["p-"+id,url])),
  ...Object.fromEntries(Object.entries(storyCoverUrls).map(([id,url]) => ["s-"+id,url])),
};

export function generateStaticParams() {
  return Object.keys(images).map(id=>({id}));
}

export async function GET(
  _request: Request,
  {params}:{params:Promise<{id:string}>}
) {
  const {id}=await params;
  const remote=images[id];
  if (!remote) return new Response("Not found",{status:404});
  try {
    const parsed=new URL(remote);
    // Only archive original, public Instagram CDN cover images.
    if(parsed.protocol!=="https:"||!parsed.hostname.endsWith(".cdninstagram.com"))
      return new Response("Not found",{status:404});

    const upstream=await fetch(remote,{
      headers:{
        Accept:"image/avif,image/webp,image/jpeg,image/*",
        "User-Agent":"Mozilla/5.0 SIGNAL-Media-Snapshot"
      },
      cache:"force-cache",
    });
    if(!upstream.ok)return new Response("Image temporarily unavailable",{status:404});
    const type=upstream.headers.get("content-type")??"";
    if(!type.startsWith("image/"))return new Response("Invalid media type",{status:404});
    const data=await upstream.arrayBuffer();
    if(data.byteLength===0||data.byteLength>12*1024*1024)
      return new Response("Invalid image size",{status:404});

    return new Response(data,{
      headers:{
        "Content-Type":type,
        "Cache-Control":"public, max-age=31536000, immutable",
        "X-Content-Type-Options":"nosniff",
      },
    });
  }catch{
    return new Response("Image temporarily unavailable",{status:404});
  }
}
