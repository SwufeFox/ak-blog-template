import type { NextConfig } from 'next'

import { siteConfig } from './src/site.config'

const base = siteConfig.defaultLocale

/**
 * The default locale lives at the root of the site (`/posts/hello`), every
 * other locale gets a prefix (`/en/posts/hello`). The rewrites below send the
 * unprefixed paths to the default locale so both URLs resolve to the same
 * page; `src/proxy.ts` redirects the prefixed copy of the default locale
 * back to the root so a page is never served from two addresses.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: `/${base}` },
        { source: '/posts/:slug', destination: `/${base}/posts/:slug` },
        { source: '/tags', destination: `/${base}/tags` },
        { source: '/tags/:tag', destination: `/${base}/tags/:tag` },
        { source: '/search', destination: `/${base}/search` },
        { source: '/feed.xml', destination: `/${base}/feed.xml` },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default nextConfig