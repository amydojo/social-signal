# OPUS SIGNAL — publication boundary

The public `/` and `/frew` pages are read-only. Existing protected `signal_*`
source tables retain RLS and are **not** opened to anonymous visitors.
The separate `/frew/owner` route uses Supabase Auth plus owner membership and RLS
to record manually checked weekly aggregate consultation counts only. It never
publishes private counts, patient records or internal approvals.

The only anonymous reporting read is `signal_published_reports` with
`published=true`, via `lib/signal/read-public.ts`. It contains explicitly
approved, source-backed snapshots, not full Metricool exports or CRM material.

## Publication contract

Each Monday week is a distinct immutable reporting period. One row per week,
revisioned with full prior payload retained privately. The `payload` must have:

- `posts`: array of public post/story objects with IDs, published dates,
  platform/account, title, permalink, format, metrics, optional thumbnailPath
  and coverUrl. Absent measurement is `null`, never inferred 0.
- `channels`: array with specific source, reporting period, and metric keys
  and values. Do not sum nonadditive audience reach, views and impression types.
- `overview`: optional editorial statement, summary, action and up to
  five indicators, all vetted as public-safe.
- `diagnostics`: reserved for validated richer performance facts.
- `coverage`: reserved for channel connection/data-missing status.
- `acquisition`: optional, reviewed **historical cohort** aggregation only.
  Includes source-evidence class (campaign tag, click ID, tracked link,
  first-session attribution), counts and stage totals, no contact identifiers.
  Cohorts can overlap; never add routes into an all-channel lead total.
- `overview.reviewedAt`: optional ISO date marking a human-verified editorial
  interpretation. The public Weekly Pulse uses reviewed conclusions; ordinary
  auto summaries do not silently override them. Preserve reviewed narrative
  across daily Metricool refreshes until genuinely superseded.

Do not copy raw CRM rows, unpublished content, email addresses, auth identities,
access tokens or raw, unreviewed analytics payloads into the public table.

## Publishing safely

1. Retrieve fresh Metricool channel *and* video/story-level fields, preserving
   provider timestamps and the correct Monday–Sunday reporting week.
2. Check identities, units, missing vs true zero, cumulative vs period values,
   freshness, cross-channel comparability and duplicates.
3. Assemble the **public-safe projection**. Validate it against the runtime
   `parsePublishedReport` contract; publish the entire reporting week atomically
   with `public.publish_signal_week` using a trusted database SQL connection.
4. Re-read the published payload anonymously, then check `/` and `/frew`.
   A stale snapshot must not replace a newer one. Existing snapshots retain
   revision history in `signal_publication_history`.
5. If a channel returns no data, preserve the previous confirmed value with its
   actual captured-as-of date if clearly labeled; otherwise use `null`.

Until a durable external Metricool credential/integration exists, the ChatGPT
daily automation can perform the extract/validate/publish operation via connected
Metricool + Supabase tools. Vercel **cannot** execute the ChatGPT connector by
itself. Do not falsely claim that a self-contained service-side vendor sync exists.

## Rollback

Public reads fall back to previously verified static published content when
Supabase or the publication schema is unavailable. The protected source and
historical revisions are untouched. To roll back presentation, revert the
feature PR. To unpublish a particular week, a trusted owner may set
`published=false`; the row then becomes invisible to anonymous clients.

## Known follow-up: media

Prefer permanent local `/media/archive/` images. Third-party CDN `coverUrl`
tokens can expire and should be archived on ingestion. Unavailable media
must render a placeholder, never a neighboring Story's image.

## CRM attribution import contract

The private `signal_private.acquisition_snapshots` relation stores dated
aggregate evidence and reconciliation only. Its schema has no anonymous API
access. Never store CRM contact rows, IDs, emails, phone numbers, appointment
notes or unrestricted JSON exports in SIGNAL. De-duplicate source records in
the upstream audit *before* publishing counts. Distinguish contacts, CRM
opportunities, platform actions and confirmed appointments. A current CRM stage
is **not** an appointment event log. Do not infer weekly arrivals from older
contacts or compare progression without comparable cohort maturity.

The public `acquisition` field in a weekly publication is only a pointer to
a labeled, reviewed historical aggregate baseline and must remain marked
`historical_cohort`. A daily sync must carry it forward unchanged, or obtain
a newer reviewed baseline before replacing it. Do not copy this historical
cohort into newly published weeks as weekly acquisition results.

Verified weekly outcomes remain in the **owner-only**
`public.signal_owner_outcomes` relation and require manual confirmation;
the anonymous Weekly Pulse must not query the private table.

The database publisher also preserves the existing, reviewed `overview`
and `acquisition` for **the same week** when an automated refresh omits them
or attempts to replace them with an older as-of date. A new human-reviewed
overview with the same/newer date may intentionally supersede it. To retire
an erroneous reviewed finding, use a trusted explicit correction and preserve
the audit trail; never silently erase it through the daily sync.
