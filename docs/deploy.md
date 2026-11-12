# 部署

产物是一个标准的 Next.js 应用。页面都在构建时生成好了，但有三处需要运行时，所以默认面向
Node 主机，而不是纯文件托管：

| 运行时依赖 | 文件 | 作用 |
| --- | --- | --- |
| 代理 | `src/proxy.ts` | 把 `/zh/…` 308 回根路径 |
| 动态 404 | `src/app/[locale]/[...rest]/page.tsx` | 未知路径返回带站点外壳的 404 |
| 图片路由 | `src/app/content/[...path]/route.ts` | 提供 `content/images/` 里的图片 |

## 构建

```sh
npm install
npm run build
npm start        # 默认 http://localhost:3000
```

Node 20.9 以上。端口用 `PORT` 环境变量改：`PORT=8080 npm start`。

站点地址在构建时写进 canonical、RSS 和 sitemap，所以**构建前**就要定下来：

```sh
NEXT_PUBLIC_SITE_URL=https://blog.example.com npm run build
```

或者直接改 `src/site.config.ts` 的 `url`。

## Vercel / Netlify

连上仓库即可，框架会自动识别。没有需要填的环境变量（除非想覆盖 `url`）。

## 自己的服务器

```sh
git clone <repo> && cd <repo>
npm ci
NEXT_PUBLIC_SITE_URL=https://blog.example.com npm run build
PORT=3000 npm start
```

前面放一层 nginx / Caddy 做 TLS 和域名即可。`next start` 不需要额外的进程管理器参数，
用 systemd、pm2 或容器都行。

## 子路径

部署在 `https://example.com/blog` 这类子路径下时，只需要把 `url` 写成带路径的地址，
页面里的绝对链接、canonical、RSS、sitemap 会跟着变。不需要 `basePath`。

如果反向代理会把前缀剥掉（例如 nginx 的 `location /blog/ { proxy_pass http://127.0.0.1:3000/; }`），
那 `url` 仍然写完整地址，路由本身看到的是剥掉前缀后的路径，两边不会打架。

## 纯静态托管

`output: 'export'` 不支持重写、重定向和代理（见 Next.js 文档的 Unsupported Features），
而本模板恰好用重写把默认语言的页面放到了根路径。所以要走纯静态，需要接受前缀或让托管方补上重写：

1. 删掉 `src/proxy.ts` 和 `src/app/[locale]/[...rest]/page.tsx`。
   前者导出模式不会执行，后者是无法预渲染的动态路由。
2. 把 `content/images/` 里的图片移到 `public/`，正文里的相对路径改成 `/images/…`，
   然后删掉 `src/app/content/[...path]/route.ts`（它同样无法预渲染）。
3. 在 `next.config.ts` 里打开 `output: 'export'`，并按托管方的习惯决定
   `trailingSlash`（`true` 产出 `out/posts/x/index.html`，`false` 产出 `out/posts/x.html`）。
4. 产物里默认语言的页面在 `/zh/…` 下，没有 `/posts/x`。要么接受这个前缀，
   要么在托管方那里补一条重写（nginx 示例）：

```nginx
location ~ ^/(posts|tags|search)/ {
  rewrite ^/(.*)$ /zh/$1 last;
}
location = /feed.xml {
  rewrite ^ /zh/feed.xml last;
}
```

`out/404.html` 是 404 页，交给托管方配置。

不追求纯文件的话，前两种部署方式（Vercel / 自建 Node）不需要做这些，也保留了
`/posts/x` 这样的干净地址。

## 上线后检查

```sh
curl -sI  https://blog.example.com/            # 200
curl -sI  https://blog.example.com/en          # 200
curl -sI  https://blog.example.com/feed.xml    # 200, application/rss+xml
curl -s   https://blog.example.com/sitemap.xml | head
curl -sI  https://blog.example.com/nope        # 404
curl -sI  https://blog.example.com/content/images/pipeline.svg   # 200
curl -sI  https://blog.example.com/og                             # 200, image/png
```

图片带 `Cache-Control: public, max-age=31536000, immutable`，RSS 是一小时。
静态页面由 Next 自己决定缓存头；放在 CDN 后面时按 HTML 的正常策略处理即可。
