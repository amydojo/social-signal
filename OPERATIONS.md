# SIGNAL / OPUS — Operations and access

## Deployment
- GitHub: https://github.com/amydojo/social-signal
- Vercel project: social-signal (Amy Do's projects)
- Production alias: https://social-signal-iota.vercel.app
- Supabase project: social-signal, project ref `ziohpcywjirynydjhgoe` (US West)
- Current status: authenticated dashboard, one imported Metricool snapshot (2026-11-09 through 2026-11-13). **Not live synced**.

## Access activation
1. In Supabase Dashboard > Authentication > URL Configuration, set **Site URL** to `https://social-signal-iota.vercel.app` and add **Redirect URL** `https://social-signal-iota.vercel.app/auth/callback` (and `https://social-signal-iota.vercel.app/auth/confirm` if using token-hash email templates).
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
