import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * The Supabase project currently falls back to this Site URL for magic links.
 * All authentication must start and end on the SAME origin so the PKCE
 * verifier cookie can be read when the code is exchanged.
 */
const CANONICAL_ORIGIN = "https://social-signal-amy-dos-projects.vercel.app";

function safeRedirect(destination: URL, response?: NextResponse) {
  const redirect = NextResponse.redirect(destination);
  response?.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
  redirect.headers.set("Cache-Control", "private, no-store");
  redirect.headers.set("Referrer-Policy", "no-referrer");
  return redirect;
}

export async function middleware(request: NextRequest) {
  const incoming = request.nextUrl;
  const pathname = incoming.pathname;

  // Avoid separate auth cookie jars between the two published SIGNAL domains.
  // Redirect only the known alternative production alias, not protected previews.
  if (incoming.hostname === "social-signal-iota.vercel.app") {
    return safeRedirect(new URL(pathname + incoming.search, CANONICAL_ORIGIN));
  }

  // Supabase currently redirects email magic links to the Site URL homepage,
  // even if the requested /auth/callback URL is absent from its allowlist.
  // Exchange the authorization code before the general auth guard runs.
  if (pathname === "/" && incoming.searchParams.has("code")) {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", incoming.searchParams.get("code")!);
    return safeRedirect(callback);
  }
  if (pathname === "/" && (incoming.searchParams.has("error") || incoming.searchParams.has("error_code"))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("error", incoming.searchParams.get("error_code") || incoming.searchParams.get("error") || "expired-link");
    return safeRedirect(login);
  }

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
    return safeRedirect(new URL("/login?configuration=missing", request.url));
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
  if (user && pathname === "/login") return safeRedirect(new URL("/", request.url), response);
  if (!user && !publicRoute) return safeRedirect(new URL("/login", request.url), response);

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest).*)"] };
