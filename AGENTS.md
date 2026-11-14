# Repository Guidelines

## Project Overview

`@swufefox/ak-blog` combines a reusable template with a separate content-only repository to build a bilingual static blog (Chinese at `/`, English at `/en`). It uses Next.js 16.4.6, React 19.3, strict TypeScript and `@swufefox/ak-ui-react` 2.0. Node is build-time tooling only; production serves the files in `out/` without a Node server, Workers or Pages Functions. Code is MIT; articles use the configured CC BY-NC-SA 4.0 license.

## Architecture & Data Flow

- **Content**: `content/posts/*.md` is the default (`zh`) collection; `content/posts/en/*.md` holds translations with matching filenames/slugs. `src/lib/posts.ts` parses YAML with `gray-matter`, validates it, caches the collection at module scope, sorts newest-first, filters drafts in production and derives tags/categories/translations.
- **External content**: `ak-blog build --content <dir> --out <dir>` accepts `posts/`, optional `posts/en/`, `images/` and `site.json`. The Node-only `@swufefox/ak-blog/build` API stages the shipped template, removes example content, applies validated configuration and runs a real static build. It never installs dependencies or changes source content. Failed rebuilds retain previous output.
- **Front matter**: required `title`, `description` and `date`; date/`updated` must match `YYYY-MM-DD` (format check only); `tags` must be a list; optional `category` (legacy `tag` accepted); `draft: true` is included in development and hidden in production. Errors must name the source file, e.g. `content/posts/x.md: missing required field "title"`.
- **Markdown**: `src/lib/markdown.ts` builds a unified processor per render. Authored raw HTML is stripped before `rehypeRaw` processes pipeline-generated HTML. It handles GFM, math, Shiki code, h2/h3 TOC extraction (autolink `#` excluded), and the custom `data`, `stats`, `mermaid`, `sketch` and `echarts` fences.
- **Images**: relative post images resolve to `/content/images/...`; local files get intrinsic dimensions plus lazy/async attributes. `src/lib/images.ts` enumerates regular allowed images; `src/app/content/[...path]/route.images.ts` emits them during static export. No request-time file server is deployed.
- **Routing**: real route entries in `src/app/(default)/` and `src/app/en/` share rendering in `src/views/`. There is no proxy or runtime rewrite. Because this Next version rejects empty dynamic parameter collections, `next.config.ts` conditionally enables the `zh-post.tsx`, `en-post.tsx`, `zh-term.tsx`, `en-term.tsx` and `images.ts` extensions by actual content inventory. Empty locale homes/search/archive/feed remain available. Global 404 is exported; Cloudflare `_redirects` handles old `/zh` URLs.
- **Metadata**: shared metadata defaults live in `src/views/layout.tsx`; every content view declares its canonical and language alternatives. Search is `noindex`; 404 is `noindex/nofollow`. All pages share the static 1200×630 `/og.png` social card (`src/app/og.png/route.tsx`, descriptor in `src/lib/social.ts`).
- **Search**: server pages pass localized post summaries to `src/components/search-client.tsx`; filtering and ranking happen client-side (title 4, tag/category 2, summary 1). No search backend or index file. The query is mirrored to `?q=` with `history.replaceState` so links reload correctly.
- **ak-ui boundary**: primitives are imported directly and rendered to build-time HTML before hydration. `AkMobileMenu` mounts after hydration to avoid module-counter ID mismatches. Desktop TOC uses `AkHeading`, mobile TOC uses native `AkCollapsible`; do not reintroduce counter-based `AkPanel` / `AkCollapseItem` there. The public UI entry in `src/ui/` stays free of Node and Next imports.
- **Theme**: `<html data-ak-theme="archive">` (light) or `terminal` (dark). An inline pre-paint script reads `localStorage['ak-theme']` and updates `<meta name="theme-color">`; storage key and browser-chrome colors live in `src/lib/theme.ts`. The CSS toggle in `theme-toggle.tsx` renders both icon/label states and switches them on the attribute. `useSyncExternalStore` keeps `aria-pressed` in sync.
- **Client runtimes**: `site-nav.tsx` (path/current page/mobile menu), `theme-toggle.tsx`, `search-client.tsx`, `post-toc.tsx` (scroll-position scrollspy), `reading-progress.tsx` and `post-runtime.tsx` (copy buttons; dynamic Mermaid/ECharts). Keep new browser behavior in similarly small client components.

## Key Directories

| Path | Purpose |
| --- | --- |
| `src/app/` | Actual static route entries and metadata handlers |
| `src/views/` | Shared localized pages, shell and feed rendering |
| `src/build/` | Content-repository build API and safe output publication |
| `src/ui/` | Independently importable React components |
| `src/components/` | Shared UI and isolated client behavior |
| `src/lib/` | Post loading/validation, Markdown pipeline, i18n, URL helpers, section kickers |
| `src/styles/` | Global tokens, ak-ui adaptations, layout and responsive rules |
| `content/posts/` | Markdown posts; locale subdirectory holds translations |
| `content/images/` | Template post images, exported to `/content/images/...` |
| `public/` | Favicon and static-host `_headers` / `_redirects` |
| `docs/` | Writing, configuration, architecture, design-system and deployment guides |
| `scripts/` | Package snapshot build, static preview and real packed-consumer smoke |

## Development Commands

```sh
npm ci
npm run dev          # http://localhost:3000
npm run lint         # eslint src
npx tsc --noEmit     # type check; no package script
npm run build        # webpack static export + content/Markdown validation
npm start            # local preview of out/, not a production requirement
npm pack             # UI/build API declarations and template snapshot
npm run smoke:package # install tarball and build independent content fixtures
```

Set `NEXT_PUBLIC_SITE_URL` before `npm run build` for real canonical/RSS/sitemap URLs. Change the port with `PORT=8080 npm start`. There is no `test` script.

## Code Conventions & Common Patterns

- TypeScript is strict; use the `@/*` alias for `src/`. File names are kebab-case, React exports PascalCase.
- Keep typed defaults in `src/site.config.ts`, content JSON contracts in `src/site-options.ts`, and generated/custom overrides in `src/site.override.json`. UI copy lives in `src/lib/i18n.ts`; `UiStrings` stays exhaustive. Use locale URL helpers from `src/lib/urls.ts`.
- Content loading uses `node:fs/promises`; pass serializable values to client components as props. Image sizing reads local file headers synchronously during the build. Keep local UI state in client components; use `useSyncExternalStore` where server and browser snapshots must agree.
- No dependency-injection container. Dependencies are explicit props/arguments; shared site settings come from the typed `siteConfig`.
- Preserve the plugin order in `src/lib/markdown.ts` and document new fenced-block syntax in `docs/writing.md`. `sketch` SVG is sanitized; `echarts` accepts JSON options only.
- Per-route canonical metadata is not optional: add `alternates.canonical` and `languages` when creating a route. Do not rely on the layout canonical for new routes.
- Styling maps semantic `--ak-*` tokens through `--site-*`. Ink carries structure/text; action yellow is for real state/interaction; danger red is reserved for errors. Follow the documented `accent` intensity: no fake telemetry, extra cuts/stripes or permanent glow. Breakpoints are 1000/860/700/360px.
- No formatter is configured. Match nearby formatting and use ESLint. Prefer contextual errors; unknown deployed paths must receive the static 404 document with HTTP 404, not a 200 SPA response.

## Important Files

- `src/site.config.ts`, `src/site-options.ts`, `src/site.override.json` — defaults, validated content options and build injection.
- `src/lib/posts.ts` — discovery, front-matter validation, caching, translations, tags/categories.
- `src/lib/markdown.ts` — unified pipeline, custom fences, TOC, media metadata.
- `src/lib/urls.ts` — locale-aware route builders.
- `next.config.ts` — static export and inventory-controlled route extensions.
- `src/views/layout.tsx` plus the real root layouts — shared shell, pre-paint theme script and metadata.
- `src/app/content/[...path]/route.images.ts` + `src/lib/images.ts` — static image enumeration and emission.
- `src/app/og.png/route.tsx` + `src/lib/social.ts` — static social card and metadata descriptor.
- `src/build/index.ts`, `bin/ak-blog.mjs`, `scripts/build-package.mjs` — packed content builder, CLI and template snapshot.
- `src/components/site-nav.tsx`, `theme-toggle.tsx`, `search-client.tsx`, `post-toc.tsx`, `post-runtime.tsx` — hydration-sensitive client behavior.
- `src/styles/globals.css` — tokens, layout, ak-ui adaptations, print rules.
- `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs` — scripts, locked deps, compiler/lint config.
- `docs/architecture.md`, `docs/writing.md`, `docs/configuration.md`, `docs/design-system.md`, `docs/deploy.md` — implementation, authoring, setup, UI rules, deployment.

## Runtime/Tooling Preferences

- Node.js **20.9+** and npm with the committed `package-lock.json` (lockfile v3). Next.js is pinned to 16.4.6, React 19.3.0; do not assume older Next conventions.
- Read the relevant guide in `node_modules/next/dist/docs/` before framework edits. Page params are Promises. Static export is the product contract; do not add runtime rewrites/proxy/route dependencies.
- `npm run build` uses webpack so the same build works with the packaged builder's temporary dependency links. `npm start` uses `scripts/preview.mjs` for a real file-only preview; Cloudflare Pages deploys `out/` directly.
- The default origin is `https://example.com`. Content `site.json.url` overrides it; `NEXT_PUBLIC_SITE_URL` wins at build time. URLs are origins, not deployment subpaths. Local preview defaults to port 3000; `PORT` / `HOST` override it.

## Testing & QA

- There is no Jest/Vitest runner or `npm test`. `npm run smoke:package` is a real integration check using the packed package, external bilingual/minimal content, static output and failed-rebuild preservation. CI and Publish workflows run it; report only checks actually exercised.
- For code changes run lint, build and TypeScript checks. Package/builder changes also require `npm pack` followed by `npm run smoke:package`. A stale `.next/dev` validator after route removal is generated state; clear that obsolete cache rather than weakening type checks.
- After route/browser changes run `npm start` and smoke the affected pages: both locale homes (`/`, `/en`), a post, tag index/term, search, feeds, and a missing path/404. Check the `archive` and `terminal` themes, theme persistence, keyboard focus, console errors and narrow-viewport overflow.
- Content-specific checks: malformed YAML/front matter and invalid ECharts JSON fail at build; Mermaid errors surface in the browser console. There is no automated substitute for these manual checks.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
