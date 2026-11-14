import type { Metadata } from 'next'
import Link from 'next/link'
import { AkDivider, AkHeading, AkTag, AkTagGroup } from '@swufefox/ak-ui-react'

import { PostNewsList } from '@/components/post-news-list'
import { ui } from '@/lib/i18n'
import { formatDate, getCategoryCounts, getPosts, readingMinutes } from '@/lib/posts'
import { postPath, tagPath } from '@/lib/urls'
import { siteConfig, type Locale } from '@/site.config'
import { BlogHero } from '@/ui/blog-hero'
import { FeaturedPost } from '@/ui/featured-post'

export function getHomeMetadata(resolved: Locale): Metadata {
  return {
    title: `${siteConfig.title} ${siteConfig.suffix}`,
    description: siteConfig.description[resolved],
  }
}

export default async function HomePage({ locale: resolved }: { locale: Locale }) {
  const copy = ui(resolved)

  const posts = await getPosts(resolved)
  const visible = siteConfig.postsOnHome > 0 ? posts.slice(0, siteConfig.postsOnHome) : posts
  const [featured, ...remaining] = visible
  const categories = await getCategoryCounts(resolved)
  const heroTitle = siteConfig.suffix.replace(/^\s*\/\s*/, '').trim() || siteConfig.title

  return (
    <>
      <div className={featured ? 'home-intro' : 'home-intro home-intro--empty'}>
        <BlogHero
          className="home-hero"
          eyebrow={siteConfig.title}
          title={heroTitle}
          description={siteConfig.description[resolved]}
        />
        {featured ? (
          <FeaturedPost
            href={postPath(resolved, featured.slug)}
            date={featured.date}
            dateLabel={formatDate(featured.date, resolved)}
            readTime={copy.readMinutes(readingMinutes(featured.body))}
            actionLabel={copy.readArticle}
            eyebrow={copy.latestEntry}
            title={featured.title}
            description={featured.description}
            category={featured.category}
          />
        ) : null}
      </div>

      {categories.length > 0 || remaining.length > 0 || !featured ? (
        <section className="home-archive">
          {categories.length > 0 ? (
            <nav className="home-categories" aria-label={copy.categories}>
              <span className="home-categories__label">{copy.categories}</span>
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

          {remaining.length > 0 ? (
            <>
              <AkDivider className="home-divider" variant="accent" aria-hidden="true" />
              <AkHeading
                title={copy.moreEntries}
                level={2}
                size="md"
                extra={<span className="home-archive__count">{copy.postsCount(remaining.length)}</span>}
              />
              <PostNewsList posts={remaining} locale={resolved} label={copy.postsLabel} empty={copy.empty} />
            </>
          ) : null}
          {!featured ? (
            <PostNewsList posts={remaining} locale={resolved} label={copy.postsLabel} empty={copy.empty} />
          ) : null}
        </section>
      ) : null}
    </>
  )
}