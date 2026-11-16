import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Preserve any refreshed Supabase cookies on navigation redirects.
function redirectWithSession(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
  redirect.headers.set("Cache-Control", "private, no-store");
  return redirect;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicRoute =
    pathname === "/login" ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/confirm") ||
    pathname === "/manifest.webmanifest";

  if (pathname === "/manifest.webmanifest") return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    if (publicRoute) return NextResponse.next();
    return NextResponse.redirect(new URL("/login?configuration=missing", request.url));
  }

  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Keep the incoming request up to date for downstream Server Components.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser validates the session and rotates expired access tokens using
  // the refresh token stored in the browser's persistent session cookies.
  const {
    data: { user },
  } = await client.auth.getUser();

  // A returning, already-authenticated user should never see the login form.
  if (user && pathname === "/login") {
    return redirectWithSession(new URL("/", request.url), response);
  }
  if (!user && !publicRoute) {
    return redirectWithSession(new URL("/login", request.url), response);
  }

  // Authenticated pages and refreshed session cookies must not be CDN-cached.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest).*)"],
};
