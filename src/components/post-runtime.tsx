'use client'

import { useEffect } from 'react'

interface Labels {
  copy: string
  copied: string
}

interface FigureData {
  code?: string
  option?: Record<string, unknown>
}

function readPayload(plot: HTMLElement): FigureData {
  const script = plot.querySelector('script[data-ak-figure-data]')
  if (!script?.textContent) return {}
  try {
    return JSON.parse(script.textContent) as FigureData
  } catch {
    return {}
  }
}

function themePalette(): string[] {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string) => style.getPropertyValue(name).trim()
  return [
    read('--ak-signal-info'),
    read('--ak-signal-success'),
    read('--ak-signal-action'),
    read('--ak-signal-accent'),
    read('--ak-signal-danger'),
    read('--ak-text-secondary'),
  ].filter(Boolean)
}

function isDark(): boolean {
  return document.documentElement.dataset.akTheme === 'terminal'
}

/**
 * Everything in a post body that needs a browser: the copy buttons on code
 * blocks, Mermaid diagrams and ECharts figures. The libraries are imported on
 * demand, so a post without figures never downloads them.
 */
export function PostRuntime({ labels }: { labels: Labels }) {
  useEffect(() => {
    const onClick = async (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest<HTMLButtonElement>('[data-ak-copy]')
      if (!button) return
      const code = button.closest('figure')?.querySelector('pre code')
      if (!code) return
      try {
        await navigator.clipboard.writeText(code.textContent ?? '')
        button.textContent = labels.copied
        window.setTimeout(() => {
          button.textContent = labels.copy
        }, 1600)
      } catch {
        button.textContent = '—'
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [labels.copy, labels.copied])

  useEffect(() => {
    let disposed = false
    const charts: { dispose: () => void; resize: () => void }[] = []

    const renderMermaid = async () => {
      const plots = Array.from(
        document.querySelectorAll<HTMLElement>('[data-ak-figure="mermaid"]'),
      )
      if (plots.length === 0) return

      // Mermaid and ECharts are heavy and most posts use neither: they are
      // code-split so a post without figures never pays for them.
      const mermaid = (await import('mermaid')).default
      const themeStyle = getComputedStyle(document.documentElement)
      const themeToken = (name: string) => themeStyle.getPropertyValue(name).trim()
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: isDark() ? 'dark' : 'base',
        fontFamily: getComputedStyle(document.body).fontFamily,
        themeVariables: {
          primaryColor: themeToken('--ak-surface-panel'),
          primaryTextColor: themeToken('--ak-text-primary'),
          lineColor: themeToken('--ak-border-strong'),
        },
      })

      for (const [index, plot] of plots.entries()) {
        if (disposed) return
        const { code } = readPayload(plot)
        if (!code) continue
        try {
          const { svg } = await mermaid.render(`ak-mermaid-${index}-${Date.now()}`, code)
          if (disposed) return
          plot.innerHTML = svg
        } catch (error) {
          console.error('[mermaid]', error)
        }
      }
    }

    const renderEcharts = async () => {
      const plots = Array.from(
        document.querySelectorAll<HTMLElement>('[data-ak-figure="echarts"]'),
      )
      if (plots.length === 0) return

      const echarts = await import('echarts')
      if (disposed) return

      for (const plot of plots) {
        const { option } = readPayload(plot)
        if (!option) continue
        // Drop the placeholder and the payload script: ECharts owns the box now.
        plot.replaceChildren()
        const chart = echarts.init(plot, undefined, { renderer: 'svg' })
        const themed = option.color ? option : { ...option, color: themePalette() }
        chart.setOption(themed)
        charts.push(chart)
      }
    }

    void renderMermaid()
    void renderEcharts()

    const onResize = () => charts.forEach((chart) => chart.resize())
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      window.removeEventListener('resize', onResize)
      charts.forEach((chart) => chart.dispose())
    }
  }, [])

  return null
}