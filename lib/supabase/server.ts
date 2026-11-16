import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createSignalServerClient() {
  const store = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SIGNAL requires Supabase configuration.");
  return createServerClient(url, key, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(values) {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server components cannot set cookies; middleware handles refresh. */ }
      },
    },
  });
}
