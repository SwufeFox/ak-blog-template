import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { copyFile, cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateSiteOptions } from '../site-options.js'

export type { SiteOptions } from '../site-options.js'

export interface BuildBlogOptions {
  /** Content repository containing posts/, optional images/ and optional site.json. */
  contentDir: string
  /** Static destination; must be empty, absent, or owned by a previous ak-blog build. */
  outDir: string
  /** JSON site options; defaults to contentDir/site.json when present. */
  configFile?: string
}

const packageRoot = fileURLToPath(new URL('../../', import.meta.url))
const require = createRequire(join(packageRoot, 'package.json'))
const markerName = '.ak-blog-output.json'

function missing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT'
}

async function statIfPresent(path: string) {
  try {
    return await lstat(path)
  } catch (error) {
    if (missing(error)) return undefined
    throw error
  }
}

function contains(parent: string, child: string): boolean {
  const path = relative(parent, child)
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`))
}

// Resolve existing ancestors too, so an output reached through a junction cannot
// conceal that it would replace the input tree.
async function canonicalPath(path: string): Promise<string> {
  try {
    return await realpath(path)
  } catch (error) {
    if (!missing(error)) throw error
    const parent = dirname(path)
    if (parent === path) throw error
    return join(await canonicalPath(parent), basename(path))
  }
}

async function copyContent(source: string, destination: string): Promise<void> {
  const stat = await lstat(source)
  if (stat.isSymbolicLink()) throw new Error(`Content symbolic links are not supported: ${source}`)
  if (stat.isDirectory()) {
    await mkdir(destination, { recursive: true })
    for (const entry of await readdir(source)) {
      await copyContent(join(source, entry), join(destination, entry))
    }
  } else if (stat.isFile()) {
    await copyFile(source, destination)
  } else {
    throw new Error(`Content must contain only regular files and directories: ${source}`)
  }
}

async function assertOutput(outDir: string): Promise<boolean> {
  const stat = await statIfPresent(outDir)
  if (!stat) return false
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Output must be a directory, not a file or symbolic link: ${outDir}`)
  }
  const entries = await readdir(outDir)
  if (entries.length === 0) return true
  try {
    const marker = JSON.parse(await readFile(join(outDir, markerName), 'utf8'))
    if (marker.generator === '@swufefox/ak-blog' && marker.format === 1) return true
  } catch {
    // An absent or invalid marker never grants permission to replace files.
  }
  throw new Error(`Refusing to replace unrelated nonempty output: ${outDir}. Use an empty directory or a previous ak-blog output.`)
}

async function dependencyDirectory(name: string): Promise<string> {
  let entry: string
  try {
    entry = require.resolve(`${name}/package.json`)
  } catch {
    try {
      entry = fileURLToPath(import.meta.resolve(name))
    } catch {
      throw new Error(`Missing build dependency "${name}". Reinstall @swufefox/ak-blog with its dependencies before building.`)
    }
  }
  let directory = dirname(entry)
  while (true) {
    try {
      const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
      if (manifest.name === name) return directory
    } catch (error) {
      if (!missing(error)) throw error
    }
    const parent = dirname(directory)
    if (parent === directory) throw new Error(`Cannot locate installed build dependency "${name}" from ${entry}`)
    directory = parent
  }
}

async function linkDependencies(stage: string): Promise<string> {
  const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')) as { dependencies: Record<string, string> }
  let nextDirectory: string | undefined
  for (const name of Object.keys(manifest.dependencies)) {
    const source = await dependencyDirectory(name)
    const destination = join(stage, 'node_modules', name)
    await mkdir(dirname(destination), { recursive: true })
    await symlink(source, destination, process.platform === 'win32' ? 'junction' : 'dir')
    if (name === 'next') nextDirectory = source
  }
  if (!nextDirectory) throw new Error('The installed package does not declare its Next.js build dependency.')
  return join(nextDirectory, 'dist', 'bin', 'next')
}

async function runNode(script: string, args: string[], cwd: string): Promise<void> {
  const child = spawn(process.execPath, [script, ...args], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
  })
  const [code, signal] = await once(child, 'exit')
  if (code !== 0) throw new Error(`Static build failed (${signal ? `signal ${signal}` : `exit ${code}`}): ${basename(script)}`)
}

async function publish(source: string, outDir: string): Promise<void> {
  await mkdir(dirname(outDir), { recursive: true })
  const transaction = await mkdtemp(join(dirname(outDir), '.ak-blog-publish-'))
  const candidate = join(transaction, 'output')
  const backup = join(transaction, 'previous')
  let keepBackup = false
  try {
    await cp(source, candidate, { recursive: true, errorOnExist: true, force: false })
    await writeFile(join(candidate, markerName), `${JSON.stringify({ generator: '@swufefox/ak-blog', format: 1 })}\n`)
    const existed = await assertOutput(outDir)
    if (existed) await rename(outDir, backup)
    try {
      await rename(candidate, outDir)
    } catch (error) {
      if (existed) {
        try {
          await rename(backup, outDir)
        } catch (restoreError) {
          keepBackup = true
          throw new Error(`Could not publish or restore ${outDir}. Previous output is preserved at ${backup}. ${String(error)}; ${String(restoreError)}`)
        }
      }
      throw error
    }
  } finally {
    if (!keepBackup) await rm(transaction, { recursive: true, force: true })
  }
}

/** Build the shipped template with caller-owned content, without installing packages or modifying the content repository. */
export async function buildBlog(options: BuildBlogOptions): Promise<void> {
  if (!options || typeof options.contentDir !== 'string' || !options.contentDir.trim()
    || typeof options.outDir !== 'string' || !options.outDir.trim()) {
    throw new Error('buildBlog requires nonempty contentDir and outDir paths.')
  }
  if (options.configFile !== undefined && (typeof options.configFile !== 'string' || !options.configFile.trim())) {
    throw new Error('configFile must be a nonempty JSON file path.')
  }
  const input = resolve(options.contentDir)
  const inputStat = await statIfPresent(input)
  if (!inputStat?.isDirectory()) throw new Error(`Content directory does not exist or is not a directory: ${input}`)
  const contentDir = await realpath(input)
  const outDir = resolve(options.outDir)
  const outputPath = await canonicalPath(outDir)
  const postsDir = join(contentDir, 'posts')
  const imagesDir = join(contentDir, 'images')
  const configFile = options.configFile === undefined ? join(contentDir, 'site.json') : resolve(options.configFile)
  if (contains(outputPath, contentDir) || contains(postsDir, outputPath) || contains(imagesDir, outputPath)
    || contains(outputPath, await canonicalPath(configFile)) || contains(outputPath, await realpath(packageRoot))) {
    throw new Error(`Output would replace or overlap source files: ${outDir}`)
  }
  await assertOutput(outDir)
  const postsStat = await statIfPresent(postsDir)
  if (!postsStat?.isDirectory() || postsStat.isSymbolicLink()) throw new Error(`Content must have a regular posts/ directory: ${postsDir}`)
  const postEntries = await readdir(postsDir, { withFileTypes: true })
  const englishDir = join(postsDir, 'en')
  const englishStat = await statIfPresent(englishDir)
  const englishEntries = englishStat?.isDirectory() ? await readdir(englishDir, { withFileTypes: true }) : []
  if (![...postEntries, ...englishEntries].some((entry) => entry.isFile() && entry.name.endsWith('.md'))) {
    throw new Error(`No Markdown posts found in ${postsDir} or ${englishDir}`)
  }
  const imagesStat = await statIfPresent(imagesDir)
  if (imagesStat && (!imagesStat.isDirectory() || imagesStat.isSymbolicLink())) {
    throw new Error(`Content images/ must be a regular directory: ${imagesDir}`)
  }
  const configStat = await statIfPresent(configFile)
  if (options.configFile !== undefined && !configStat) throw new Error(`Configuration file does not exist: ${configFile}`)
  if (configStat && !configStat.isFile()) throw new Error(`Configuration must be a JSON file: ${configFile}`)
  let config: unknown = {}
  if (configStat) {
    try {
      config = JSON.parse(await readFile(configFile, 'utf8'))
    } catch (error) {
      throw new Error(`Cannot read JSON configuration ${configFile}: ${String(error)}`)
    }
  }
  const siteOptions = validateSiteOptions(config, configFile)
  const stage = await mkdtemp(join(tmpdir(), 'ak-blog-build-'))
  try {
    await cp(join(packageRoot, 'dist', 'template'), stage, { recursive: true })
    await rm(join(stage, 'content'), { recursive: true, force: true })
    await copyContent(postsDir, join(stage, 'content', 'posts'))
    if (imagesStat) await copyContent(imagesDir, join(stage, 'content', 'images'))
    else await mkdir(join(stage, 'content', 'images'), { recursive: true })
    await writeFile(join(stage, 'src', 'site.override.json'), `${JSON.stringify(siteOptions, null, 2)}\n`)
    const next = await linkDependencies(stage)
    await runNode(next, ['build', '--webpack'], stage)
    const output = join(stage, 'out')
    if (!(await statIfPresent(join(output, 'index.html')))?.isFile()) {
      throw new Error('Next.js did not produce out/index.html. The installed template must use static export.')
    }
    await publish(output, outDir)
  } catch (error) {
    throw new Error(`Unable to build blog from ${contentDir}: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    await rm(stage, { recursive: true, force: true })
  }
}
