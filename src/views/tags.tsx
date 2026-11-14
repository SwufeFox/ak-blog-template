import type { Metadata } from 'next'
import Link from 'next/link'
import { AkDivider, AkHeading, AkTable } from '@swufefox/ak-ui-react'

import { ui } from '@/lib/i18n'
import { kicker } from '@/lib/kickers'
import { getCategoryCounts, getPosts, getTags } from '@/lib/posts'
import { tagPath, tagsPath } from '@/lib/urls'
import { siteConfig, type Locale } from '@/site.config'

export function getTagsMetadata(resolved: Locale): Metadata {
  return {
    title: siteConfig.nav[resolved].tags,
    description: siteConfig.description[resolved],
    alternates: {
      canonical: tagsPath(resolved),
      languages: Object.fromEntries(
        siteConfig.locales.map((entry) => [entry, tagsPath(entry)]),
      ),
    },
  }
}

export default async function TagsPage({ locale: resolved }: { locale: Locale }) {
  const copy = ui(resolved)

  const [categories, tags, posts] = await Promise.all([
    getCategoryCounts(resolved),
    getTags(resolved),
    getPosts(resolved),
  ])

  const rows = [
    ...categories.map((category) => ({
      id: `category:${category.name}`,
      cells: {
        type: copy.category,
        name: <Link href={tagPath(resolved, category.name)}>{category.name}</Link>,
        count: category.count,
      },
    })),
    ...tags.map((tag) => ({
      id: `tag:${tag.name}`,
      cells: {
        type: copy.tags,
        name: <Link href={tagPath(resolved, tag.name)}>#{tag.name}</Link>,
        count: tag.count,
      },
    })),
  ]

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

      <AkTable
        className="archive-table"
        aria-label={siteConfig.nav[resolved].tags}
        columns={[
          { key: 'type', header: copy.typeLabel, width: '6rem' },
          { key: 'name', header: copy.termLabel },
          { key: 'count', header: copy.postsLabel, numeric: true, width: '7rem' },
        ]}
        rows={rows}
        emptyLabel={copy.empty}
        hoverable={false}
      />
    </div>
  )
}