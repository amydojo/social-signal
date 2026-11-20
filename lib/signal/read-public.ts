import {createClient} from "@supabase/supabase-js";
import {parsePublishedReport,type PublicWeek} from "./publication";

/**
 * Public read-only server access. No login, service-role key or writes.
 * The published table is the ONLY report table readable to the anon role.
 * A source failure never manufactures zeros or overwrites prior reports.
 */
export async function loadPublishedWeeks():Promise<PublicWeek[]>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return [];
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
      return [];
    }
    const seen=new Set<string>();
    return (data??[]).map(parsePublishedReport).filter((w):w is PublicWeek=>{
      if(!w||seen.has(w.weekStart))return false;
      seen.add(w.weekStart);return true;
    });
  }catch{
    console.error("Public reporting fetch unavailable");
    return [];
  }
}
