export function normalizeLang(lang: string) {
  return lang.trim().replace(/_/g, '-').toLowerCase()
}

export function isEnglishLang(lang: string) {
  const norm = normalizeLang(lang)
  return norm === 'en' || norm.startsWith('en-')
}
