# Repository Guidelines

## Project Overview

`open-ak-blog-template` is a bilingual (Chinese default, English at `/en`) blog template built with Next.js 16.4.6, React 19.3, TypeScript (strict) and `@swufefox/ak-ui-react` 2.0. Markdown is parsed and rendered during `next build`; production runs as a Node server because locale routing, the custom 404 and image delivery need a runtime. Code is MIT; articles use the configured CC BY-NC-SA 4.0 license.

## Architecture & Data Flow

- **Content**: `content/posts/*.md` is the default (`zh`) collection; `content/posts/en/*.md` holds translations with matching filenames/slugs. `src/lib/posts.ts` parses YAML with `gray-matter`, validates it, caches the collection at module scope, sorts newest-first, filters drafts in production and derives tags/categories/translations.
- **Front matter**: required `title`, `description` and `date`; date/`updated` must match `YYYY-MM-DD` (format check only); `tags` must be a list; optional `category` (legacy `tag` accepted); `draft: true` is included in development and hidden in production. Errors must name the source file, e.g. `content/posts/x.md: missing required field "title"`.
- **Markdown**: `src/lib/markdown.ts` builds a unified processor per render. Authored raw HTML is stripped before `rehypeRaw` processes pipeline-generated HTML. It handles GFM, math, Shiki code, h2/h3 TOC extraction (autolink `#` excluded), and the custom `data`, `stats`, `mermaid`, `sketch` and `echarts` fences.
- **Images**: relative post images resolve to `/content/images/...`; local files get intrinsic `width`/`height` via `image-size` plus `loading="lazy"`/`decoding="async"`. `src/app/content/[...path]/route.ts` serves only allowed formats from `content/images`, checks path containment and sets immutable caching.
- **Routing**: default locale lives at `/`, other locales at `/en/...`. `next.config.ts` rewrites bare paths to the default locale; `src/proxy.ts` 308-redirects `/zh/...` duplicates. The locale layout owns locale `generateStaticParams`; posts and tag terms add their own content params; the feed is `force-static`. Home, archive and search are statically rendered via the locale params.
- **Metadata**: home canonical comes from `src/app/[locale]/layout.tsx`; posts, archive, tag terms and search declare their own `alternates.canonical` and `languages` in `generateMetadata`. Search is `noindex`; 404 is `noindex/nofollow`. All pages share the 1200×630 `/og` social card (`src/app/og/route.tsx`, descriptor in `src/lib/social.ts`) through layout/post Open Graph and Twitter metadata.
- **Search**: server pages pass localized post summaries to `src/components/search-client.tsx`; filtering and ranking happen client-side (title 4, tag/category 2, summary 1). No search backend or index file.
- **ak-ui boundary**: `@swufefox/ak-ui-react` is a client-entry package but can be imported from server components; every component is SSR'd then hydrated. There is **no `src/components/ak.ts` forwarding layer** — import primitives directly. `AkMobileMenu` is mounted only after hydration via `useSyncExternalStore` to avoid the package's module-counter ID mismatch.
- **Theme**: `<html data-ak-theme="archive">` (light) or `terminal` (dark). An inline pre-paint script reads `localStorage['ak-theme']` and updates `<meta name="theme-color">`; storage key and browser-chrome colors live in `src/lib/theme.ts`. The CSS toggle in `theme-toggle.tsx` renders both icon/label states and switches them on the attribute. `useSyncExternalStore` keeps `aria-pressed` in sync.
- **Client runtimes**: `site-nav.tsx` (path/current page/mobile menu), `theme-toggle.tsx`, `search-client.tsx`, `post-toc.tsx` (scroll-position scrollspy), `reading-progress.tsx` and `post-runtime.tsx` (copy buttons; dynamic Mermaid/ECharts). Keep new browser behavior in similarly small client components.

## Key Directories

| Path | Purpose |
| --- | --- |
| `src/app/` | App Router pages, metadata, feed/sitemap/robots and image route |
| `src/components/` | Shared UI and isolated client behavior |
| `src/lib/` | Post loading/validation, Markdown pipeline, i18n, URL helpers, section kickers |
| `src/styles/` | Global tokens, ak-ui adaptations, layout and responsive rules |
| `content/posts/` | Markdown posts; locale subdirectory holds translations |
| `content/images/` | Post images, served by the `/content/...` route |
| `public/` | Static passthrough assets (favicon) |
| `docs/` | Writing, configuration, architecture, design-system and deployment guides |

## Development Commands

```sh
npm ci
npm run dev          # http://localhost:3000
npm run lint         # eslint src
npx tsc --noEmit     # type check; no package script
npm run build        # production build + content/Markdown validation
npm start            # serve the production build
```

Set `NEXT_PUBLIC_SITE_URL` before `npm run build` for real canonical/RSS/sitemap URLs. Change the port with `PORT=8080 npm start`. There is no `test` script.

## Code Conventions & Common Patterns

- TypeScript is strict; use the `@/*` alias for `src/`. File names are kebab-case, React exports PascalCase.
- Keep template identity/options in `src/site.config.ts`; UI copy belongs in `src/lib/i18n.ts` and `UiStrings` must stay exhaustive per locale. Use `src/lib/urls.ts` (`homePath`, `postPath`, `tagsPath`, `tagPath`, `searchPath`, `feedPath`) instead of building locale URLs by hand.
- Content loading uses `node:fs/promises`; pass serializable values to client components as props. Image sizing reads local file headers synchronously during the build. Keep local UI state in client components; use `useSyncExternalStore` where server and browser snapshots must agree.
- No dependency-injection container. Dependencies are explicit props/arguments; shared site settings come from the typed `siteConfig`.
- Preserve the plugin order in `src/lib/markdown.ts` and document new fenced-block syntax in `docs/writing.md`. `sketch` SVG is sanitized; `echarts` accepts JSON options only.
- Per-route canonical metadata is not optional: add `alternates.canonical` and `languages` when creating a route. Do not rely on the layout canonical for new routes.
- Styling maps semantic `--ak-*` tokens through `--site-*`. Ink carries structure/text; action yellow is for real state/interaction; danger red is reserved for errors. Follow the documented `accent` intensity: no fake telemetry, extra cuts/stripes or permanent glow. Breakpoints are 1000/860/700/360px.
- No formatter is configured. Match nearby formatting and use ESLint as the style check. Prefer contextual errors over silent recovery; unknown routes use `notFound()`.

## Important Files

- `src/site.config.ts` — identity, locales, navigation, URL, licenses.
- `src/lib/posts.ts` — discovery, front-matter validation, caching, translations, tags/categories.
- `src/lib/markdown.ts` — unified pipeline, custom fences, TOC, media metadata.
- `src/lib/urls.ts` — locale-aware route builders.
- `src/proxy.ts` + `next.config.ts` — locale redirect/rewrite pair.
- `src/app/[locale]/layout.tsx` — theme boot script, shell, metadata defaults.
- `src/app/content/[...path]/route.ts` — guarded image delivery.
- `src/app/og/route.tsx` + `src/lib/social.ts` — 1200×630 social card and its metadata descriptor.
- `src/components/site-nav.tsx`, `theme-toggle.tsx`, `search-client.tsx`, `post-toc.tsx`, `post-runtime.tsx` — hydration-sensitive client behavior.
- `src/styles/globals.css` — tokens, layout, ak-ui adaptations, print rules.
- `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs` — scripts, locked deps, compiler/lint config.
- `docs/architecture.md`, `docs/writing.md`, `docs/configuration.md`, `docs/design-system.md`, `docs/deploy.md` — implementation, authoring, setup, UI rules, deployment.

## Runtime/Tooling Preferences

- Node.js **20.9+** and npm with the committed `package-lock.json` (lockfile v3). Next.js is pinned to 16.4.6, React 19.3.0; do not assume older Next conventions.
- This Next.js requires reading the relevant guide in `node_modules/next/dist/docs/` before changing framework code. `params` in pages/layouts are Promises; `src/proxy.ts` is the middleware entry.
- The app needs a Node runtime: rewrites/proxy, the dynamic 404 catch-all and the image route are runtime features. Static export is **not** supported as-is; `docs/deploy.md` documents the migration. Vercel/Netlify and `next start` self-hosting are supported.
- `src/site.config.ts` defaults `url` to `https://example.com`; override with `NEXT_PUBLIC_SITE_URL` at build time. Deployment port defaults to 3000; `PORT` overrides it.

## Testing & QA

- No test runner, test files, coverage setup, CI workflow or `npm test` exists. Do not claim a test suite passed.
- For code changes run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. The build exercises real front matter and Markdown rendering, and fails on invalid content.
- After route/browser changes run `npm start` and smoke the affected pages: both locale homes (`/`, `/en`), a post, tag index/term, search, feeds, and a missing path/404. Check the `archive` and `terminal` themes, theme persistence, keyboard focus, console errors and narrow-viewport overflow.
- Content-specific checks: malformed YAML/front matter and invalid ECharts JSON fail at build; Mermaid errors surface in the browser console. There is no automated substitute for these manual checks.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
