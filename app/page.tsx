import SignalDashboard, { type Snapshot, type Post, type Insight, type Experiment } from "./dashboard";

/**
 * Read-only, explicitly public preview.
 * Data is a historic, verified Metricool snapshot already used in the
 * reporting prototype. No authenticated Supabase tables, API tokens,
 * CRM records, personal information, or server secrets are exposed.
 * New imports to Supabase do NOT automatically become public.
 */
const snapshot: Snapshot = {
  id: "public-2026-11-09",
  week_start: "2026-11-09",
  week_end: "2026-11-13",
  captured_at: "2026-11-13T21:57:00Z",
  source: "Metricool",
  reel_views: 1072,
  reel_interactions: 33,
  story_count: 10,
  story_replies: 5,
  account_data_through: "2026-11-11",
  coverage_notes: "Public read-only preview of the Nov 9–13 snapshot. Instagram Reel and Story numbers captured Nov 13 at 1:57 p.m. PT. Account-level metrics only cover Nov 9–11; TikTok, YouTube, GBP and attribution remain incomplete. Not live data.",
};

const posts: Post[] = [
  {
    id: "reel-nov-09",
    published_on: "2026-11-09",
    title: "A consultation is also about what you want to keep",
    permalink: "https://www.instagram.com/reel/Dfiwcicsux9/",
    platform: "instagram",
    views: 477,
    reach: 323,
    likes: 21,
    comments: 1,
    shares: 1,
    saves: null,
    interactions: 23,
    skip_3s_pct: 46.9,
    avg_watch_seconds: 8.038,
  },
  {
    id: "reel-nov-12",
    published_on: "2026-11-12",
    title: "A scar cannot show everything happening underneath",
    permalink: "https://www.instagram.com/reel/DfqeQMZMKqR/",
    platform: "instagram",
    views: 595,
    reach: 463,
    likes: 10,
    comments: 0,
    shares: 0,
    saves: 0,
    interactions: 10,
    skip_3s_pct: 34.9,
    avg_watch_seconds: 8.329,
  },
];

const insights: Insight[] = [
  {
    id: "finding-1",
    kind: "finding",
    position: 1,
    title: "Specific surgical detail held early attention",
    body: "The Nov 12 scar Reel had a 34.9% three-second skip rate versus 46.9% for the Nov 9 consultation Reel. A single comparison is directional, not proof of causation.",
  },
  {
    id: "finding-2",
    kind: "finding",
    position: 2,
    title: "Consultation content generated more interaction",
    body: "The Nov 9 consultation Reel had 23 interactions versus 10 for the scar Reel despite fewer views.",
  },
  {
    id: "action-1",
    kind: "action",
    position: 1,
    title: "Test specific patient questions",
    body: "Open the next surgical-detail Reel with a tangible patient question and measure early retention.",
  },
  {
    id: "action-2",
    kind: "action",
    position: 2,
    title: "Build a save-worthy takeaway",
    body: "Give viewers a practical question to bring to their consultation and track saves and shares.",
  },
  {
    id: "action-3",
    kind: "action",
    position: 3,
    title: "Verify consultation routing",
    body: "Confirm how comments and DMs convert to qualified inquiries before reporting bookings.",
  },
  {
    id: "caveat-1",
    kind: "caveat",
    position: 1,
    title: "Attribution unverified",
    body: "No post-level consultation or booking attribution exists in this snapshot; other channels remain incomplete.",
  },
];

const experiments: Experiment[] = [
  {
    id: "experiment-1",
    title: "Specific openings versus broad educational hooks",
    hypothesis: "Starting with a concrete surgical observation may reduce early skips versus broad educational framing.",
    status: "proposed",
    notes: "Compare three similar Reels on retention, saves, and qualified inquiries. No causal claim yet.",
  },
];

export default function Home() {
  return (
    <SignalDashboard
      snapshot={snapshot}
      weeks={[snapshot]}
      posts={posts}
      insights={insights}
      experiments={experiments}
      role="public"
      email=""
    />
  );
}
