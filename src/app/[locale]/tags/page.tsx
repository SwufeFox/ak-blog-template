import type { Metadata } from 'next'
import { AkDivider, AkHeading, AkNewsList } from '@swufefox/ak-ui-react'

import { ui } from '@/lib/i18n'
import { kicker } from '@/lib/kickers'
import { getCategoryCounts, getPosts, getTags } from '@/lib/posts'
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
    title: siteConfig.nav[resolved].tags,
    description: siteConfig.description[resolved],
  }
}

export default async function TagsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const resolved = requireLocale(locale)
  const copy = ui(resolved)

  const [categories, tags, posts] = await Promise.all([
    getCategoryCounts(resolved),
    getTags(resolved),
    getPosts(resolved),
  ])

  return (
    <div className="route-page">
      <header className="route-head">
        <AkHeading
          title={siteConfig.nav[resolved].tags}
          en={kicker(resolved, 'archive')}
          stack
          level={1}
          size="lg"
        />
        <p className="route-head__summary">
          <span>{copy.postsCount(posts.length)}</span>
          <span>{copy.tagsCount(tags.length)}</span>
        </p>
      </header>

      <AkDivider className="route-divider" variant="accent" aria-hidden="true" />

      {categories.length > 0 ? (
        <section className="term-section">
          <AkHeading title={copy.categories} en={kicker(resolved, 'categories')} stack level={2} />
          <AkNewsList
            className="term-news-list"
            label={copy.categories}
            items={categories.map((category) => ({
              title: category.name,
              time: copy.postsCount(category.count),
              href: tagPath(resolved, category.name),
            }))}
            empty={copy.empty}
          />
        </section>
      ) : null}

      {tags.length > 0 ? (
        <section className="term-section">
          <AkHeading title={copy.tags} en={kicker(resolved, 'tags')} stack level={2} />
          <AkNewsList
            className="term-news-list"
            label={copy.tags}
            items={tags.map((tag) => ({
              title: `#${tag.name}`,
              time: copy.postsCount(tag.count),
              href: tagPath(resolved, tag.name),
            }))}
            empty={copy.empty}
          />
        </section>
      ) : null}
    </div>
  )
}