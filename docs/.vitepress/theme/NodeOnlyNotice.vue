<script setup lang="ts">
import type { CatalogEntry } from '../../scripts/types'

defineProps<{
  entry: CatalogEntry
}>()
</script>

<template>
  <div>
    <div class="badge-node-only" role="note" aria-label="Esta función solo está disponible en Node.js">
      ⚠️ <strong>Node.js only</strong> — Esta función usa APIs de Node.js y no está disponible en el browser.
    </div>

    <div v-if="entry.examples.length" class="examples-section">
      <div class="repl-title">Ejemplos</div>
      <pre v-for="(ex, i) in entry.examples" :key="i" class="example-block">{{ ex }}</pre>
    </div>
  </div>
</template>
