import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const client = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(values) { values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
    },
  });
  await client.auth.signOut();
  return response;
}
