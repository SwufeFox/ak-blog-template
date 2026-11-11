import { NextResponse, type NextRequest } from 'next/server'

import { siteConfig } from '@/site.config'

const base = siteConfig.defaultLocale

/**
 * The default locale is served from the root of the site, so `/zh/posts/x`
 * would be a second copy of `/posts/x`. Redirecting here — before the router
 * rewrites the bare paths to `/zh/...` — keeps one address per page without
 * the two rules fighting each other.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname !== `/${base}` && !pathname.startsWith(`/${base}/`)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = pathname.slice(base.length + 1) || '/'
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: ['/((?!_next|content|favicon.ico|robots.txt|sitemap.xml|feed.xml).*)'],
}
