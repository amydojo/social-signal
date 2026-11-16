import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  if (!token_hash || !type) return NextResponse.redirect(new URL("/login?error=invalid-link", request.url));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.redirect(new URL("/login?configuration=missing", request.url));
  const response = NextResponse.redirect(new URL("/", request.url));
  const client = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(values) { values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
    },
  });
  const { error } = await client.auth.verifyOtp({ token_hash, type });
  if (error) return NextResponse.redirect(new URL("/login?error=expired-link", request.url));
  return response;
}
