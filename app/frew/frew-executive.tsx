import type {ExecutivePulse,CadenceItem} from "./frew-insights";

function Track({item}:{item:CadenceItem}){
  const unknown=item.observed===null;
  const value=item.observed??0;
  return <div className="pulse-plan-item">
    <div className="pulse-plan-item-top">
      <strong>{item.label}</strong>
      <span>{unknown?"Unverified":value+" / "+item.target}</span>
    </div>
    <progress aria-label={item.label+" recorded against weekly target"} max={item.target} value={value}/>
    <small>{unknown?item.detail:"Recorded toward weekly target · not an on-time audit"}</small>
  </div>;
}
export default function FrewExecutiveBrief({pulse,partial}:{pulse:ExecutivePulse;partial:boolean}){
  return <section className="pulse-decision" aria-label="Executive decisions and content accountability">
    <div className="pulse-decision-head">
      <div>
        <span className="pulse-decision-kicker">EXECUTION &amp; LEARNING</span>
        <h2>What the week is telling us</h2>
      </div>
      <span className="pulse-decision-status">{partial?"IN PROGRESS":"RECORDED WEEK"}</span>
    </div>
    <div className="pulse-plan-grid">
      {pulse.primary.map(item=><Track key={item.key} item={item}/>)}
    </div>
    <div className="pulse-brief-grid">
      <article>
        <span className="pulse-brief-no">01 / SIGNAL</span>
        <h3>What worked</h3>
        <strong>{pulse.creative.headline}</strong>
        <p>{pulse.creative.evidence}</p>
      </article>
      <article>
        <span className="pulse-brief-no">02 / RESPONSE</span>
        <h3>What to test next</h3>
        <strong>Pair a specific patient-question Reel with another surgeon-and-team moment.</strong>
        <p>{pulse.creative.interpretation}</p>
      </article>
      <article>
        <span className="pulse-brief-no">03 / DECISION</span>
        <h3>What needs verification</h3>
        <strong>Tracked ad actions are not confirmed consult bookings.</strong>
        <p>Check the private CRM handoff. Friday content approvals, audience questions and medical compliance status remain outside this public report.</p>
      </article>
    </div>
    <details className="pulse-plan-details">
      <summary>Full posting cadence and reporting gaps <span>What we can and cannot verify</span></summary>
      <div className="pulse-plan-details-grid">
        {pulse.secondary.map(item=><Track key={item.key} item={item}/>)}
      </div>
      <p>Frew's targets: 3 Instagram Reels, 2 carousels, 4 TikToks, 3 YouTube Shorts, 2 results posts, weekday Stories and one Google Business post. Collab tagging, deadlines, CTAs and surgeon approval require separate review.</p>
      <p>Publishing checklist fully evidenced for {pulse.verification.checked} of {pulse.verification.observed} captured Instagram feed posts. Missing checks mean unverified, not failed. Audience questions and organic search exports are not ingested here.</p>
      <p>{pulse.comparisonNote}</p>
    </details>
  </section>;
}
