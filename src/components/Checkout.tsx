import { useMemo, useState } from 'react'
import { getRestaurant } from '../data/restaurants'
import type { CartLine } from '../types'

interface CheckoutProps {
  lines: CartLine[]
  onBack: () => void
  onChangeQty: (key: string, quantity: number) => void
  onPlace: (payload: { address: string; tip: number; total: number; courierPayShare: number }) => void
}

export function Checkout({ lines, onBack, onChangeQty, onPlace }: CheckoutProps) {
  const restaurant = getRestaurant(lines[0]?.restaurantId ?? '')
  const [address, setAddress] = useState('184 Harbor Lane')
  const [tip, setTip] = useState(3)

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0),
    [lines],
  )
  const deliveryFee = restaurant?.deliveryFee ?? 0
  const service = Math.round(subtotal * 0.05 * 100) / 100
  const total = Math.round((subtotal + deliveryFee + service + tip) * 100) / 100
  const courierPayShare = Math.round((deliveryFee + tip * 0.85 + 2.4) * 100) / 100

  if (!restaurant || lines.length === 0) {
    return (
      <section className="checkout">
        <p>Your bag is empty.</p>
        <button type="button" className="btn btn--primary" onClick={onBack}>
          Browse kitchens
        </button>
      </section>
    )
  }

  return (
    <section className="checkout">
      <button type="button" className="text-link" onClick={onBack}>
        ← Keep browsing
      </button>

      <div className="section-head">
        <h1>Confirm your drop</h1>
        <p>
          {restaurant.name} promises minute {restaurant.exactEtaMinutes} from place.
        </p>
      </div>

      <label className="field">
        <span>Deliver to</span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>

      <ul className="bag-list">
        {lines.map((line) => (
          <li key={line.key} className="bag-line">
            <div>
              <strong>{line.item.name}</strong>
              <p>${line.item.price.toFixed(2)} each</p>
            </div>
            <div className="qty">
              <button type="button" onClick={() => onChangeQty(line.key, line.quantity - 1)} aria-label="Decrease">
                −
              </button>
              <span>{line.quantity}</span>
              <button type="button" onClick={() => onChangeQty(line.key, line.quantity + 1)} aria-label="Increase">
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="tip-row">
        <span>Courier tip</span>
        <div className="tip-options">
          {[0, 2, 3, 5].map((t) => (
            <button
              key={t}
              type="button"
              className={`filter ${tip === t ? 'filter--active' : ''}`}
              onClick={() => setTip(t)}
            >
              {t === 0 ? 'None' : `$${t}`}
            </button>
          ))}
        </div>
      </div>

      <div className="fair-pay">
        <h2>Fair drop breakdown</h2>
        <p>
          Courier earns about <strong>${courierPayShare.toFixed(2)}</strong> on this run — tip plus
          base drop, shown before you pay.
        </p>
      </div>

      <dl className="totals">
        <div>
          <dt>Subtotal</dt>
          <dd>${subtotal.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Drop fee</dt>
          <dd>${deliveryFee.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Kitchen keep</dt>
          <dd>${service.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Tip</dt>
          <dd>${tip.toFixed(2)}</dd>
        </div>
        <div className="totals__grand">
          <dt>Total</dt>
          <dd>${total.toFixed(2)}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => onPlace({ address, tip, total, courierPayShare })}
      >
        Place order · arrive in {restaurant.exactEtaMinutes} min
      </button>
    </section>
  )
}
