import {NextResponse,type NextRequest} from "next/server";
/** Read-only SIGNAL and outcomes reports require no Supabase Auth cookie. 
 * Owner-only write actions still enforce auth and RLS independently. */
export function middleware(request:NextRequest){
  if(request.nextUrl.hostname==="social-signal-iota.vercel.app"){
    const destination=new URL(request.nextUrl.pathname+request.nextUrl.search,
      "https://social-signal-amy-dos-projects.vercel.app");
    return NextResponse.redirect(destination,308);
  }
  return NextResponse.next();
}
export const config={matcher:["/:path*"]};
