export function Hero({ onShowLiveWard }) {
  return (
    <section className="wardround-hero" aria-labelledby="wardround-hero-title">
      <div className="wardround-hero__copy">
        <p className="wardround-hero__eyebrow">Human-led clinical co-work</p>
        <h1 id="wardround-hero-title">Clinical signal. Human decision.</h1>
        <p className="wardround-hero__summary">
          Wardround keeps live risk, agent reasoning, and nurse approval together in
          one shared ICU workflow.
        </p>
        <a
          className="wardround-hero__cta"
          href="#live-ward"
          onClick={onShowLiveWard}
        >
          See the live ward
        </a>
      </div>

      <aside className="wardround-hero__assurance" aria-label="Wardround safeguard">
        <p>Human approval required</p>
        <span>
          The agent can prepare the next action. A nurse remains the one who commits it.
        </span>
      </aside>
    </section>
  );
}
