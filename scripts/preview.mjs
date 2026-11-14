import { createReadStream } from 'node:fs'
import { realpath, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { pipeline } from 'node:stream/promises'

const root = await realpath(resolve(process.argv[2] ?? 'out')).catch((error) => {
  throw new Error(`Static output is unavailable. Run npm run build first. ${error.message}`)
})
const port = Number(process.env.PORT ?? 3000)
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer from 0 to 65535.')
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.pdf': 'application/pdf', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json',
}

async function file(path) {
  try {
    const resolved = await realpath(path)
    const child = relative(root, resolved)
    if (isAbsolute(child) || child === '..' || child.startsWith(`..${sep}`)) return undefined
    const info = await stat(resolved)
    return info.isFile() ? { path: resolved, size: info.size } : undefined
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) return undefined
    throw error
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' })
      response.end('Method not allowed')
      return
    }
    let pathname
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    } catch {
      response.writeHead(400)
      response.end('Invalid URL')
      return
    }
    const segments = pathname.split('/')
    const forbidden = pathname.includes('\\') || pathname.includes('\0') || segments.some((part) => part.startsWith('.'))
    let selected
    if (!forbidden) {
      const target = join(root, ...segments)
      selected = await file(target)
      if (!selected && !pathname.endsWith('/')) selected = await file(`${target}.html`)
      if (!selected) selected = await file(join(target, 'index.html'))
    }
    const status = selected ? 200 : 404
    selected ??= await file(join(root, '404.html'))
    if (!selected) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end(request.method === 'HEAD' ? undefined : 'Not found')
      return
    }
    response.writeHead(status, {
      'Content-Type': types[extname(selected.path).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': selected.size,
      'X-Content-Type-Options': 'nosniff',
    })
    if (request.method === 'HEAD') response.end()
    else await pipeline(createReadStream(selected.path), response)
  } catch (error) {
    console.error(error)
    if (!response.headersSent) response.writeHead(500)
    response.end('Static preview failed')
  }
})
server.on('error', (error) => {
  console.error(`Static preview: ${error.message}`)
  process.exitCode = 1
})
server.listen(port, process.env.HOST ?? '127.0.0.1', () => {
  const address = server.address()
  console.log(`Previewing ${root} at http://${process.env.HOST ?? '127.0.0.1'}:${address.port}`)
})
