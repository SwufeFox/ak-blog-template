import { notFound } from 'next/navigation'

import { isLocale, type Locale } from '@/site.config'

/**
 * Pages call this to turn the raw route segment into a locale. An unknown
 * segment is a 404 — the layout still renders the site shell, because it falls
 * back to the default locale when the segment is not one of the configured
 * languages.
 */
export function requireLocale(value: string): Locale {
  if (!isLocale(value)) notFound()
  return value
}