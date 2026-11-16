# SIGNAL / OPUS — Operations and access

## Deployment
- GitHub: https://github.com/amydojo/social-signal
- Vercel project: social-signal (Amy Do's projects)
- Canonical production site: https://social-signal-amy-dos-projects.vercel.app (old iota alias redirects here)
- Supabase project: social-signal, project ref `ziohpcywjirynydjhgoe` (US West)
- Current status: authenticated dashboard, one imported Metricool snapshot (2026-11-09 through 2026-11-13). **Not live synced**.

## Access activation
1. In Supabase Dashboard > Authentication > URL Configuration, set **Site URL** to `https://social-signal-amy-dos-projects.vercel.app` and add **Redirect URL** `https://social-signal-amy-dos-projects.vercel.app/auth/callback` (and `https://social-signal-amy-dos-projects.vercel.app/auth/confirm` if using token-hash email templates).
2. In the deployed app, use the email sign-in link (or create a password-based Supabase Auth user in the Supabase Dashboard and use Password login).
3. Signing in creates an Auth identity, **not** reporting permission.
4. To approve an owner after their Auth user exists, execute this in the Supabase SQL Editor (replace the email):
   ```sql
   insert into public.signal_members(user_id, role)
   select id, 'owner' from auth.users where lower(email) = lower('owner@example.com')
   on conflict (user_id) do update set role = excluded.role;
   ```
   To approve Dr. Frew, replace `'owner'` with `'viewer'` and use his verified sign-in email. Do **not** approve an address before checking who controls it.
5. Vercel currently has Deployment Protection / SSO enabled. Before external viewers can access the app, adjust deployment access deliberately and confirm application login/RLS protection remains in place.

## Security
- The public website does not return reporting data to unauthenticated users.
- All `public.signal_*` tables have RLS enabled. `anon` has **no SELECT permission**, and authenticated users must have a matching `signal_members` row.
- Only an approved `owner` can write snapshots, posts, insights, or experiments through the data API. Viewers can read approved OPUS data.
- Supabase project uses a publishable browser key. Never use a service-role key in client code.
- **The GitHub repository is currently public.** Change repository visibility to Private under GitHub Settings > General > Danger Zone before treating the project or its earlier commits as confidential. Earlier history included the first performance snapshot inline in application source. Changing visibility does not erase copies already obtained.

## Reporting quality
- Source Metricool, captured Nov 13, 2026, at 1:57 PM PST.
- Two verified Instagram Reels, ten Stories, five Story replies.
- Account-level coverage only Nov 9–11. Do not claim complete cross-channel performance or booking attribution.
- Weekly data is stored in `signal_snapshots`; individual posts in `signal_posts`; editorial analysis in `signal_insights`; creative test hypotheses in `signal_experiments`.
- Imports are currently controlled SQL writes; a self-service validated import UI and Metricool API sync are **not yet built**.

## Operating principle
Keep OPUS's reporting data separate from the product's source code and secret credentials. Preserve capture times, missing data, and historical versions.

## Nov 16 sign-in loop fix
- Supabase auth logs showed an email magic link redirecting to the configured Site URL root, not to `/auth/callback`. Older middleware discarded the `?code=` on root and sent users back to login.
- Middleware now accepts a returned `code` at root and forwards it to the callback to exchange for a cookie-backed session.
- The old iota Vercel alias redirects to the canonical production origin before users request a login email, so PKCE verifier cookies are scoped to the same origin as the returned link.
- Request and open the magic link in the SAME browser, especially on iPhone. If a mail client opens a different browser, the PKCE cookie may be missing. Link scanners and repeated clicks can consume a one-use magic link.
- Supabase Auth URL Configuration should ultimately allowlist the exact callback `https://social-signal-amy-dos-projects.vercel.app/auth/callback`, even though the root fallback is handled.
