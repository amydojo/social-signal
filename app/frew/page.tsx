import type {Metadata} from "next";
import FrewDashboard from "./frew-report";
import "./frew.css";

export const metadata:Metadata={
  title:"Weekly Pulse / OPUS",
  description:"OPUS Weekly Pulse: a concise, read-only performance brief for Dr. Frew",
  robots:{index:false,follow:false,nocache:true}
};
export default function FrewPage(){return <FrewDashboard/>;}
