<script setup lang="ts">
import FunctionDocs from './FunctionDocs.vue'
import NodeOnlyNotice from './NodeOnlyNotice.vue'
import ReplPanel from './ReplPanel.vue'
import type { CatalogEntry } from '../../scripts/types'

defineProps<{
  entry: CatalogEntry
}>()
</script>

<template>
  <div>
    <FunctionDocs :entry="entry" />

    <NodeOnlyNotice v-if="entry.nodeOnly" :entry="entry" />

    <!-- :key="entry.name" → reset automático de ReplPanel sin watchers -->
    <ReplPanel v-else :key="entry.name" :entry="entry" />
  </div>
</template>
