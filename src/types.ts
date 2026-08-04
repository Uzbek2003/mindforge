export type Category = 'math' | 'science' | 'history' | 'computer-science'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Puzzle {
  id: number
  category: Category
  difficulty: Difficulty
  ageMin: number
  ageMax: number
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

export const CATEGORY_LABELS: Record<Category, string> = {
  math: 'Math',
  science: 'Science',
  history: 'History',
  'computer-science': 'Computer Science',
}

export const CATEGORY_ICONS: Record<Category, string> = {
  math: '∑',
  science: '⚗',
  history: '🏛',
  'computer-science': '💻',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const UNLOCK_THRESHOLDS = {
  medium: 15,
  hard: 15,
} as const
