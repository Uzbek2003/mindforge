import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')

describe('difficulty card responsive layout', () => {
  const ui = readFileSync(join(ROOT, 'src/components/UI.tsx'), 'utf8')
  const css = readFileSync(join(ROOT, 'src/App.css'), 'utf8')

  it('keeps Locked in normal document flow instead of absolute overlay', () => {
    expect(ui).toContain('className="difficulty-label"')
    expect(ui).toContain('className="lock-icon"')
    expect(ui).toContain('className="difficulty-meta"')
    // Locked badge must appear between title and meta in the markup order.
    const labelIdx = ui.indexOf('className="difficulty-label"')
    const lockIdx = ui.indexOf('{!unlocked && <span className="lock-icon">Locked</span>}')
    const metaIdx = ui.indexOf('className="difficulty-meta"')
    expect(lockIdx).toBeGreaterThan(labelIdx)
    expect(metaIdx).toBeGreaterThan(lockIdx)
    expect(css).not.toMatch(/\.lock-icon\s*\{[^}]*position:\s*absolute/)
  })

  it('gives narrow difficulty cards room to wrap without overflow', () => {
    expect(css).toContain('.difficulty-grid {')
    expect(css).toMatch(/grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
    expect(css).toContain('.difficulty-card {')
    expect(css).toMatch(/\.difficulty-card\s*\{[\s\S]*?min-width:\s*0/)
    expect(css).toMatch(/\.difficulty-card\s*\{[\s\S]*?overflow-wrap:\s*anywhere/)
    expect(css).toMatch(/@media \(max-width:\s*390px\)/)
    expect(css).toMatch(/@media \(max-width:\s*320px\)/)
  })
})
