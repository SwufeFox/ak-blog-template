# @swufefox/ak-blog npm package

`@swufefox/ak-blog` 1.0.0 provides three React components and an offline CLI that creates a complete Next.js blog. Node.js 20.9 or newer is required. The library is ESM-only and ships TypeScript declarations. Its root entry has no Next.js, filesystem, site configuration, Markdown or chart-runtime imports.

## Use the React components

Install the package and its peers in a React application:

```sh
npm install @swufefox/ak-blog @swufefox/ak-ui-react@^2 react@^19 react-dom@^19
```

Peer ranges are `@swufefox/ak-ui-react ^2.0.0`, and React / React DOM `^18.2.0 || ^19.0.0`. Use matching React and React DOM versions. React 18 applications can keep their existing compatible versions. Next.js, Mermaid and the other template application dependencies are development dependencies of this repository; installing the library does not install them.

Import both stylesheets once in your application's CSS-capable entry point, with the ak-ui stylesheet first:

```tsx
import '@swufefox/ak-ui-react/style.css'
import '@swufefox/ak-blog/style.css'
import {
  BlogHero,
  FeaturedPost,
  PostList,
  type PostListItem,
} from '@swufefox/ak-blog'

const posts: PostListItem[] = [{
  href: '/posts/hello',
  title: 'Hello, archive',
  description: 'A first entry in a carefully kept collection.',
  date: '2026-11-13',
  dateLabel: 'November 13, 2026',
  category: 'Notes',
}]

export function BlogIndex() {
  return (
    <main data-ak-theme="archive">
      <BlogHero
        eyebrow="Field notes"
        title="A place for considered writing"
        description="Articles, experiments and things worth keeping."
      />
      <FeaturedPost
        {...posts[0]}
        eyebrow="Featured"
        readTime="3 min read"
        actionLabel="Read article"
      />
      <PostList items={posts} label="Latest articles" empty="No articles yet." />
    </main>
  )
}
```

The root exports `BlogHero`, `FeaturedPost`, `PostList`, and the types `BlogHeroProps`, `FeaturedPostProps`, `PostListProps`, `PostListItem`. Links are standard anchors; supply your own URLs, translated labels, date formatting and article data. Set `data-ak-theme="archive"` for the light theme or `data-ak-theme="terminal"` for the dark theme on the page root. The component CSS uses ak-ui tokens and is marked as a side effect so bundlers retain it. It does not include the template's site layout or Markdown styles.

The components support server rendering. Import JavaScript and types alone in a plain Node SSR program; Node does not load CSS files. Let your framework or bundler handle stylesheet imports. These components wrap ak-ui React primitives, so React Server Component applications retain ak-ui's client boundaries and hydration requirements. The library does not provide routing, content loading, search, a theme toggle or a Markdown renderer.

## Create a complete blog

Once the package is published, the standard invocation is:

```sh
npx @swufefox/ak-blog my-blog
cd my-blog
npm install
npm run dev
```

`npx` may download the package. The `ak-blog` command itself only copies the bundled template: it makes no network requests and never installs packages, runs scripts or overwrites existing files. It accepts a new directory or an existing empty directory; any nonempty target, file or target symlink is rejected. Quote paths containing spaces. The project name defaults to a lowercase, hyphenated version of the directory name, and `--name` accepts an explicit valid lowercase npm name, including scoped names:

```sh
ak-blog "My writing space" --name my-writing-space
ak-blog my-blog --name @example/my-blog
ak-blog --help
ak-blog --version
```

The generated application has `private: true`, the original `dev`, `build`, `start` and `lint` scripts, application runtime dependencies, and TypeScript / ESLint development dependencies. It uses its own copied UI source and styles; it does not depend on this npm package. The snapshot includes current `src`, `content`, `public`, application configuration, `.gitignore`, a project-specific README, MIT license and guides. It excludes package publishing scripts, caches, generated build output, node_modules, environment files, private-key files and symlinks. The included package-maintenance guide describes the original source repository; its publishing commands do not apply to generated blogs.

The generated application intentionally has no lockfile: this repository's lock describes the library's development dependency graph, where application runtime dependencies are development-only. Run `npm install` once in the generated project and commit its new `package-lock.json`; subsequent installs can use `npm ci`. Dependency ranges are taken from the current root manifest rather than a second version list.

The full blog needs a Node server in production. Its locale proxy, image route and dynamic 404 prevent static export as configured. Markdown is processed during the build; Mermaid and ECharts run in the browser where used. Set `NEXT_PUBLIC_SITE_URL` before a production build, then run `npm run build` and `npm start`. See [deployment](deploy.md), [configuration](configuration.md), and [writing](writing.md).

## Build and try a local tarball

From the repository root:

```sh
npm ci
npm run build:package
npm pack
```

`build:package` invokes the installed TypeScript compiler without adding a build dependency. It regenerates `dist/ui/index.js` and declarations, copies `src/styles/components.css` to `dist/style.css`, and creates `dist/template` from the current source. `npm pack` runs the same build through `prepack`, so the tarball always contains a fresh snapshot. Neither command builds the Next.js application or publishes anything. The output is `swufefox-ak-blog-1.0.0.tgz`.

Install this exact tarball in a separate project, replacing the absolute example path with your checkout path:

```sh
mkdir ak-blog-consumer
cd ak-blog-consumer
npm init -y
npm install "/absolute/path/to/swufefox-ak-blog-1.0.0.tgz" @swufefox/ak-ui-react@^2 react@^19 react-dom@^19
node --input-type=module -e 'import React from "react"; import { renderToString } from "react-dom/server"; import { BlogHero } from "@swufefox/ak-blog"; console.log(renderToString(React.createElement(BlogHero, { title: "Hello", description: "SSR from the local tarball" })));'
node node_modules/@swufefox/ak-blog/bin/ak-blog.mjs "../generated blog" --name generated-blog
cd "../generated blog"
npm install
npm run build
```

In a TypeScript React consumer, the import example above exercises declaration resolution with either `moduleResolution: "bundler"` or `"NodeNext"`. CommonJS `require()` is not an exported entry point. Local CLI testing can also use `node bin/ak-blog.mjs "../generated blog"` directly from the repository after `build:package`.

## Publish workflow

Before a release, update the package version and lockfile, review the application content that will enter the snapshot, and complete the application and outside-repository consumer checks. Inspect the packed file list with `npm pack --dry-run`, then create and test the real tarball with `npm pack`. The manifest restricts publication to compiled UI, CSS, the generated template, CLI, guides, README and license; no repository URL or author is fabricated.

Only an authorized release maintainer should run the final registry operation:

```sh
npm publish ./swufefox-ak-blog-1.0.0.tgz --access public
```

The package also sets `publishConfig.access` to `public` for its scoped name. The documented publish command is a manual release step; local packaging and generator commands never publish to a registry.
