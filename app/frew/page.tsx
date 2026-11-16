import type {Metadata} from "next";
import FrewDashboard from "./frew-report";
import "./frew.css";

export const metadata:Metadata={
  title:"Dr. Frew Report / SIGNAL",
  description:"Read-only OPUS weekly performance and reporting status",
  robots:{index:false,follow:false,nocache:true}
};
export default function FrewPage(){return <FrewDashboard/>;}
