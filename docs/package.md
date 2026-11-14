# @swufefox/ak-blog package

This package combines a reusable static blog template with a separate content repository. Node.js 20.9+ is required for the build tooling; the deployed site is HTML, CSS, browser JavaScript, images and feeds. It does not require a Node server, Cloudflare Worker or Pages Function.

## Build a content repository

Input layout:

```text
content-repository/
  posts/
    hello.md
    en/hello.md
  images/
    diagram.svg
  site.json
```

Only `posts/` and at least one Markdown file are required. English translations, images and site configuration are optional. Matching filenames connect translations. The directory may be a separate Git checkout; it needs no Next.js sources or package manifest.

```sh
npx @swufefox/ak-blog build --content ../content-repository --out ./out
```

The builder uses the template bundled with the installed version, removes its sample content from the staging area, copies the caller's posts/images, applies site configuration, and executes a real Next.js static build. It never runs npm or downloads dependencies during `build`; npm/npx obtains declared dependencies when installing the package.

Output publication happens only after a successful build. An absent or empty output directory is accepted; nonempty output must carry the marker from an earlier ak-blog build. Input trees, symlink targets and unrelated nonempty directories are protected. A failed rebuild leaves previous output available. Temporary staging is removed. The ownership marker contains the generator identity, not the caller's filesystem path.

## CLI

```sh
ak-blog build --content <directory> --out <directory> [--config <file>]
ak-blog init <directory> [--name <npm-project-name>]
ak-blog --help
ak-blog --version
```

Paths containing spaces must be quoted. `--content` and `--out` are resolved from the calling directory. `--config` is optional; when omitted, `<contentDir>/site.json` is used if present. Invalid input or build failures produce contextual errors and a nonzero exit status.

`init` creates a standalone source project for people who want to modify template internals. It accepts a new or empty directory, never overwrites files and does not install dependencies. The generated private project supports `npm run dev`, `npm run build`, and `npm start` (a local static-file preview). It intentionally starts without a lockfile; run `npm install`, commit the resulting lock, then use `npm ci` for later installations.

## Programmatic build API

```js
import { buildBlog } from '@swufefox/ak-blog/build'

await buildBlog({
  contentDir: '../content-repository',
  outDir: './out',
  configFile: './site.json', // optional
})
```

`buildBlog(options: BuildBlogOptions): Promise<void>` is a Node-only entry point. It is separate from the React entry so browser consumers do not import filesystem or process APIs. The package exports `BuildBlogOptions` and `SiteOptions` types from this subpath.

`SiteOptions` accepts optional `title`, `suffix`, `description` (`zh` / `en`), `url`, `author`, `email`, `about`, `repo`, `sameAs`, `postsOnHome`, and `license` (`name` / `url`). Nested description/license fields merge with defaults. Unknown fields and invalid types fail with the configuration path. `url` must be an absolute HTTP(S) origin; trailing slashes are normalized. `NEXT_PUBLIC_SITE_URL` overrides the JSON URL during the build.

The template keeps Chinese at `/` and English at `/en`. Adding other languages is a source-level customization because UI strings and route definitions must remain exhaustive.

## React components

The root exports `BlogHero`, `FeaturedPost`, `PostList` and their corresponding props types, plus `PostListItem`. Use matching React / React DOM 19.3+ and ak-ui React 2.x. The package includes its build-tool dependencies; that installation footprint does not imply a production server requirement.

Import styles once, in order:

```tsx
import '@swufefox/ak-ui-react/style.css'
import '@swufefox/ak-blog/style.css'
```

In Next.js, place CSS imports in the root layout. The component entry itself contains no Node, Next.js, content-loading or chart-runtime imports and supports server rendering. Plain Node SSR programs should import JavaScript only and let a framework or bundler handle CSS.

| Component | Required props | Optional props |
| --- | --- | --- |
| `BlogHero` | `title`, `description` | `eyebrow`, `titleAs` (default `h1`), `className` |
| `FeaturedPost` | `href`, `title`, `description`, `date`, `dateLabel`, `readTime`, `eyebrow`, `actionLabel` | `category`, `className` |
| `PostList` | `items`, `label`, `empty` | `className` |

`PostListItem` contains `href`, `title`, `description`, `date`, `dateLabel`, and optional `category`. Title and description accept React nodes, allowing highlighted search results. Dates, translated labels, reading time and URLs are supplied by the caller.

Set `data-ak-theme="archive"` or `terminal` on the page root. Component CSS is scoped and marked as a side effect; it does not include global page resets or the complete Markdown layout. Existing static sites may use these components while retaining their own content and routing. To get the complete blog behavior from content alone, use the build API or CLI.

## Local package verification

From this source repository:

```sh
npm ci
npm run lint
npm run build
npx tsc --noEmit
npm pack
npm run smoke:package
```

`prepack` compiles ESM and declarations, copies component CSS, and creates a current-source `dist/template` snapshot. No copied template is committed. The package includes the builder, UI, template, CLI, guides and license; it excludes caches, private keys, environment files, source symlinks and package-maintenance scripts.

`smoke:package` installs the actual tarball into an isolated consumer with development dependencies omitted. It exercises CLI and API builds using independent bilingual and Chinese-only content, checks images/feeds/metadata/404/OG, excludes bundled examples and drafts, and verifies unrelated-output protection and preservation after malformed content fails. It creates and removes its own temporary fixtures.

Before npm publication, use the local tarball:

```sh
npm exec --package=./swufefox-ak-blog-1.0.1.tgz -- ak-blog build --content ../my-content --out ../my-content/out
```

See [deployment](deploy.md) for Cloudflare Pages and other static hosts, and [writing](writing.md) for content syntax.

## Publish workflow

The release convention follows [ak-ui-react's publish workflow](https://github.com/SwufeFox/ak-ui-react/blob/master/.github/workflows/publish.yml): `v*` tags, manual dry runs, the `npm-publish` environment, Node 22.14.0, npm 11.5.1 or newer, and OIDC authentication. Repository metadata points to `https://github.com/SwufeFox/ak-blog.git`.

### First publication

A GitHub repository and an npm package are separate resources. The first successful publication creates the npm package. An owner with permission to publish under `@swufefox` can bootstrap it interactively:

```sh
npm login --registry=https://registry.npmjs.org
npm pack
npm publish ./swufefox-ak-blog-1.0.1.tgz --access public
```

Complete login and 2FA locally. `publishConfig.registry` fixes publication to the official npm registry even when installations use a mirror. The scoped package is public.

After the package exists, add its GitHub Actions Trusted Publisher with these exact values:

| Field | Value |
| --- | --- |
| Organization or user | `SwufeFox` |
| Repository | `ak-blog` |
| Workflow filename | `publish.yml` |
| Environment name | `npm-publish` |
| Allowed actions | Enable direct `npm publish` |

Use the matching GitHub environment. New npm trusted-publisher configurations can be stage-only by default, so direct publishing must be enabled. No long-lived `NPM_TOKEN` is needed for subsequent releases. npm generates provenance for trusted publication from the public repository. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

### Automated checks and releases

`CI` runs on `main` pushes, pull requests and manual dispatch. It installs the lockfile, lints, builds the static demo, checks types, packs the package and runs the independent content-consumer smoke. The `.tgz` is uploaded as an artifact.

`Publish` uses the same checks. A `v*` tag must match `package.json.version`; a mismatch stops before installation. The job uploads and publishes the same tarball. Release dependency caching is not enabled. Manual dispatch defaults to `dry_run: true`, which produces the artifact without publishing; environment protection still applies.

For a later version, from a clean working tree:

```sh
npm version patch
git push origin main --follow-tags
```

Do not push the already manually published bootstrap version to publish it again. npm versions cannot be overwritten. Trusted-publisher authentication errors require checking the exact owner, repository, workflow filename, environment and allowed action; local packaging and content builds never publish anything.
