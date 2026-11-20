import type {ExecutivePulse,CadenceItem} from "./frew-insights";

function Track({item}:{item:CadenceItem}){
  const unknown=item.observed===null;
  const value=item.observed??0;
  return <div className="pulse-plan-item">
    <div className="pulse-plan-item-top">
      <strong>{item.label}</strong>
      <span>{unknown?"No count yet":value+" / "+item.target}</span>
    </div>
    <progress aria-label={item.label+" recorded against weekly target"} max={item.target} value={value}/>
    <small>{unknown?item.detail:"Posts we can see · not an on-time check"}</small>
  </div>;
}
export default function FrewExecutiveBrief({pulse,partial}:{pulse:ExecutivePulse;partial:boolean}){
  return <section className="pulse-decision" aria-label="Weekly work and next steps">
    <div className="pulse-decision-head">
      <div>
        <span className="pulse-decision-kicker">THE WEEK AT OPUS</span>
        <h2>What happened, what still needs checking</h2>
      </div>
      <span className="pulse-decision-status">{partial?"SO FAR":"WEEK TOTAL"}</span>
    </div>
    <div className="pulse-plan-grid">
      {pulse.primary.map(item=><Track key={item.key} item={item}/>)}
    </div>
    <div className="pulse-brief-grid">
      <article>
        <span className="pulse-brief-no">PUBLISHED</span>
        <h3>What went out</h3>
        <strong>{pulse.published.headline}</strong>
        <p>{pulse.published.detail}</p>
      </article>
      <article>
        <span className="pulse-brief-no">PATIENT QUESTIONS</span>
        <h3>What people asked</h3>
        <strong>{pulse.conversation.headline}</strong>
        <p>{pulse.conversation.detail}</p>
      </article>
      <article>
        <span className="pulse-brief-no">TO CHECK</span>
        <h3>Did anyone book?</h3>
        <strong>The public report doesn't have verified consultation totals.</strong>
        <p>Check those numbers in Aesthetix. We also don't have Frew's post approvals or medical checks recorded here yet.</p>
      </article>
    </div>
    <details className="pulse-plan-details">
      <summary>Other platforms and missing info <span>Posting goals and what isn't connected</span></summary>
      <div className="pulse-plan-details-grid">
        {pulse.secondary.map(item=><Track key={item.key} item={item}/>)}
      </div>
      <p>Weekly plan: 3 Reels, 2 carousels, 4 TikToks, 3 YouTube Shorts, 2 posts on the results account, Stories on weekdays, and one Google Business post. The figures above are posts we can find, not a check of whether everything went out on time.</p>
      <p>We have posting, CTA and medical-review status for {pulse.verification.checked} of {pulse.verification.observed} Instagram feed posts. Blank means we haven't checked, not that a post failed review.</p>
      <p>{pulse.comparisonNote}</p>
    </details>
  </section>;
}
