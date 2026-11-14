import type { Metadata } from 'next'

import { otherLocale, ui } from '@/lib/i18n'
import { siteConfig } from '@/site.config'
import { homePath } from '@/lib/urls'
import SiteShell, { SiteHead } from '@/views/layout'
import NotFound from '@/views/not-found'

export const metadata: Metadata = {
  title: `${ui(siteConfig.defaultLocale).notFoundTitle} · ${siteConfig.title}`,
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
}

export default function GlobalNotFound() {
  const locale = siteConfig.defaultLocale
  return (
    <html lang={locale === 'zh' ? 'zh-CN' : locale} data-ak-theme="archive" suppressHydrationWarning>
      <head><SiteHead /></head>
      <body>
        <SiteShell locale={locale} languageHref={homePath(otherLocale(locale))}>
          <NotFound locale={locale} />
        </SiteShell>
      </body>
    </html>
  )
}
