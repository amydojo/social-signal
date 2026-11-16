import { redirect } from "next/navigation";
import { createSignalServerClient } from "../lib/supabase/server";
import SignalDashboard, { type Snapshot, type Post, type Insight, type Experiment } from "./dashboard";
export const dynamic = "force-dynamic";
export default async function Home({searchParams}:{searchParams:Promise<{week?:string}>}) {
  const supabase=await createSignalServerClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user) redirect("/login");
  const {data:member,error:memberError}=await supabase.from("signal_members").select("role").eq("user_id",user.id).maybeSingle();
  if(memberError) return <AccessMessage title="Unable to verify access" body="Membership verification failed. No report data has been loaded."/>;
  if(!member) return <AccessMessage title="Access pending approval" body="Your sign-in is confirmed, but this account is not yet approved for the OPUS workspace. Ask the SIGNAL owner to authorize your account."/>;
  const {data:rawWeeks,error:weeksError}=await supabase.from("signal_snapshots").select("id,week_start,week_end,captured_at,source,reel_views,reel_interactions,story_count,story_replies,account_data_through,coverage_notes").order("week_start",{ascending:false}).limit(52);
  if(weeksError) return <AccessMessage title="Reports unavailable" body="Could not load the reporting database. No fallback demo data will be shown."/>;
  const weeks=(rawWeeks??[]) as Snapshot[];
  const wanted=(await searchParams).week;
  const snapshot=weeks.find(w=>w.week_start===wanted)??weeks[0]??null;
  let posts:Post[]=[];
  let insights:Insight[]=[];
  const {data:expData,error:expError}=await supabase.from("signal_experiments").select("id,title,hypothesis,status,notes").order("created_at",{ascending:false}).limit(50);
  if(expError) return <AccessMessage title="Reports unavailable" body="One or more protected queries failed."/>;
  if(snapshot) {
    const [p,i]=await Promise.all([
      supabase.from("signal_posts").select("id,published_on,title,permalink,platform,views,reach,likes,comments,shares,saves,interactions,skip_3s_pct,avg_watch_seconds").eq("snapshot_id",snapshot.id).order("published_on",{ascending:true}),
      supabase.from("signal_insights").select("id,kind,position,title,body").eq("snapshot_id",snapshot.id).order("position",{ascending:true})
    ]);
    if(p.error||i.error) return <AccessMessage title="Reports unavailable" body="One or more protected queries failed."/>;
    posts=(p.data??[]) as Post[];insights=(i.data??[]) as Insight[];
  }
  return <SignalDashboard snapshot={snapshot} weeks={weeks} posts={posts} insights={insights} experiments={(expData??[]) as Experiment[]} role={member.role} email={user.email??"Approved member"}/>;
}
function AccessMessage({title,body}:{title:string;body:string}) {
  return <main className="access-pending"><div className="eyebrow">SIGNAL / OPUS · PRIVATE</div><h1>{title}</h1><p>{body}</p><form action="/auth/signout" method="POST"><button type="submit">Sign out</button></form></main>;
}
