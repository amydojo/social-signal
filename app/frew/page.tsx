import type {Metadata} from "next";
import FrewDashboard from "./frew-report";
import {loadPublishedWeeksWithState} from "../../lib/signal/read-public";
import {loadCRMWeeklyHistory} from "../../lib/signal/read-crm-weekly";
import {loadCRMClinicalEvidence} from "../../lib/signal/read-crm-evidence";
import "./frew.css";
import "./frew-executive.css";
import "./frew-crm-history.css";
import "./frew-crm-evidence.css";

export const metadata:Metadata={
  title:"PULSE · OPUS",
  description:"PULSE — OPUS weekly performance, at a glance.",
  robots:{index:false,follow:false,nocache:true}
};
export const dynamic="force-dynamic";
export default async function FrewPage(){
  const [published,crm,clinical]=await Promise.all([loadPublishedWeeksWithState(),loadCRMWeeklyHistory(),loadCRMClinicalEvidence()]);
  return <FrewDashboard
    published={published.weeks} readState={published.state}
    crmHistory={crm.weeks} crmReadState={crm.state}
    clinicalEvidence={clinical}
  />;
}
