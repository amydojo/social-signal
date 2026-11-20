import {createClient} from "@supabase/supabase-js";

/** Public-safe, contact-level aggregates only. No names, contact IDs, or clinical notes. */
export type CRMWeek={
  weekStart:string;
  dataThrough:string;
  snapshotDate:string;
  total:number;
  website:number;
  meta:number;
  instagram:number;
  direct4d:number;
  other:number;
  paidSearch:number;
  paidSocial:number;
  organicSearch:number;
  socialMedia:number;
  directTraffic:number;
  referral:number;
  unattributed:number;
  backdatedImports:number;
};
export type CRMWeeklyRead={weeks:CRMWeek[];state:"live"|"unavailable"|"empty"|"partial"};
const count=(v:unknown)=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=0&&v<=1000000;
const day=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&
  !Number.isNaN(Date.parse(v+"T12:00:00Z"))&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v;
const daysBetween=(from:string,to:string)=>(Date.parse(to+"T12:00:00Z")-Date.parse(from+"T12:00:00Z"))/86400000;
function parseRow(value:unknown):CRMWeek|null{
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const r=value as Record<string,unknown>;
  if(!day(r.week_start)||!day(r.data_through)||!day(r.source_snapshot_date))return null;
  const fields=[
    "contact_count","website_first_access","meta_native","instagram_dm","direct_4d","other_intake",
    "first_paid_search","first_paid_social","first_organic_search","first_social_media",
    "first_direct_traffic","first_referral","first_unattributed","backdated_imports"
  ];
  if(fields.some(k=>!count(r[k])))return null;
  const week=r.week_start as string;
  const monday=new Date(week+"T12:00:00Z").getUTCDay()===1;
  if(!monday||daysBetween(week,r.data_through as string)<0||
    daysBetween(week,r.data_through as string)>6||
    (r.source_snapshot_date as string)<(r.data_through as string))return null;
  const total=r.contact_count as number;
  if(total!==["website_first_access","meta_native","instagram_dm","direct_4d","other_intake"]
      .reduce((n,k)=>n+(r[k] as number),0)||
    total!==["first_paid_search","first_paid_social","first_organic_search","first_social_media",
      "first_direct_traffic","first_referral","first_unattributed"]
      .reduce((n,k)=>n+(r[k] as number),0)||
    (r.backdated_imports as number)>total)return null;
  return {
    weekStart:week,
    dataThrough:r.data_through as string,
    snapshotDate:r.source_snapshot_date as string,
    total,
    website:r.website_first_access as number,
    meta:r.meta_native as number,
    instagram:r.instagram_dm as number,
    direct4d:r.direct_4d as number,
    other:r.other_intake as number,
    paidSearch:r.first_paid_search as number,
    paidSocial:r.first_paid_social as number,
    organicSearch:r.first_organic_search as number,
    socialMedia:r.first_social_media as number,
    directTraffic:r.first_direct_traffic as number,
    referral:r.first_referral as number,
    unattributed:r.first_unattributed as number,
    backdatedImports:r.backdated_imports as number
  };
}
/** Stored in the controlled reporting DB, not a GitHub data file. */
export async function loadCRMWeeklyHistory():Promise<CRMWeeklyRead>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return {weeks:[],state:"unavailable"};
  try{
    const client=createClient(url,key,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    });
    const {data,error}=await client.from("signal_crm_weekly_aggregates")
      .select("week_start,source_snapshot_date,data_through,contact_count,website_first_access,meta_native,instagram_dm,direct_4d,other_intake,first_paid_search,first_paid_social,first_organic_search,first_social_media,first_direct_traffic,first_referral,first_unattributed,backdated_imports")
      .order("week_start",{ascending:true}).limit(100)
      .abortSignal(AbortSignal.timeout(5000));
    if(error){console.error("Weekly CRM aggregate read unavailable:",error.code??"unknown");return {weeks:[],state:"unavailable"};}
    if(!data?.length)return {weeks:[],state:"empty"};
    const weeks:CRMWeek[]=[];
    const seen=new Set<string>();
    let rejected=0;
    for(const row of data){
      const item=parseRow(row);
      if(!item||seen.has(item.weekStart)){rejected++;continue;}
      seen.add(item.weekStart);
      weeks.push(item);
    }
    return {weeks,state:rejected?"partial":"live"};
  }catch{
    console.error("Weekly CRM aggregate read unavailable");
    return {weeks:[],state:"unavailable"};
  }
}
