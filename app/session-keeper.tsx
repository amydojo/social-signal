"use client";

import { useEffect } from "react";
import { createSignalBrowserClient } from "../lib/supabase/browser";

/**
 * Keep the cookie-backed Supabase session current while the app is open
 * and when iOS Safari / the Home Screen app returns from the background.
 * Session persistence works across visits until explicit sign out, browser
 * data removal, or configured provider-side session expiry.
 */
export default function SessionKeeper() {
  useEffect(() => {
    const supabase = createSignalBrowserClient();
    const syncIfVisible = () => {
      if (document.visibilityState === "visible") {
        void supabase.auth.getSession();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") window.location.replace("/login");
    });

    document.addEventListener("visibilitychange", syncIfVisible);
    window.addEventListener("focus", syncIfVisible);
    void supabase.auth.getSession();

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", syncIfVisible);
      window.removeEventListener("focus", syncIfVisible);
    };
  }, []);

  return null;
}
