import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SUPPORT_EMAIL } from './constants'
import { buildQuestionReportEmail } from './utils/report'
import type { Puzzle } from './types'

const EXPECTED_SUPPORT_EMAIL = 'shakhzodrafikov915@gmail.com'
/** Built in parts so this test file is not flagged by the repo-wide scan. */
const LEGACY_SUPPORT_EMAIL = ['support', '@', 'quiznova', '.', 'app'].join('')
const ROOT = join(import.meta.dirname, '..')

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

function walkFiles(dir: string, out: string[] = []): string[] {
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
      walkFiles(full, out)
      continue
    }
    if (/\.(ts|tsx|js|jsx|html|md|json|xml|txt)$/i.test(entry)) {
      out.push(full)
    }
  }
  return out
}

describe('support email', () => {
  it('uses the real support address as SUPPORT_EMAIL', () => {
    expect(SUPPORT_EMAIL).toBe(EXPECTED_SUPPORT_EMAIL)
  })

  it('builds report mailto links with the real support address', () => {
    const href = buildQuestionReportEmail(SAMPLE_PUZZLE, 0)
    expect(href.startsWith(`mailto:${EXPECTED_SUPPORT_EMAIL}?`)).toBe(true)
    expect(href).not.toContain(LEGACY_SUPPORT_EMAIL)
  })

  it('keeps Settings and Legal pages bound to SUPPORT_EMAIL for display and mailto', () => {
    const settings = readFileSync(join(ROOT, 'src/components/SettingsScreen.tsx'), 'utf8')
    const legal = readFileSync(join(ROOT, 'src/components/LegalPage.tsx'), 'utf8')

    expect(settings).toContain('SUPPORT_EMAIL')
    expect(settings).toContain('mailto:${SUPPORT_EMAIL}')
    expect(settings).toContain('{SUPPORT_EMAIL}')
    expect(settings).not.toContain(LEGACY_SUPPORT_EMAIL)

    expect(legal).toContain('mailto:${SUPPORT_EMAIL}')
    expect(legal).toContain('{SUPPORT_EMAIL}')
    expect(legal).not.toContain(LEGACY_SUPPORT_EMAIL)
  })

  it('updates static legal/support pages and removes the legacy address everywhere', () => {
    const publicFiles = ['public/privacy.html', 'public/terms.html', 'public/support.html']
    for (const file of publicFiles) {
      const content = readFileSync(join(ROOT, file), 'utf8')
      expect(content, file).toContain(`mailto:${EXPECTED_SUPPORT_EMAIL}`)
      expect(content, file).toContain(EXPECTED_SUPPORT_EMAIL)
      expect(content, file).not.toContain(LEGACY_SUPPORT_EMAIL)
    }

    const offenders = walkFiles(ROOT).filter((file) => {
      if (file.endsWith(`${join('src', 'supportEmail.test.ts')}`) || file.endsWith('supportEmail.test.ts')) {
        return false
      }
      const content = readFileSync(file, 'utf8')
      return content.includes(LEGACY_SUPPORT_EMAIL)
    })

    expect(
      offenders.map((file) => relative(ROOT, file)),
      'legacy support email still present',
    ).toEqual([])
  })
})
