import type { CSSProperties } from 'react'
import type { WorldDefinition, MixedAdventureDefinition } from '../config/worlds'
import { roundedPercentOf } from '../utils/progress'

type WorldCardData = WorldDefinition | MixedAdventureDefinition

interface WorldCardProps {
  world: WorldCardData
  completed: number
  total: number
  selected: boolean
  onSelect: () => void
}

export function WorldCard({ world, completed, total, selected, onSelect }: WorldCardProps) {
  const pct = roundedPercentOf(completed, total)

  const style = {
    '--world-accent': world.theme.accent,
    '--world-accent-soft': world.theme.accentSoft,
    '--world-gradient': world.theme.gradient,
    '--world-shadow': world.theme.shadow,
  } as CSSProperties

  return (
    <button
      type="button"
      className={`world-card ${selected ? 'world-card-selected' : ''}`}
      style={style}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${world.name}. ${completed} of ${total} completed.`}
    >
      <div className="world-card-glow" aria-hidden="true" />
      <div className="world-card-content">
        <span className="world-card-icon" aria-hidden="true">
          {world.icon}
        </span>
        <div className="world-card-text">
          <span className="world-card-name">{world.shortName}</span>
          <span className="world-card-tagline">{world.tagline}</span>
        </div>
        <div className="world-card-progress" aria-hidden="true">
          <div className="world-card-progress-track">
            <div className="world-card-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="world-card-progress-label">
            {completed}/{total} · {pct}%
          </span>
        </div>
      </div>
    </button>
  )
}
