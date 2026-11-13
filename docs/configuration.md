# 配置与主题

站点的身份、语言和导航都在 `src/site.config.ts`；界面文案在 `src/lib/i18n.ts`；配色在
`src/styles/globals.css`。除此之外的地方一般不需要为了「换个站名」去改。

## `src/site.config.ts`

| 字段 | 说明 |
| --- | --- |
| `title` | 站点名，页头和 `<title>` 都用它 |
| `suffix` | 跟在站名后面的小字，如 `/ notes`；`title + suffix` 组成页面标题 |
| `description` | 每个语言一句：首页主标题、meta description、RSS 描述 |
| `url` | 部署后的绝对地址（不带结尾斜杠），用于 canonical、RSS、sitemap、JSON-LD |
| `author` | 作者名，页脚与结构化数据 |
| `email` | 页脚邮箱，可省略 |
| `about` | 外部的「关于」页，页头导航的「关于 ↗」指向它 |
| `repo` | 仓库地址，可省略 |
| `sameAs` | 页脚里的个人主页列表，也喂给 JSON-LD |
| `defaultLocale` | 默认语言；它的页面在根路径，不需要前缀 |
| `locales` | 站点发布的语言列表，顺序决定语言切换链接 |
| `localeNames` | 语言切换链接上显示的名字，如 `中文` / `English` |
| `nav` | 每种语言的导航文案（归档、搜索、关于） |
| `postsOnHome` | 首页最多显示几篇，`0` 表示全部 |
| `license` | 文章页「附记」里的许可协议名称与链接 |

`url` 也可以用环境变量覆盖，部署时不用改代码：

```sh
NEXT_PUBLIC_SITE_URL=https://blog.example.com npm run build
```

`locales` 的类型会从数组推导出 `Locale`，漏写任何一处文案都是类型错误，而不是英文漏到中文页面上。

## 增加一门语言

以日语为例，四处改动：

1. `src/site.config.ts`：`export const locales = ['zh', 'en', 'ja']`，再补上
   `description.ja`、`localeNames.ja`、`nav.ja`。
2. `src/lib/i18n.ts`：加一个 `ja` 条目，把 `UiStrings` 里每个字段写全。
3. `content/posts/ja/`：放日文文章，文件名要和中文版一致才算互为翻译。
4. 完成。`/ja/…` 的页面、`/ja/feed.xml`、sitemap 与 hreflang 都会自动出现。

`src/app/[locale]/layout.tsx` 用 `lang` 属性输出语言代码（`zh` 会写成 `zh-CN`），
需要别的写法时改那里。

页头的语言链接显示的是列表里的**下一个**语言（`otherLocale()` 循环取值）。两种语言时正好是
另一个语言；三种以上时想换成下拉菜单，改 `src/components/site-nav.tsx`。

## 界面文案

`src/lib/i18n.ts` 里的 `strings` 是一个 `Record<Locale, UiStrings>`：每种语言一份，字段
由 `src/site.config.ts` 的 `UiStrings` 接口约束。分成几类：

- 导航与通用：`home`、`navMenu`、`close`、`switchLanguage`、`skip`、`themeToggle`
- 文章页：`allPosts`、`published`、`readingTime`、`readMinutes`、`updated`、`toc`、`colophon`、`licenseText`、`source`、
  `previous`、`next`、`backToTop`、`copyCode`、`copied`
- 首页、列表与归档：`latestEntry`、`readArticle`、`moreEntries`、`postsCount`、`tagsCount`、`postsLabel`、`categoriesLabel`、`tagsLabel`、`typeLabel`、`termLabel`、`empty`
- 搜索：`searchLabel`、`searchPlaceholder`、`searchFoundOne`、`searchFoundMany`、`searchNone`、`searchClear`、`searchHint`
- 404：`notFoundTitle`、`notFoundText`、`notFoundAction`

带参数的字段写成函数（`readMinutes: (n) => \`${n} 分钟\``）。搜索结果的计数是个例外：
它要在客户端格式化，所以拆成了单数 / 复数两条字符串，用 `{count}` 占位。

## 主题

ak-ui 2.0 提供随主题切换的语义令牌；`src/styles/globals.css` 将它们映射到本站的 `--site-*` 变量。页面外壳、图表和控件共用同一套动态令牌，不再维护第二份颜色表。

| 用途 | 本站变量 | ak-ui 变量 |
| --- | --- | --- |
| 页面背景 | `--site-canvas` | `--ak-surface-canvas` |
| 页框与正文底面 | `--site-paper` | `--ak-surface-sunken` |
| 安静面板 | `--site-wash` | `--ak-surface-sunken-2` |
| 正文与次要文字 | `--site-ink` / `--site-body` / `--site-muted` | `--ak-text-primary` / `--ak-text-secondary` |
| 分隔线 | `--site-line` / `--site-bar` | `--ak-border` / `--ak-border-strong` |
| 信号 | `--site-info` / `--site-action` / `--site-success` / `--site-accent` / `--site-danger` | 对应的 `--ak-signal-*` |
| 字体 | `--site-display` / `--site-sans` / `--site-label` / `--site-mono` | `--ak-font-display` / `--ak-font-sans` / `--ak-font-label` / `--ak-font-mono` |
| 图示 | `--site-diagram-*` | 信息、成功、强调、动作、危险信号令牌 |

修改站点配色时调整 `--site-*` 映射或相应的 ak-ui 语义令牌；保留颜色角色，不要把危险、成功、警告和信息信号互换。`globals.css` 中每个 `var(--ak-*)` 都带后备值。

### 深浅色怎么工作

- `<html data-ak-theme="archive|terminal">` 是唯一开关。`archive` 是浅色默认主题，`terminal` 是可选深色主题。
- `src/app/[locale]/layout.tsx` 在绘制前读取 `localStorage['ak-theme']`；没有保存选择时始终使用 `archive`，不跟随操作系统主题。
- 页头按钮（`src/components/theme-toggle.tsx`）切换属性并持久化选择；ak-ui 与本站令牌据此同步切换。
- 主题色常量集中在 `src/lib/theme.ts`；绘制前的脚本和切换按钮同时更新 `<meta name="theme-color">`（`archive` `#eef0f1`，`terminal` `#111315`），移动端浏览器栏跟随主题。
- `globals.css` 不再按 `prefers-color-scheme` 覆盖颜色，避免浏览器偏好越过站点默认值。

## 页头与页脚

- 页头：站名 + `suffix`、导航（归档 / 搜索 / 关于）、语言切换与 `AkButton` 主题开关。窄屏时导航收进 `AkMobileMenu`。
- 页脚：`AkCodeId` 站点标记、版权、`sameAs` 社交主页、邮箱与 RSS。

导航的目标在 `src/lib/urls.ts` 里统一生成（`homePath`、`postPath`、`tagPath`、`tagsPath`、
`searchPath`、`feedPath`），新增页面时先在那里加一个函数，再在页头 / 页脚引用。
