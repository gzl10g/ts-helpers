import { computed, ref } from 'vue'
import type { Catalog, CatalogEntry } from '../../../scripts/types'

export interface Category {
  module: string
  label: string
  entries: CatalogEntry[]
}

const MODULE_LABELS: Record<string, string> = {
  validation: 'Validation',
  strings: 'Strings',
  objects: 'Objects & Arrays',
  dates: 'Dates',
  math: 'Math & Finance',
  async: 'Async',
  environment: 'Environment',
  number: 'Number',
  errors: 'Errors',
  data: 'Data I/O',
  csv: 'CSV',
  json: 'JSON',
  tree: 'Tree',
  validators: 'Validators',
}

export function useCatalog() {
  const entries = ref<CatalogEntry[]>([])

  // Dynamic import avoids SSR issues in VitePress
  async function loadCatalog() {
    try {
      const data = await import('../../catalog.json')
      entries.value = (data.default as Catalog).entries
    } catch (e) {
      console.error('Failed to load catalog:', e)
    }
  }

  const categories = computed<Category[]>(() => {
    const grouped = new Map<string, CatalogEntry[]>()
    for (const entry of entries.value) {
      if (!grouped.has(entry.module)) grouped.set(entry.module, [])
      grouped.get(entry.module)!.push(entry)
    }
    return Array.from(grouped.entries()).map(([module, moduleEntries]) => ({
      module,
      label: MODULE_LABELS[module] ?? module,
      entries: moduleEntries,
    }))
  })

  return { entries, categories, loadCatalog }
}
