import {createClient} from "@supabase/supabase-js";

/** Reviewed, anonymous-safe aggregates only; no contact or appointment rows. */
export type CRMClinicalSnapshot={
  snapshotDate:string;
  contactTotal:number;
  paidSearchFirstSession:number;
  googleGclidContacts:number;
  googleV02CampaignContacts:number;
  googleMatchedContacts:number;
  googleMatchedWeekContacts:number;
  googleMatchedLeadStage:number;
  googleMatchedRepliedStage:number;
  googleMatchedDatedConsults:number;
  consultBookedStage:number;
  consultBookedDated:number;
  consultBookedWithoutDated:number;
  consultCompleteStage:number;
  consultCompleteLastVisit:number;
  surgeryScheduledStage:number;
  surgeryScheduledDated:number;
  appointmentFieldRecords:number;
  appointmentDateDisagreements:number;
  upcomingConsults:number;
  upcomingConfirmed:number;
  upcomingUnconfirmed:number;
  upcomingWebsiteRoute:number;
  upcomingOtherRoutes:number;
};
export type CRMConsultWeek={
  snapshotDate:string;
  weekStart:string;
  scheduled:number;
  confirmed:number;
  unconfirmed:number;
  websiteRoute:number;
  otherRoutes:number;
};
export type CRMClinicalRead={
  snapshot:CRMClinicalSnapshot|null;
  weeks:CRMConsultWeek[];
  state:"live"|"unavailable"|"empty"|"invalid";
};
const count=(v:unknown)=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=0&&v<=1000000;
const date=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&
  !Number.isNaN(Date.parse(v+"T12:00:00Z"))&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v;
const daysAfter=(v:string,days:number)=>new Date(Date.parse(v+"T12:00:00Z")+days*86400000).toISOString().slice(0,10);
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const mapping={
  contact_total:"contactTotal",
  paid_search_first_session:"paidSearchFirstSession",
  google_gclid_contacts:"googleGclidContacts",
  google_v02_campaign_contacts:"googleV02CampaignContacts",
  google_matched_contacts:"googleMatchedContacts",
  google_matched_week_contacts:"googleMatchedWeekContacts",
  google_matched_lead_stage:"googleMatchedLeadStage",
  google_matched_replied_stage:"googleMatchedRepliedStage",
  google_matched_dated_consults:"googleMatchedDatedConsults",
  consult_booked_stage:"consultBookedStage",
  consult_booked_dated:"consultBookedDated",
  consult_booked_without_dated:"consultBookedWithoutDated",
  consult_complete_stage:"consultCompleteStage",
  consult_complete_last_visit:"consultCompleteLastVisit",
  surgery_scheduled_stage:"surgeryScheduledStage",
  surgery_scheduled_dated:"surgeryScheduledDated",
  appointment_field_records:"appointmentFieldRecords",
  appointment_date_disagreements:"appointmentDateDisagreements",
  upcoming_consults:"upcomingConsults",
  upcoming_confirmed:"upcomingConfirmed",
  upcoming_unconfirmed:"upcomingUnconfirmed",
  upcoming_website_route:"upcomingWebsiteRoute",
  upcoming_other_routes:"upcomingOtherRoutes"
} as const;
export function parseCRMClinicalSnapshot(v:unknown):CRMClinicalSnapshot|null{
  if(!object(v)||!date(v.snapshot_date)||Object.keys(mapping).some(k=>!count(v[k])))return null;
  const values=Object.fromEntries(Object.entries(mapping).map(([sql,js])=>[js,v[sql]]));
  const r={snapshotDate:v.snapshot_date as string,...values} as CRMClinicalSnapshot;
  if(r.googleMatchedContacts>r.paidSearchFirstSession||
     r.googleMatchedContacts>r.googleGclidContacts||
     r.googleMatchedContacts>r.googleV02CampaignContacts||
     r.googleMatchedWeekContacts>r.googleMatchedContacts||
     r.googleMatchedContacts!==r.googleMatchedLeadStage+r.googleMatchedRepliedStage||
     r.googleMatchedDatedConsults>r.googleMatchedContacts||
     r.consultBookedStage!==r.consultBookedDated+r.consultBookedWithoutDated||
     r.consultCompleteLastVisit>r.consultCompleteStage||
     r.surgeryScheduledDated>r.surgeryScheduledStage||
     r.upcomingConsults!==r.upcomingConfirmed+r.upcomingUnconfirmed||
     r.upcomingConsults!==r.upcomingWebsiteRoute+r.upcomingOtherRoutes||
     r.upcomingConsults>r.appointmentFieldRecords||
     r.appointmentDateDisagreements>r.appointmentFieldRecords)return null;
  return r;
}
export function parseCRMConsultWeeks(v:unknown,snapshot:CRMClinicalSnapshot):CRMConsultWeek[]|null{
  if(!Array.isArray(v)||v.length>26)return null;
  const seen=new Set<string>();
  const weeks:CRMConsultWeek[]=[];
  for(const row of v){
    if(!object(row)||!date(row.snapshot_date)||row.snapshot_date!==snapshot.snapshotDate||
       !date(row.week_start)||(new Date(row.week_start+"T12:00:00Z")).getUTCDay()!==1||
       !((row.week_start as string)>snapshot.snapshotDate)||
       seen.has(row.week_start as string))return null;
    const keys=["scheduled_count","confirmed_count","unconfirmed_count","website_route_count","other_route_count"] as const;
    if(keys.some(key=>!count(row[key])))return null;
    const [scheduled,confirmed,unconfirmed,websiteRoute,otherRoutes]=keys.map(key=>row[key] as number);
    if(scheduled!==confirmed+unconfirmed||scheduled!==websiteRoute+otherRoutes)return null;
    seen.add(row.week_start as string);
    weeks.push({snapshotDate:snapshot.snapshotDate,weekStart:row.week_start as string,scheduled,
      confirmed,unconfirmed,websiteRoute,otherRoutes});
  }
  weeks.sort((a,b)=>a.weekStart.localeCompare(b.weekStart));
  if(weeks.reduce((n,w)=>n+w.scheduled,0)!==snapshot.upcomingConsults||
     weeks.reduce((n,w)=>n+w.confirmed,0)!==snapshot.upcomingConfirmed||
     weeks.reduce((n,w)=>n+w.unconfirmed,0)!==snapshot.upcomingUnconfirmed||
     weeks.reduce((n,w)=>n+w.websiteRoute,0)!==snapshot.upcomingWebsiteRoute)return null;
  return weeks;
}
export async function loadCRMClinicalEvidence():Promise<CRMClinicalRead>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const fallback:CRMClinicalRead={snapshot:null,weeks:[],state:"unavailable"};
  if(!url||!key)return fallback;
  try{
    const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const fields=["snapshot_date",...Object.keys(mapping)].join(",");
    const {data:rows,error}=await client.from("signal_crm_evidence_snapshots")
      .select(fields).order("snapshot_date",{ascending:false}).limit(1)
      .abortSignal(AbortSignal.timeout(5000));
    if(error){console.error("CRM evidence snapshot read unavailable:",error.code??"unknown");return fallback;}
    if(!rows?.length)return {snapshot:null,weeks:[],state:"empty"};
    const snapshot=parseCRMClinicalSnapshot(rows[0]);
    if(!snapshot)return {snapshot:null,weeks:[],state:"invalid"};
    const {data:weeksRows,error:weeksError}=await client.from("signal_crm_upcoming_consult_weeks")
      .select("snapshot_date,week_start,scheduled_count,confirmed_count,unconfirmed_count,website_route_count,other_route_count")
      .eq("snapshot_date",snapshot.snapshotDate).order("week_start",{ascending:true}).limit(26)
      .abortSignal(AbortSignal.timeout(5000));
    if(weeksError){console.error("CRM consultation weekly read unavailable:",weeksError.code??"unknown");return fallback;}
    const weeks=parseCRMConsultWeeks(weeksRows??[],snapshot);
    if(!weeks)return {snapshot:null,weeks:[],state:"invalid"};
    return {snapshot,weeks,state:"live"};
  }catch{console.error("CRM clinical evidence read unavailable");return fallback;}
}
