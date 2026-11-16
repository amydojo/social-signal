import { createBrowserClient } from "@supabase/ssr";

/**
 * @supabase/ssr persists the session in browser cookies and automatically
 * refreshes expired access tokens. Never use the service-role key here.
 */
export function createSignalBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SIGNAL authentication is not configured.");
  return createBrowserClient(url, key);
}
