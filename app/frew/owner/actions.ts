"use server";

import {revalidatePath} from "next/cache";
import {notFound,redirect} from "next/navigation";
import {createSignalServerClient} from "../../../lib/supabase/server";

function counts(value:FormDataEntryValue|null):number|null{
  const raw=String(value??"").trim();
  if(!raw)return null;
  if(!/^\d{1,7}$/.test(raw))throw new Error("Enter non-negative whole-number counts only.");
  const num=Number(raw);
  if(!Number.isSafeInteger(num)||num>1000000)throw new Error("Count exceeds the allowed range.");
  return num;
}
function isMondayWeek(v:string):boolean{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
  const date=new Date(v+"T12:00:00Z");
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===v&&date.getUTCDay()===1;
}
export async function saveOwnerCounts(formData:FormData){
  const week=String(formData.get("week_start")??"");
  if(!isMondayWeek(week))throw new Error("The reporting week must start on Monday.");
  const supabase=await createSignalServerClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)redirect("/frew/owner/login");
  const {data:member,error:memberError}=await supabase.from("signal_members")
    .select("role").eq("user_id",user.id).maybeSingle();
  if(memberError||member?.role!=="owner")notFound();
  const payload={
    week_start:week,
    inquiries_received:counts(formData.get("inquiries_received")),
    qualified_inquiries:counts(formData.get("qualified_inquiries")),
    consultations_requested:counts(formData.get("consultations_requested")),
    consultations_booked:counts(formData.get("consultations_booked")),
    checked_by:user.id,
    checked_at:new Date().toISOString()
  };
  const {error}=await supabase.from("signal_owner_outcomes").upsert(payload,{onConflict:"week_start"});
  if(error)throw new Error("Unable to save the private weekly counts.");
  revalidatePath("/frew/owner");
  redirect("/frew/owner?week="+encodeURIComponent(week)+"&saved=1");
}
export async function requestOwnerLink(formData:FormData){
  const email=String(formData.get("email")??"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>250)
    redirect("/frew/owner/login?error=invalid");
  const supabase=await createSignalServerClient();
  const {error}=await supabase.auth.signInWithOtp({
    email,options:{
      emailRedirectTo:"https://opussignal.vercel.app/auth/callback?next=%2Ffrew%2Fowner",
      shouldCreateUser:false
    }
  });
  if(error)redirect("/frew/owner/login?error=signin");
  redirect("/frew/owner/login?sent=1");
}
