'use client'

import { AkButton } from '@swufefox/ak-ui-react'
import { useSyncExternalStore } from 'react'

type Theme = 'archive' | 'terminal'

const STORAGE_KEY = 'ak-theme'

/** The ak-ui theme lives on <html data-ak-theme>, set before paint by an inline script. */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ak-theme'] })
  return () => observer.disconnect()
}

function readTheme(): Theme {
  return document.documentElement.dataset.akTheme === 'terminal' ? 'terminal' : 'archive'
}

function serverTheme(): Theme {
  return 'archive'
}

export function ThemeToggle({ label }: { label: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme)

  const toggle = () => {
    const next: Theme = readTheme() === 'terminal' ? 'archive' : 'terminal'
    document.documentElement.dataset.akTheme = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode: the choice simply does not persist */
    }
  }

  const sun = (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
      <circle cx="8" cy="8" r="3.4" />
      <path
        d="M8 .8v2M8 13.2v2M.8 8h2M13.2 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )

  const moon = (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M13.4 9.6A5.8 5.8 0 0 1 6.4 2.6a5.9 5.9 0 1 0 7 7Z" />
    </svg>
  )

  return (
    <AkButton
      className="theme-toggle"
      type="button"
      size="sm"
      variant="ghost"
      chamfer
      icon={
        <>
          <span className="theme-toggle__glyph theme-toggle__glyph--light">{sun}</span>
          <span className="theme-toggle__glyph theme-toggle__glyph--dark">{moon}</span>
        </>
      }
      aria-label={label}
      aria-pressed={theme === 'terminal'}
      onClick={toggle}
      sound={false}
    >
      <span className="theme-toggle__code theme-toggle__code--light">LIGHT</span>
      <span className="theme-toggle__code theme-toggle__code--dark">DARK</span>
    </AkButton>
  )
}