# open-ak-blog-template

用 Next.js 与 [`@swufefox/ak-ui-react`](https://github.com/SwufeFox/ak-ui-react) 搭的博客模板。
界面以档案纸面和深色 AkHero 为焦点；分类、文章、目录与搜索结果由 ak-ui 组件承载。

- **构建时定稿**：文章、归档、RSS、sitemap 都在 `next build` 时生成，运行时只做路由。
- **两种语言**：中文在根路径（`/posts/hello`），英文加前缀（`/en/posts/hello`），同名文件互为翻译。
- **正文是 Markdown**：目录、代码高亮、公式、数据表、KPI、Mermaid、手写 SVG、ECharts。
- **深浅色**：默认使用 `archive`，可以切换至 `terminal` 并记住选择。

## 开始

```sh
npm install
npm run dev          # http://localhost:3000
npm run build        # 生产构建
npm start            # 预览构建结果
npm run lint         # ESLint
```

Node 20.9 以上。

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

## 示例

`content/posts/` 里有两篇中文示例和对应的英文版，正好覆盖了所有正文组件：
`getting-started.md` 讲元数据和代码，`figures.md` 讲图片、表格、KPI、Mermaid、示意图和 ECharts。
改它们比从零写快。

## 致谢

设计语言来自 [YunYouJun/ak-ui](https://github.com/YunYouJun/ak-ui) 与
[MooncellWiki/prts-design](https://github.com/MooncellWiki/prts-design)，React 实现是
[SwufeFox/ak-ui-react](https://github.com/SwufeFox/ak-ui-react)（MIT）。
模板本身没有附带许可证，用之前按自己的需要补一份。
