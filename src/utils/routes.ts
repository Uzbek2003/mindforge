export type PublicLegalRoute = '/privacy' | '/terms' | '/about' | '/support'

export type LegalScreen = 'privacy' | 'terms' | 'about' | 'contact'

const PUBLIC_TO_SCREEN: Record<PublicLegalRoute, LegalScreen> = {
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/about': 'about',
  '/support': 'contact',
}

const SCREEN_TO_PUBLIC: Record<LegalScreen, PublicLegalRoute> = {
  privacy: '/privacy',
  terms: '/terms',
  about: '/about',
  contact: '/support',
}

export function legalPathToScreen(pathname: string): LegalScreen | null {
  return PUBLIC_TO_SCREEN[pathname as PublicLegalRoute] ?? null
}

export function screenToLegalPath(screen: LegalScreen): PublicLegalRoute {
  return SCREEN_TO_PUBLIC[screen]
}

export const PUBLIC_LEGAL_ROUTES: PublicLegalRoute[] = [
  '/privacy',
  '/terms',
  '/about',
  '/support',
]
