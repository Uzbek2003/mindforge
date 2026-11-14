import { useEffect, useMemo, useState } from 'react'
import type { ActiveOrder, KitchenStage } from '../types'

const STAGES: KitchenStage[] = ['queued', 'prepping', 'plated', 'out', 'nearby', 'delivered']

const STAGE_COPY: Record<KitchenStage, string> = {
  queued: 'Kitchen confirmed — ticket is on the rail.',
  prepping: 'Cooks are on your ticket now.',
  plated: 'Food is plated and bagged for handoff.',
  out: 'Courier has your bag and is rolling.',
  nearby: 'Courier is on your block.',
  delivered: 'On your door — on the minute.',
}

interface TrackingProps {
  order: ActiveOrder
  onHome: () => void
  onOrderAgain: () => void
}

function stageFromElapsed(elapsedSec: number, promisedMinute: number): KitchenStage {
  const total = Math.max(promisedMinute * 60, 60)
  const p = Math.min(elapsedSec / total, 1)
  if (p < 0.12) return 'queued'
  if (p < 0.38) return 'prepping'
  if (p < 0.52) return 'plated'
  if (p < 0.82) return 'out'
  if (p < 0.96) return 'nearby'
  return 'delivered'
}

export function Tracking({ order, onHome, onOrderAgain }: TrackingProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const elapsedSec = Math.floor((now - order.placedAt) / 1000)
  // Demo compresses real wait: 1 real second ≈ ~ promisedMinute/45 of the journey
  const demoElapsed = elapsedSec * Math.max(1, Math.round((order.promisedMinute * 60) / 45))
  const stage = stageFromElapsed(demoElapsed, order.promisedMinute)
  const stageIndex = STAGES.indexOf(stage)

  const remaining = useMemo(() => {
    const total = order.promisedMinute * 60
    const left = Math.max(total - demoElapsed, 0)
    return Math.ceil(left / 60)
  }, [demoElapsed, order.promisedMinute])

  const progress = Math.min(demoElapsed / (order.promisedMinute * 60), 1)

  return (
    <section className="tracking">
      <div className="section-head">
        <p className="eyebrow">Live drop · {order.id}</p>
        <h1>
          {stage === 'delivered'
            ? 'Delivered'
            : remaining <= 1
              ? 'Arriving now'
              : `${remaining} min to door`}
        </h1>
        <p>{STAGE_COPY[stage]}</p>
      </div>

      <div className="tracking__clock" aria-hidden={stage === 'delivered'}>
        <div className="tracking__ring" style={{ ['--progress' as string]: progress }}>
          <div className="tracking__ring-core">
            <span className="tracking__minute">
              {stage === 'delivered' ? '0' : Math.max(remaining, 0)}
            </span>
            <span>min left</span>
          </div>
        </div>
      </div>

      <ol className="stage-rail">
        {STAGES.map((s, i) => (
          <li
            key={s}
            className={`stage-rail__item ${i <= stageIndex ? 'is-done' : ''} ${
              i === stageIndex ? 'is-current' : ''
            }`}
          >
            <span className="stage-rail__dot" />
            <span className="stage-rail__label">{s}</span>
          </li>
        ))}
      </ol>

      <div className="tracking__map" aria-hidden="true">
        <div className="tracking__route" />
        <div
          className={`tracking__rider ${stage === 'delivered' ? 'is-done' : ''}`}
          style={{ ['--rider-progress' as string]: Math.min(progress, 1) }}
        />
        <div className="tracking__home" />
        <div className="tracking__kitchen" />
      </div>

      <div className="tracking__summary">
        <p>
          <strong>{order.restaurantName}</strong> → {order.address}
        </p>
        <p>
          {order.lines.reduce((n, l) => n + l.quantity, 0)} items · ${order.total.toFixed(2)} · courier
          share ${order.courierPayShare.toFixed(2)}
        </p>
      </div>

      <div className="hero__actions">
        <button type="button" className="btn btn--primary" onClick={onOrderAgain}>
          Order again
        </button>
        <button type="button" className="btn btn--ghost" onClick={onHome}>
          Back to Kith
        </button>
      </div>
    </section>
  )
}
