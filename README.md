# @swufefox/ak-blog

基于 Next.js 与 [`@swufefox/ak-ui-react`](https://github.com/SwufeFox/ak-ui-react) 的双语博客模板，也是可独立引用的 React 组件包。
首页用深色站点封面与最新文章组成双栏；正文、目录、归档和搜索保持适合阅读的密度。

- **构建时定稿**：文章、归档、RSS、sitemap 都在 `next build` 时生成，运行时只做路由。
- **两种语言**：中文在根路径（`/posts/hello`），英文加前缀（`/en/posts/hello`），同名文件互为翻译。
- **正文是 Markdown**：目录、代码高亮、公式、数据表、KPI、Mermaid、手写 SVG、ECharts。
- **深浅色**：默认使用 `archive`，可以切换至 `terminal` 并记住选择。

## 先选一种用法

| 你的目标 | 用法 |
| --- | --- |
| 从零搭建博客，直接写 Markdown | 用 CLI 创建完整 Next.js 项目，见下面的“创建博客” |
| 已经有 React / Next.js 项目，只需要博客组件 | 安装后导入组件和样式，见“在现有项目中引用” |
| 修改模板本身或准备发布 npm 包 | 见“开发与本地打包” |

需要 Node.js **20.9+**。完整博客需要 Node 服务器；组件包是 ESM，支持 React 18.2 / 19 和 TypeScript。

## 创建博客

包发布到 npm 后，运行：

```sh
npx @swufefox/ak-blog my-blog
cd my-blog
npm install
npm run dev
```

打开 `http://localhost:3000` 看中文首页，`http://localhost:3000/en` 看英文首页。

初始化命令接受**新目录或已有空目录**，不会覆盖已有项目，也不会自动安装依赖。目录有空格时加引号；需要指定 npm 项目名时使用 `--name`：

```sh
npx @swufefox/ak-blog "My Blog" --name my-blog
```

生成的是包含源码、示例文章、样式和配置的**独立项目**，不再依赖 `@swufefox/ak-blog` 包。第一次 `npm install` 会生成锁文件，请提交它；后续安装可以用 `npm ci`。更新 npm 包不会自动覆盖你的博客源码。

### 配置站点

打开 `src/site.config.ts`，修改 `siteConfig` 中的字段：

| 字段 | 用途 |
| --- | --- |
| `title`、`suffix` | 页头名称与首页封面标题，例如 `my-blog`、`/ notes` |
| `description.zh`、`description.en` | 中英文站点介绍与搜索引擎摘要 |
| `author`、`email` | 作者与联系地址 |
| `about`、`repo`、`sameAs` | 关于页面、源码仓库和页脚社交链接；替换示例地址 |
| `postsOnHome` | 首页展示文章总数，包含推荐文章；`0` 表示全部 |
| `license` | 文章页展示的内容许可 |

部署前在项目根目录创建 `.env.local`，设置实际站点地址：

```dotenv
NEXT_PUBLIC_SITE_URL=https://blog.example.com
```

这个地址在构建时写入 canonical、RSS 和 sitemap。改地址后需要重新构建。

### 写第一篇文章

新建 `content/posts/hello.md`：

```markdown
---
title: 我的第一篇笔记
description: 记录开始使用这个博客的过程。
date: '2026-11-13'
category: 随笔
tags: [博客, 写作]
---

这里是正文。

## 开始记录

支持 Markdown、代码高亮、数学公式，以及图表代码块。
```

文章地址是 `/posts/hello`。英文翻译放在 `content/posts/en/hello.md`，地址是 `/en/posts/hello`；同名文件建立语言对应关系。图片放在 `content/images/`。`title`、`description`、`date` 必填；日期使用 `YYYY-MM-DD`，`tags` 使用列表；加上 `draft: true` 可在开发时预览、在生产构建时隐藏。完整语法见[写文章](docs/writing.md)。

### 构建与部署

```sh
npm run lint
npx tsc --noEmit
npm run build
npm start
```

`npm start` 默认监听 3000 端口，可通过 `PORT` 环境变量修改。支持 Vercel、Netlify 或运行 `next start` 的 Node 服务器；当前模板的语言路由、图片路由和 404 需要运行时，不能直接用 `output: 'export'` 部署到纯静态空间。详见[部署](docs/deploy.md)。

## 在现有项目中引用

发布到 npm 后，在已有 React 项目中安装包和 ak-ui：

```sh
npm install @swufefox/ak-blog @swufefox/ak-ui-react@^2
```

项目需要已安装版本匹配的 `react` / `react-dom`（18.2 或 19）。先导入 ak-ui 样式，再导入本包样式。在 Next.js App Router 中，把下面两行 CSS 导入放在根 `layout.tsx`，组件放在相应的 `page.tsx`：

```tsx
import '@swufefox/ak-ui-react/style.css'
import '@swufefox/ak-blog/style.css'
```

```tsx
import { BlogHero, FeaturedPost, PostList, type PostListItem } from '@swufefox/ak-blog'

const posts: PostListItem[] = [
  {
    href: '/posts/hello',
    title: '我的第一篇笔记',
    description: '记录开始写作的过程。',
    date: '2026-11-13',
    dateLabel: '2026年11月13日',
    category: '随笔',
  },
]

export default function BlogPage() {
  const [latest, ...rest] = posts
  return (
    <main data-ak-theme="archive">
      <BlogHero eyebrow="My blog" title="Notes" description="代码、工具与日常。" />
      {latest ? (
        <FeaturedPost
          {...latest}
          eyebrow="最近发布"
          readTime="2 分钟"
          actionLabel="阅读文章"
        />
      ) : null}
      <PostList items={rest} label="更多文章" empty="暂时没有更多文章。" />
    </main>
  )
}
```

| 导出 | 必填 props | 可选 props |
| --- | --- | --- |
| `BlogHero` | `title`、`description` | `eyebrow`、`titleAs`（默认 `h1`）、`className` |
| `FeaturedPost` | `href`、`title`、`description`、`date`、`dateLabel`、`readTime`、`eyebrow`、`actionLabel` | `category`、`className` |
| `PostList` | `items`、`label`、`empty` | `className` |

`PostListItem` 包含 `href`、`title`、`description`、`date`、`dateLabel` 和可选的 `category`。包也导出三个组件对应的 `*Props` 类型。`date` 是机器可读日期，`dateLabel` 是你格式化好的显示日期，阅读时间与所有界面文案也由调用方提供。

将根节点的 `data-ak-theme` 改成 `terminal` 即为深色。样式只作用于组件，不附带模板的全局重置或页面布局；双栏等布局由宿主项目决定。组件可服务端渲染，使用普通链接；它们不会读取 Markdown、创建路由或自动计算阅读时间，也不包含搜索和主题切换逻辑。需要这些完整功能时，使用上面的 CLI 创建博客。更多说明见[包使用与发布](docs/package.md)。

## 开发与本地打包

下面命令用于本仓库，不是生成后的博客项目：

```sh
npm ci
npm run dev
npm run lint
npx tsc --noEmit
npm run build        # 构建演示博客
npm start           # 预览演示博客
npm pack            # 编译组件、生成模板快照并打包
```

`npm pack` 生成 `swufefox-ak-blog-1.0.0.tgz`。**尚未发布到 npm 时**，在本仓库直接用本地包创建博客：

```sh
npm exec --package=./swufefox-ak-blog-1.0.0.tgz -- ak-blog ../my-blog
```

也可以在外部 React 项目安装该文件：

```sh
npm install /path/to/swufefox-ak-blog-1.0.0.tgz
```

打包不会发布到 npm。GitHub 仓库存在也不代表 npm 包已经创建；第一次成功的 `npm publish` 会创建 `@swufefox/ak-blog`。

## 首次发布与自动发布

首次发布需要一个有 `@swufefox` scope 发布权限的 npm 账号。在本仓库执行：

```sh
npm login --registry=https://registry.npmjs.org
npm pack
npm publish ./swufefox-ak-blog-1.0.0.tgz --access public
```

登录、2FA 与账号选择在本机完成。发布目标由 `publishConfig.registry` 固定为 npm 官方 registry，不受本机安装镜像设置影响。

首次发布成功后，在 npm 的 `@swufefox/ak-blog` 包设置中添加 **GitHub Actions Trusted Publisher**：

| 设置 | 值 |
| --- | --- |
| Organization or user | `SwufeFox` |
| Repository | `ak-blog` |
| Workflow filename | `publish.yml` |
| Environment name | `npm-publish` |
| Allowed actions | 启用直接发布 `npm publish` |

GitHub 仓库中使用同名 `npm-publish` environment。后续 workflow 通过 OIDC 发布，无需保存长期 `NPM_TOKEN`。

| Workflow | 触发方式 | 行为 |
| --- | --- | --- |
| [CI](https://github.com/SwufeFox/ak-blog/blob/main/.github/workflows/ci.yml) | `main` push、PR、手动运行 | lint、博客构建、类型检查、打包并上传 `.tgz` |
| [Publish](https://github.com/SwufeFox/ak-blog/blob/main/.github/workflows/publish.yml) | `v*` tag、手动运行 | 同样检查并打包，校验 tag 与包版本一致，然后发布 |

手动运行 **Publish** 默认勾选 `dry_run`，只检查、打包和上传产物；取消勾选才会发布。正式发布后续版本时：

```sh
npm version patch
git push origin main --follow-tags
```

例如首次手动发布 `1.0.0` 后，下一次 patch 会生成 `v1.0.1`。不要再推送 `v1.0.0` 触发同一版本发布，npm 不允许覆盖已经发布的版本。配置与故障排查见[包使用与发布](docs/package.md)。

## 目录

```
content/posts/            文章，文件名就是 slug
content/posts/en/         同一篇文章的英文版
content/images/           正文里的图片
public/                   原样发布的静态文件
src/site.config.ts        站点身份、语言、导航
src/lib/markdown.ts       Markdown 管线：插件与自定义代码块
src/lib/posts.ts          读取、校验并按语言切分文章
src/app/[locale]/         页面：首页、文章、归档、搜索、404、RSS
src/components/           页头、页脚、文章列表、目录、搜索框、图表运行时
src/ui/                   可独立引用的封面、推荐文章和文章列表
src/styles/components.css 随 npm 包发布的组件样式
src/styles/globals.css    ak-ui 主题覆盖与全站样式
```

## 文档

| 文档 | 内容 |
| --- | --- |
| [写文章](docs/writing.md) | 元数据、代码、公式、图片，以及 `data` / `stats` / `mermaid` / `sketch` / `echarts` 的写法 |
| [配置与主题](docs/configuration.md) | `site.config.ts` 每个字段、界面文案、增加语言、换配色 |
| [设计系统](docs/design-system.md) | 用到的 ak-ui 组件、官方参考、三条约定、取舍记录 |
| [它是怎么工作的](docs/architecture.md) | 渲染管线、路由表、ak-ui 的客户端边界、搜索与 i18n 的实现 |
| [部署](docs/deploy.md) | Vercel / 自建服务器、子路径、纯静态托管的取舍 |
| [包使用与发布](docs/package.md) | React 导入、CLI 创建博客、本地 tarball 验证与 npm 发布 |

## 示例

`content/posts/` 里有两篇中文示例和对应的英文版，正好覆盖了所有正文组件：
`getting-started.md` 讲元数据和代码，`figures.md` 讲图片、表格、KPI、Mermaid、示意图和 ECharts。
改它们比从零写快。

## 致谢

设计语言来自 [YunYouJun/ak-ui](https://github.com/YunYouJun/ak-ui) 与
[MooncellWiki/prts-design](https://github.com/MooncellWiki/prts-design)，React 实现是
[SwufeFox/ak-ui-react](https://github.com/SwufeFox/ak-ui-react)（MIT）。
模板以 [MIT License](LICENSE) 发布。
