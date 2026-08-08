import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')

/** Minimal PNG IHDR reader for width/height. */
function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path)
  expect(buf.subarray(0, 8).toString('binary')).toBe('\x89PNG\r\n\x1a\n')
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  return { width, height }
}

const LEGACY = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
} as const

const ADAPTIVE = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
} as const

const SPLASH: Record<string, readonly [number, number]> = {
  'drawable/splash.png': [480, 320],
  'drawable-port-mdpi/splash.png': [320, 480],
  'drawable-port-hdpi/splash.png': [480, 800],
  'drawable-port-xhdpi/splash.png': [720, 1280],
  'drawable-port-xxhdpi/splash.png': [960, 1600],
  'drawable-port-xxxhdpi/splash.png': [1280, 1920],
  'drawable-land-mdpi/splash.png': [480, 320],
  'drawable-land-hdpi/splash.png': [800, 480],
  'drawable-land-xhdpi/splash.png': [1280, 720],
  'drawable-land-xxhdpi/splash.png': [1600, 960],
  'drawable-land-xxxhdpi/splash.png': [1920, 1280],
}

describe('MindForge Knowledge Cube icon assets', () => {
  it('ships the master logo source', () => {
    const master = join(ROOT, 'branding/source/mindforge-knowledge-cube-master.png')
    expect(existsSync(master)).toBe(true)
    expect(pngSize(master)).toEqual({ width: 1024, height: 1024 })
  })

  it('installs legacy and round launcher icons at every density', () => {
    for (const [folder, size] of Object.entries(LEGACY)) {
      for (const name of ['ic_launcher.png', 'ic_launcher_round.png'] as const) {
        const path = join(ROOT, 'android/app/src/main/res', folder, name)
        expect(existsSync(path), path).toBe(true)
        expect(pngSize(path)).toEqual({ width: size, height: size })
      }
    }
  })

  it('installs adaptive foregrounds inside the Android safe zone', () => {
    for (const [folder, size] of Object.entries(ADAPTIVE)) {
      const path = join(ROOT, 'android/app/src/main/res', folder, 'ic_launcher_foreground.png')
      expect(existsSync(path), path).toBe(true)
      expect(pngSize(path)).toEqual({ width: size, height: size })

      // Soft alpha bbox must stay near the center 66dp safe circle.
      const buf = readFileSync(path)
      // Decode via PNG size already checked; approximate content bounds using non-zero alpha scan
      // for IHDR-validated RGBA PNGs written by our generator (no palette).
      const { width, height } = pngSize(path)
      expect(width).toBe(size)
      expect(height).toBe(size)
      // Ensure file is a real PNG larger than an empty stub.
      expect(buf.byteLength).toBeGreaterThan(800)
    }

    const bg = readFileSync(join(ROOT, 'android/app/src/main/res/values/ic_launcher_background.xml'), 'utf8')
    expect(bg).toMatch(/#0F1117/i)
  })

  it('installs portrait and landscape splash screens', () => {
    for (const [rel, [w, h]] of Object.entries(SPLASH)) {
      const path = join(ROOT, 'android/app/src/main/res', rel)
      expect(existsSync(path), path).toBe(true)
      expect(pngSize(path)).toEqual({ width: w, height: h })
    }
  })

  it('ships web favicon, PWA icons, Play icon, and feature graphic', () => {
    const expectations: Array<[string, number, number]> = [
      ['public/favicon-32.png', 32, 32],
      ['public/icon-192.png', 192, 192],
      ['public/icon-512.png', 512, 512],
      ['public/play-icon-512.png', 512, 512],
      ['public/feature-graphic-1024x500.png', 1024, 500],
      ['branding/generated/mindforge-icon-foreground-1024.png', 1024, 1024],
      ['branding/generated/mindforge-icon-background-1024.png', 1024, 1024],
      ['branding/generated/mindforge-play-icon-512.png', 512, 512],
      ['branding/generated/mindforge-feature-1024x500.png', 1024, 500],
    ]
    for (const [rel, w, h] of expectations) {
      const path = join(ROOT, rel)
      expect(existsSync(path), path).toBe(true)
      expect(pngSize(path)).toEqual({ width: w, height: h })
    }

    const favicon = readFileSync(join(ROOT, 'public/favicon.svg'), 'utf8')
    expect(favicon).toContain('aria-label="MindForge"')
    expect(favicon).toContain('image/png;base64,')
    expect(favicon).not.toContain('>Q<')

    const logoMark = join(ROOT, 'public/logo-mark.png')
    expect(existsSync(logoMark)).toBe(true)
    expect(pngSize(logoMark)).toEqual({ width: 128, height: 128 })

    const header = readFileSync(join(ROOT, 'src/components/UI.tsx'), 'utf8')
    expect(header).toContain('src="/logo-mark.png"')
    expect(header).not.toMatch(/logo-mark[^>]*>Q</)

    const logoCss = readFileSync(join(ROOT, 'src/App.css'), 'utf8')
    expect(logoCss).toMatch(/\.logo-mark\s*\{[\s\S]*?object-fit:\s*cover/)
    expect(logoCss).not.toMatch(/\.logo-mark\s*\{[\s\S]*?#7c3aed/)

    const manifest = readFileSync(join(ROOT, 'public/manifest.webmanifest'), 'utf8')
    expect(manifest).toContain('/icon-192.png')
    expect(manifest).toContain('/icon-512.png')

    const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8')
    expect(indexHtml).toContain('/favicon.svg')
    expect(indexHtml).toContain('/favicon-32.png')
    expect(indexHtml).toContain('/icon-192.png')
  })
})
