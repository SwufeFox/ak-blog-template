import type { Metadata } from 'next'
import { ui } from '@/lib/i18n'
import NotFound from '@/views/not-found'

export const metadata: Metadata = {
  title: ui('zh').notFoundTitle,
  robots: { index: false, follow: false },
}

export default function MissingPage() {
  return <NotFound locale="zh" />
}
