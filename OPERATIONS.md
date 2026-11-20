# OPUS SIGNAL — operational source of truth

Updated November 19, 2026. See also `lib/signal/README.md` for the database publication contract.

## Addresses and access

- **SIGNAL:** https://opussignal.vercel.app
- **Weekly Pulse:** https://opussignal.vercel.app/frew
- **Published data readback:** https://opussignal.vercel.app/api/publications
- **GitHub:** amydojo/social-signal (main deploys through Vercel)
- **Vercel:** project `prj_0sRMDNJOi4UC0d66uZ7Jr6fC7iiD`
- **Supabase:** project `ziohpcywjirynydjhgoe`

The public site is intentionally **read-only without login**, at the owner's request. It exposes selected reviewed social performance—not patient, lead/CRM, private internal approval, access-token, or otherwise sensitive information. Anybody with the URLs can read the published data. Never treat an obscure URL or `robots: noindex` as an authentication boundary.

No viewer sign-in is required for reporting or the lighthearted anonymous emoji stickers. Old auth callback routes and `signal_frew_stamps` remain for historical compatibility, not the public interaction.

## Data architecture (Nov 19 onwards)

**Connected Metricool analytics → explicit validation → protected publication SQL → published Supabase table → both websites.**

- `public.signal_published_reports` is the *only anonymous-readable reporting table*. RLS reads require `published=true`. Each record identifies one Monday–Sunday reporting week, last capture, status, revision, optional editorial overview, per-post/story items, per-account metrics, diagnostics/coverage and source-based media references.
- Private `signal_snapshots`, `signal_posts`, `signal_stories`, `signal_daily_social`, `signal_ads_daily`, `signal_members`, `signal_publication_history` and `signal_publication_runs` retain restricted access.
- `public.publish_signal_week(date,timestamptz,text,date,jsonb,boolean)` is an **explicit trusted publisher**, unavailable to anonymous/authenticated site users. It retains prior revisions, rejects older capture timestamps and treats identical replays idempotently. It never deletes a completed reporting week.
- `lib/signal/publication.ts` checks records for valid source weeks, metric types, safe URLs and field whitelists. `lib/signal/read-public.ts` reads the approved reports using only the public Supabase publishable key on the Next.js server. `lib/signal/studio-adapter.ts` feeds SIGNAL Studio. PULSE uses the same `PublicWeek` records.
- `/api/publications` returns only sanitized published data and explicitly disables HTTP caching, so new revisions can be verified immediately.
- Historical reviewed extracts in the repository are a **fallback**, not the primary future publication path. Do not restart routine weekly editing in `app/report-data.ts` or `app/frew/frew-current-data.ts`; no code changes or deployment should be required for normal daily metrics.

## Daily data collection

The existing **SIGNAL Daily Sync** ChatGPT automation runs at about 8 AM Pacific. It is instructed to query the connected Metricool brand 7930515 and publish verified public-safe weekly rows using connected Supabase tools, then read back the live site. Its schedule and success depend on those connected tools being available in the automation environment.

**Important limitation:** Vercel does not have a Metricool API token or an independent vendor API cron job. We have not claimed a fully self-contained Metricool collector. A failed connector query or publish must leave the last validated snapshot intact and report the precise blocker. Never assert that a connection returned 0 posts just because its query returned no rows.

## Data integrity rules

1. Always use **published post date** to choose the Monday–Sunday report, and label partial weeks WTD. Keep source capture dates and per-account reporting windows.
2. Cumulative post views are not event views earned during that week. Story impressions are not unique people. Do not add unique reach across days. Platform conversion events are not verified consultation bookings.
3. Missing observations are **null/—**, never assumed zero. Only present 0 when the provider actually reports a measured zero.
4. Match channel identities exactly. The current linked YouTube channel identifies as Amy Do, not verified OPUS YouTube. Do not attribute private Dr. Frew/Results accounts to the single connected OPUS brand.
5. No private CRM, patient identity, unpublished account or sensitive source field in the public publication payload. Never expose service role credentials in frontend/runtime responses.
6. Changes to published weeks must have fresh evidence, use a newer capture timestamp, and keep the previous revision privately recoverable.
7. Prefer saved, immutable `/media/archive/` files; original provider thumbnail URLs can expire. The daily GitHub media-archive workflow preserves verified post/Story images when supplied in published records; missing frames stay honest placeholders.

## Testing and releases

For code changes, use an isolated branch, PR and **SIGNAL quality gate** (`npm test`, `npm run typecheck`, `npm run build`). Do not merge a failing build. Verify Vercel's READY commit and HTTP 200 for `/`, `/frew`, `/api/publications`, with correct latest week and no cross-week leakage. A data-only publication needs readback and verification but **no GitHub deployment**.

To stop a faulty public report, use a trusted SQL action to unpublish the affected week; RLS then hides it. Previous versions are preserved in `signal_publication_history`. For a UI regression, revert the PR/commit. Private source tables and sticker feedback must remain untouched.

The GitHub repository is currently **public**. Do not check credentials or private data into it. Changing visibility later will not erase material already exposed in earlier history.
