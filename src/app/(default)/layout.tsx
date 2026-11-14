import SiteShell, { getLayoutMetadata, SiteHead } from '@/views/layout'

export const metadata = getLayoutMetadata('zh')

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-ak-theme="archive" suppressHydrationWarning>
      <head><SiteHead /></head>
      <body><SiteShell locale="zh">{children}</SiteShell></body>
    </html>
  )
}
