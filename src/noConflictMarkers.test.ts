import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')

/** Built in parts so this test file is not flagged by the scan. */
const CONFLICT_MARKERS = [
  ['<', '<', '<', '<', '<', '<', '<'].join(''),
  ['=', '=', '=', '=', '=', '=', '='].join(''),
  ['>', '>', '>', '>', '>', '>', '>'].join(''),
] as const

const SOURCE_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|css|html|md|json|xml|txt)$/i

function listTrackedSourceFiles(): string[] {
  const output = execFileSync('git', ['ls-files', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  return output
    .split('\0')
    .filter(Boolean)
    .filter((file) => SOURCE_EXTENSIONS.test(file))
    .filter((file) => !file.endsWith('noConflictMarkers.test.ts'))
}

function isConflictMarkerLine(line: string): boolean {
  const trimmed = line.trimStart()
  const [start, middle, end] = CONFLICT_MARKERS
  return (
    trimmed.startsWith(start) ||
    trimmed === middle ||
    trimmed.startsWith(end)
  )
}

function findConflictMarkerHits(files: string[]): string[] {
  const hits: string[] = []
  for (const file of files) {
    const content = readFileSync(join(ROOT, file), 'utf8')
    const lines = content.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (isConflictMarkerLine(line)) {
        hits.push(`${relative(ROOT, join(ROOT, file))}:${index + 1}: ${line.trim()}`)
      }
    })
  }
  return hits
}

describe('merge conflict markers', () => {
  it('keeps tracked source files free of unresolved conflict markers', () => {
    const files = listTrackedSourceFiles()
    expect(files.length).toBeGreaterThan(0)
    expect(files).toContain('src/App.tsx')

    const hits = findConflictMarkerHits(files)
    expect(hits, 'unresolved merge conflict markers found').toEqual([])
  })

  it('still detects a synthetic conflict marker when present', () => {
    const synthetic = [
      'const keep = true',
      `${CONFLICT_MARKERS[0]} HEAD`,
      'const fromHead = 1',
      CONFLICT_MARKERS[1],
      'const fromIncoming = 2',
      `${CONFLICT_MARKERS[2]} 01d993ed1dd044ff49ffebda8b675a641e5ecf4e`,
      'const after = true',
    ].join('\n')

    const lines = synthetic.split('\n')
    const detected = lines
      .map((line, index) => (isConflictMarkerLine(line) ? `${index + 1}: ${line.trimStart()}` : null))
      .filter((value): value is string => value !== null)

    expect(detected).toEqual([
      `2: ${CONFLICT_MARKERS[0]} HEAD`,
      `4: ${CONFLICT_MARKERS[1]}`,
      `6: ${CONFLICT_MARKERS[2]} 01d993ed1dd044ff49ffebda8b675a641e5ecf4e`,
    ])
  })
})
