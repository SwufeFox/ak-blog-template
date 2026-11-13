import { formatDate, type Post } from '@/lib/posts'
import { postPath } from '@/lib/urls'
import type { Locale } from '@/site.config'
import { PostList, type PostListItem } from '@/ui/post-list'

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
  const items: PostListItem[] = posts.map((post) => ({
    category: post.category,
    title: post.title,
    description: post.description,
    dateLabel: formatDate(post.date, locale),
    date: post.date,
    href: postPath(locale, post.slug),
  }))

  return <PostList items={items} label={label} empty={empty} />
}
