import { readdir, readFile } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { join, relative } from 'node:path'
import matter from 'gray-matter'

import { defaultLocale, isLocale, siteConfig, type Locale } from '@/site.config'

const POSTS_DIR = join(process.cwd(), 'content', 'posts')

export interface PostMeta {
  slug: string
  title: string
  description: string
  /** ISO date, `YYYY-MM-DD`. */
  date: string
  updated?: string
  category?: string
  tags: string[]
  locale: Locale
  draft: boolean
}

export interface Post extends PostMeta {
  /** Raw markdown body, without front matter. */
  body: string
  /** Path relative to the project root, for the "source" link in the colophon. */
  filePath: string
  /** Absolute directory of the markdown file, used to resolve relative images. */
  sourceDir: string
}

export interface TagSummary {
  name: string
  count: number
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function fail(file: string, message: string): never {
  throw new Error(`content/posts/${file}: ${message}`)
}

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') return String(value)
  return undefined
}

function parsePost(fileName: string, raw: string, locale: Locale, directory: string): Post {
  let parsed: ReturnType<typeof matter>
  try {
    parsed = matter(raw)
  } catch (error) {
    fail(fileName, `front matter is not valid YAML: ${(error as Error).message}`)
  }
  const { data, content } = parsed
  const slug = fileName.replace(/\.md$/, '')

  const title = asString(data.title)
  if (!title) fail(fileName, 'missing required field "title"')

  const description = asString(data.description)
  if (!description) fail(fileName, 'missing required field "description"')

  const date = asString(data.date)
  if (!date || !DATE_PATTERN.test(date)) {
    fail(fileName, 'field "date" must be a YYYY-MM-DD string')
  }

  const updated = asString(data.updated)
  if (updated !== undefined && !DATE_PATTERN.test(updated)) {
    fail(fileName, 'field "updated" must be a YYYY-MM-DD string')
  }

  const rawTags = data.tags ?? []
  if (!Array.isArray(rawTags)) fail(fileName, 'field "tags" must be a list')
  const tags = rawTags.map((tag) => asString(tag)?.trim() ?? '').filter(Boolean)
  if (tags.some((tag) => !tag)) fail(fileName, 'field "tags" must only contain strings')

  const category = asString(data.category) ?? asString(data.tag)

  const draft = data.draft === true

  return {
    slug,
    title,
    description,
    date,
    updated,
    category: category?.trim() || undefined,
    tags,
    locale,
    draft,
    body: content,
    filePath: relative(process.cwd(), join(directory, fileName)).replace(/\\/g, '/'),
    sourceDir: directory,
  }
}

let cache: Post[] | null = null

async function loadPosts(): Promise<Post[]> {
  if (cache) return cache

  let entries: Dirent[]
  try {
    entries = await readdir(POSTS_DIR, { withFileTypes: true })
  } catch {
    entries = []
  }

  const posts: Post[] = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) {
      // A directory named after a locale holds that language's translation of
      // the posts: `content/posts/en/hello.md` is the English `hello.md`.
      if (!isLocale(entry.name)) continue
      const directory = join(POSTS_DIR, entry.name)
      const files = (await readdir(directory)).filter((file) => file.endsWith('.md')).sort()
      for (const file of files) {
        const raw = await readFile(join(directory, file), 'utf8')
        posts.push(parsePost(file, raw, entry.name, directory))
      }
      continue
    }
    if (!entry.name.endsWith('.md')) continue
    const raw = await readFile(join(POSTS_DIR, entry.name), 'utf8')
    posts.push(parsePost(entry.name, raw, defaultLocale, POSTS_DIR))
  }

  cache = posts
  return posts
}

/** Every post, newest first. Drafts are included; callers filter them out. */
export async function getAllPosts(): Promise<Post[]> {
  const posts = await loadPosts()
  return [...posts].sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1))
}

export async function getPosts(locale: Locale): Promise<Post[]> {
  const posts = await getAllPosts()
  // Drafts stay visible in `next dev` so they can be previewed, and disappear
  // from every production build.
  const showDrafts = process.env.NODE_ENV !== 'production'
  return posts.filter((post) => post.locale === locale && (showDrafts || !post.draft))
}

export async function getPost(slug: string, locale: Locale): Promise<Post | undefined> {
  const posts = await getPosts(locale)
  return posts.find((post) => post.slug === slug)
}

/** The post with the same slug in another locale, used for the language switch. */
export async function getTranslation(slug: string, locale: Locale): Promise<Post | undefined> {
  const posts = await getAllPosts()
  return posts.find((post) => post.slug === slug && post.locale === locale && !post.draft)
}

export async function getTags(locale: Locale): Promise<TagSummary[]> {
  const posts = await getPosts(locale)
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export async function getCategoryCounts(locale: Locale): Promise<TagSummary[]> {
  const posts = await getPosts(locale)
  const counts = new Map<string, number>()
  for (const post of posts) {
    if (!post.category) continue
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/** Posts filed under a term, whether it is used as a tag or as a category. */
export async function getPostsByTerm(term: string, locale: Locale): Promise<Post[]> {
  const posts = await getPosts(locale)
  return posts.filter((post) => post.tags.includes(term) || post.category === term)
}

/** Whether the term exists at all, as a tag or as a category. */
export async function termExists(term: string, locale: Locale): Promise<boolean> {
  const posts = await getPosts(locale)
  return posts.some((post) => post.tags.includes(term) || post.category === term)
}


/**
 * Reading time in minutes. CJK is counted per character, everything else per
 * word, so a mixed post is not off by a factor of five.
 */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
  const cjk = text.match(/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff]/g)?.length ?? 0
  const latin = text.replace(/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff]/g, ' ').match(/[A-Za-z0-9'\-]+/g)?.length ?? 0
  return cjk + latin
}

export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.round(countWords(markdown) / 380))
}

export function formatDate(date: string, locale: Locale): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

/** Short, sortable form used in machine readable output. */
export function toISODate(date: string): string {
  return `${date}T00:00:00.000Z`
}

export function siteUrl(path = ''): string {
  return `${siteConfig.url.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}
