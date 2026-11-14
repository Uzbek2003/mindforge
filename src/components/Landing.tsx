interface LandingProps {
  onStart: () => void
  onTrackDemo: () => void
}

export function Landing({ onStart, onTrackDemo }: LandingProps) {
  return (
    <section className="hero">
      <div className="hero__atmosphere" aria-hidden="true">
        <div className="hero__wash" />
        <div className="hero__grain" />
        <div className="hero__street">
          <div className="hero__lane" />
          <div className="hero__courier">
            <div className="hero__courier-body" />
            <div className="hero__courier-wheel hero__courier-wheel--front" />
            <div className="hero__courier-wheel hero__courier-wheel--back" />
            <div className="hero__bag" />
          </div>
          <div className="hero__steam hero__steam--a" />
          <div className="hero__steam hero__steam--b" />
          <div className="hero__plate">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="hero__copy">
        <p className="hero__brand-lockup">
          <span className="brand__mark brand__mark--lg" aria-hidden="true" />
          <span className="hero__brand-name">Kith</span>
        </p>
        <h1 className="hero__headline">On your door. On the minute.</h1>
        <p className="hero__lede">
          Neighborhood kitchens, live prep timelines, and exact arrival — not a vague 25–40.
        </p>
        <div className="hero__actions">
          <button type="button" className="btn btn--primary" onClick={onStart}>
            Order nearby
          </button>
          <button type="button" className="btn btn--ghost" onClick={onTrackDemo}>
            Watch a live drop
          </button>
        </div>
      </div>
    </section>
  )
}
