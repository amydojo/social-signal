import { NextResponse, type NextRequest } from "next/server";

/**
 * SIGNAL's public read-only dashboard has no login gate.
 * Only one production URL is used, so saved Home Screen shortcuts and
 * existing links land on the same version.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.hostname === "social-signal-iota.vercel.app") {
    const destination = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      "https://social-signal-amy-dos-projects.vercel.app"
    );
    return NextResponse.redirect(destination, 308);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
