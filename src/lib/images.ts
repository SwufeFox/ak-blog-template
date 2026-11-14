import { readdir } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

export const IMAGES_DIR = resolve(process.cwd(), 'content', 'images')

export const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

/** Enumerate regular image files only; never follow links outside the content tree. */
export async function getImageParams(): Promise<{ path: string[] }[]> {
  const paths: { path: string[] }[] = []

  async function visit(segments: string[]) {
    const directory = resolve(IMAGES_DIR, ...segments)
    let entries
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch (error) {
      if (segments.length === 0 && (error as NodeJS.ErrnoException).code === 'ENOENT') return
      throw new Error(`Cannot read content images at ${directory}`, { cause: error })
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const child = [...segments, entry.name]
      if (entry.isDirectory()) await visit(child)
      else if (entry.isFile() && IMAGE_TYPES[extname(entry.name).toLowerCase()]) {
        paths.push({ path: ['images', ...child] })
      }
    }
  }

  await visit([])
  return paths
}
