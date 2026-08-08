import type { ReactNode } from 'react'
import { APP_NAME, APP_TAGLINE } from '../constants'
import type { Category, Difficulty } from '../types'
import { CATEGORY_ICONS, CATEGORY_LABELS, DIFFICULTY_LABELS } from '../types'
import { percentOf, roundedPercentOf } from '../utils/progress'

interface HeaderProps {
  onHome?: () => void
  showHome?: boolean
  homeLabel?: string
  onSettings?: () => void
}

export function Header({ onHome, showHome, homeLabel = 'Home', onSettings }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-brand">
        <span className="logo-mark" aria-hidden="true">Q</span>
        <div>
          <h1>{APP_NAME}</h1>
          <p className="tagline">{APP_TAGLINE}</p>
        </div>
      </div>
      <div className="header-actions">
        {onSettings && (
          <button type="button" className="btn btn-ghost" onClick={onSettings} aria-label="Open settings">
            Settings
          </button>
        )}
        {showHome && onHome && (
          <button type="button" className="btn btn-ghost" onClick={onHome}>
            {homeLabel}
          </button>
        )}
      </div>
    </header>
  )
}

interface CategoryCardProps {
  category: Category
  count: number
  completed: number
  selected: boolean
  onSelect: () => void
}

export function CategoryCard({ category, count, completed, selected, onSelect }: CategoryCardProps) {
  const pct = roundedPercentOf(completed, count)

  return (
    <button
      type="button"
      className={`category-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="category-icon" aria-hidden="true">{CATEGORY_ICONS[category]}</span>
      <span className="category-name">{CATEGORY_LABELS[category]}</span>
      <span className="category-progress">{completed}/{count} · {pct}%</span>
    </button>
  )
}

interface DifficultyCardProps {
  difficulty: Difficulty
  count: number
  completed: number
  unlocked: boolean
  selected: boolean
  unlockHint?: string
  onSelect: () => void
}

export function DifficultyCard({
  difficulty,
  count,
  completed,
  unlocked,
  selected,
  unlockHint,
  onSelect,
}: DifficultyCardProps) {
  return (
    <button
      type="button"
      className={`difficulty-card difficulty-${difficulty} ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
      onClick={onSelect}
      disabled={!unlocked}
      aria-pressed={selected}
      aria-disabled={!unlocked}
    >
      <span className="difficulty-label">{DIFFICULTY_LABELS[difficulty]}</span>
      <span className="difficulty-meta">
        {unlocked ? `${completed}/${count} solved` : unlockHint}
      </span>
      {!unlocked && <span className="lock-icon" aria-hidden="true">Locked</span>}
    </button>
  )
}

interface ProgressRingProps {
  value: number
  max: number
  label: string
}

export function ProgressRing({ value, max, label }: ProgressRingProps) {
  const pct = percentOf(value, max)
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="progress-ring" role="img" aria-label={`${value} of ${max} ${label}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-bg" cx="50" cy="50" r="42" />
        <circle
          className="ring-fill"
          cx="50"
          cy="50"
          r="42"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-label">
        <strong>{value}</strong>
        <span>/{max}</span>
        <small>{label}</small>
      </div>
    </div>
  )
}

interface ToggleRowProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function ToggleRow({ label, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <label className="setting-row">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </label>
  )
}

interface SelectRowProps {
  label: string
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  disabled?: boolean
  children: ReactNode
}

export function SelectRow({
  label,
  value,
  onChange,
  ariaLabel,
  disabled,
  children,
}: SelectRowProps) {
  return (
    <label className="setting-row setting-select">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {children}
      </select>
    </label>
  )
}
