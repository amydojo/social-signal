import SignalDashboard from "./dashboard";
import {snapshot,posts,stories,coverage,socialDaily,adsDaily,insights,experiments} from "./report-data";

/**
 * SIGNAL is intentionally public and read-only at the owner's request.
 * Data in this release comes from a selected, reviewed weekly Metricool
 * export; private Supabase tables remain protected by row-level security.
 */
export default function Home() {
  return <SignalDashboard
    snapshot={snapshot}
    weeks={[snapshot]}
    posts={posts}
    stories={stories}
    coverage={coverage}
    socialDaily={socialDaily}
    adsDaily={adsDaily}
    insights={insights}
    experiments={experiments}
  />;
}
