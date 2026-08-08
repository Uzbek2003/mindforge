export type PublicLegalRoute = '/privacy' | '/terms' | '/about' | '/support'

export type LegalScreen = 'privacy' | 'terms' | 'about' | 'contact'

const SCREEN_TO_PUBLIC: Record<LegalScreen, PublicLegalRoute> = {
  privacy: '/privacy',
  terms: '/terms',
  about: '/about',
  contact: '/support',
}

const PUBLIC_TO_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_TO_PUBLIC).map(([screen, path]) => [path, screen as LegalScreen]),
) as Record<PublicLegalRoute, LegalScreen>

/** Screen order used by the Settings menu. */
export const LEGAL_SCREENS = Object.keys(SCREEN_TO_PUBLIC) as LegalScreen[]

export const LEGAL_SCREEN_TITLES: Record<LegalScreen, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Use',
  about: 'About the App',
  contact: 'Contact & Support',
}

export function legalPathToScreen(pathname: string): LegalScreen | null {
  return PUBLIC_TO_SCREEN[pathname as PublicLegalRoute] ?? null
}

export function screenToLegalPath(screen: LegalScreen): PublicLegalRoute {
  return SCREEN_TO_PUBLIC[screen]
}

export const PUBLIC_LEGAL_ROUTES: PublicLegalRoute[] = Object.values(SCREEN_TO_PUBLIC)
