'use client'

import { AkNewsList, AkSearch } from '@swufefox/ak-ui-react'
import { useMemo, useState, type ReactNode } from 'react'

import { postPath } from '@/lib/urls'
import type { Locale } from '@/site.config'

export interface SearchItem {
  slug: string
  title: string
  description: string
  tags: string[]
  category?: string
  date: string
  time: string
}

interface Labels {
  label: string
  placeholder: string
  foundOne: string
  foundMany: string
  none: string
  clear: string
  hint: string
}

function terms(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

function score(item: SearchItem, words: string[]): number {
  const title = item.title.toLowerCase()
  const description = item.description.toLowerCase()
  const tags = item.tags.join(' ').toLowerCase()
  const category = (item.category ?? '').toLowerCase()

  let total = 0
  for (const word of words) {
    if (title.includes(word)) total += 4
    if (tags.includes(word) || category.includes(word)) total += 2
    if (description.includes(word)) total += 1
  }
  return total
}

function highlight(text: string, words: string[]): ReactNode {
  if (words.length === 0) return text
  const pattern = new RegExp(`(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return text.split(pattern).map((part, index) =>
    words.includes(part.toLowerCase()) ? <mark key={index}>{part}</mark> : part,
  )
}

export function SearchClient({
  items,
  locale,
  labels,
}: {
  items: SearchItem[]
  locale: Locale
  labels: Labels
}) {
  const [query, setQuery] = useState('')
  const words = useMemo(() => terms(query), [query])

  const results = useMemo(() => {
    if (words.length === 0) return []
    return items
      .map((item) => ({ item, rank: score(item, words) }))
      .filter((entry) => entry.rank > 0)
      .sort((a, b) => b.rank - a.rank || (a.item.date < b.item.date ? 1 : -1))
      .map((entry) => entry.item)
  }, [items, words])

  const resultItems = results.map((item) => ({
    category: item.category ?? item.tags[0],
    title: (
      <>
        <span className="post-news-list__title">{highlight(item.title, words)}</span>
        <span className="post-news-list__summary">{highlight(item.description, words)}</span>
      </>
    ),
    time: item.time,
    dateTime: item.date,
    href: postPath(locale, item.slug),
  }))

  return (
    <>
      <AkSearch
        className="search-form"
        label={labels.label}
        placeholder={labels.placeholder}
        shortcut="/"
        value={query}
        onValueChange={setQuery}
      />
      <p className="search-status" aria-live="polite">
        {words.length === 0
          ? labels.hint
          : results.length === 0
            ? labels.none
            : results.length === 1
              ? labels.foundOne
              : labels.foundMany.replace('{count}', String(results.length))}
        {words.length > 0 && results.length === 0 ? (
          <button type="button" className="search-status__clear" onClick={() => setQuery('')}>
            {labels.clear}
          </button>
        ) : null}
      </p>
      {results.length > 0 ? (
        <AkNewsList
          className="post-news-list search-results"
          items={resultItems}
          label={labels.label}
          empty={labels.none}
        />
      ) : null}
    </>
  )
}