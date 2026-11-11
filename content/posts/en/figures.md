---
title: Figures, tables and numbers
description: "Three components you only reach for when writing technical notes — a data table with inline bars, KPI cards and hand-drawn diagrams. The syntax is short and a mistake fails the build."
date: 2026-01-12
category: Notes
tags:
  - Markdown
  - ak-ui
---

A markdown table is fine for exact numbers, but some things it cannot say: which value in a column is
larger, a handful of numbers that deserve the whole screen, or a drawing of how data moves. This note
writes one of each, and doubles as a test of the template.

## Images

Images live in `content/images/`; write the path relative to the post and the build turns it into a
URL the browser can fetch:

![Markdown, an AST, and HTML](../images/pipeline.svg)

Images get a hairline border, scale with the column and never overflow on a phone.

## Data tables

The first line of a `data` fence is the header, every other line is a row. `bars` names the columns
that get an inline bar, drawn from zero and switching colour for negative values; `mark` highlights a
row:

```data title="Build times" bars="Cold,Warm" mark="Cold start" note="Seconds. Median of three runs on this machine."
Stage | Cold | Warm
Cold start | 48.2 | 12.4
Hot reload | 6.1 | 0.8
Static export | 52.7 | 41.2
```

Numeric columns are right-aligned automatically, and the first number in a cell decides the bar
length, so `48.2s`, `+12%` and `$1,200` all work.

## KPI cards

`stats` groups rows under `##`, and each row is `label | value | note`. A value starting with `+` uses
the accent colour:

```stats title="Template weight" meta="production build" note="gzipped, images excluded."
## First paint
HTML | 14 KB | one article
CSS | 21 KB | including ak-ui
JS | 96 KB | search and theme

## Loaded on demand
Chart library | 382 KB | only when a chart appears
Syntax highlighting | 0 KB | done at build time
```

## Sketches

When the structure itself is the point, write SVG. `sketch` provides a few classes: `panel` for the
backdrop, `node` for boxes, `edge` for connectors, `caps` for small uppercase headings and `mid` to
centre text:

```sketch title="Three stages of one article" note="A sketch, not a measurement."
<svg viewBox="0 0 704 150">
  <rect class="panel" x="0" y="0" width="704" height="150" rx="10"/>
  <text class="caps" x="24" y="30">RENDER</text>
  <g class="node plain"><rect x="24" y="56" width="150" height="40" rx="4"/><text class="mid" x="99" y="76">Markdown</text></g>
  <path class="edge" d="M178 76 H218" marker-end="url(#arrow)"/>
  <g class="node blue"><rect x="222" y="56" width="190" height="40" rx="4"/><text class="mid" x="317" y="76">remark / rehype</text></g>
  <path class="edge" d="M416 76 H456" marker-end="url(#arrow)"/>
  <g class="node teal"><rect x="460" y="56" width="220" height="40" rx="4"/><text class="mid" x="570" y="76">HTML and SVG</text></g>
  <text class="small" x="24" y="124">source</text>
  <text class="small" x="460" y="124">static output</text>
</svg>
```

Colours inside a sketch are class names or `var(--…)` values; hard-coded colours are dropped, and so
are `<script>`, `<style>`, `foreignObject` and event attributes.

## Interactive charts

Use `echarts` when you need hover, animation or a legend. The body is a valid JSON option:

```echarts title="Writing time per week" note="Hours; illustrative data." height="280"
{
  "tooltip": {"trigger": "axis"},
  "grid": {"left": 36, "right": 16, "top": 20, "bottom": 28},
  "xAxis": {"type": "category", "data": ["Week 1", "Week 2", "Week 3", "Week 4"]},
  "yAxis": {"type": "value"},
  "series": [
    {"name": "Writing", "type": "bar", "barWidth": "36%", "data": [6, 9, 4, 11]},
    {"name": "Editing", "type": "line", "smooth": true, "data": [2, 3, 1, 5]}
  ]
}
```

ECharts is only downloaded when a page actually contains a chart, so posts without one never pay for
it.

## Summary

The three components cover most of what prose cannot say: exact numbers go in `data`, a handful of
key figures in `stats`, structure in `sketch`, and anything interactive in `echarts`. Mistakes are
safe — the build names the file and the reason.