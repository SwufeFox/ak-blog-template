#!/usr/bin/env node
import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { builtinModules } from 'node:module'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
const help = `ak-blog ${manifest.version}

Usage:
  ak-blog build --content <directory> --out <directory> [--config <file>]
  ak-blog init <directory> [--name <npm-project-name>]

build  Export the bundled blog with posts/, optional images/ and site.json from
       a content repository. No Next.js source, install or network is required.
       Output must be empty, absent, or a previous ak-blog build.
init   Copy the full editable template into a new or existing empty directory.

Quote paths containing spaces. Relative paths resolve from the current directory.
--config overrides the default <content>/site.json file.
--name sets the initializer's npm project name (scoped names are supported).
-h, --help shows help; -v, --version prints the package version.

After init, run npm install, then npm run dev in the project directory.
Production: npm run build exports out/; npm start previews those static files.
`

function validProjectName(name) {
  if (name.length > 214) return false
  const parts = name.startsWith('@') ? name.slice(1).split('/') : [name]
  if (parts.length !== (name.startsWith('@') ? 2 : 1)) return false
  return parts.every((part) => /^[a-z0-9-][a-z0-9._-]*$/.test(part)
    && !['node_modules', 'favicon.ico'].includes(part)
    && !builtinModules.includes(part))
}

async function copyTemplate(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name === 'package.json' && source === template) continue
    const from = join(source, entry.name)
    const to = join(destination, entry.name === 'gitignore' && source === template ? '.gitignore' : entry.name)
    if (entry.isDirectory()) {
      await mkdir(to)
      await copyTemplate(from, to)
    } else if (entry.isFile()) {
      await copyFile(from, to, constants.COPYFILE_EXCL)
    } else {
      throw new Error(`Unsupported template entry: ${from}`)
    }
  }
}

const template = join(packageRoot, 'dist/template')

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || (args.length === 1 && ['--help', '-h'].includes(args[0]))) {
    console.log(help)
    return
  }
  if (args.length === 1 && ['--version', '-v'].includes(args[0])) {
    console.log(manifest.version)
    return
  }
  const command = args.shift()
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log(help)
    return
  }
  if (command === 'build') {
    const values = {}
    for (let index = 0; index < args.length; index++) {
      const argument = args[index]
      const equals = argument.indexOf('=')
      const flag = equals === -1 ? argument : argument.slice(0, equals)
      if (!['--content', '--out', '--config'].includes(flag)) throw new Error(`Unknown build argument: ${argument}`)
      if (values[flag] !== undefined) throw new Error(`Specify ${flag} only once.`)
      const value = equals === -1 ? args[++index] : argument.slice(equals + 1)
      if (!value || value.startsWith('--')) throw new Error(`${flag} requires a path.`)
      values[flag] = value
    }
    if (!values['--content'] || !values['--out']) throw new Error('build requires --content and --out. Run ak-blog --help for usage.')
    const { buildBlog } = await import('../dist/build/index.js')
    await buildBlog({ contentDir: values['--content'], outDir: values['--out'], configFile: values['--config'] })
    console.log(`Built static blog in ${resolve(values['--out'])}`)
    return
  }
  if (command !== 'init') throw new Error(`Unknown command: ${command}. Use ak-blog build or ak-blog init; run ak-blog --help for usage.`)

  let targetArgument
  let projectName
  for (let index = 0; index < args.length; index++) {
    const argument = args[index]
    if (argument === '--name') {
      if (projectName !== undefined || !args[index + 1] || args[index + 1].startsWith('-')) {
        throw new Error('--name requires one npm project name.')
      }
      projectName = args[++index]
    } else if (argument.startsWith('--name=')) {
      if (projectName !== undefined) throw new Error('Specify --name only once.')
      projectName = argument.slice('--name='.length)
    } else if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}. Run ak-blog --help for usage.`)
    } else if (targetArgument !== undefined) {
      throw new Error('Specify exactly one target directory; quote paths that contain spaces.')
    } else {
      targetArgument = argument
    }
  }
  if (!targetArgument) throw new Error('A target directory is required.')

  const target = resolve(targetArgument)
  projectName ??= basename(target).toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+/, '')
    .slice(0, 214)
  if (!validProjectName(projectName)) {
    throw new Error('Invalid npm project name. Supply --name with a lowercase name such as my-blog.')
  }

  let targetStat
  try {
    targetStat = await lstat(target)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  if (targetStat && (!targetStat.isDirectory() || targetStat.isSymbolicLink())) {
    throw new Error('The target must be a directory, not a file or symbolic link.')
  }
  if (targetStat && (await readdir(target)).length !== 0) {
    throw new Error(`Target directory is not empty: ${target}`)
  }

  const appManifest = JSON.parse(await readFile(join(template, 'package.json'), 'utf8'))
  appManifest.name = projectName
  await mkdir(target, { recursive: true })
  await writeFile(join(target, 'package.json'), `${JSON.stringify(appManifest, null, 2)}\n`, { flag: 'wx' })
  await copyTemplate(template, target)
  console.log(`Created ${projectName} in ${target}\n\nInside that directory, run:\n  npm install\n  npm run dev\n\nFor production: npm run build, then npm start.`)
}

main().catch((error) => {
  console.error(`ak-blog: ${error.message}`)
  process.exitCode = 1
})
