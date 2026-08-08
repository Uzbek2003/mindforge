/**
 * Measures difficulty-card label/lock/meta overlap at narrow phone widths.
 * Exit 0 when Locked, title, and progress text stay separated with no overflow.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WIDTHS = [320, 360, 390]
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome'

const cssFile = readdirSync(join(ROOT, 'dist/assets')).find((f) => f.endsWith('.css'))
if (!cssFile) {
  console.error('No built CSS in dist/assets — run npm run build first')
  process.exit(1)
}
const css = readFileSync(join(ROOT, 'dist/assets', cssFile), 'utf8')

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${css}</style>
<style>
  :root {
    --bg-elevated: #1a1d27;
    --border: #2a3142;
    --text: #e8ecf4;
    --text-muted: #9aa3b5;
    --easy: #4ade80;
    --medium: #fbbf24;
    --hard: #f87171;
    --radius: 12px;
  }
  body { margin: 0; background: #0f1117; color: var(--text); font-family: system-ui, sans-serif; }
  .wrap { padding: 12px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="difficulty-grid">
      <button type="button" class="difficulty-card difficulty-easy selected">
        <span class="difficulty-label">Easy</span>
        <span class="difficulty-meta">3/25 solved</span>
      </button>
      <button type="button" class="difficulty-card difficulty-medium locked" disabled>
        <span class="difficulty-label">Medium</span>
        <span class="lock-icon">Locked</span>
        <span class="difficulty-meta">5 easy left</span>
      </button>
      <button type="button" class="difficulty-card difficulty-hard locked" disabled>
        <span class="difficulty-label">Hard</span>
        <span class="lock-icon">Locked</span>
        <span class="difficulty-meta">10 medium left</span>
      </button>
    </div>
  </div>
</body>
</html>`

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

let failed = false
try {
  for (const width of WIDTHS) {
    const page = await browser.newPage()
    await page.setViewport({ width, height: 800, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const report = await page.evaluate((w) => {
      const grid = document.querySelector('.difficulty-grid')
      const cards = [...document.querySelectorAll('.difficulty-card')]
      const issues = []
      const gridRect = grid.getBoundingClientRect()
      if (grid.scrollWidth > w + 1 || gridRect.right > w + 1) {
        issues.push(`grid horizontal overflow scrollWidth=${grid.scrollWidth}`)
      }
      for (const card of cards) {
        const label = card.querySelector('.difficulty-label')
        const lock = card.querySelector('.lock-icon')
        const meta = card.querySelector('.difficulty-meta')
        const cardRect = card.getBoundingClientRect()
        const nodes = [label, lock, meta].filter(Boolean)
        for (const el of nodes) {
          const r = el.getBoundingClientRect()
          if (r.left < cardRect.left - 0.5 || r.right > cardRect.right + 0.5) {
            issues.push(`${card.className}: "${el.textContent}" clips card horizontally`)
          }
          if (r.width < 1 || r.height < 1) {
            issues.push(`${card.className}: "${el.textContent}" has zero size`)
          }
        }
        const rects = nodes.map((el) => ({
          text: el.textContent,
          ...el.getBoundingClientRect().toJSON(),
        }))
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i]
            const b = rects[j]
            const overlap = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
            if (overlap) {
              issues.push(`${card.className}: "${a.text}" overlaps "${b.text}"`)
            }
          }
        }
        // Locked cards must stack title → Locked → progress with clear gaps.
        if (lock) {
          const lr = label.getBoundingClientRect()
          const kr = lock.getBoundingClientRect()
          const mr = meta.getBoundingClientRect()
          const gap1 = kr.top - lr.bottom
          const gap2 = mr.top - kr.bottom
          if (gap1 < 4 || gap2 < 4) {
            issues.push(
              `${card.className}: insufficient vertical gap (title→lock=${gap1.toFixed(1)}px, lock→meta=${gap2.toFixed(1)}px)`,
            )
          }
        }
      }
      return { width: w, issues }
    }, width)
    const ok = report.issues.length === 0
    console.log(`[${width}px] ${ok ? 'PASS' : 'FAIL'}`)
    if (!ok) {
      failed = true
      for (const issue of report.issues) console.log('  -', issue)
    }
    await page.close()
  }
} finally {
  await browser.close()
}

process.exit(failed ? 1 : 0)
