/** Public-safe, aggregate-only CRM evidence. No patient records, names or IDs. */
export type AttributionEvidence="campaign_tag"|"google_click_id"|"tracked_link"|"first_session";
export type AcquisitionRouteName="Meta First Access"|"Google Ads"|"Instagram bio link"|"Website First Access";
export type AcquisitionStage="Cold"|"Lead"|"Replied"|"Consultation stage";
export type AcquisitionChannel="Paid Search"|"Social media"|"Organic Search"|"Direct traffic";
export type PublicAcquisition={
  asOf:string;
  scope:"historical_cohort";
  source:string;
  routes:{route:AcquisitionRouteName;evidence:AttributionEvidence;contacts:number;
    stages?:{stage:AcquisitionStage;contacts:number}[]}[];
  websiteFirstTouch:{channel:AcquisitionChannel;contacts:number}[];
  finding:string;decision:string;
};
const routes=new Set<AcquisitionRouteName>(["Meta First Access","Google Ads","Instagram bio link","Website First Access"]);
const evidence=new Set<AttributionEvidence>(["campaign_tag","google_click_id","tracked_link","first_session"]);
const stages=new Set<AcquisitionStage>(["Cold","Lead","Replied","Consultation stage"]);
const channels=new Set<AcquisitionChannel>(["Paid Search","Social media","Organic Search","Direct traffic"]);
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,allowed:string[])=>Object.keys(x).every(k=>allowed.includes(k));
const date=(x:unknown)=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T12:00:00Z"))&&
  new Date(x+"T12:00:00Z").toISOString().slice(0,10)===x;
const count=(x:unknown)=>Number.isSafeInteger(x)&&typeof x==="number"&&x>=0&&x<=1000000;
const text=(x:unknown,max:number)=>typeof x==="string"&&x.length>0&&x.length<=max&&
  !/[<>@]/.test(x)&&!/(https?:\/\/|\b\d{3}[-. ]\d{3}[-. ]\d{4}\b)/i.test(x);
export function parsePublicAcquisition(x:unknown):PublicAcquisition|null{
  if(!obj(x)||!keys(x,["asOf","scope","source","routes","websiteFirstTouch","finding","decision"])||
    !date(x.asOf)||x.scope!=="historical_cohort"||!text(x.source,120)||
    !text(x.finding,320)||!text(x.decision,320)||
    !Array.isArray(x.routes)||x.routes.length<1||x.routes.length>4||
    !Array.isArray(x.websiteFirstTouch)||x.websiteFirstTouch.length>4)return null;
  const used=new Set<string>();
  const out:PublicAcquisition["routes"]=[];
  for(const route of x.routes){
    if(!obj(route)||!keys(route,["route","evidence","contacts","stages"])||
      !routes.has(route.route as AcquisitionRouteName)||!evidence.has(route.evidence as AttributionEvidence)||
      !count(route.contacts)||used.has(route.route as string))return null;
    used.add(route.route as string);
    const correctEvidence:Record<AcquisitionRouteName,AttributionEvidence>={
      "Meta First Access":"campaign_tag","Google Ads":"google_click_id",
      "Instagram bio link":"tracked_link","Website First Access":"first_session"};
    if(correctEvidence[route.route as AcquisitionRouteName]!==route.evidence)return null;
    const progress:NonNullable<PublicAcquisition["routes"][number]["stages"]>=[];
    if(route.stages!=null){
      if(!Array.isArray(route.stages)||route.stages.length>4)return null;
      const uniqueStage=new Set<string>();
      for(const st of route.stages){
        if(!obj(st)||!keys(st,["stage","contacts"])||!stages.has(st.stage as AcquisitionStage)||
          !count(st.contacts)||uniqueStage.has(st.stage as string))return null;
        uniqueStage.add(st.stage as string);
        progress.push({stage:st.stage as AcquisitionStage,contacts:st.contacts as number});
      }
      if(progress.reduce((n,st)=>n+st.contacts,0)>(route.contacts as number))return null;
    }
    out.push({route:route.route as AcquisitionRouteName,evidence:route.evidence as AttributionEvidence,
      contacts:route.contacts as number,...(route.stages!=null?{stages:progress}:{})});
  }
  const firstTouch:PublicAcquisition["websiteFirstTouch"]=[];
  const usedChannel=new Set<string>();
  for(const item of x.websiteFirstTouch){
    if(!obj(item)||!keys(item,["channel","contacts"])||
      !channels.has(item.channel as AcquisitionChannel)||!count(item.contacts)||
      usedChannel.has(item.channel as string))return null;
    usedChannel.add(item.channel as string);
    firstTouch.push({channel:item.channel as AcquisitionChannel,contacts:item.contacts as number});
  }
  const website=out.find(r=>r.route==="Website First Access");
  if(firstTouch.length&&(!website||firstTouch.reduce((n,v)=>n+v.contacts,0)>website.contacts))return null;
  return {asOf:x.asOf as string,scope:"historical_cohort",source:x.source as string,
    routes:out,websiteFirstTouch:firstTouch,finding:x.finding as string,decision:x.decision as string};
}
