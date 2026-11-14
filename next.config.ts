import type { NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

import { getImageParams } from './src/lib/images'
import { getPosts } from './src/lib/posts'
import { siteConfig } from './src/site.config'

export default async function nextConfig(phase: string): Promise<NextConfig> {
  const development = phase === PHASE_DEVELOPMENT_SERVER
  const pageExtensions = ['tsx', 'ts']

  // Next rejects an empty generateStaticParams() during export. Optional
  // collections therefore opt into their route extension only when nonempty.
  // In development all routes stay registered so new content appears live.
  for (const locale of siteConfig.locales) {
    const posts = await getPosts(locale)
    if (development || posts.length > 0) pageExtensions.push(`${locale}-post.tsx`)
    if (development || posts.some((post) => post.tags.length > 0 || post.category)) {
      pageExtensions.push(`${locale}-term.tsx`)
    }
  }
  if (development || (await getImageParams()).length > 0) pageExtensions.push('images.ts')

  return {
    output: 'export',
    pageExtensions,
    images: { unoptimized: true },
    experimental: { globalNotFound: true },
  }
}