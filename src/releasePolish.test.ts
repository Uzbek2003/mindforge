import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  APP_DESCRIPTION,
  APP_NAME,
  CANONICAL_URL,
  OG_IMAGE_URL,
  SITE_URL,
} from './constants'
import { DEFAULT_SETTINGS } from './types'

const ROOT = join(import.meta.dirname, '..')

describe('release polish: social metadata', () => {
  it('exposes MindForge site URL constants for social previews', () => {
    expect(SITE_URL).toBe('https://mindforge-beta-five.vercel.app')
    expect(CANONICAL_URL).toBe('https://mindforge-beta-five.vercel.app/')
    expect(OG_IMAGE_URL).toBe('https://mindforge-beta-five.vercel.app/icon-512.png')
  })

  it('ships canonical, Open Graph, and Twitter tags in index.html', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
    const forbidden = ['Quiz', 'Nova'].join('')

    expect(html).toContain(`<title>${APP_NAME}`)
    expect(html).toContain(`content="${APP_NAME}`)
    expect(html).toContain(`<link rel="canonical" href="${CANONICAL_URL}"`)
    expect(html).toContain(`property="og:title"`)
    expect(html).toContain(`property="og:description"`)
    expect(html).toContain(`property="og:image" content="${OG_IMAGE_URL}"`)
    expect(html).toContain(`property="og:url" content="${CANONICAL_URL}"`)
    expect(html).toContain(`property="og:site_name" content="${APP_NAME}"`)
    expect(html).toContain(`name="twitter:card" content="summary_large_image"`)
    expect(html).toContain(`name="twitter:title"`)
    expect(html).toContain(`name="twitter:description"`)
    expect(html).toContain(`name="twitter:image" content="${OG_IMAGE_URL}"`)
    expect(html).toContain(
      'MindForge — free educational puzzle and trivia game covering math, science, history, and computer science.',
    )
    expect(html).toContain(APP_DESCRIPTION.replace(/^Free/, 'free'))
    expect(html).not.toContain(forbidden)
  })

  it('keeps the web manifest description MindForge-branded', () => {
    const manifest = readFileSync(join(ROOT, 'public/manifest.webmanifest'), 'utf8')
    expect(manifest).toContain('"name": "MindForge"')
    expect(manifest).toContain('MindForge')
    expect(manifest).not.toContain(['Quiz', 'Nova'].join(''))
  })
})

describe('release polish: answer accessibility markup', () => {
  it('uses semantic radiogroup radios instead of listbox/option', () => {
    const answerOptions = readFileSync(join(ROOT, 'src/components/AnswerOptions.tsx'), 'utf8')
    const classic = readFileSync(join(ROOT, 'src/components/PuzzleGame.tsx'), 'utf8')
    const story = readFileSync(
      join(ROOT, 'src/components/adventure/StoryBattleScreen.tsx'),
      'utf8',
    )

    expect(answerOptions).toContain('role="radiogroup"')
    expect(answerOptions).toContain('type="radio"')
    expect(answerOptions).not.toContain('role="listbox"')
    expect(answerOptions).not.toContain('role="option"')

    expect(classic).toContain('AnswerOptions')
    expect(classic).not.toContain('role="listbox"')
    expect(classic).not.toContain('role="option"')

    expect(story).toContain('AnswerOptions')
    expect(story).not.toContain('role="listbox"')
    expect(story).not.toContain('role="option"')
  })
})

describe('release polish: timer accessibility settings', () => {
  it('defaults to timed play (Untimed and Extended Time off)', () => {
    expect(DEFAULT_SETTINGS.untimedMode).toBe(false)
    expect(DEFAULT_SETTINGS.extendedTime).toBe(false)
  })

  it('exposes Untimed Mode and Extended Time in Settings', () => {
    const settingsUi = readFileSync(join(ROOT, 'src/components/SettingsScreen.tsx'), 'utf8')
    expect(settingsUi).toContain('Untimed Mode')
    expect(settingsUi).toContain('Extended Time')
    expect(settingsUi).toContain("onUpdate('untimedMode'")
    expect(settingsUi).toContain("onUpdate('extendedTime'")
  })

  it('wires timer resolution into classic and story gameplay', () => {
    const classic = readFileSync(join(ROOT, 'src/components/PuzzleGame.tsx'), 'utf8')
    const story = readFileSync(
      join(ROOT, 'src/components/adventure/StoryBattleScreen.tsx'),
      'utf8',
    )
    expect(classic).toContain('resolveQuestionTimeLimit')
    expect(classic).toContain('isUntimed')
    expect(story).toContain('resolveQuestionTimeLimit')
    expect(story).toContain('resolveRetryTimeLimit')
    expect(story).toContain('isUntimed')
  })
})
