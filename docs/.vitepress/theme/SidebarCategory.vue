<script setup lang="ts">
import { ref } from 'vue'
import type { CatalogEntry } from '../../scripts/types'

interface Category {
  module: string
  label: string
  entries: CatalogEntry[]
}

const props = defineProps<{
  category: Category
  selectedName: string | null
  visibleEntries?: CatalogEntry[] // filtered entries for this category (undefined = show all)
}>()

const emit = defineEmits<{
  select: [name: string]
}>()

const expanded = ref(true)
const categoryId = `category-${props.category.module}`
const listId = `list-${props.category.module}`

function toggle() {
  expanded.value = !expanded.value
}

function select(name: string) {
  emit('select', name)
}

// Entries to show: filtered or all
</script>

<template>
  <div class="sidebar-category">
    <button
      :aria-expanded="expanded"
      :aria-controls="listId"
      :id="categoryId"
      class="category-header"
      @click="toggle"
    >
      <span>{{ category.label }}</span>
      <span class="category-count">({{ (visibleEntries ?? category.entries).length }})</span>
    </button>

    <ul
      v-show="expanded"
      :id="listId"
      role="listbox"
      :aria-labelledby="categoryId"
      class="category-entries"
    >
      <li
        v-for="entry in (visibleEntries ?? category.entries)"
        :key="entry.name"
        v-memo="[entry.name === selectedName]"
        role="option"
        :aria-selected="entry.name === selectedName"
      >
        <button
          class="fn-entry"
          :class="{ active: entry.name === selectedName }"
          @click="select(entry.name)"
          @keydown.enter.prevent="select(entry.name)"
          @keydown.space.prevent="select(entry.name)"
        >
          <span>{{ entry.name }}</span>
          <span
            v-if="entry.nodeOnly"
            class="badge-node"
            aria-label="Solo disponible en Node.js"
          >Node</span>
        </button>
      </li>
    </ul>
  </div>
</template>
