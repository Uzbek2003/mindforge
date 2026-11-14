import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const outDir = '/opt/cursor/artifacts'
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 800 } },
})
const page = await context.newPage()

async function shot(name) {
  const path = `${outDir}/${name}`
  await page.screenshot({ path, fullPage: false })
  console.log('shot', path)
}

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForSelector('text=On your door. On the minute.')
await shot('kith_01_landing.png')

await page.getByRole('button', { name: 'Order nearby' }).click()
await page.waitForSelector('text=Nearby kitchens on the clock')
await page.waitForSelector('text=Ember Oven')
await page.waitForTimeout(500)
await shot('kith_02_discover.png')

await page.getByRole('button', { name: /Ember Oven/ }).click()
await page.waitForSelector('text=Minute Margherita')
await shot('kith_03_restaurant.png')

await page.getByRole('button', { name: 'Add' }).first().click()
await page.waitForSelector('text=Review bag')
await shot('kith_04_cart_bar.png')

await page.getByRole('button', { name: /Review bag/ }).click()
await page.waitForSelector('text=Confirm your drop')
await page.waitForSelector('text=Fair drop breakdown')
await shot('kith_05_checkout.png')

await page.getByRole('button', { name: /Place order/ }).click()
await page.waitForSelector('text=Live drop')
await page.waitForTimeout(2500)
await shot('kith_06_tracking.png')

const video = page.video()
await context.close()
await browser.close()

if (video) {
  const raw = await video.path()
  const { copyFile, rename } = await import('node:fs/promises')
  const dest = `${outDir}/kith_order_flow_demo.webm`
  try {
    await rename(raw, dest)
  } catch {
    await copyFile(raw, dest)
  }
  console.log('video', dest)
}

console.log('walkthrough ok')
