import SiteShell, { getLayoutMetadata, SiteHead } from '@/views/layout'

export const metadata = getLayoutMetadata('en')

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-ak-theme="archive" suppressHydrationWarning>
      <head><SiteHead /></head>
      <body><SiteShell locale="en">{children}</SiteShell></body>
    </html>
  )
}
