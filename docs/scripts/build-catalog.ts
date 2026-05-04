/**
 * Builds docs/.vitepress/catalog.json from JSDoc metadata in src/*.ts
 *
 * Strategy: regex-based parsing — robust enough for the canonical JSDoc style
 * used across the library (description + @param/@returns/@example tags).
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Catalog, CatalogEntry, CatalogParam } from './types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT = resolve(__dirname, '..', '..')
const SRC_DIR = join(ROOT, 'src')
const OUT_FILE = join(ROOT, 'docs', '.vitepress', 'catalog.json')
const PKG_FILE = join(ROOT, 'package.json')

const NODE_ONLY_MODULES = new Set(['data', 'csv', 'json', 'tree', 'validators'])
const SKIP_FILES = new Set(['index.ts', 'types.ts'])

interface ParsedJsDoc {
  description: string
  params: CatalogParam[]
  returns: { type: string; description: string }
  examples: string[]
  alias: string
}

/** Cleans a JSDoc raw block: strips leading `*` and surrounding `/** ... *\/` markers. */
function stripJsDocStars(raw: string): string {
  return raw
    .replace(/^\s*\/\*\*/, '')
    .replace(/\*\/\s*$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim()
}

/** Parses cleaned JSDoc body into structured fields. */
function parseJsDoc(body: string): ParsedJsDoc {
  const lines = body.split('\n')
  const descriptionLines: string[] = []
  const tagBlocks: { tag: string; content: string }[] = []

  let currentTag: { tag: string; content: string } | null = null
  let inDescription = true

  for (const line of lines) {
    const tagMatch = line.match(/^@(\w+)\b\s*(.*)$/)
    if (tagMatch) {
      inDescription = false
      if (currentTag) tagBlocks.push(currentTag)
      currentTag = { tag: tagMatch[1], content: tagMatch[2] }
    } else if (currentTag) {
      currentTag.content += '\n' + line
    } else if (inDescription) {
      descriptionLines.push(line)
    }
  }
  if (currentTag) tagBlocks.push(currentTag)

  const description = descriptionLines.join('\n').trim()
  const params: CatalogParam[] = []
  let returns = { type: '', description: '' }
  const examples: string[] = []

  for (const block of tagBlocks) {
    const content = block.content.trim()
    if (block.tag === 'param') {
      // @param name - desc | @param {type} name - desc | @param name desc
      const m =
        content.match(/^\{([^}]+)\}\s+(\[?\w+\]?)\s*-?\s*([\s\S]*)$/) ||
        content.match(/^(\[?\w+\]?)\s*-?\s*([\s\S]*)$/)
      if (m) {
        let name: string, type: string, desc: string
        if (m.length === 4) {
          type = m[1]
          name = m[2]
          desc = m[3]
        } else {
          name = m[1]
          type = ''
          desc = m[2]
        }
        const optional = name.startsWith('[') && name.endsWith(']')
        if (optional) name = name.slice(1, -1).split('=')[0]
        params.push({
          name: name.trim(),
          type: type.trim(),
          description: desc.trim(),
          optional,
        })
      }
    } else if (block.tag === 'returns' || block.tag === 'return') {
      const m =
        content.match(/^\{([^}]+)\}\s*([\s\S]*)$/) ||
        content.match(/^([\s\S]*)$/)
      if (m && m.length === 3) {
        returns = { type: m[1].trim(), description: m[2].trim() }
      } else if (m) {
        returns = { type: '', description: m[1].trim() }
      }
    } else if (block.tag === 'example') {
      // Strip surrounding ```typescript / ``` fences if present
      let ex = content.trim()
      ex = ex.replace(/^```(?:typescript|ts|js|javascript)?\n?/, '')
      ex = ex.replace(/\n?```$/, '')
      examples.push(ex.trim())
    }
  }

  const aliasBlock = tagBlocks.find((b) => b.tag === 'alias')
  const alias = aliasBlock ? aliasBlock.content.trim() : ''

  return { description, params, returns, examples, alias }
}

/** Extracts all (jsdoc, exportLine) pairs from a source file. */
function extractEntries(source: string, moduleName: string): CatalogEntry[] {
  const entries: CatalogEntry[] = []

  // Match: /** ... */ followed by export const|function (allowing async)
  const re =
    /\/\*\*([\s\S]*?)\*\/\s*export\s+(?:async\s+)?(?:const|function)\s+(\w+)\b([\s\S]*?)(?=\n(?:\/\*\*|export\s|function\s|const\s|let\s|var\s|class\s)|\n\}\n|$)/g

  let match: RegExpExecArray | null
  while ((match = re.exec(source)) !== null) {
    const rawJsDoc = '/**' + match[1] + '*/'
    const name = match[2]
    const declTail = match[3]

    const body = stripJsDocStars(rawJsDoc)
    const parsed = parseJsDoc(body)

    // Build a signature from the declaration tail
    const signature = extractSignature(declTail)

    const nodeOnly = NODE_ONLY_MODULES.has(moduleName)

    entries.push({
      name,
      module: moduleName,
      signature,
      description: parsed.description,
      params: parsed.params,
      returns: parsed.returns,
      examples: parsed.examples,
      nodeOnly,
      _alias: parsed.alias,
    } as CatalogEntry & { _alias: string })
  }

  // Resolve alias entries: copy params/signature/returns/examples from the aliased function
  for (const entry of entries) {
    const aliasTarget = (entry as CatalogEntry & { _alias?: string })._alias
    if (aliasTarget && !entry.params.length && !entry.signature) {
      const source = entries.find((e) => e.name === aliasTarget)
      if (source) {
        entry.params = source.params
        entry.signature = source.signature
        entry.returns = source.returns
        if (!entry.examples.length) entry.examples = source.examples
      }
    }
    delete (entry as CatalogEntry & { _alias?: string })._alias
  }

  return entries
}

/** Extracts the signature `(params): returnType` from the export declaration tail. */
function extractSignature(tail: string): string {
  // Find the first '(' and balance parens
  const startIdx = tail.indexOf('(')
  if (startIdx === -1) {
    // Possibly a const without parens (rare); return up to '='
    const eq = tail.indexOf('=')
    return eq >= 0 ? tail.slice(0, eq).trim() : tail.trim().slice(0, 120)
  }

  let depth = 0
  let i = startIdx
  for (; i < tail.length; i++) {
    const ch = tail[i]
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) {
        i++
        break
      }
    }
  }

  const params = tail.slice(startIdx, i)

  // After params, capture return type up to '=>' or '{' or '=' or end
  const rest = tail.slice(i)
  const retMatch = rest.match(/^\s*(:\s*[^={]+?)\s*(?:=>|\{|=\s*[^>])/)
  let returnType = ''
  if (retMatch) {
    returnType = retMatch[1].trim()
  }

  // Normalize whitespace
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()
  return returnType ? `${normalize(params)}${normalize(' ' + returnType)}` : normalize(params)
}

function main(): void {
  const pkg = JSON.parse(readFileSync(PKG_FILE, 'utf8'))
  const version: string = pkg.version

  const files = readdirSync(SRC_DIR)
    .filter((f) => f.endsWith('.ts'))
    .filter((f) => !SKIP_FILES.has(f))
    .filter((f) => statSync(join(SRC_DIR, f)).isFile())

  const allEntries: CatalogEntry[] = []
  const stats: Record<string, number> = {}

  for (const file of files) {
    const moduleName = file.replace(/\.ts$/, '')
    const source = readFileSync(join(SRC_DIR, file), 'utf8')
    const entries = extractEntries(source, moduleName)
    stats[moduleName] = entries.length
    allEntries.push(...entries)
  }

  const catalog: Catalog = {
    generatedAt: new Date().toISOString(),
    version,
    entries: allEntries,
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, JSON.stringify(catalog, null, 2) + '\n', 'utf8')

  console.log(`[build-catalog] wrote ${allEntries.length} entries to ${OUT_FILE}`)
  for (const [mod, count] of Object.entries(stats).sort()) {
    console.log(`  ${mod.padEnd(14)} ${count}`)
  }
}

main()
