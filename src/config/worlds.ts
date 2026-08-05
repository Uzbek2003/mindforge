import type { Category } from '../types'

/** Visual + narrative identity for each learning world. */
export interface WorldTheme {
  accent: string
  accentSoft: string
  gradient: string
  shadow: string
}

export interface WorldDefinition {
  id: string
  category: Category
  name: string
  shortName: string
  icon: string
  tagline: string
  theme: WorldTheme
  /** Reserved for future XP / level display without schema changes. */
  progressionKey: string
}

export interface MixedAdventureDefinition {
  id: 'mixed-adventure'
  category: 'all'
  name: string
  shortName: string
  icon: string
  tagline: string
  theme: WorldTheme
}

export const WORLDS: WorldDefinition[] = [
  {
    id: 'math-kingdom',
    category: 'math',
    name: 'Mathematics Kingdom',
    shortName: 'Math Kingdom',
    icon: '📘',
    tagline: 'Master numbers, patterns, and logic',
    progressionKey: 'math',
    theme: {
      accent: '#2563eb',
      accentSoft: 'rgba(37, 99, 235, 0.14)',
      gradient: 'linear-gradient(145deg, #1d4ed8 0%, #3b82f6 48%, #93c5fd 100%)',
      shadow: '0 12px 32px rgba(37, 99, 235, 0.28)',
    },
  },
  {
    id: 'science-lab',
    category: 'science',
    name: 'Science Lab',
    shortName: 'Science Lab',
    icon: '🧪',
    tagline: 'Experiment with how the world works',
    progressionKey: 'science',
    theme: {
      accent: '#059669',
      accentSoft: 'rgba(5, 150, 105, 0.14)',
      gradient: 'linear-gradient(145deg, #047857 0%, #10b981 48%, #6ee7b7 100%)',
      shadow: '0 12px 32px rgba(5, 150, 105, 0.28)',
    },
  },
  {
    id: 'history-museum',
    category: 'history',
    name: 'History Museum',
    shortName: 'History Museum',
    icon: '🏛',
    tagline: 'Explore events that shaped civilization',
    progressionKey: 'history',
    theme: {
      accent: '#b45309',
      accentSoft: 'rgba(180, 83, 9, 0.14)',
      gradient: 'linear-gradient(145deg, #92400e 0%, #d97706 48%, #fcd34d 100%)',
      shadow: '0 12px 32px rgba(180, 83, 9, 0.28)',
    },
  },
  {
    id: 'coding-academy',
    category: 'computer-science',
    name: 'Coding Academy',
    shortName: 'Coding Academy',
    icon: '💻',
    tagline: 'Build thinking skills for the digital age',
    progressionKey: 'computer-science',
    theme: {
      accent: '#7c3aed',
      accentSoft: 'rgba(124, 58, 237, 0.14)',
      gradient: 'linear-gradient(145deg, #6d28d9 0%, #8b5cf6 48%, #c4b5fd 100%)',
      shadow: '0 12px 32px rgba(124, 58, 237, 0.28)',
    },
  },
]

export const MIXED_ADVENTURE: MixedAdventureDefinition = {
  id: 'mixed-adventure',
  category: 'all',
  name: 'Grand Adventure',
  shortName: 'Mixed worlds',
  icon: '✦',
  tagline: 'A journey across every world',
  theme: {
    accent: '#0ea5e9',
    accentSoft: 'rgba(14, 165, 233, 0.14)',
    gradient: 'linear-gradient(145deg, #0369a1 0%, #0ea5e9 48%, #7dd3fc 100%)',
    shadow: '0 12px 32px rgba(14, 165, 233, 0.28)',
  },
}

export function getWorldByCategory(category: Category): WorldDefinition {
  return WORLDS.find((world) => world.category === category) ?? WORLDS[0]
}

export function getWorldDisplayName(category: Category | 'all'): string {
  if (category === 'all') return MIXED_ADVENTURE.shortName
  return getWorldByCategory(category).shortName
}
