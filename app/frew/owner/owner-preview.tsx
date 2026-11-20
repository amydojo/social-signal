"use client";

import {useState} from "react";

type Field="inquiries_received"|"qualified_inquiries"|"consultations_requested"|"consultations_booked";
type Paid={value:number|null;period:string|null};
type Props={week:string;google:Paid;meta:Paid;metaImpressions:number|null};
const fields:{key:Field;label:string;detail:string}[]=[
  {key:"inquiries_received",label:"New CRM inquiries",detail:"New people confirmed by Aesthetix for this week"},
  {key:"qualified_inquiries",label:"Qualified conversations",detail:"Inquiries that genuinely progressed to a relevant human conversation"},
  {key:"consultations_requested",label:"Consults requested",detail:"People who asked for a consultation"},
  {key:"consultations_booked",label:"Consults booked",detail:"Appointments verified as booked"}
];
const empty=():Record<Field,string>=>({
  inquiries_received:"",qualified_inquiries:"",consultations_requested:"",consultations_booked:""
});
const sample:Record<Field,string>={
  inquiries_received:"12",qualified_inquiries:"6",consultations_requested:"4",consultations_booked:"3"
};
const fmt=(value:number|null)=>value==null?"—":value.toLocaleString("en-US");
const label=(v:string)=>v===""?"—":Number(v).toLocaleString("en-US");
export default function OwnerPreview({week,google,meta,metaImpressions}:Props){
  const [values,setValues]=useState<Record<Field,string>>(empty);
  const [sampleLoaded,setSampleLoaded]=useState(false);
  const change=(key:Field,next:string)=>{
    if(!/^\d{0,7}$/.test(next))return;
    if(next!==""&&Number(next)>1000000)return;
    setValues(prev=>({...prev,[key]:next}));
    setSampleLoaded(false);
  };
  const any=fields.some(f=>values[f.key]!=="");
  return <div className="pulse-owner-preview" aria-label="Interactive outcomes preview">
    <div className="pulse-preview-notice" role="status">
      <strong>Testing mode · not real CRM data</strong>
      <span>Figures you enter update this screen only. They disappear when you refresh or change weeks.</span>
    </div>
    <div className="pulse-owner-summary pulse-preview-summary">
      <div>
        <span>NEW CRM INQUIRIES</span>
        <strong>{label(values.inquiries_received)}</strong>
        <small>{values.inquiries_received?"Demo figure · not verified":"Not connected to Aesthetix"}</small>
      </div>
      <div>
        <span>CONSULTS BOOKED</span>
        <strong>{label(values.consultations_booked)}</strong>
        <small>{values.consultations_booked?"Demo figure · not verified":"Appointment data not connected"}</small>
      </div>
      <div>
        <span>GOOGLE ADS ACTIONS</span>
        <strong>{fmt(google.value)}</strong>
        <small>{google.period??"No reported event window"} · platform events</small>
      </div>
      <div>
        <span>META FORM LEADS</span>
        <strong>{fmt(meta.value)}</strong>
        <small>{meta.period??"No reported lead window"}{meta.value==null&&metaImpressions===0?" · zero observed impressions":""}</small>
      </div>
    </div>
    <p className="pulse-owner-caveat">Google conversion actions, Meta form submissions and CRM bookings are different measurement units. They cannot be treated as one conversion funnel without matching records and time windows.</p>

    <div className="pulse-owner-form-head pulse-preview-editor-heading">
      <div>
        <span className="pulse-decision-kicker">LAYOUT TEST / {week}</span>
        <h2>Try some example outcomes</h2>
      </div>
      <div className="pulse-preview-buttons">
        <button type="button" onClick={()=>{setValues({...sample});setSampleLoaded(true);}}>
          Load sample numbers
        </button>
        <button type="button" className="pulse-preview-reset" onClick={()=>{setValues(empty());setSampleLoaded(false);}}>
          Clear preview
        </button>
      </div>
    </div>
    {sampleLoaded&&<p className="pulse-preview-example">Example numbers only—12 inquiries, six qualified conversations, four consult requests, three bookings. These are not OPUS results.</p>}
    <div className="pulse-owner-fields">
      {fields.map(f=><label key={f.key}>
        <strong>{f.label}</strong>
        <small>{f.detail}</small>
        <input name={f.key} type="text" inputMode="numeric" pattern="[0-9]*"
          maxLength={7} autoComplete="off"
          value={values[f.key]} onChange={e=>change(f.key,e.target.value)}
          placeholder="Unknown" aria-label={"Demo "+f.label}/>
      </label>)}
    </div>
    <div className="pulse-preview-foot">
      <span>{any?"Demo values active. Nothing has been saved.":"Start blank or load sample numbers to test the cards."}</span>
      <span>Public preview · private CRM and saving remain disabled</span>
    </div>
  </div>;
}
