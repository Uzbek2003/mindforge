import { describe, expect, it } from 'vitest'
import {
  PUBLIC_LEGAL_ROUTES,
  legalPathToScreen,
  screenToLegalPath,
  type LegalScreen,
} from './routes'

describe('legalPathToScreen', () => {
  it('maps every public route to its screen', () => {
    expect(legalPathToScreen('/privacy')).toBe('privacy')
    expect(legalPathToScreen('/terms')).toBe('terms')
    expect(legalPathToScreen('/about')).toBe('about')
    expect(legalPathToScreen('/support')).toBe('contact')
  })

  it('returns null for unknown paths', () => {
    expect(legalPathToScreen('/')).toBeNull()
    expect(legalPathToScreen('/privacy/')).toBeNull()
    expect(legalPathToScreen('/Privacy')).toBeNull()
    expect(legalPathToScreen('')).toBeNull()
  })
})

describe('screenToLegalPath', () => {
  it('round-trips with legalPathToScreen for all public routes', () => {
    for (const route of PUBLIC_LEGAL_ROUTES) {
      const screen = legalPathToScreen(route)
      expect(screen).not.toBeNull()
      expect(screenToLegalPath(screen as LegalScreen)).toBe(route)
    }
  })

  it('maps the contact screen to the /support path', () => {
    expect(screenToLegalPath('contact')).toBe('/support')
  })
})

describe('PUBLIC_LEGAL_ROUTES', () => {
  it('lists each route exactly once', () => {
    expect(new Set(PUBLIC_LEGAL_ROUTES).size).toBe(PUBLIC_LEGAL_ROUTES.length)
    expect(PUBLIC_LEGAL_ROUTES).toHaveLength(4)
  })
})
