'use client'

import { AkPanel } from '@swufefox/ak-ui-react'
import { useEffect, useState } from 'react'
import type { TocEntry } from '@/lib/markdown'

export function PostToc({ toc, title, en }: { toc: TocEntry[]; title: string; en?: string }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const headings = toc
      .map((entry) => document.getElementById(entry.id))
      .filter((heading): heading is HTMLElement => heading !== null)
    if (headings.length === 0) return

    const last = toc[toc.length - 1]
    let atBottom = false

    const markBottom = () => {
      atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      if (atBottom && last) setActive(last.id)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (atBottom) return
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-12% 0px -72% 0px' },
    )

    for (const heading of headings) observer.observe(heading)
    window.addEventListener('scroll', markBottom, { passive: true })
    markBottom()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', markBottom)
    }
  }, [toc])

  if (toc.length === 0) return null

  return (
    <nav className="toc" aria-label={title}>
      <AkPanel className="toc-panel" title={title} en={en} titleTag="h2">
        <ol>
          {toc.map((entry) => (
            <li key={entry.id} className={`level-${entry.level}`}>
              <a
                href={`#${entry.id}`}
                aria-current={active === entry.id ? 'location' : undefined}
                onClick={() => setActive(entry.id)}
              >
                {entry.title}
              </a>
            </li>
          ))}
        </ol>
      </AkPanel>
    </nav>
  )
}