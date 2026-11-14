/**
 * Site configuration.
 *
 * Template defaults live here. The content builder supplies site.override.json
 * from the content repository's optional site.json.
 */

import overrides from './site.override.json'
import type { SiteOptions } from './site-options'

const siteOptions: SiteOptions = overrides

export const locales = ['zh', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'zh'

/** UI strings. Keep one entry per locale; the type enforces exhaustiveness. */
export interface UiStrings {
  skip: string
  home: string
  navMenu: string
  close: string
  switchLanguage: string
  themeToggle: string
  allPosts: string
  categories: string
  tags: string
  category: string
  published: string
  readingTime: string
  readMinutes: (minutes: number) => string
  updated: (date: string) => string
  breadcrumb: string
  postNavigation: string
  toc: string
  colophon: string
  licenseText: string
  source: string
  previous: string
  next: string
  backToTop: string
  empty: string
  notFoundTitle: string
  notFoundText: string
  notFoundAction: string
  searchLabel: string
  searchPlaceholder: string
  searchFoundOne: string
  searchFoundMany: string
  searchNone: string
  searchClear: string
  searchHint: string
  postsCount: (count: number) => string
  tagsCount: (count: number) => string
  postsLabel: string
  moreEntries: string
  latestEntry: string
  readArticle: string
  categoriesLabel: string
  tagsLabel: string
  typeLabel: string
  termLabel: string
  copyCode: string
  copied: string
}

export interface SiteConfig {
  /** Display name, shown in the header and in <title>. */
  title: string
  /** Small latin label printed next to the title. */
  suffix: string
  /** One-liner used on the home page and in meta descriptions. */
  description: Record<Locale, string>
  /** Absolute origin of the deployed site, no trailing slash. */
  url: string
  author: string
  email?: string
  /** External "about me" page. */
  about?: string
  repo?: string
  /** Profiles shown in the footer. */
  sameAs?: string[]
  /** Locale used when the visitor did not ask for another one. */
  defaultLocale: Locale
  /** Every locale the site is published in. */
  locales: Locale[]
  /** Endonyms, shown in the language switcher. */
  localeNames: Record<Locale, string>
  /** Labels for the header navigation. */
  nav: Record<Locale, { tags: string; search: string; about: string }>
  /** Posts shown per page on the home page. 0 means "all of them". */
  postsOnHome: number
  /** Content licence shown in the article colophon. */
  license: {
    name: string
    url: string
  }
}

const siteDefaults: SiteConfig = {
  title: 'open-ak',
  suffix: '/ notes',
  description: {
    zh: '关于代码、工具，以及把事情做简单的练习。',
    en: 'Notes on code, tools, and the practice of making things simpler.',
  },
  url: 'https://example.com',
  author: 'your-name',
  email: 'hello@example.com',
  about: 'https://example.com/about',
  repo: 'https://github.com/your-name/open-ak-blog-template',
  sameAs: ['https://github.com/your-name', 'https://example.com/@your-name'],
  defaultLocale,
  locales: [...locales],
  localeNames: {
    zh: '中文',
    en: 'English',
  },
  nav: {
    zh: { tags: '归档', search: '搜索', about: '关于' },
    en: { tags: 'Archive', search: 'Search', about: 'About' },
  },
  postsOnHome: 0,
  license: {
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  },
}

export const siteConfig: SiteConfig = {
  ...siteDefaults,
  ...siteOptions,
  description: { ...siteDefaults.description, ...siteOptions.description },
  license: { ...siteDefaults.license, ...siteOptions.license },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? siteOptions.url ?? siteDefaults.url,
}

export function isLocale(value: string): value is Locale {
  return (siteConfig.locales as string[]).includes(value)
}
