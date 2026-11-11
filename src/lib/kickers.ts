import type { Locale } from '@/site.config'

/**
 * Latin kickers above Chinese section headings. They are design labels, not
 * copy: English pages already read Latin, so a translation of themselves
 * would be noise.
 */
const KICKERS = {
  categories: 'CATEGORIES',
  latest: 'LATEST',
  archive: 'ARCHIVE',
  search: 'SEARCH',
  tags: 'TAGS',
  contents: 'CONTENTS',
} as const

export function kicker(locale: Locale, key: keyof typeof KICKERS): string | undefined {
  return locale === 'zh' ? KICKERS[key] : undefined
}
