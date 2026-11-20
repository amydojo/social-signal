import {NextResponse,type NextRequest} from "next/server";
import {createServerClient} from "@supabase/ssr";

/** /frew/owner is a public, read-only preview; authentication is still
 * required by the separate private CRM write actions. */
export async function middleware(request:NextRequest){
  if(request.nextUrl.hostname==="social-signal-iota.vercel.app"){
    const destination=new URL(request.nextUrl.pathname+request.nextUrl.search,
      "https://social-signal-amy-dos-projects.vercel.app");
    return NextResponse.redirect(destination,308);
  }
  if(request.nextUrl.pathname==="/frew/owner"||
      !request.nextUrl.pathname.startsWith("/frew/owner")||
      request.nextUrl.pathname.startsWith("/frew/owner/login")){
    return NextResponse.next();
  }
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return NextResponse.next();
  let response=NextResponse.next({request});
  const supabase=createServerClient(url,key,{
    cookies:{
      getAll(){return request.cookies.getAll();},
      setAll(items){
        items.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }
    }
  });
  await supabase.auth.getUser();
  return response;
}
export const config={matcher:["/:path*"]};
