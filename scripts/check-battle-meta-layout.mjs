/**
 * Measures battle-meta overflow at narrow phone widths using headless Chrome.
 * Exit 0 when no horizontal overflow / left clipping is detected.
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
  body { margin: 0; }
</style>
</head>
<body>
  <div class="screen adventure-screen story-battle">
    <div class="battle-top">
      <div class="battle-enemy-card">
        <span class="battle-enemy-icon">🌀</span>
        <div class="battle-enemy-meta">
          <strong>Counting Mist</strong>
          <span class="panel-hint">A soft fog that thins when sums come out right.</span>
        </div>
      </div>
      <div class="battle-hp-block">
        <div class="battle-hp-labels"><span>Harmony</span><span>40 / 40</span></div>
        <div class="battle-hp-bar"><div class="battle-hp-fill" style="width:100%"></div></div>
      </div>
      <div class="battle-player-row">
        <span>Keeper Lv 1</span>
        <span>+0 XP this fight · 12 total</span>
      </div>
    </div>
    <div class="battle-meta" role="status">
      <span class="badge battle-meta-title">Gate of Counting</span>
      <div class="battle-meta-chips">
        <span class="badge badge-muted">Puzzle 1/3</span>
        <span class="badge badge-muted">Attempt 1/2</span>
        <span class="timer-badge">⏱ 58s</span>
      </div>
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
      const meta = document.querySelector('.battle-meta')
      const title = document.querySelector('.battle-meta-title')
      const chips = [...document.querySelectorAll('.battle-meta-chips > *')]
      const rects = [meta, title, ...chips].filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect()
        return {
          text: (el.textContent || '').trim(),
          left: r.left,
          right: r.right,
          width: r.width,
          top: r.top,
        }
      })
      const clipped = rects.filter((r) => r.left < -0.5 || r.right > w + 0.5)
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        titleTop: title?.getBoundingClientRect().top ?? null,
        firstChipTop: chips[0]?.getBoundingClientRect().top ?? null,
        clipped,
        rects,
      }
    }, width)

    const titleBelowChips =
      report.titleTop != null &&
      report.firstChipTop != null &&
      report.titleTop >= report.firstChipTop - 1
    const overflow = report.scrollWidth > width + 1 || report.clipped.length > 0 || titleBelowChips

    console.log(
      JSON.stringify(
        {
          width,
          scrollWidth: report.scrollWidth,
          clientWidth: report.clientWidth,
          titleStackedAboveChips: !titleBelowChips,
          clippedCount: report.clipped.length,
          clipped: report.clipped,
          pass: !overflow,
        },
        null,
        2,
      ),
    )
    if (overflow) failed = true
    await page.close()
  }
} finally {
  await browser.close()
}

process.exit(failed ? 1 : 0)
