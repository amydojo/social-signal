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
  return <section className="pulse-decision" aria-label="Weekly posts and notes">
    <div className="pulse-decision-head">
      <div>
        <span className="pulse-decision-kicker">POSTS &amp; NOTES</span>
        <h2>How the week is going</h2>
      </div>
      <span className="pulse-decision-status">{partial?"SO FAR":"WEEK TOTAL"}</span>
    </div>
    <div className="pulse-plan-grid">
      {pulse.primary.map(item=><Track key={item.key} item={item}/>)}
    </div>
    <div className="pulse-brief-grid">
      <article>
        <span className="pulse-brief-no">POSTS</span>
        <h3>What got attention</h3>
        <strong>{pulse.creative.headline}</strong>
        <p>{pulse.creative.evidence}</p>
      </article>
      <article>
        <span className="pulse-brief-no">NEXT</span>
        <h3>What I'd try again</h3>
        <strong>One Reel answering a real patient question. One showing more of Frew and the team.</strong>
        <p>{pulse.creative.interpretation}</p>
      </article>
      <article>
        <span className="pulse-brief-no">TO CHECK</span>
        <h3>Did anyone book?</h3>
        <strong>Ad conversions aren't the same as booked consults.</strong>
        <p>We still need the Aesthetix numbers. Post approvals and medical review aren't tracked in this public report either.</p>
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
