import { AkNewsList, type AkNewsListItem } from '@swufefox/ak-ui-react'
import type { ReactNode } from 'react'

export interface PostListItem {
  href: string
  title: ReactNode
  description: ReactNode
  date: string
  dateLabel: string
  category?: ReactNode
}

export interface PostListProps {
  items: readonly PostListItem[]
  label: string
  empty: ReactNode
  className?: string
}

export function PostList({ items, label, empty, className }: PostListProps) {
  const newsItems: AkNewsListItem[] = items.map((item) => ({
    category: item.category,
    title: (
      <>
        <span className="post-news-list__title">{item.title}</span>
        <span className="post-news-list__summary">{item.description}</span>
      </>
    ),
    time: item.dateLabel,
    dateTime: item.date,
    href: item.href,
  }))

  return (
    <AkNewsList
      className={className ? `post-news-list ${className}` : 'post-news-list'}
      items={newsItems}
      label={label}
      empty={empty}
    />
  )
}
