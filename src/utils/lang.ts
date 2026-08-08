/** Lowercased BCP-47-ish tag: "en_US" → "en-us". */
export function normalizeLang(lang: string): string {
  return lang.trim().replace(/_/g, '-').toLowerCase()
}

/** Display form of an engine language tag: "en_US" → "en-US". */
export function formatLangTag(lang: string): string {
  return lang.replace(/_/g, '-')
}

export function isEnglishLang(lang: string): boolean {
  const norm = normalizeLang(lang)
  return norm === 'en' || norm.startsWith('en-')
}
