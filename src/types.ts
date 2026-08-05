export type Category = 'math' | 'science' | 'history' | 'computer-science'
export type Difficulty = 'easy' | 'medium' | 'hard'

export type SessionMode = 'quick' | 'standard' | 'challenge' | 'full' | 'endless' | 'daily'

export type TextSize = 'normal' | 'large'
export type VoiceSpeed = 'slow' | 'normal' | 'fast'
export type VoicePitch = 'deep' | 'normal'

export interface Puzzle {
  id: number
  category: Category
  difficulty: Difficulty
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  hint: string
  explanation: string
}

export interface GameProgress {
  completed: number[]
  correctCount: number
  streak: number
  bestStreak: number
}

export interface AppSettings {
  soundEnabled: boolean
  vibrationEnabled: boolean
  textSize: TextSize
  reduceAnimations: boolean
  voiceExplanationsEnabled: boolean
  voiceAutoPlay: boolean
  voiceId: string | null
  voiceSpeed: VoiceSpeed
  voicePitch: VoicePitch
  voiceVolume: number
  stopSpeechOnLeave: boolean
}

export interface LastSession {
  category: Category | 'all'
  difficulty: Difficulty
  mode: SessionMode
  puzzleIds: number[]
  index: number
  sessionAnswers: SessionAnswer[]
  startedAt: number
}

export interface SessionAnswer {
  puzzleId: number
  selectedIndex: number | null
  correct: boolean
  timedOut?: boolean
}

export interface SessionResult {
  correct: number
  incorrect: number
  total: number
  accuracy: number
  bestStreakInSession: number
  timeMs: number
  wrongPuzzleIds: number[]
  category: Category | 'all'
  difficulty: Difficulty
  mode: SessionMode
}

export const CATEGORY_LABELS: Record<Category, string> = {
  math: 'Math Kingdom',
  science: 'Science Lab',
  history: 'History Museum',
  'computer-science': 'Coding Academy',
}

export const CATEGORY_ICONS: Record<Category, string> = {
  math: '📘',
  science: '🧪',
  history: '🏛',
  'computer-science': '💻',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const SESSION_MODE_CONFIG: Record<
  SessionMode,
  { label: string; description: string; count: number | null }
> = {
  quick: { label: 'Quick Play', description: '5 questions', count: 5 },
  standard: { label: 'Standard', description: '10 questions', count: 10 },
  challenge: { label: 'Challenge', description: '20 questions', count: 20 },
  full: { label: 'Full Category', description: 'All available puzzles', count: null },
  endless: { label: 'Endless', description: 'Mixed mode until you stop', count: null },
  daily: { label: 'Daily Challenge', description: '5 new puzzles every day', count: 5 },
}

export const UNLOCK_THRESHOLDS = {
  medium: 15,
  hard: 15,
} as const

/** Seconds allowed per question by difficulty. */
export const DIFFICULTY_TIME_LIMITS: Record<Difficulty, number> = {
  easy: 60,
  medium: 40,
  hard: 35,
}

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  textSize: 'normal',
  reduceAnimations: false,
  voiceExplanationsEnabled: false,
  voiceAutoPlay: false,
  voiceId: null,
  voiceSpeed: 'normal',
  voicePitch: 'deep',
  voiceVolume: 1,
  stopSpeechOnLeave: true,
}
