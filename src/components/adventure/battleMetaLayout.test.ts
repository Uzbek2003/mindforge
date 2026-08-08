import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '../../..')

describe('battle metadata responsive layout', () => {
  const screen = readFileSync(
    join(ROOT, 'src/components/adventure/StoryBattleScreen.tsx'),
    'utf8',
  )
  const css = readFileSync(join(ROOT, 'src/App.css'), 'utf8')

  it('uses a dedicated battle-meta structure instead of a single overflow-prone chip row', () => {
    expect(screen).toContain('className="battle-meta"')
    expect(screen).toContain('battle-meta-title')
    expect(screen).toContain('battle-meta-chips')
    expect(screen).toContain('{node.name}')
    // Avoid regressing to the shared game-meta row for story battle chips.
    expect(screen).not.toMatch(/className="game-meta"/)
  })

  it('defines narrow-screen wrapping/stacking rules for battle metadata', () => {
    expect(css).toContain('.battle-meta {')
    expect(css).toContain('.battle-meta-chips {')
    expect(css).toContain('overflow-x: clip')
    expect(css).toContain('overflow-wrap: anywhere')
    expect(css).toMatch(/@media \(max-width:\s*480px\)/)
    expect(css).toMatch(/@media \(max-width:\s*360px\)/)
    expect(css).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
    expect(css).toMatch(/\.battle-meta-chips\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  })
})
