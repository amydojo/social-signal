import {createClient} from "@supabase/supabase-js";
import {parsePublishedReport,type PublicWeek} from "./publication";

export type PublicReadState="live"|"unavailable"|"empty"|"invalid"|"partial";
export type PublicReadResult={weeks:PublicWeek[];state:PublicReadState};

/**
 * Public read-only server access; failures never masquerade as a measured zero.
 * A schema-invalid row is never used, and a live-data outage is distinguishable
 * from an empty legitimate publication or historical fallback.
 */
export async function loadPublishedWeeksWithState():Promise<PublicReadResult>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return {weeks:[],state:"unavailable"};
  try{
    const client=createClient(url,key,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    });
    const {data,error}=await client.from("signal_published_reports")
      .select("week_start,week_end,status,data_through,captured_at,schema_version,revision,payload")
      .eq("published",true).order("week_start",{ascending:false}).limit(60)
      .abortSignal(AbortSignal.timeout(5000));
    if(error){
      console.error("Public reporting fetch failed:",error.code??"unknown");
      return {weeks:[],state:"unavailable"};
    }
    if(!data?.length)return {weeks:[],state:"empty"};
    const seen=new Set<string>();
    let rejected=0;
    const weeks:PublicWeek[]=[];
    for(const row of data){
      const week=parsePublishedReport(row);
      if(!week||seen.has(week.weekStart)){rejected++;continue;}
      seen.add(week.weekStart);
      weeks.push(week);
    }
    return {weeks,state:rejected?(weeks.length?"partial":"invalid"):"live"};
  }catch{
    console.error("Public reporting fetch unavailable");
    return {weeks:[],state:"unavailable"};
  }
}
export async function loadPublishedWeeks():Promise<PublicWeek[]>{
  return (await loadPublishedWeeksWithState()).weeks;
}
