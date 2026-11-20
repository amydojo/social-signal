import type {Metadata} from "next";
import FrewDashboard from "./frew-report";
import {loadPublishedWeeks} from "../../lib/signal/read-public";
import "./frew.css";

export const metadata:Metadata={
  title:"PULSE · OPUS",
  description:"PULSE — OPUS weekly performance, at a glance.",
  robots:{index:false,follow:false,nocache:true}
};
export const dynamic="force-dynamic";
export default async function FrewPage(){
  const published=await loadPublishedWeeks();
  return <FrewDashboard published={published}/>;
}
