import { existsSync, readFileSync } from 'node:fs'
import { join, normalize, relative } from 'node:path'
import { imageSize } from 'image-size'
import { unified, type Plugin } from 'unified'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { VFile } from 'vfile'
import { visit } from 'unist-util-visit'
import katex from 'katex'
import type { Root as MdastRoot } from 'mdast'
import type { ElementContent, Root as HastRoot } from 'hast'

import { ui } from '@/lib/i18n'
import type { Locale } from '@/site.config'

export interface TocEntry {
  id: string
  title: string
  level: number
}

export interface RenderedPost {
  html: string
  toc: TocEntry[]
}

export interface RenderOptions {
  /** Absolute directory of the markdown file, used to resolve relative images. */
  fileDir: string
  locale: Locale
}

/* ------------------------------------------------------------------ utils */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface BlockAttributes {
  title?: string
  note?: string
  meta?: string
  height?: string
  bars?: string
  scale?: string
  mark?: string
  src?: string
}

function parseAttributes(meta: string | null | undefined): BlockAttributes {
  const attributes: BlockAttributes = {}
  if (!meta) return attributes
  const pattern = /(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*'([^']*)'/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(meta)) !== null) {
    const key = (match[1] ?? match[3]) as keyof BlockAttributes
    attributes[key] = match[2] ?? match[4]
  }
  return attributes
}

function splitRow(line: string): string[] {
  const cells = line.split('|').map((cell) => cell.trim())
  if (cells.length > 0 && cells[0] === '') cells.shift()
  if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop()
  return cells
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

interface DataTable {
  header: string[]
  rows: string[][]
}

function parseTable(source: string): DataTable | undefined {
  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (lines.length < 2) return undefined

  const header = splitRow(lines[0])
  const hasSeparator = isSeparatorRow(splitRow(lines[1]))
  const rows = lines.slice(hasSeparator ? 2 : 1).map(splitRow)
  if (!header.length || !rows.length) return undefined
  return { header, rows }
}

const NUMBER_PATTERN = /[+\-−]?\d[\d, ]*(?:\.\d+)?/

function firstNumber(value: string): number | undefined {
  const match = value.match(NUMBER_PATTERN)
  if (!match) return undefined
  const parsed = Number(match[0].replace(/[,\s]/g, '').replace('−', '-'))
  return Number.isFinite(parsed) ? parsed : undefined
}

function isNumericColumn(rows: string[][], column: number): boolean {
  const values = rows.map((row) => row[column]).filter((value) => value !== undefined && value !== '')
  if (!values.length) return false
  return values.every((value) => firstNumber(value) !== undefined)
}

/* --------------------------------------------------- remark: custom blocks */

/** Fences that this blog renders itself instead of handing to the highlighter. */
const BLOCK_LANGUAGES: Record<string, true> = {
  data: true,
  stats: true,
  echarts: true,
  mermaid: true,
  sketch: true,
}

function renderDataBlock(source: string, attributes: BlockAttributes): string {
  const table = parseTable(source)
  if (!table) return ''

  const barColumns = (attributes.bars ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => table.header.indexOf(name))
    .filter((index) => index >= 0)

  const perColumn = attributes.scale === 'column'
  const marked = new Set(
    (attributes.mark ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )

  const columnMaxima = new Map<number, number>()
  if (perColumn) {
    for (const column of barColumns) {
      const max = Math.max(
        0,
        ...table.rows.map((row) => Math.abs(firstNumber(row[column] ?? '') ?? 0)),
      )
      columnMaxima.set(column, max)
    }
  }
  const sharedMax = Math.max(
    0,
    ...table.rows.flatMap((row) =>
      barColumns.map((column) => Math.abs(firstNumber(row[column] ?? '') ?? 0)),
    ),
  )

  const numeric = table.header.map((_, column) => isNumericColumn(table.rows, column))

  const head = table.header
    .map(
      (cell, column) =>
        `<th${numeric[column] ? ' class="is-num"' : ''} scope="col">${escapeHtml(cell)}</th>`,
    )
    .join('')

  const body = table.rows
    .map((row) => {
      const cells = table.header
        .map((_, column) => {
          const value = row[column] ?? ''
          const classes = [numeric[column] ? 'is-num' : '']
          if (barColumns.includes(column)) {
            const amount = firstNumber(value)
            if (amount !== undefined) {
              const max = perColumn ? (columnMaxima.get(column) ?? 0) : sharedMax
              const ratio = max > 0 ? Math.min(1, Math.abs(amount) / max) : 0
              const end = `${(ratio * 100).toFixed(2)}%`
              classes.push('is-bar')
              const negative = amount < 0 ? ' is-negative' : ''
              return `<td class="${classes.filter(Boolean).join(' ')}"><span class="ak-bar-track"><i class="ak-bar${negative}" style="--w:${end}"></i></span><span class="ak-bar__value">${escapeHtml(value)}</span></td>`
            }
          }
          return `<td class="${classes.filter(Boolean).join(' ')}">${escapeHtml(value)}</td>`
        })
        .join('')
      return `<tr${marked.has(row[0] ?? '') ? ' class="is-marked"' : ''}>${cells}</tr>`
    })
    .join('')

  return `<div class="ak-table-scroll"><table class="ak-data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
}

interface KpiRow {
  label: string
  value: string
  note: string
}

function renderStatsBlock(source: string): string {
  const groups: { title: string; rows: KpiRow[] }[] = []
  let current: (typeof groups)[number] | undefined

  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('##')) {
      current = { title: line.replace(/^#+\s*/, ''), rows: [] }
      groups.push(current)
      continue
    }
    if (!current) {
      current = { title: '', rows: [] }
      groups.push(current)
    }
    const [label, value = '', note = ''] = splitRow(line)
    current.rows.push({ label, value, note })
  }

  return groups
    .map((group) => {
      const title = group.title
        ? `<p class="ak-kpi-group__title">${escapeHtml(group.title)}</p>`
        : ''
      const cells = group.rows
        .map((row) => {
          const tone = row.value.trim().startsWith('+')
            ? ' is-up'
            : /^[-\u2212]/.test(row.value.trim())
              ? ' is-down'
              : ''
          const note = row.note ? `<dd class="ak-kpi__note">${escapeHtml(row.note)}</dd>` : ''
          return `<div class="ak-kpi__cell"><dt>${escapeHtml(row.label)}</dt><dd class="ak-kpi__value${tone}">${escapeHtml(row.value)}</dd>${note}</div>`
        })
        .join('')
      return `<div class="ak-kpi-group">${title}<dl class="ak-kpi">${cells}</dl></div>`
    })
    .join('')
}

/** Hand written SVG in a post: strip everything that could execute. */
function sanitizeSvg(svg: string): string {
  const cleaned = svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\sstyle\s*=\s*"[^"]*"/gi, '')
    .replace(/\sstyle\s*=\s*'[^']*'/gi, '')
    .replace(/(href|xlink:href)\s*=\s*"(?!#)[^"]*"/gi, '$1="#')

  // Sketches reference `url(#arrow)` for the house arrowhead; define it once
  // per drawing when the author did not bring their own marker.
  if (/marker-end\s*=\s*"url\(#arrow\)"/.test(cleaned) && !/id\s*=\s*"arrow"/.test(cleaned)) {
    return cleaned.replace(
      /<svg\b[^>]*>/,
      (tag) =>
        `${tag}<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="ak-arrowhead" d="M0 0 L10 5 L0 10"/></marker></defs>`,
    )
  }

  return cleaned
}

function figureCaption(index: number, attributes: BlockAttributes): string {
  const title = attributes.title ? escapeHtml(attributes.title) : ''
  const meta = attributes.meta
    ? `<span class="ak-figure__meta">${escapeHtml(attributes.meta)}</span>`
    : ''
  const number = `<span class="ak-figure__index">FIG ${String(index).padStart(2, '0')}</span>`
  return `<figcaption class="ak-figure__cap">${number}<span class="ak-figure__title">${title}</span>${meta}</figcaption>`
}

function figureNote(attributes: BlockAttributes): string {
  return attributes.note ? `<p class="ak-figure__note">${escapeHtml(attributes.note)}</p>` : ''
}

/* --------------------------------------------------- remark: plugin bodies */

const remarkStripHtml: Plugin<[], MdastRoot> = () => (tree) => {
  visit(tree, 'html', (_node, index, parent) => {
    if (!parent || index === undefined) return
    parent.children.splice(index, 1)
  })
}

const remarkRenderMath: Plugin<[], MdastRoot> = () => (tree, file) => {
  visit(tree, (node, index, parent) => {
    if (node.type !== 'inlineMath' && node.type !== 'math') return
    if (!parent || index === undefined) return
    const value = node.value
    try {
      const html = katex.renderToString(value, {
        displayMode: node.type === 'math',
        throwOnError: true,
        output: 'htmlAndMathml',
      })
      parent.children[index] = { type: 'html', value: html }
    } catch (error) {
      file.message(`invalid formula: ${value}\n${(error as Error).message}`)
    }
  })
}

const remarkBlogBlocks: Plugin<[], MdastRoot> = () => (tree, file) => {
  let figureIndex = 0

  visit(tree, 'code', (node, index, parent) => {
    if (!parent || index === undefined) return
    const lang = node.lang
    if (!lang || !BLOCK_LANGUAGES[lang]) {
      // Keep the fence meta string reachable for the caption built after the
      // highlighter has run; rehype-pretty-code consumes it.
      node.data = {
        ...node.data,
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          'data-ak-meta': node.meta ?? '',
        },
      }
      return
    }

    const attributes = parseAttributes(node.meta)
    figureIndex += 1
    const source = node.value ?? ''
    let body = ''

    switch (lang) {
      case 'data':
        body = renderDataBlock(source, attributes)
        break
      case 'stats':
        body = renderStatsBlock(source)
        break
      case 'mermaid':
        body = `<div class="ak-figure__plot" data-ak-figure="mermaid"><script type="application/json" data-ak-figure-data>${JSON.stringify({ code: source }).replace(/</g, '\\u003c')}</script><pre class="ak-figure__fallback"><code>${escapeHtml(source)}</code></pre></div>`
        break
      case 'echarts': {
        let option: unknown
        try {
          option = JSON.parse(source)
        } catch (error) {
          file.message(`invalid echarts option: ${(error as Error).message}`)
          return
        }
        const requested = Number(attributes.height ?? 360)
        const height = Math.min(720, Math.max(160, Number.isFinite(requested) ? requested : 360))
        body = `<div class="ak-figure__plot" data-ak-figure="echarts" style="--ak-figure-h:${height}px"><script type="application/json" data-ak-figure-data>${JSON.stringify({ option }).replace(/</g, '\\u003c')}</script><div class="ak-figure__placeholder"></div></div>`
        break
      }
      case 'sketch':
        body = `<div class="ak-figure__plot ak-sketch">${sanitizeSvg(source)}</div>`
        break
      default:
        break
    }

    const html = `<figure class="ak-figure ak-figure--${lang}">${figureCaption(figureIndex, attributes)}${body}${figureNote(attributes)}</figure>`
    parent.children[index] = { type: 'html', value: html }
  })
}

/* ------------------------------------------------------- rehype: code meta */

const rehypeCodeFigure: Plugin<[{ locale: Locale }], HastRoot> = ({ locale }) => (tree) => {
  visit(tree, 'element', (node) => {
    if (node.tagName !== 'figure') return
    if (
      !('data-rehype-pretty-code-figure' in node.properties) &&
      !('dataRehypePrettyCodeFigure' in node.properties)
    ) {
      return
    }

    const preNode = node.children.find(
      (child) => child.type === 'element' && child.tagName === 'pre',
    )
    const pre = preNode && preNode.type === 'element' ? preNode : undefined
    const codeNode = pre?.children.find(
      (child) => child.type === 'element' && child.tagName === 'code',
    )
    const code = codeNode && codeNode.type === 'element' ? codeNode : undefined
    const rawMeta = pre?.properties['data-ak-meta'] ?? pre?.properties.dataAkMeta
    const attributes = parseAttributes(typeof rawMeta === 'string' ? rawMeta : undefined)
    if (pre) {
      delete pre.properties['data-ak-meta']
      delete pre.properties.dataAkMeta
    }

    const languageProperties = code?.properties ?? pre?.properties ?? {}
    const language = languageProperties['data-language'] ?? languageProperties.dataLanguage

    node.properties.className = [
      ...(Array.isArray(node.properties.className)
        ? node.properties.className.map((name) => String(name))
        : []),
      'ak-code',
    ]

    const parts: string[] = []
    if (attributes.title) {
      parts.push(`<span class="ak-code__path">${escapeHtml(attributes.title)}</span>`)
    }
    if (typeof language === 'string' && language && language !== 'text') {
      parts.push(`<span class="ak-code__lang">${escapeHtml(language)}</span>`)
    }
    if (attributes.src) {
      parts.push(
        `<a class="ak-code__src" href="${escapeHtml(attributes.src)}" rel="noreferrer">source ↗</a>`,
      )
    }
    parts.push(
      `<button class="ak-code__copy" type="button" data-ak-copy>${escapeHtml(ui(locale).copyCode)}</button>`,
    )

    const caption = `<figcaption class="ak-code__cap">${parts.join('')}</figcaption>`
    const existing = node.children.find(
      (child) => child.type === 'element' && child.tagName === 'figcaption',
    )
    if (existing && existing.type === 'element') {
      existing.children = [{ type: 'raw', value: caption }]
    } else {
      node.children.unshift({ type: 'raw', value: caption })
    }
  })

  // Code is not prose: browser translation would rewrite identifiers and paths.
  visit(tree, 'element', (node) => {
    if (node.tagName === 'code' || node.tagName === 'pre') {
      node.properties.translate = 'no'
    }
  })
}

/* ----------------------------------------------------- rehype: media paths */

const rehypeMediaPaths: Plugin<[{ fileDir: string }], HastRoot> = ({ fileDir }) => (
  tree,
) => {
  visit(tree, 'element', (node) => {
    if (node.tagName !== 'img') return

    // Content images sit inside the prose, not in the hero: never make them
    // block the first paint, and keep intrinsic dimensions when the file is local.
    node.properties.loading = 'lazy'
    node.properties.decoding = 'async'

    const src = node.properties.src
    if (typeof src !== 'string') return
    if (/^(https?:)?\/\//.test(src) || src.startsWith('/') || src.startsWith('data:')) return

    const resolved = normalize(join(fileDir, src))
    if (!resolved.startsWith(process.cwd())) return
    if (!existsSync(resolved)) return

    try {
      const { width, height } = imageSize(readFileSync(resolved))
      if (width && height) {
        node.properties.width = width
        node.properties.height = height
      }
    } catch {
      // Unknown format: let the browser derive the size from the file.
    }

    const rel = relative(process.cwd(), resolved).replace(/\\/g, '/')
    if (rel.startsWith('public/')) {
      node.properties.src = `/${rel.slice('public/'.length)}`
    } else if (rel.startsWith('content/')) {
      node.properties.src = `/content/${rel.slice('content/'.length)}`
    } else {
      node.properties.src = `/${rel}`
    }
  })
}

/* ----------------------------------------------------------------- pipeline */

function createProcessor(options: RenderOptions) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkStripHtml)
    .use(remarkRenderMath)
    .use(remarkBlogBlocks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeMediaPaths, { fileDir: options.fileDir })
    .use(rehypePrettyCode, {
      theme: { light: 'github-light', dark: 'github-dark' },
      keepBackground: false,
      defaultLang: 'text',
    })
    .use(rehypeCodeFigure, { locale: options.locale })
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: { className: ['ak-anchor'], ariaHidden: 'true', tabIndex: -1 },
      content: { type: 'text', value: '#' },
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
}

function textContent(nodes: ElementContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') return node.value
      if (node.type !== 'element') return ''
      // rehype-autolink-headings appends an anchor ("#") to every heading; it
      // belongs to the rendered page, not to the contents label.
      const classes = node.properties.className
      if (Array.isArray(classes) && classes.includes('ak-anchor')) return ''
      return textContent(node.children)
    })
    .join('')
}

function collectToc(tree: HastRoot): TocEntry[] {
  const toc: TocEntry[] = []
  visit(tree, 'element', (node) => {
    if (node.tagName !== 'h2' && node.tagName !== 'h3') return
    const id = node.properties.id
    if (typeof id !== 'string') return
    const title = textContent(node.children).trim()
    if (!title) return
    toc.push({ id, title, level: node.tagName === 'h2' ? 2 : 3 })
  })
  return toc
}

export async function renderMarkdown(
  markdown: string,
  options: RenderOptions,
): Promise<RenderedPost> {
  const processor = createProcessor(options)
  const file = new VFile({ value: markdown, path: join(options.fileDir, 'post.md') })
  const tree = processor.parse(file)
  const transformed = await processor.run(tree, file)
  const html = processor.stringify(transformed)
  return { html, toc: collectToc(transformed) }
}