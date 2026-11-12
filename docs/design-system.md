# 设计系统

模板使用 `@swufefox/ak-ui-react` 2.0。组件 props 与行为以[官方 API 文档](https://github.com/SwufeFox/ak-ui-react/blob/master/docs/api.md)为准；设计约定见 [`llms.txt`](https://ak-ui-react.swufefox.com/llms.txt)。

## 模板用到的组件

| 组件 | 用途 |
| --- | --- |
| `AkCut` | 页头品牌标记 |
| `AkButton` | 主题切换 |
| `AkHero` | 首页主横幅 |
| `AkHeading` / `AkDivider` | 页面标题、栏目层级与分隔 |
| `AkTag` / `AkTagGroup` | 分类标签 |
| `AkNewsList` | 首页、搜索与标签文章列表 |
| `AkTable` | 归档页的类型 / 名称 / 文章索引 |
| `AkPanel` / `AkCollapseItem` | 桌面目录面板与移动端折叠目录 |
| `AkNotice` | 文章许可信息 |
| `AkBreadcrumb` | 文章页位置导航 |
| `AkCodeId` / `AkWatermark` | 页脚站点标记与 404 水印 |
| `AkStripes` | 404 顶部的危险条纹 |
| `AkGridBackdrop` | 页面背景纹理 |
| `AkMobileMenu` | 窄屏导航和焦点管理 |
| `AkSearch` | 搜索输入框；结果仍由模板即时过滤 |
| `AkBackTop` | 文章页回到顶部 |

## 强度

模板按 ak-ui 的 `accent` 档使用：保留博客的阅读布局，只借用它的排版层级、信号色、紧凑元数据和一处克制的切角反馈。没有引入粒子、深度、加载屏或假遥测——博客首先是读物，不是游戏 HUD。结构用墨色，动作黄只表示状态与反馈，危险红只出现在 404。

## 使用约定

1. 在 `src/app/[locale]/layout.tsx` 导入一次 `@swufefox/ak-ui-react/style.css`。组件入口可直接从服务端页面导入；Next.js 会为交互组件建立客户端边界并生成首屏 HTML。
2. 颜色沿用 `--ak-*` 语义令牌，并通过 `--site-*` 映射给站点样式。每个 `var(--ak-*)` 保留后备值；信息、动作、成功、强调和危险颜色各自承担对应含义。结构用墨色：栏目标题竖条、分隔线、外框角标、分类方块都用 `--site-ink`；动作黄只留给状态与反馈——导航当前页、主题开关悬停、标签信号、搜索命中、阅读进度、目录当前项。404 用危险红和 `AkStripes` 的危险条纹。
3. 标题使用 `--ak-font-display`（Oswald 等表单字体），正文与控件使用 `--ak-font-sans`，导航、标签与计数使用 `--ak-font-label`，日期、代码和对齐读数使用 `--ak-font-mono`。不把所有文本都设为等宽或全大写。
4. 标签、编号和状态必须传达真实内容。导航与主要操作保留至少 44px 高的目标区域；窄屏重新排版，不缩小桌面布局。

## 主题

`<html data-ak-theme="archive">` 是默认浅色档案主题；页头开关可切换到深色 `terminal`。首次访问固定使用 `archive`，保存的选择通过 `localStorage['ak-theme']` 在绘制前恢复。两套主题都由 ak-ui 公开令牌驱动，站点表面、信号色和图示随之切换。

开关是 `AkButton` 的 ghost + chamfer 形态：透明底、1px 边、右上角切角，用 `LIGHT` / `DARK` 单行列标出当前主题；悬停只换动作黄描边和淡底，不位移、不加外发光。窄屏隐藏文字，只留图标。两个图标和两段文字都渲染在 HTML 里，由 `[data-ak-theme]` 控制显示，因此预绘制脚本切换主题时不会先闪出错误的一侧。

## 版式选择

- 首页用 `AkHero` 建立唯一的深色焦点；分类是紧凑筛选条（标签 + 计数），不再使用栏目大标题，最新文章保留唯一的主标题。文章条目由 `AkNewsList` 承载，保留标题、摘要、分类和日期。
- 中文栏目标题用 `AkHeading` 的 `en` + `stack` 叠一行拉丁小标（`LATEST`、`ARCHIVE`、`TAGS`、`SEARCH`，见 `src/lib/kickers.ts`），英文页面不重复；栏目标题左侧竖条和分隔线使用墨色，动作黄只留给交互状态。
- 站体外框是平直纸面，不加悬浮投影；左上、右下用 2px 墨色角标代替阴影。
- Hero 的右下角用 `--ak-cut-lg` 切一刀，作为整页唯一的几何切口；按钮、标签的切角与它呼应。切口不承载交互，只是面板形状。
- 文章目录是平直侧栏：去掉面板底色和边框，只留左侧墨色条与当前项的动作黄标记；正文才是文章页的视觉重心。
- 404 是唯一使用危险信号的页面：顶部一条 `AkStripes` 黄黑条纹，`ERR / 404` 与描边水印用危险红，返回按钮仍是普通墨色动作。
- 社交卡片沿用 Hero 的黑底、黄块和大字 `NOTES`，固定 1200×630；`ImageResponse` 默认字体只覆盖拉丁字符，所以卡片不排中文，中文留给页面与 metadata description。
- 归档页使用 `AkTable`：类型 / 名称 / 文章三列，等宽数字右对齐，表头用墨色下划线；首页与搜索结果仍用 `AkNewsList`，因为它们承载标题、摘要和日期，而不是词条索引。
- 文章页使用 `AkBreadcrumb` 和 `AkHeading` 定位文章；桌面目录是 `AkPanel` 结构但视觉上不加底色/边框，移动目录使用原生语义的 `AkCollapseItem`。目录随滚动计算当前小节并标成动作黄竖线；顶部另有一条 3px 阅读进度条。
- Hero 的中文说明是 18px/500 的辅助文本，不再用标题字号；文章正文第一个 `p` 作为导语放大到 18px/1.9，后面的正文回到 16px。
- 次要链接（页脚、目录、清除搜索）保留 24px 最小命中区；主题开关、主导航、菜单关闭保持 44px。
- 标题使用 `--ak-font-display`（宿主品牌映射），不使用 `--ak-font-command` 的中文衬线：模板不随包分发中文字体，避免依赖系统宋体。组件语义与 token 角色不变。
- 正文保留适合阅读的行宽与现有 Markdown 组件；颜色重点集中在导航、可操作信息和真实状态。
