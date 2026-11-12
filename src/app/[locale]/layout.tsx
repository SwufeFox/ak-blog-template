import type { Metadata } from 'next'
import '@swufefox/ak-ui-react/style.css'
import 'katex/dist/katex.min.css'
import '@/styles/globals.css'

import { AkGridBackdrop } from '@swufefox/ak-ui-react'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { otherLocale, ui } from '@/lib/i18n'
import { THEME_COLORS, THEME_STORAGE_KEY } from '@/lib/theme'
import { homePath } from '@/lib/urls'
import { isLocale, siteConfig } from '@/site.config'

/** Runs before paint so the page never flashes the wrong colour scheme or chrome. */
const themeScript = `(function(){var root=document.documentElement;var colors=${JSON.stringify(THEME_COLORS)};function paint(t){root.dataset.akTheme=t;var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=colors[t]||colors.archive}try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='archive'||t==='light'){paint('archive');return}if(t==='terminal'||t==='dark'){paint('terminal');return}}catch(e){}paint('archive')})()`

export function generateStaticParams() {
  return siteConfig.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.title} ${siteConfig.suffix}`,
      template: `%s · ${siteConfig.title}`,
    },
    description: siteConfig.description[isLocale(locale) ? locale : siteConfig.defaultLocale],
    applicationName: siteConfig.title,
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    alternates: {
      canonical: homePath(isLocale(locale) ? locale : siteConfig.defaultLocale),
      languages: Object.fromEntries(
        siteConfig.locales.map((entry) => [entry, homePath(entry)]),
      ),
    },
    openGraph: {
      type: 'website',
      siteName: siteConfig.title,
      title: `${siteConfig.title} ${siteConfig.suffix}`,
      description: siteConfig.description[isLocale(locale) ? locale : siteConfig.defaultLocale],
      locale: isLocale(locale) ? locale : siteConfig.defaultLocale,
    },
    twitter: {
      card: 'summary',
      title: `${siteConfig.title} ${siteConfig.suffix}`,
      description: siteConfig.description[isLocale(locale) ? locale : siteConfig.defaultLocale],
    },
    robots: { index: true, follow: true },
    icons: { icon: '/favicon.svg' },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Unknown locales fall back to the default one instead of 404ing here: the
  // catch-all route below raises notFound(), and this layout is what gives the
  // resulting 404 page the site shell.
  const resolved = isLocale(locale) ? locale : siteConfig.defaultLocale
  const copy = ui(resolved)

  return (
    <html
      lang={resolved === 'zh' ? 'zh-CN' : resolved}
      data-ak-theme="archive"
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content={THEME_COLORS.archive} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="site-canvas">
          <AkGridBackdrop variant="grid" className="site-canvas__grid" aria-hidden="true" />
          <div className="shell">
            <a className="skip" href="#main">
              {copy.skip}
            </a>
            <SiteHeader locale={resolved} otherLocale={otherLocale(resolved)} />
            <main id="main">{children}</main>
            <SiteFooter locale={resolved} />
          </div>
        </div>
      </body>
    </html>
  )
}
