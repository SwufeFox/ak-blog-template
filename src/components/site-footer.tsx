import { AkCodeId } from '@swufefox/ak-ui-react'

import { feedPath } from '@/lib/urls'
import { siteConfig, type Locale } from '@/site.config'

function profileLabel(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer__identity">
        <AkCodeId>{siteConfig.title}</AkCodeId>
        <span>© {year} {siteConfig.author}</span>
      </div>
      <nav aria-label={siteConfig.nav[locale].about}>
        {siteConfig.sameAs?.map((url) => (
          <a key={url} href={url} rel="me">
            {profileLabel(url)}
          </a>
        ))}
        {siteConfig.email ? <a href={`mailto:${siteConfig.email}`}>Email</a> : null}
        <a href={feedPath(locale)}>RSS</a>
      </nav>
    </footer>
  )
}