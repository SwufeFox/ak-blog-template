import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AkBackTop, AkBreadcrumb, AkCollapseItem, AkDivider, AkHeading, AkNotice, AkTag, AkTagGroup } from '@swufefox/ak-ui-react'

import { PostRuntime } from '@/components/post-runtime'
import { PostToc } from '@/components/post-toc'
import { ReadingProgress } from '@/components/reading-progress'
import { otherLocale, ui } from '@/lib/i18n'
import { kicker } from '@/lib/kickers'
import { renderMarkdown } from '@/lib/markdown'
import { SOCIAL_IMAGE } from '@/lib/social'
import {
  formatDate,
  getPost,
  getPosts,
  getTranslation,
  readingMinutes,
  toISODate,
} from '@/lib/posts'
import { homePath, postPath, tagPath } from '@/lib/urls'
import { siteConfig } from '@/site.config'
import { requireLocale } from '@/lib/locale'

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []
  for (const locale of siteConfig.locales) {
    for (const post of await getPosts(locale)) {
      params.push({ locale, slug: post.slug })
    }
  }
  return params
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const resolved = requireLocale(locale)
  const post = await getPost(slug, resolved)
  if (!post) return {}

  const languages: Record<string, string> = {}
  for (const entry of siteConfig.locales) {
    const translated = await getTranslation(post.slug, entry)
    if (translated) languages[entry] = postPath(entry, post.slug)
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: {
      canonical: postPath(resolved, post.slug),
      languages,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: postPath(resolved, post.slug),
      publishedTime: toISODate(post.date),
      modifiedTime: post.updated ? toISODate(post.updated) : undefined,
      authors: [siteConfig.author],
      tags: post.tags,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [SOCIAL_IMAGE],
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const resolved = requireLocale(locale)
  const post = await getPost(slug, resolved)
  if (!post) notFound()

  const copy = ui(resolved)
  const { html, toc } = await renderMarkdown(post.body, {
    fileDir: post.sourceDir,
    locale: resolved,
  })

  const posts = await getPosts(resolved)
  const index = posts.findIndex((entry) => entry.slug === post.slug)
  const previous = index > 0 ? posts[index - 1] : undefined
  const next = index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined

  const target = otherLocale(resolved)
  const translation = target === resolved ? undefined : await getTranslation(post.slug, target)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: toISODate(post.date),
    dateModified: toISODate(post.updated ?? post.date),
    inLanguage: resolved,
    author: { '@type': 'Person', name: siteConfig.author },
    keywords: post.tags.join(', '),
    mainEntityOfPage: `${siteConfig.url}${postPath(resolved, post.slug)}`,
  }

  return (
    <>
      <ReadingProgress />
      <article className="article">
        <header className="article-header">
          <div className="article-header__meta">
            <AkBreadcrumb
              ariaLabel={copy.breadcrumb}
              items={[
                { label: copy.allPosts, href: homePath(resolved) },
                ...(post.category
                  ? [{ label: post.category, href: tagPath(resolved, post.category) }]
                  : []),
              ]}
            />
            <span className="article-header__facts">
              <time dateTime={post.date}>{formatDate(post.date, resolved)}</time>
              <span>{copy.readMinutes(readingMinutes(post.body))}</span>
              {post.updated ? <span>{copy.updated(formatDate(post.updated, resolved))}</span> : null}
              {translation ? (
                <Link href={postPath(target, post.slug)} hrefLang={target} lang={target}>
                  {siteConfig.localeNames[target]}
                </Link>
              ) : null}
            </span>
          </div>
          <AkHeading className="article-header__heading" title={post.title} level={1} size="lg" />
          <p className="article-header__dek">{post.description}</p>
          {post.tags.length > 0 ? (
            <AkTagGroup className="article-header__tags">
              {post.tags.map((tag) => (
                <Link key={tag} href={tagPath(resolved, tag)}>
                  <AkTag size="sm" variant="neutral">#{tag}</AkTag>
                </Link>
              ))}
            </AkTagGroup>
          ) : null}
        </header>

        <AkDivider className="article-divider" variant="accent" aria-hidden="true" />

        {toc.length > 0 ? (
          <AkCollapseItem className="toc-mobile" title={copy.toc}>
            <nav aria-label={copy.toc}>
              <ol>
                {toc.map((entry) => (
                  <li key={entry.id} className={`level-${entry.level}`}>
                    <a href={`#${entry.id}`}>{entry.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </AkCollapseItem>
        ) : null}

        <div className="article-body">
          <div
            className="article-body__content prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <PostToc toc={toc} title={copy.toc} en={kicker(resolved, 'contents')} />
          <footer className="colophon">
            <AkNotice code="AK / META" title={copy.colophon} variant="info">
              {copy.licenseText}{' '}
              <a href={siteConfig.license.url} rel="license">
                {siteConfig.license.name}
              </a>
            </AkNotice>
            <dl className="colophon__list">
              <div>
                <dt>{copy.source}</dt>
                <dd>
                  <code>{post.filePath}</code>
                </dd>
              </div>
              {post.category ? (
                <div>
                  <dt>{copy.category}</dt>
                  <dd>
                    <Link href={tagPath(resolved, post.category)}>
                      <AkTag size="sm" variant="neutral">{post.category}</AkTag>
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
          </footer>
        </div>

        {previous || next ? (
          <nav className="post-pagination" aria-label={copy.postNavigation}>
            {previous ? (
              <Link className="post-pagination__previous" rel="prev" href={postPath(resolved, previous.slug)}>
                <span>{copy.previous}</span>
                {previous.title}
              </Link>
            ) : null}
            {next ? (
              <Link className="post-pagination__next" rel="next" href={postPath(resolved, next.slug)}>
                <span>{copy.next}</span>
                {next.title}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </article>

      <AkBackTop label={copy.backToTop} visibilityHeight={600} />
      <PostRuntime labels={{ copy: copy.copyCode, copied: copy.copied }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  )
}