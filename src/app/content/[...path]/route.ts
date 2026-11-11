import { readFile, realpath } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'

const IMAGES_DIR = resolve(process.cwd(), 'content', 'images')

const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

function isWithin(root: string, target: string): boolean {
  const relativePath = relative(root, target)
  return (
    relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  )
}

/** Serves image files from `content/images/` only. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  if (path[0] !== 'images' || path.length < 2) {
    return new Response('Not found', { status: 404 })
  }

  const target = resolve(IMAGES_DIR, ...path.slice(1))
  if (!isWithin(IMAGES_DIR, target)) {
    return new Response('Not found', { status: 404 })
  }

  const contentType = IMAGE_TYPES[extname(target).toLowerCase()]
  if (!contentType) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const [imageRoot, realTarget] = await Promise.all([realpath(IMAGES_DIR), realpath(target)])
    if (!isWithin(imageRoot, realTarget)) {
      return new Response('Not found', { status: 404 })
    }

    const file = await readFile(realTarget)
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}