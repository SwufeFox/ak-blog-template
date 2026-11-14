# @swufefox/ak-blog

把一个独立内容仓库构建成完整的双语静态博客。模板、Markdown 渲染、搜索、主题和页面布局由本包提供；内容仓库只需要文章、图片和可选的 `site.json`。

**Node.js 20.9+ 只用于构建。部署产物是 HTML、CSS、JS、图片和 feed，不需要 Node 服务、Cloudflare Workers 或 Pages Functions。**

- 中文地址保持 `/`、`/posts/hello`，英文在 `/en`、`/en/posts/hello`。
- 构建时处理 Markdown、代码高亮、数学公式、目录、图片尺寸、RSS、sitemap 和社交卡片。
- 浏览器负责深浅主题、搜索、目录定位、代码复制及 Mermaid / ECharts 图表。
- 界面使用 [`@swufefox/ak-ui-react`](https://github.com/SwufeFox/ak-ui-react)，也可单独导入博客组件。

## 用内容仓库构建博客

内容仓库可以是另一个 Git 仓库，不需要复制 Next.js 源码，也不需要 `package.json`：

```text
my-content/
  posts/
    hello.md
    en/
      hello.md
  images/
    diagram.svg
  site.json
```

`posts/` 必须存在并包含 Markdown 文章。英文目录、图片目录和 `site.json` 都是可选的。同名中英文文件互为翻译。

包发布到 npm 后，在任何位置执行：

```sh
npx @swufefox/ak-blog build --content ./my-content --out ./out
```

如果当前目录就是内容仓库：

```sh
npx @swufefox/ak-blog build --content . --out ./out
```

将生成的 `out/` 上传到静态托管即可。模板自带示例文章不会混进你的站点。构建器不会往内容仓库写入页面源码或安装依赖；npm/npx 在安装本包时取得构建依赖，`ak-blog build` 本身只使用已安装的依赖。

输出目录须为空、不存在，或是本工具之前生成的目录。重建失败时保留原有产物；源文章、图片和配置不会被覆盖。输出中的 `.ak-blog-output.json` 是重建时识别目录归属的标记。

## 配置站点

在内容仓库根目录创建 `site.json`：

```json
{
  "title": "我的博客",
  "suffix": "/ notes",
  "description": {
    "zh": "代码、工具与日常。",
    "en": "Notes on code, tools and everyday life."
  },
  "url": "https://blog.example.com",
  "author": "你的名字",
  "email": "hello@example.com",
  "sameAs": ["https://github.com/your-name"],
  "postsOnHome": 0
}
```

所有字段均可省略，省略部分沿用模板默认值。可用字段还包括 `about`、`repo` 和 `license: { "name": "…", "url": "…" }`。`description`、`license` 按字段合并；`postsOnHome: 0` 表示展示全部文章。

`url` 必须是 HTTP(S) 站点 origin，不带部署子路径、查询或 fragment。环境变量 `NEXT_PUBLIC_SITE_URL` 的优先级高于 `site.json.url`，适合在构建平台设置实际域名。它在构建时写入 canonical、RSS 和 sitemap，改域名后需重新构建。

也可显式指定配置文件：

```sh
npx @swufefox/ak-blog build --content ../my-content --out ./out --config ./site.json
```

## 写文章

`posts/hello.md`：

```markdown
---
title: 我的第一篇笔记
description: 记录开始使用这个博客的过程。
date: '2026-11-14'
category: 随笔
tags: [博客, 写作]
---

这里是正文。

## 开始记录

![示意图](../images/diagram.svg)
```

文章地址为 `/posts/hello`。英文翻译放在 `posts/en/hello.md`，图片相对路径相应写成 `../../images/diagram.svg`。构建时图片被导出到 `/content/images/…`。

`title`、`description`、`date` 必填，日期使用 `YYYY-MM-DD`，`tags` 使用列表。`draft: true` 的文章不会进入静态产物。Markdown、公式与 `data` / `stats` / `mermaid` / `sketch` / `echarts` 语法见[写文章](docs/writing.md)。

## 部署到 Cloudflare Pages

连接**内容仓库**，配置：

| 设置 | 值 |
| --- | --- |
| Framework preset | None |
| Build command | `npx --yes @swufefox/ak-blog build --content . --out out` |
| Build output directory | `out` |
| 构建环境 Node | 20.9+，推荐 22 或更新的 LTS |
| 环境变量 | `NEXT_PUBLIC_SITE_URL=https://你的域名` |

如果仓库结构是 `content/posts/` 和 `content/images/`，将命令中的 `--content .` 改成 `--content ./content`。正式站点建议把包版本固定到已验证的版本，避免每次构建自动升级。

Pages 直接托管静态产物；不启用 Functions，不使用 Next.js 服务端适配器。目录内的 `404.html`、`_redirects`、`_headers` 分别提供缺失页、旧 `/zh` 地址跳转和静态缓存规则。其他静态主机可直接托管 HTML 文件，并按平台配置等价规则。详见[部署](docs/deploy.md)。

## 在构建脚本中引用

```sh
npm install @swufefox/ak-blog
```

```js
import { buildBlog } from '@swufefox/ak-blog/build'

await buildBlog({
  contentDir: '../my-content',
  outDir: './out',
  // configFile: './site.json',
})
```

`buildBlog` 返回 `Promise<void>`，构建失败时抛出包含源文件或路径上下文的错误。此入口仅在 Node 构建脚本中使用；它不会进入网站的浏览器 bundle。类型 `BuildBlogOptions` 和 `SiteOptions` 随包提供。

## 自定义整套模板源码

只有需要修改页面代码、Markdown 管线或模板 CSS 时，才需要创建独立源码项目：

```sh
npx @swufefox/ak-blog init my-blog
cd my-blog
npm install
npm run dev
npm run build
npm start
```

`init` 接受新的或已有空目录，不覆盖已有文件，也不自动安装依赖。名称有空格时使用引号，可用 `--name my-blog` 指定 npm 项目名。

生成的项目中，文章放在 `content/posts/`，站点覆盖配置写在 `src/site.override.json`。`npm run build` 生成 `out/`；`npm start` 只是本地静态预览，不是线上运行要求。构建前提交首次安装生成的锁文件，后续使用 `npm ci`。

## 单独引用 React 组件

已有 React 19.3+ 项目也可以只使用组件入口，保留原有路由、文章加载和静态导出配置。先在应用样式入口导入：

```tsx
import '@swufefox/ak-ui-react/style.css'
import '@swufefox/ak-blog/style.css'
```

```tsx
import { BlogHero, FeaturedPost, PostList, type PostListItem } from '@swufefox/ak-blog'

const posts: PostListItem[] = [{
  href: '/posts/hello',
  title: '我的第一篇笔记',
  description: '记录开始写作的过程。',
  date: '2026-11-14',
  dateLabel: '2026年11月14日',
  category: '随笔',
}]

export default function BlogPage() {
  const [latest, ...rest] = posts
  return (
    <main data-ak-theme="archive">
      <BlogHero eyebrow="My blog" title="Notes" description="代码、工具与日常。" />
      {latest ? <FeaturedPost {...latest} eyebrow="最近发布" readTime="2 分钟" actionLabel="阅读文章" /> : null}
      <PostList items={rest} label="更多文章" empty="暂时没有更多文章。" />
    </main>
  )
}
```

将根节点的 `data-ak-theme` 改成 `terminal` 即为深色。组件样式不附带模板的全局页面重置。组件入口不导入 Node、Next.js 或文件系统；安装包带有构建器依赖，但不会因此要求你的静态站部署 Node 服务。组件 props 与包边界见[包使用与发布](docs/package.md)。

## 开发与验证本仓库

```sh
npm ci
npm run dev
npm run lint
npm run build
npx tsc --noEmit
npm start
npm pack
npm run smoke:package
```

`npm pack` 编译组件与构建 API，并生成当前模板快照；`smoke:package` 在独立临时项目安装真实 tarball，再用外部内容仓库构建静态站，检查双语、图片、站点配置、草稿、最小内容与失败重建的文件保护。

尚未发布到 npm 时，可在仓库根目录用本地产物构建：

```sh
npm exec --package=./swufefox-ak-blog-1.0.1.tgz -- ak-blog build --content ../my-content --out ../my-content/out
```

## 首次发布与自动发布

GitHub 仓库和 npm 包是两个独立资源。首次成功的 `npm publish` 会创建 npm 包，无需先在网站创建空包：

```sh
npm login --registry=https://registry.npmjs.org
npm pack
npm publish ./swufefox-ak-blog-1.0.1.tgz --access public
```

发布目标由 `publishConfig.registry` 固定为 npm 官方 registry。发布账号需要 `@swufefox` scope 权限；登录与 2FA 在本机完成。

首次发布后，在 npm 包设置中添加 GitHub Actions Trusted Publisher：

| 设置 | 值 |
| --- | --- |
| Organization or user | `SwufeFox` |
| Repository | `ak-blog` |
| Workflow filename | `publish.yml` |
| Environment name | `npm-publish` |
| Allowed actions | 启用直接 `npm publish` |

[CI](https://github.com/SwufeFox/ak-blog/blob/main/.github/workflows/ci.yml) 在 `main` push、PR 和手动运行时检查博客与实际包消费。[Publish](https://github.com/SwufeFox/ak-blog/blob/main/.github/workflows/publish.yml) 在 `v*` 标签或手动运行时检查并发布；手动运行默认 `dry_run: true`，只生成可下载产物。

后续版本使用 `npm version patch`，再 `git push origin main --follow-tags`。标签必须与包版本一致，已发布的 npm 版本不能覆盖。首次手动发布的版本不要再次通过标签触发同版本发布。详见[包使用与发布](docs/package.md)。

## 文档与源码

| 路径 | 用途 |
| --- | --- |
| `src/build/` | 内容仓库构建 API、临时工作区与输出发布 |
| `src/app/`、`src/views/` | 静态路由入口与共享页面实现 |
| `src/site-options.ts` | 内容仓库配置类型与校验 |
| `src/ui/` | 可独立导入的 React 组件 |
| `src/lib/` | 内容加载、Markdown、i18n、URL 与媒体 |
| `src/styles/` | 组件样式与完整模板样式 |
| [写文章](docs/writing.md) | Markdown 与自定义围栏语法 |
| [配置](docs/configuration.md) | `site.json`、模板默认值和界面文案 |
| [设计系统](docs/design-system.md) | ak-ui 组件、语义令牌与版式 |
| [架构](docs/architecture.md) | 内容仓库到静态文件的数据流 |
| [部署](docs/deploy.md) | Cloudflare Pages、静态主机和路径规则 |

设计语言来自 [YunYouJun/ak-ui](https://github.com/YunYouJun/ak-ui) 与 [MooncellWiki/prts-design](https://github.com/MooncellWiki/prts-design)，React 实现来自 [SwufeFox/ak-ui-react](https://github.com/SwufeFox/ak-ui-react)。代码采用 [MIT License](LICENSE)，文章许可由站点配置决定。
