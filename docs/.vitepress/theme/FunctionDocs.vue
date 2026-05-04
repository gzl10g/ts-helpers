<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CatalogEntry } from '../../scripts/types'

const props = defineProps<{
  entry: CatalogEntry
}>()

const copied = ref(false)

watch(() => props.entry.name, () => {
  copied.value = false
})

async function copyImport() {
  const text = `import { ${props.entry.name} } from '@gzl10/ts-helpers/${props.entry.module}'`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback: clipboard not available
  }
}
</script>

<template>
  <div>
    <div class="fn-signature">
      <span class="fn-name">{{ entry.name }}</span>{{ entry.signature }}
    </div>
    <p v-if="entry.description" class="fn-description">{{ entry.description }}</p>

    <!-- Copy import -->
    <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
      <code style="font-size:12px; color:var(--vp-c-text-3); background:var(--vp-c-bg-soft); padding:4px 8px; border-radius:4px; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        import { {{ entry.name }} } from '@gzl10/ts-helpers/{{ entry.module }}'
      </code>
      <button
        style="padding:4px 10px; font-size:12px; border:1px solid var(--vp-c-border); border-radius:4px; background:var(--vp-c-bg); color:var(--vp-c-text-2); cursor:pointer; white-space:nowrap; flex-shrink:0;"
        :aria-label="`Copiar import de ${entry.name}`"
        @click="copyImport"
      >
        {{ copied ? '✓ Copiado' : 'Copiar' }}
      </button>
    </div>

    <div v-if="entry.params.length" style="margin-bottom: 16px;">
      <div class="repl-title">Parámetros</div>
      <table style="width:100%; font-size:13px; border-collapse:collapse;">
        <tr v-for="p in entry.params" :key="p.name">
          <td style="padding:4px 8px; font-family:var(--vp-font-family-mono); color:var(--vp-c-brand-1);">{{ p.name }}</td>
          <td style="padding:4px 8px; font-family:var(--vp-font-family-mono); color:var(--vp-c-text-3);">{{ p.type }}</td>
          <td style="padding:4px 8px; color:var(--vp-c-text-2);">{{ p.description }}</td>
        </tr>
      </table>
    </div>

    <div v-if="entry.returns?.description" style="margin-bottom:16px; font-size:13px; color:var(--vp-c-text-2);">
      <span style="font-family:var(--vp-font-family-mono); color:var(--vp-c-text-3);">returns </span>
      <span style="font-family:var(--vp-font-family-mono);">{{ entry.returns.type }}</span>
      {{ entry.returns.description ? '— ' + entry.returns.description : '' }}
    </div>
  </div>
</template>
