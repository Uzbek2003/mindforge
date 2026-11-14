import { useMemo, useState } from 'react'
import { RESTAURANTS } from '../data/restaurants'
import type { Cuisine, Restaurant } from '../types'

const FILTERS: Array<'All' | Cuisine> = [
  'All',
  'Neighborhood',
  'Breakfast',
  'Noodles',
  'Grill',
  'Greens',
  'Sweets',
]

interface DiscoverProps {
  onOpen: (restaurant: Restaurant) => void
}

export function Discover({ onOpen }: DiscoverProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    return RESTAURANTS.filter((r) => {
      const matchesFilter = filter === 'All' || r.cuisine === filter
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.neighborhood.toLowerCase().includes(q) ||
        r.dishHint.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [filter, query])

  return (
    <section className="discover">
      <div className="section-head">
        <h1>Nearby kitchens on the clock</h1>
        <p>Every ETA is a minute — kitchens start cooking to your courier, not a guess.</p>
      </div>

      <label className="search">
        <span className="sr-only">Search kitchens</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search kitchens, dishes, neighborhoods"
        />
      </label>

      <div className="filters" role="tablist" aria-label="Cuisine filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`filter ${filter === f ? 'filter--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="kitchen-list">
        {list.map((r, i) => (
          <li key={r.id} style={{ animationDelay: `${i * 45}ms` }}>
            <button type="button" className="kitchen" onClick={() => onOpen(r)}>
              <div className="kitchen__visual" style={{ ['--kitchen-accent' as string]: r.accent }}>
                <span className="kitchen__orb" />
                <span className="kitchen__dish">{r.dishHint}</span>
              </div>
              <div className="kitchen__meta">
                <div className="kitchen__row">
                  <h2>{r.name}</h2>
                  <span className="eta">{r.exactEtaMinutes} min</span>
                </div>
                <p>
                  {r.cuisine} · {r.neighborhood}
                </p>
                <div className="kitchen__row kitchen__row--foot">
                  <span>
                    {r.rating.toFixed(1)} · {r.reviewCount.toLocaleString()} reviews
                  </span>
                  <span>{r.deliveryFee === 0 ? 'Free drop' : `$${r.deliveryFee.toFixed(2)} drop`}</span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {list.length === 0 && <p className="empty">No kitchens match that search.</p>}
    </section>
  )
}
