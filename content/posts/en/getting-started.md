---
title: Starting from an empty folder
description: How the metadata works, which components the body supports, and where figures and tables belong — read this before you make the template your own.
date: 2026-01-08
category: Notes
tags:
  - Next.js
  - Markdown
  - ak-ui
---

The template runs. There is only one thing left to do: put your writing in it. A post is a
Markdown file under `content/posts/`, the file name is the URL (`content/posts/hello.md` →
`/posts/hello`), and the same file name under `content/posts/en/` is the English translation
of that post.

## Metadata

Every post opens with a YAML block, followed by a blank line and the body:

```yaml
---
title: Starting from an empty folder
description: One sentence that shows up in listings, the feed and search results.
date: 2026-01-08
updated: 2026-01-12
category: Notes
tags:
  - Next.js
  - Markdown
---
```

| Field | Required | What it does |
| --- | --- | --- |
| `title` | yes | The page title — do not repeat it as `# title` in the body |
| `description` | yes | The summary used in listings and meta descriptions |
| `date` | yes | `YYYY-MM-DD` |
| `updated` | no | The date of the last substantial edit |
| `category` | no | A category, which gets an archive page of its own |
| `tags` | no | A list of tags, each with an archive page |
| `draft` | no | `true` keeps the post out of the production build |

A missing required field, or a date written as `2026/01/08`, fails the build and names the
file that caused it.

## The body

The body starts at `##` — `##` and `###` headings become the table of contents, and the
Chinese in a heading is kept as it is. Tables, quotes, lists, strikethrough and task lists are
plain GFM:

- A list item
- Another one
  - A nested one

Inline maths is written $e^{i\pi} + 1 = 0$, and a display formula stands on its own:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,\mathrm{d}x = \sqrt{\pi}
$$

## Code

Fenced blocks with a language are highlighted, and the corner carries the language and a copy
button. Add `title` to show the file path:

```ts title="src/lib/posts.ts"
export async function getPosts(locale: Locale): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.locale === locale && !post.draft)
}
```

> When you quote somebody else's code, put the permanent link into `src` so readers can jump
> to the exact lines.

## Figures and tables

Use `data` when the reader needs exact numbers and `stats` when a handful of numbers is the
point:

```stats title="Build times" meta="Local · M2" note="Median of three runs."
## Cold start
First compile | 2.4 s | including dependency prebuild
Hot reload | 180 ms | single file change
```

Flows and structures go to Mermaid:

```mermaid title="The path of one request" note="Rendered to SVG in the browser."
flowchart TD
  A[Markdown] --> B[remark / rehype]
  B --> C{A figure?}
  C -- yes --> D[client render]
  C -- no --> E[static HTML]
```

## Summary

Rebuild after writing. A content-only repository uses `ak-blog build --content . --out out`;
a source project uses `npm run build`. Upload `out/` to Cloudflare Pages or another static host.
No production Node server is required; `npm start` only previews the exported files locally.