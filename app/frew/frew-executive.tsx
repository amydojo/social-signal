import type {ExecutivePulse} from "./frew-insights";

export default function FrewExecutiveBrief({pulse,partial}:{pulse:ExecutivePulse;partial:boolean}){
  if(!pulse.highlights.length)return null;
  return <section className="pulse-decision" aria-label="Source-backed weekly marketing highlights">
    <div className="pulse-decision-head">
      <div>
        <span className="pulse-decision-kicker">THE WEEK AT OPUS</span>
        <h2>What the results tell us</h2>
      </div>
      <span className="pulse-decision-status">{partial?"WEEK TO DATE":"WEEKLY READOUT"}</span>
    </div>
    <div className="pulse-brief-grid">
      {pulse.highlights.map(item=><article key={item.label}>
        <span className="pulse-brief-no">{item.label}</span>
        <strong>{item.headline}</strong>
        <p>{item.detail}</p>
      </article>)}
    </div>
  </section>;
}
