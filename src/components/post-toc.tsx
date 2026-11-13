'use client'

import { AkHeading } from '@swufefox/ak-ui-react'
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
    let frame = 0

    const update = () => {
      frame = 0
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setActive(last.id)
        return
      }

      // The current section is the last heading above the reading threshold.
      // A plain intersection test leaves the rail blank between headings.
      const threshold = window.innerHeight * 0.25
      let current: string | null = null
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > threshold) break
        current = heading.id
      }
      setActive(current)
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [toc])

  if (toc.length === 0) return null

  return (
    <nav className="toc" aria-label={title}>
      <AkHeading className="toc-heading" title={title} en={en} level={2} />
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
    </nav>
  )
}