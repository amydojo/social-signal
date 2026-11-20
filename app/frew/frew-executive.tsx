import type {ExecutivePulse} from "./frew-insights";

export default function FrewExecutiveBrief({pulse,partial}:{pulse:ExecutivePulse;partial:boolean}){
  return <section className="pulse-decision" aria-label="Weekly publications, patient interest and next steps">
    <div className="pulse-decision-head">
      <div>
        <span className="pulse-decision-kicker">THE WEEK AT OPUS</span>
        <h2>What happened, and what still needs checking</h2>
      </div>
      <span className="pulse-decision-status">{partial?"SO FAR":"WEEK SUMMARY"}</span>
    </div>
    <div className="pulse-brief-grid">
      <article>
        <span className="pulse-brief-no">PUBLISHED</span>
        <h3>What went out</h3>
        <strong>{pulse.published.headline}</strong>
        <p>{pulse.published.detail}</p>
      </article>
      <article>
        <span className="pulse-brief-no">AUDIENCE RESPONSE</span>
        <h3>What people asked</h3>
        <strong>{pulse.conversation.headline}</strong>
        <p>{pulse.conversation.detail}</p>
      </article>
      <article>
        <span className="pulse-brief-no">NEXT</span>
        <h3>Where does interest go next?</h3>
        <strong>{pulse.metrics[1].value!=null
          ?pulse.metrics[1].value+" surgical consultations are currently in the booked stage."
          :"Consultation progress is the next focus."}</strong>
        <p>{pulse.action}</p>
      </article>
    </div>
  </section>;
}
