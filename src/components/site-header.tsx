import Link from 'next/link'
import { AkCut } from '@swufefox/ak-ui-react'

import { ui } from '@/lib/i18n'
import { homePath } from '@/lib/urls'
import { siteConfig, type Locale } from '@/site.config'
import { SiteNav } from './site-nav'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader({ locale, otherLocale }: { locale: Locale; otherLocale: Locale }) {
  const copy = ui(locale)

  return (
    <header className="site-header">
      <Link className="brand" href={homePath(locale)}>
        <AkCut as="span" size="sm" className="brand__mark" aria-hidden="true">
          {siteConfig.title.slice(0, 2).toUpperCase()}
        </AkCut>
        <span className="brand__name" translate="no">{siteConfig.title}</span>
        <span className="brand__suffix">{siteConfig.suffix}</span>
      </Link>
      <div className="site-nav__group">
        <SiteNav
          locale={locale}
          aboutUrl={siteConfig.about}
          otherLocale={otherLocale}
          otherLocaleName={siteConfig.localeNames[otherLocale]}
          labels={{
            home: copy.home,
            tags: siteConfig.nav[locale].tags,
            search: siteConfig.nav[locale].search,
            about: siteConfig.nav[locale].about,
            menu: copy.navMenu,
            close: copy.close,
            language: copy.switchLanguage,
          }}
        />
        <ThemeToggle label={copy.themeToggle} />
      </div>
    </header>
  )
}