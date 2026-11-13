'use client'

import { AkSearch } from '@swufefox/ak-ui-react'
import { useMemo, useSyncExternalStore, type ReactNode } from 'react'

import { postPath } from '@/lib/urls'
import type { Locale } from '@/site.config'
import { PostList } from '@/ui/post-list'

const SEARCH_EVENT = 'ak-search-change'

function subscribeSearch(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener(SEARCH_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(SEARCH_EVENT, onChange)
  }
}

function readSearch(): string {
  return window.location.search
}

function serverSearch(): string {
  return ''
}

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
  const search = useSyncExternalStore(subscribeSearch, readSearch, serverSearch)
  const query = useMemo(() => new URLSearchParams(search).get('q') ?? '', [search])
  const words = useMemo(() => terms(query), [query])

  // The URL is the source of truth: `/search?q=…` is shareable and survives a
  // reload, and replaceState keeps the typing session out of browser history.
  const setQuery = (next: string) => {
    const url = new URL(window.location.href)
    if (next) url.searchParams.set('q', next)
    else url.searchParams.delete('q')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    window.dispatchEvent(new Event(SEARCH_EVENT))
  }

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
    title: highlight(item.title, words),
    description: highlight(item.description, words),
    dateLabel: item.time,
    date: item.date,
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
        <PostList
          className="search-results"
          items={resultItems}
          label={labels.label}
          empty={labels.none}
        />
      ) : null}
    </>
  )
}