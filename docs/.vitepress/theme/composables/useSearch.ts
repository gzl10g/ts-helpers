import { computed, ref } from 'vue'
import { useDebounce } from '@vueuse/core'
import type { CatalogEntry } from '../../../scripts/types'

export function useSearch(entries: { value: CatalogEntry[] }) {
  const searchTerm = ref('')
  const debouncedSearch = useDebounce(searchTerm, 150)

  const filteredEntries = computed(() => {
    const q = debouncedSearch.value.trim().toLowerCase()
    if (!q) return entries.value
    return entries.value.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
    )
  })

  const matchingModules = computed(() => {
    const modules = new Set(filteredEntries.value.map((e) => e.module))
    return modules
  })

  return { searchTerm, filteredEntries, matchingModules }
}
