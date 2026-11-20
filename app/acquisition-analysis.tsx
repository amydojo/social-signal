import type {PublicAcquisitionAnalysis} from "../lib/signal/acquisition";
import "./acquisition-analysis.css";

const fmt=(n:number)=>n.toLocaleString("en-US");
const pct=(top:number,bottom:number)=>bottom?((100*top)/bottom).toFixed(1)+"%":"—";
const usd=(n:number)=>n.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
const groupSubtitles:Record<string,string>={
  "Website First Access":"Website opportunity source · not a first-touch channel",
  "Meta native forms":"CRM opportunities explicitly sourced to Meta native intake",
  "4D Direct":"Administrative / appointment-origin records, not a marketing channel",
  "Other intake":"Remaining open opportunity sources"
};
export default function AcquisitionAnalysis({analysis}:{analysis:PublicAcquisitionAnalysis}){
  const web=analysis.opportunityGroups.find(g=>g.name==="Website First Access");
  const meta=analysis.opportunityGroups.find(g=>g.name==="Meta native forms");
  const c=analysis.contactCoverage,o=analysis.opportunityCoverage,f=analysis.operations;
  return <div className="acq-depth" aria-label="Detailed attribution intelligence">
    <div className="acq-depth-head">
      <span>THE FINDING / SOURCE-VERIFIED CRM COHORTS</span>
      <h3>What happened after the inquiry?</h3>
      <p>These are <strong>open opportunity stage snapshots</strong>, not confirmed appointment event counts. Website and Meta opportunities are different cohorts with different ages and intake rules.</p>
    </div>
    <div className="acq-compare">
      {[web,meta].filter((g):g is NonNullable<typeof g>=>Boolean(g)).map(g=>
        <article className="acq-compare-card" key={g.name}>
          <span>{g.name}</span>
          <div className="acq-compare-number"><strong>{fmt(g.advancedStage)}</strong><span>/ {fmt(g.opportunities)}</span></div>
          <div className="acq-compare-rate">{pct(g.advancedStage,g.opportunities)} <small>currently at booked or completed consult / surgery stage</small></div>
          <div className="acq-compare-meter" aria-hidden="true"><span style={{width:pct(g.advancedStage,g.opportunities)}}/></div>
          <p>{groupSubtitles[g.name]}</p>
          <div className="acq-compare-breakdown">
            <span>{g.lead} Lead</span><span>{g.replied} Replied</span><span>{g.cancelNoShow} Cancel / no-show</span>
          </div>
        </article>)}
    </div>
    <p className="acq-depth-note">The website group shows more advanced *current stages*, but this is not an apples-to-apples form experiment. Different entry periods, source accuracy, lead mix and time to mature prevent claiming the website caused the difference.</p>

    <div className="acq-depth-heading">
      <span>PAID MEDIA ↔ CRM / RECONCILIATION</span>
      <h3>Three counts, three different units.</h3>
      <p>Don't subtract these columns to declare lost leads. Advertising events can differ from contacts, and the opportunity export covers open opportunities only.</p>
    </div>
    <div className="acq-reconcile">
      {analysis.campaigns.map(camp=><article key={camp.platform}>
        <div className="acq-reconcile-title">
          <h4>{camp.platform==="Meta Ads"?"Meta · First Access relaunch":"Google · high-intent Search"}</h4>
          <span>{camp.period}</span>
        </div>
        <div className="acq-reconcile-steps">
          <div><strong>{fmt(camp.reportedEvents)}</strong><span>{camp.platform==="Meta Ads"?"Platform form leads":"Platform conversion actions"}</span></div>
          <div><strong>{fmt(camp.contactEvidence)}</strong><span>{camp.platform==="Meta Ads"?"Relaunch UTM contacts":"Contacts with a Google click ID"}</span></div>
          <div><strong>{fmt(camp.openOpportunities)}</strong><span>{camp.platform==="Meta Ads"?"Meta-sourced open opportunities":"Paid Search-labeled website opportunities"}</span></div>
        </div>
        <div className="acq-reconcile-footer">
          <span>{usd(camp.spendUSD)} reported spend</span>
          <span>{usd(camp.spendUSD/camp.reportedEvents)} per {camp.platform==="Meta Ads"?"platform lead":"reported conversion"}</span>
        </div>
        <p>{camp.note}</p>
      </article>)}
    </div>

    <div className="acq-depth-heading">
      <span>ATTRIBUTION QUALITY / TWO EXPORTS</span>
      <h3>The data exists. The fields don't consistently agree.</h3>
    </div>
    <div className="acq-coverage-strip">
      <div><strong>{fmt(c.total)}</strong><span>total contact records</span></div>
      <div><strong>{fmt(c.sourceRecorded)}<em>/{fmt(c.total)}</em></strong><span>contact intake Source populated</span></div>
      <div><strong>{fmt(c.firstSessionRecorded)}<em>/{fmt(c.total)}</em></strong><span>first-session channel populated</span></div>
      <div><strong>{fmt(o.adSourceMissing)}<em>/{fmt(o.total)}</em></strong><span>open opportunities missing Ad Source</span></div>
    </div>
    <p className="acq-depth-note">“Source” describes the intake route (such as a Meta form, Instagram DM, or 4D Direct); it does <strong>not</strong> necessarily identify the paid or organic acquisition channel. First-session attribution is a separate field. The opportunity export contains {fmt(o.total)} records across {fmt(o.distinctContactIds)} contact IDs, with {fmt(o.nonSurgicalAdSourceMissing)} of {fmt(o.nonSurgicalTotal)} nonsurgical opportunities missing Ad Source.</p>
    <p className="acq-depth-note">Notably, the 32 Website First Access contact records have identifiable first-session channels (shown above), yet 12 of the 29 Website First Access <em>opportunities</em> are unattributed in their separate Ad Source field. This is an opportunity-mapping and reconciliation gap, not evidence that every visitor's acquisition source is unknown.</p>

    <div className="acq-depth-heading">
      <span>WEBSITE OPPORTUNITIES / AD SOURCE FIELD</span>
      <h3>Which origins are reaching a later stage?</h3>
      <p>Opportunity Ad Source labels below are a different dataset from the 32 contact-level first-session channels above. They must not be combined into a conversion denominator.</p>
    </div>
    <div className="acq-opportunity-channels">
      {analysis.websiteOpportunityChannels.map(row=><article key={row.channel}>
        <div><strong>{row.channel}</strong><span>{row.advancedStage} of {row.opportunities} at a booked+ stage</span></div>
        <strong>{pct(row.advancedStage,row.opportunities)}</strong>
        <div className="acq-channel-meter"><span style={{width:pct(row.advancedStage,row.opportunities)}}/></div>
      </article>)}
    </div>

    <div className="acq-depth-heading">
      <span>FOLLOW-UP / WORKFLOW SIGNALS</span>
      <h3>What could be blocking real conversations?</h3>
    </div>
    <div className="acq-operational">
      <div><strong>{f.metaLeadStage} / {meta?.opportunities??"—"}</strong><span>Meta open opportunities still at Lead</span></div>
      <div><strong>{f.metaEngagementZero}</strong><span>Meta opportunities with engagement score zero</span></div>
      <div><strong>{f.metaSmsInvalid}</strong><span>Meta opportunities tagged invalid SMS</span></div>
      <div><strong>{f.newestWebsiteMissingAdSource} / {f.newestWebsiteOpportunities}</strong><span>recent website opportunities missing Ad Source</span></div>
    </div>
    <p className="acq-depth-note">These are exported CRM states, not message-delivery or call logs. They do not prove that outreach failed or that a lead never responded. The same opportunity audit found {fmt(f.moreInformationOpportunities)} records with “More Information” as treatment of interest, but complete form and workflow mapping remains unverified.</p>

    <div className="acq-depth-heading">
      <span>DECISIONS / SUPPORTED INTERPRETATION</span>
      <h3>Where I would investigate next</h3>
    </div>
    <div className="acq-intelligence">
      {analysis.findings.map((item,i)=><article key={item.title}>
        <span>0{i+1} / FINDING</span><h4>{item.title}</h4>
        <p>{item.evidence}</p><div><strong>Next move</strong><p>{item.decision}</p></div>
      </article>)}
    </div>
    <p className="acq-depth-note">Source: Aesthetix contact export and separate open-opportunity exports reviewed November 20, 2026; paid platform figures from the October 20–November 19 Metricool campaign audit. No patient names, contact records, or confirmed appointments are published here.</p>
  </div>;
}
