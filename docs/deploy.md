# 部署

`@swufefox/ak-blog` 构建完整的静态站。Node 用于安装依赖、读取 Markdown 和执行构建；线上只需托管 `out/` 中的文件，不需要 Node 服务、Workers 或 Pages Functions。

## 独立内容仓库

仓库根目录包含 `posts/`、可选的 `posts/en/`、`images/` 和 `site.json`，不需要 Next.js 源码：

```sh
npx @swufefox/ak-blog build --content . --out out
```

也可以从另一个工作目录调用模板包：

```sh
npx @swufefox/ak-blog build --content ../my-content --out ./public-blog
```

`--content` 指向直接包含 `posts/` 的目录。构建器不会把模板示例文章混入内容仓库，不在输入目录安装依赖，不修改源文章。目标目录可为空或不存在；已有目标必须是本工具生成的目录。失败的重建保留上一次有效产物。

## Cloudflare Pages

连接内容仓库并选择以下设置：

| 设置 | 值 |
| --- | --- |
| Framework preset | None |
| Build command | `npx --yes @swufefox/ak-blog build --content . --out out` |
| Build output directory | `out` |
| Node 构建版本 | 20.9+，建议 22 或更新的 LTS |
| `NEXT_PUBLIC_SITE_URL` | 实际站点 origin，如 `https://blog.example.com` |

如果内容位于 `content/posts/`，使用 `--content ./content`。正式部署请固定已验证的 npm 包版本；首次安装包会下载构建依赖，构建命令本身不再运行 npm 安装。

不要选择 Next.js 服务端适配器，也不需要为本模板创建 Functions。Pages 直接提供 HTML、CSS、JS 和图片。

随产物分发的主机配置：

- `_redirects` 将旧 `/zh`、`/zh/*` 地址 308 到默认语言的根路径。
- `_headers` 配置文章图片和 feed 的静态响应头。
- `404.html` 提供默认中文站点外壳的错误页；静态主机负责返回 HTTP 404。

正文和页面的中英文地址保持 `/` 与 `/en`。这两个入口在构建时真正生成，不依赖运行时 rewrites，也不通过复制 `/zh` 产物伪装根路由。

## 自定义源码项目

使用 `ak-blog init my-blog` 或克隆模板后：

```sh
npm install
npm run build
npm start
```

`npm run build` 使用 Next.js 的静态导出，生成 `out/`。`npm start` 是本地文件预览服务器，默认 `127.0.0.1:3000`；可通过 `PORT` 和 `HOST` 修改监听地址。它读取导出的文件，对未知地址返回自定义 `404.html` 和 HTTP 404，不使用 SPA 的 200 回退。

开发界面仍可运行 `npm run dev`。部署时上传 `out/`，不是 `.next/`，也不运行 `next start`。

## 域名与路径

在 `site.json` 中写入 `url`，或者构建前设置 `NEXT_PUBLIC_SITE_URL`。环境变量优先，地址必须是无子路径的 HTTP(S) origin。修改域名后需要重新构建，因为 canonical、RSS、sitemap、Open Graph 都在构建时确定。

当前模板面向站点根路径部署，不宣称把 `url` 改成 `/blog` 就能支持子路径。若需要 `/blog`，必须同时设计构建配置、静态资源和全部路由前缀。

## 其他静态主机

静态文件采用干净 URL：`out/en.html` 对应 `/en`，`out/posts/hello.html` 对应 `/posts/hello`。主机需支持把无扩展名地址解析到相应 `.html` 文件。

nginx 示例：

```nginx
root /srv/blog/out;
index index.html;

location = /zh { return 308 /; }
location ~ ^/zh/(.*)$ { return 308 /$1; }

location / {
  try_files $uri $uri.html $uri/ =404;
}

error_page 404 /404.html;
```

Vercel、Netlify 或对象存储/CDN 也可以托管同一份静态产物；将输出目录设为 `out`，并按平台配置 clean URLs、404、重定向和缓存。Cloudflare 的 `_headers` / `_redirects` 在其他主机上不一定会被解释。

## 上线检查

检查以下地址及内容：

| 地址 | 预期 |
| --- | --- |
| `/`、`/en` | 对应语言首页，HTTP 200 |
| `/posts/<slug>`、`/en/posts/<slug>` | 真实文章和对应 canonical |
| `/tags`、`/search` | 静态页面，搜索在浏览器过滤 |
| `/feed.xml`、`/en/feed.xml` | 对应语言 RSS |
| `/sitemap.xml`、`/robots.txt` | 使用实际站点域名 |
| `/content/images/<file>` | 原始图片及正确类型 |
| `/og.png` | 1200×630 PNG 社交卡片 |
| 不存在的路径 | 自定义错误页，HTTP 404 |

再检查主题持久化、目录锚点、语言切换、图表、键盘焦点和窄屏溢出。不能用首页的 200 响应代替所有未知路径的 404。
