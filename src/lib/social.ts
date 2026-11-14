import { siteConfig } from '@/site.config'

const base = siteConfig.url.replace(/\/$/, '')

export const SOCIAL_IMAGE = {
  url: `${base}/og.png`,
  width: 1200,
  height: 630,
  alt: 'OPEN-AK / notes — notes on code, tools, and the practice of making things simpler.',
}
