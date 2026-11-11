import { AkNewsList, type AkNewsListItem } from '@swufefox/ak-ui-react'

import { formatDate, type Post } from '@/lib/posts'
import { postPath } from '@/lib/urls'
import type { Locale } from '@/site.config'

export function PostNewsList({
  posts,
  locale,
  label,
  empty,
}: {
  posts: Post[]
  locale: Locale
  label: string
  empty: string
}) {
  const items: AkNewsListItem[] = posts.map((post) => ({
    category: post.category,
    title: (
      <>
        <span className="post-news-list__title">{post.title}</span>
        <span className="post-news-list__summary">{post.description}</span>
      </>
    ),
    time: formatDate(post.date, locale),
    dateTime: post.date,
    href: postPath(locale, post.slug),
  }))

  return <AkNewsList className="post-news-list" items={items} label={label} empty={empty} />
}
