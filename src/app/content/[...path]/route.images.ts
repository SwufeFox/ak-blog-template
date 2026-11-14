import { readFile, realpath } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'

import { getImageParams, IMAGE_TYPES, IMAGES_DIR } from '@/lib/images'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getImageParams()
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

/** Emits image files at build time, retaining their original public paths. */
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