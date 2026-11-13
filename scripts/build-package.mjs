import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
const dist = join(root, 'dist')
const template = join(dist, 'template')
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

// These are application runtime dependencies; the published UI has only peers.
const runtimeDependencies = [
  '@swufefox/ak-ui-react',
  'echarts',
  'gray-matter',
  'image-size',
  'katex',
  'mermaid',
  'next',
  'react',
  'react-dom',
  'rehype-autolink-headings',
  'rehype-pretty-code',
  'rehype-raw',
  'rehype-slug',
  'rehype-stringify',
  'remark-gfm',
  'remark-math',
  'remark-parse',
  'remark-rehype',
  'unified',
  'unist-util-visit',
]
const developmentDependencies = [
  '@types/hast',
  '@types/mdast',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  'eslint',
  'eslint-config-next',
  'typescript',
]

function selectDependencies(names) {
  return Object.fromEntries(names.map((name) => {
    const version = manifest.devDependencies[name]
    if (!version) throw new Error(`Missing template dependency: ${name}`)
    return [name, version]
  }))
}

// Only the directories and root files below enter the snapshot. Never follow
// symlinks or include dotfiles, credentials, caches or nested build output.
const excludedDirectories = new Set(['node_modules', 'dist', 'build', 'out', 'coverage', 'cache'])
function excluded(name) {
  return name.startsWith('.') || excludedDirectories.has(name)
    || /^(?:secrets?|credentials?)(?:[._-]|$)/i.test(name)
    || /\.(?:pem|key|p12|pfx|jks|keystore|tsbuildinfo|log|tgz)$/i.test(name)
}

async function copyTree(source, destination) {
  await mkdir(destination, { recursive: true })
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (excluded(entry.name) || entry.isSymbolicLink()) continue
    const from = join(source, entry.name)
    const to = join(destination, entry.name)
    if (entry.isDirectory()) await copyTree(from, to)
    else if (entry.isFile()) await copyFile(from, to)
  }
}

await rm(dist, { recursive: true, force: true })
const compiler = spawnSync(process.execPath, [
  join(root, 'node_modules/typescript/bin/tsc'),
  '--project', join(root, 'tsconfig.package.json'),
], { cwd: root, stdio: 'inherit' })
if (compiler.error) throw compiler.error
if (compiler.status !== 0) process.exit(compiler.status ?? 1)

await copyFile(join(root, 'src/styles/components.css'), join(dist, 'style.css'))
await mkdir(template, { recursive: true })
for (const directory of ['src', 'content', 'public']) {
  await copyTree(join(root, directory), join(template, directory))
}
await mkdir(join(template, 'docs'), { recursive: true })
for (const entry of await readdir(join(root, 'docs'), { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.md')) {
    await copyFile(join(root, 'docs', entry.name), join(template, 'docs', entry.name))
  }
}
for (const file of ['next.config.ts', 'tsconfig.json', 'eslint.config.mjs', 'LICENSE']) {
  await copyFile(join(root, file), join(template, basename(file)))
}
await writeFile(join(template, 'README.md'), `# My ak-blog

由 @swufefox/ak-blog 创建的独立双语博客。需要 Node.js 20.9 以上。

## 开始

\`\`\`sh
npm install
npm run dev
\`\`\`

修改 \`src/site.config.ts\` 配置站点，在 \`content/posts/\` 写中文文章，在 \`content/posts/en/\` 写英文翻译。第一次安装后提交生成的 \`package-lock.json\`，后续可使用 \`npm ci\`。

## 检查与部署

\`\`\`sh
npm run lint
npx tsc --noEmit
npm run build
npm start
\`\`\`

生产构建前设置 \`NEXT_PUBLIC_SITE_URL\`。部署需要 Node 服务器。

- [写文章](docs/writing.md)
- [配置与主题](docs/configuration.md)
- [设计系统](docs/design-system.md)
- [架构](docs/architecture.md)
- [部署](docs/deploy.md)
- [原始 npm 包与维护说明](docs/package.md)

此项目使用复制的组件源码，不依赖 @swufefox/ak-blog 的运行时或发布脚本。包维护文档中的打包命令适用于原始包仓库。

代码采用 [MIT License](LICENSE)，文章许可由站点配置决定。
`)
// npm excludes .gitignore from tarballs; the CLI restores its real filename.
await copyFile(join(root, '.gitignore'), join(template, 'gitignore'))
await writeFile(join(template, 'package.json'), `${JSON.stringify({
  name: manifest.name,
  version: manifest.version,
  private: true,
  type: 'module',
  description: manifest.description,
  license: manifest.license,
  engines: manifest.engines,
  scripts: Object.fromEntries(['dev', 'build', 'start', 'lint'].map((name) => [name, manifest.scripts[name]])),
  dependencies: selectDependencies(runtimeDependencies),
  devDependencies: selectDependencies(developmentDependencies),
}, null, 2)}\n`)
console.log('Built dist/ui, dist/style.css and the current-source app snapshot in dist/template.')
