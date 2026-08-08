import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  APP_ID,
  APP_NAME,
  APP_VERSION,
  PROGRESS_EXPORT_FILENAME,
  STORAGE_KEYS,
  STORAGE_KEYS_LEGACY,
} from './constants'
import capacitorConfig from '../capacitor.config'
import { getTestVoicePhrase } from './utils/speechText'
import { buildQuestionReportEmail } from './utils/report'
import type { Puzzle } from './types'

const ROOT = join(import.meta.dirname, '..')
const EXPECTED_APP_ID = 'com.shakhzodrafikov.mindforge'

/** Built in parts so allowlisted migration code can still mention the old brand safely in tests. */
const FORBIDDEN_USER_FACING_BRAND = ['Quiz', 'Nova'].join('')

const SAMPLE_PUZZLE: Puzzle = {
  id: 1,
  category: 'math',
  difficulty: 'easy',
  question: 'What is 2 + 2?',
  options: ['3', '4', '5', '6'],
  correctIndex: 1,
  hint: 'Basic addition',
  explanation: 'Two plus two equals four.',
}

const ALLOWLIST = new Set([
  'src/brandingConsistency.test.ts',
  'src/constants.ts', // documents QuizNova-era legacy keys/migration
  'src/main.tsx', // calls migrateQuizNovaStorageKeys once at boot
  'src/utils/storageMigration.ts',
  'src/utils/storageMigration.test.ts',
  'src/utils/progressExport.ts',
  'src/utils/progressExport.test.ts',
  'src/supportEmail.test.ts',
])

const SOURCE_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|css|html|md|json|xml|txt|webmanifest|svg)$/i

/** Normalize repo-relative paths so Windows `\` and POSIX `/` share one allowlist. */
export function normalizeRepoPath(repoPath: string): string {
  return repoPath.replace(/\\/g, '/')
}

export function isBrandingAllowlisted(repoPath: string): boolean {
  return ALLOWLIST.has(normalizeRepoPath(repoPath))
}

function walkSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (
      entry === 'node_modules' ||
      entry === 'dist' ||
      entry === '.git' ||
      entry === 'build' ||
      entry === 'package-lock.json'
    ) {
      continue
    }
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walkSourceFiles(full, out)
      continue
    }
    if (SOURCE_EXTENSIONS.test(entry)) {
      out.push(normalizeRepoPath(relative(ROOT, full)))
    }
  }
  return out
}

describe('MindForge branding and package consistency', () => {
  it('exposes MindForge app name, id, version, and export filename', () => {
    expect(APP_NAME).toBe('MindForge')
    expect(APP_ID).toBe(EXPECTED_APP_ID)
    expect(APP_VERSION).toBe('1.0.0')
    expect(PROGRESS_EXPORT_FILENAME).toBe('mindforge-progress.json')
  })

  it('uses mindforge-* storage keys with quiznova-* legacy aliases only', () => {
    expect(STORAGE_KEYS.progress).toBe('mindforge-progress')
    expect(STORAGE_KEYS.settings).toBe('mindforge-settings')
    expect(STORAGE_KEYS.lastSession).toBe('mindforge-last-session')
    expect(STORAGE_KEYS.reportedQuestions).toBe('mindforge-reported')
    expect(STORAGE_KEYS.adventure).toBe('mindforge-adventure')

    expect(STORAGE_KEYS_LEGACY.progress).toBe('quiznova-progress')
    expect(STORAGE_KEYS_LEGACY.settings).toBe('quiznova-settings')
    expect(STORAGE_KEYS_LEGACY.lastSession).toBe('quiznova-last-session')
    expect(STORAGE_KEYS_LEGACY.reportedQuestions).toBe('quiznova-reported')
    expect(STORAGE_KEYS_LEGACY.adventure).toBe('quiznova-adventure')
  })

  it('keeps Capacitor appId/appName aligned with MindForge', () => {
    expect(capacitorConfig.appId).toBe(EXPECTED_APP_ID)
    expect(capacitorConfig.appName).toBe('MindForge')
  })

  it('keeps Android applicationId, namespace, labels, and MainActivity package aligned', () => {
    const gradle = readFileSync(join(ROOT, 'android/app/build.gradle'), 'utf8')
    const strings = readFileSync(join(ROOT, 'android/app/src/main/res/values/strings.xml'), 'utf8')
    const mainActivityPath = join(
      ROOT,
      'android/app/src/main/java/com/shakhzodrafikov/mindforge/MainActivity.java',
    )

    expect(gradle).toContain(`applicationId "${EXPECTED_APP_ID}"`)
    expect(gradle).toContain(`namespace = "${EXPECTED_APP_ID}"`)
    expect(strings).toContain('<string name="app_name">MindForge</string>')
    expect(strings).toContain('<string name="title_activity_main">MindForge</string>')
    expect(strings).toContain(`<string name="package_name">${EXPECTED_APP_ID}</string>`)
    expect(strings).toContain(`<string name="custom_url_scheme">${EXPECTED_APP_ID}</string>`)
    expect(existsSync(mainActivityPath)).toBe(true)
    expect(readFileSync(mainActivityPath, 'utf8')).toContain(`package ${EXPECTED_APP_ID};`)
    expect(
      existsSync(join(ROOT, 'android/app/src/main/java/com/uzbek2003/quiznova/MainActivity.java')),
    ).toBe(false)
  })

  it('uses MindForge in web manifest, index title, and spoken/report wording', () => {
    const manifest = readFileSync(join(ROOT, 'public/manifest.webmanifest'), 'utf8')
    const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8')
    expect(manifest).toContain('"name": "MindForge"')
    expect(manifest).toContain('"short_name": "MindForge"')
    expect(indexHtml).toContain('MindForge')
    expect(indexHtml).not.toContain(FORBIDDEN_USER_FACING_BRAND)

    expect(getTestVoicePhrase('system')).toContain('MindForge learning guide')
    expect(getTestVoicePhrase('president')).toContain('MindForge quiz coach')
    expect(buildQuestionReportEmail(SAMPLE_PUZZLE, 0)).toContain('MindForge')
    expect(buildQuestionReportEmail(SAMPLE_PUZZLE, 0)).not.toContain(FORBIDDEN_USER_FACING_BRAND)
  })

  it('normalizes Windows and POSIX paths before allowlist matching', () => {
    expect(normalizeRepoPath('src\\utils\\storageMigration.ts')).toBe(
      'src/utils/storageMigration.ts',
    )
    expect(normalizeRepoPath('src/utils/storageMigration.ts')).toBe(
      'src/utils/storageMigration.ts',
    )
    expect(normalizeRepoPath('src\\utils/progressExport.ts')).toBe(
      'src/utils/progressExport.ts',
    )

    expect(isBrandingAllowlisted('src\\utils\\storageMigration.ts')).toBe(true)
    expect(isBrandingAllowlisted('src/utils/storageMigration.ts')).toBe(true)
    expect(isBrandingAllowlisted('src\\constants.ts')).toBe(true)
    expect(isBrandingAllowlisted('src/constants.ts')).toBe(true)
    expect(isBrandingAllowlisted('src\\main.tsx')).toBe(true)
    expect(isBrandingAllowlisted('src\\components\\HomeScreen.tsx')).toBe(false)
    expect(isBrandingAllowlisted('public\\about.html')).toBe(false)
    expect(isBrandingAllowlisted('android\\app\\build.gradle')).toBe(false)
  })

  it('has no unintended QuizNova user-facing text in source files', () => {
    const offenders = walkSourceFiles(ROOT).flatMap((file) => {
      const normalized = normalizeRepoPath(file)
      if (isBrandingAllowlisted(normalized)) return []
      const content = readFileSync(join(ROOT, ...normalized.split('/')), 'utf8')
      if (!content.includes(FORBIDDEN_USER_FACING_BRAND)) return []

      return content
        .split('\n')
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.includes(FORBIDDEN_USER_FACING_BRAND))
        .map(({ line, index }) => `${normalized}:${index + 1}: ${line.trim()}`)
    })

    expect(offenders, 'QuizNova still present outside allowlisted migration/test files').toEqual([])
  })
})
