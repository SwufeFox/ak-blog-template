import type { Metadata } from 'next'
import Link from 'next/link'
import { AkDivider, AkHero, AkHeading, AkTag, AkTagGroup } from '@swufefox/ak-ui-react'

import { PostNewsList } from '@/components/post-news-list'
import { kicker } from '@/lib/kickers'
import { ui } from '@/lib/i18n'
import { getCategoryCounts, getPosts } from '@/lib/posts'
import { tagPath } from '@/lib/urls'
import { siteConfig } from '@/site.config'
import { requireLocale } from '@/lib/locale'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const resolved = requireLocale(locale)
  return {
    title: `${siteConfig.title} ${siteConfig.suffix}`,
    description: siteConfig.description[resolved],
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const resolved = requireLocale(locale)
  const copy = ui(resolved)

  const posts = await getPosts(resolved)
  const visible = siteConfig.postsOnHome > 0 ? posts.slice(0, siteConfig.postsOnHome) : posts
  const categories = await getCategoryCounts(resolved)
  const heroTitle = siteConfig.suffix.replace(/^\s*\/\s*/, '').trim() || siteConfig.title

  return (
    <>
      <AkHero
        className="home-hero"
        eyebrow={siteConfig.title}
        title={heroTitle}
        titleAs="h1"
        subtitle={siteConfig.description[resolved]}
        bar
      />

      <section className="home-archive">
        {categories.length > 0 ? (
          <nav className="home-categories" aria-label={copy.categories}>
            <AkHeading
              title={copy.categories}
              en={kicker(resolved, 'categories')}
              stack
              level={2}
            />
            <AkTagGroup>
              {categories.map((category) => (
                <Link key={category.name} href={tagPath(resolved, category.name)}>
                  <AkTag size="md" variant="neutral">
                    {category.name}<span className="term-count">{category.count}</span>
                  </AkTag>
                </Link>
              ))}
            </AkTagGroup>
          </nav>
        ) : null}

        <AkDivider className="home-divider" variant="accent" aria-hidden="true" />

        <AkHeading
          title={copy.latestPosts}
          en={kicker(resolved, 'latest')}
          stack
          level={2}
          size="md"
          extra={<span className="home-archive__count">{copy.postsCount(visible.length)}</span>}
        />
        <PostNewsList posts={visible} locale={resolved} label={copy.postsLabel} empty={copy.empty} />
      </section>
    </>
  )
}