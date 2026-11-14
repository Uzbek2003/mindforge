import type { MenuItem, Restaurant } from '../types'

interface RestaurantViewProps {
  restaurant: Restaurant
  onBack: () => void
  onAdd: (item: MenuItem) => void
}

export function RestaurantView({ restaurant, onBack, onAdd }: RestaurantViewProps) {
  return (
    <section className="restaurant">
      <button type="button" className="text-link" onClick={onBack}>
        ← Nearby
      </button>

      <header
        className="restaurant__hero"
        style={{ ['--kitchen-accent' as string]: restaurant.accent }}
      >
        <div className="restaurant__hero-wash" aria-hidden="true" />
        <div className="restaurant__hero-copy">
          <p className="eyebrow">{restaurant.neighborhood}</p>
          <h1>{restaurant.name}</h1>
          <p>{restaurant.kitchenNote}</p>
          <div className="restaurant__stats">
            <span className="eta eta--lg">{restaurant.exactEtaMinutes} min exact</span>
            <span>
              {restaurant.rating.toFixed(1)} · {restaurant.cuisine}
            </span>
          </div>
        </div>
      </header>

      <div className="timeline-strip" aria-label="Kitchen timeline preview">
        <div className="timeline-strip__step is-live">Queued</div>
        <div className="timeline-strip__step">Prepping</div>
        <div className="timeline-strip__step">Plated</div>
        <div className="timeline-strip__step">Out</div>
      </div>

      <ul className="menu-list">
        {restaurant.menu.map((item, i) => (
          <li key={item.id} style={{ animationDelay: `${i * 60}ms` }}>
            <article className="menu-item">
              <div>
                <div className="menu-item__title">
                  <h2>{item.name}</h2>
                  {item.popular && <span className="pill">Most ordered</span>}
                </div>
                <p>{item.description}</p>
                <div className="menu-item__meta">
                  <span>${item.price.toFixed(2)}</span>
                  <span>{item.prepMinutes} min prep</span>
                  {item.tags?.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <button type="button" className="btn btn--add" onClick={() => onAdd(item)}>
                Add
              </button>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
