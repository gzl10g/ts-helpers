import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '..', '..')
const CATALOG_PATH = join(ROOT, 'docs', '.vitepress', 'catalog.json')
const SCRIPT_PATH = join(ROOT, 'docs', 'scripts', 'build-catalog.ts')

interface CatalogEntry {
  name: string
  module: string
  signature: string
  description: string
  params: unknown[]
  returns: { type: string; description: string }
  examples: string[]
  nodeOnly: boolean
}

interface Catalog {
  generatedAt: string
  version: string
  entries: CatalogEntry[]
}

let catalog: Catalog

beforeAll(() => {
  // Run via pnpm filter so tsx is resolved from docs workspace
  execSync(`pnpm --filter @gzl10/ts-helpers-docs exec tsx ${SCRIPT_PATH}`, {
    cwd: ROOT,
    stdio: 'pipe',
  })
  expect(existsSync(CATALOG_PATH)).toBe(true)
  catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8')) as Catalog
})

describe('build-catalog', () => {
  it('generates more than 100 entries', () => {
    expect(catalog.entries.length).toBeGreaterThan(100)
  })

  it('has version and generatedAt metadata', () => {
    expect(catalog.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(catalog.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('every entry has required minimal fields', () => {
    for (const entry of catalog.entries) {
      expect(typeof entry.name).toBe('string')
      expect(entry.name.length).toBeGreaterThan(0)
      expect(typeof entry.module).toBe('string')
      expect(typeof entry.nodeOnly).toBe('boolean')
    }
  })

  it('marks data/csv/json/tree entries as nodeOnly', () => {
    const nodeOnlyModules = ['data', 'csv', 'json', 'tree']
    for (const mod of nodeOnlyModules) {
      const modEntries = catalog.entries.filter((e) => e.module === mod)
      // tree may have 0 (only an interface export), so guard
      if (modEntries.length === 0) continue
      for (const e of modEntries) {
        expect(e.nodeOnly, `${e.module}.${e.name} should be nodeOnly`).toBe(true)
      }
    }
  })

  it('marks strings/validation entries as not nodeOnly', () => {
    const browserModules = ['strings', 'validation']
    for (const mod of browserModules) {
      const modEntries = catalog.entries.filter((e) => e.module === mod)
      expect(modEntries.length).toBeGreaterThan(0)
      for (const e of modEntries) {
        expect(e.nodeOnly, `${e.module}.${e.name} should NOT be nodeOnly`).toBe(false)
      }
    }
  })

  it('extracts JSDoc descriptions for well-documented functions', () => {
    const sanitize = catalog.entries.find((e) => e.name === 'sanitizeString')
    expect(sanitize).toBeDefined()
    expect(sanitize!.description.length).toBeGreaterThan(20)
    expect(sanitize!.examples.length).toBeGreaterThan(0)
  })
})
