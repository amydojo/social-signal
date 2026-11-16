import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicRoute = pathname.startsWith("/login") || pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/confirm");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    if (publicRoute) return NextResponse.next();
    return NextResponse.redirect(new URL("/login?configuration=missing", request.url));
  }
  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user && !publicRoute) return NextResponse.redirect(new URL("/login", request.url));
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"] };
