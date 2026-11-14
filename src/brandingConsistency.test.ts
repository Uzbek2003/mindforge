import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Kith branding', () => {
  it('names the product Kith in the document head', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    expect(html).toContain('Kith — On your door. On the minute.')
    expect(html).toContain('application-name" content="Kith"')
    expect(html).not.toMatch(/>MindForge</)
  })
})
