import { siteConfig, type Locale } from '@/site.config'

/**
 * URLs of the default locale live at the root; English gets an `/en` prefix.
 * Both locales have real static routes, including `/posts/<slug>` for Chinese.
 */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === siteConfig.defaultLocale) return clean
  return `/${locale}${clean === '/' ? '' : clean}`
}

export function homePath(locale: Locale): string {
  return localePath(locale, '/')
}

export function postPath(locale: Locale, slug: string): string {
  return localePath(locale, `/posts/${encodeURIComponent(slug)}`)
}

export function tagsPath(locale: Locale): string {
  return localePath(locale, '/tags')
}

export function tagPath(locale: Locale, tag: string): string {
  return localePath(locale, `/tags/${encodeURIComponent(tag)}`)
}

export function searchPath(locale: Locale): string {
  return localePath(locale, '/search')
}

export function feedPath(locale: Locale): string {
  return localePath(locale, '/feed.xml')
}
