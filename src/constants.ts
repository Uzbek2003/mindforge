export const APP_NAME = 'MindForge'
export const APP_ID = 'com.shakhzodrafikov.mindforge'
export const APP_TAGLINE = 'Learn across four adventure worlds'
export const APP_DESCRIPTION =
  'Free educational puzzle and trivia game covering math, science, history, and computer science.'
export const SUPPORT_EMAIL = 'shakhzodrafikov915@gmail.com'
export const APP_VERSION = '1.0.0'
export const PROGRESS_EXPORT_FILENAME = 'mindforge-progress.json'

/** Current localStorage keys (MindForge). */
export const STORAGE_KEYS = {
  progress: 'mindforge-progress',
  settings: 'mindforge-settings',
  lastSession: 'mindforge-last-session',
  reportedQuestions: 'mindforge-reported',
  adventure: 'mindforge-adventure',
} as const

/**
 * QuizNova-era keys kept for additive migration and defensive reads.
 * Do not remove until well after the MindForge rebrand ships.
 */
export const STORAGE_KEYS_LEGACY = {
  progress: 'quiznova-progress',
  settings: 'quiznova-settings',
  lastSession: 'quiznova-last-session',
  reportedQuestions: 'quiznova-reported',
  adventure: 'quiznova-adventure',
} as const

/** One-time flag so QuizNova values win over any stale pre-QuizNova mindforge-progress. */
export const STORAGE_MIGRATION_FLAG = 'mindforge-storage-migrated-v1'
