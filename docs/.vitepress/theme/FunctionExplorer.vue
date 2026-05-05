<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import SidebarCategory from './SidebarCategory.vue'
import PlaygroundPanel from './PlaygroundPanel.vue'
import type { CatalogEntry } from '../../scripts/types'
import type { Category } from './composables/useCatalog'

interface Catalog {
  generatedAt: string
  version: string
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

// State
const entries = ref<CatalogEntry[]>([])
const searchTerm = ref('')
const selectedName = ref<string | null>(null)
const sidebarOpen = ref(false)

// Load catalog
onMounted(async () => {
  try {
    const data = await import('../catalog.json')
    entries.value = (data.default as Catalog).entries

    // Read URL param on load
    const params = new URLSearchParams(window.location.search)
    const fn = params.get('fn')
    if (fn && entries.value.some((e) => e.name === fn)) {
      selectedName.value = fn
    }
  } catch (e) {
    console.error('Failed to load catalog:', e)
  }
})

// Sync URL
watch(selectedName, (name) => {
  const url = new URL(window.location.href)
  if (name) {
    url.searchParams.set('fn', name)
  } else {
    url.searchParams.delete('fn')
  }
  window.history.replaceState({}, '', url.toString())
})

// Computed
const filteredEntries = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return entries.value
  return entries.value.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q),
  )
})

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

const currentEntry = computed<CatalogEntry | null>(
  () => entries.value.find((e) => e.name === selectedName.value) ?? null,
)

const matchingModules = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return null // null = show all
  return new Set(filteredEntries.value.map((e) => e.module))
})

function getFilteredEntriesForCategory(module: string): CatalogEntry[] | undefined {
  if (!matchingModules.value) return undefined
  if (!matchingModules.value.has(module)) return []
  return filteredEntries.value.filter((e) => e.module === module)
}

function handleSelect(name: string) {
  selectedName.value = name
  sidebarOpen.value = false // close drawer on mobile
}

// Keyboard: '/' focuses search
function handleKeydown(e: KeyboardEvent) {
  if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
    e.preventDefault()
    const input = document.querySelector('.sidebar-search input') as HTMLInputElement
    input?.focus()
  }
  if (e.key === 'Escape') {
    searchTerm.value = ''
    const input = document.querySelector('.sidebar-search input') as HTMLInputElement
    input?.blur()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="playground-layout">
    <!-- Hamburger button — mobile only -->
    <button
      class="sidebar-toggle"
      :aria-expanded="sidebarOpen"
      aria-label="Abrir navegación de funciones"
      aria-controls="playground-sidebar"
      @click="sidebarOpen = !sidebarOpen"
    >
      ☰
    </button>

    <!-- Sidebar -->
    <aside
      id="playground-sidebar"
      class="playground-sidebar"
      :class="{ 'sidebar-open': sidebarOpen }"
      aria-label="Navegación de funciones"
    >
      <div class="sidebar-search">
        <input
          v-model="searchTerm"
          type="search"
          placeholder="Buscar función... (/)"
          role="searchbox"
          aria-label="Buscar función"
        />
      </div>

      <SidebarCategory
        v-for="cat in categories"
        v-show="!matchingModules || matchingModules.has(cat.module)"
        :key="cat.module"
        :category="cat"
        :selected-name="selectedName"
        :visible-entries="getFilteredEntriesForCategory(cat.module)"
        @select="handleSelect"
      />
    </aside>

    <!-- Main panel -->
    <main class="playground-panel" aria-label="Detalles de la función">
      <div v-if="!currentEntry" class="playground-empty">
        Selecciona una función del panel izquierdo
      </div>
      <PlaygroundPanel v-else :entry="currentEntry" />
    </main>
  </div>
</template>
