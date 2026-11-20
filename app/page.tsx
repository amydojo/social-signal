import SignalDashboard from "./dashboard";
import {snapshot,posts,stories,coverage,socialDaily,adsDaily,insights,experiments} from "./report-data";
import {loadPublishedWeeks} from "../lib/signal/read-public";
import {studioSnapshots,studioPosts,studioStories,studioCoverage,studioInsights} from "../lib/signal/studio-adapter";
import {weekStartFor} from "./frew/frew-selection";

/** Public, read-only Studio. Data is published explicitly, not sourced from
 * private tables. No re-deploy needed for a newly approved weekly snapshot.
 * Static verified source extracts remain the fallback during API outages.
 */
export const dynamic="force-dynamic";

export default async function Home(){
  const published=await loadPublishedWeeks();
  const revised=published.length?studioSnapshots(published):[];
  const latest=revised[0]??snapshot;
  const replaced=new Set(published.map(p=>p.weekStart));
  const combinedPosts=published.length?[
    ...posts.filter(p=>!replaced.has(weekStartFor(p.published_on)??"")),
    ...studioPosts(published)
  ]:posts;
  const combinedStories=published.length?[
    ...stories.filter(s=>!replaced.has(weekStartFor(
      s.published_at_raw.slice(0,4)+"-"+s.published_at_raw.slice(4,6)+"-"+s.published_at_raw.slice(6,8)
    )??"")),
    ...studioStories(published)
  ]:stories;
  return <SignalDashboard
    snapshot={latest}
    weeks={revised.length?revised:[snapshot]}
    posts={combinedPosts}
    stories={combinedStories}
    coverage={published.length?studioCoverage(published[0]):coverage}
    socialDaily={socialDaily}
    adsDaily={adsDaily}
    insights={published.length?studioInsights(published[0]):insights}
    experiments={experiments}
  />;
}
