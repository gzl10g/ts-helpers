<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue'
import OutputDisplay from './OutputDisplay.vue'
import type { CatalogEntry } from '../../scripts/types'
import type { RunResult } from './composables/useRunner'

const MonacoEditor = defineAsyncComponent({
  loader: () => import('./MonacoEditorImpl.vue'),
  loadingComponent: {
    template:
      '<div style="height:120px;background:var(--vp-c-bg-soft);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--vp-c-text-3);font-size:13px;">Cargando editor...</div>',
  },
  errorComponent: {
    template:
      '<div style="height:120px;background:var(--vp-c-bg-soft);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--vp-c-danger-1);font-size:13px;">Error al cargar el editor</div>',
  },
  timeout: 10000,
})

const props = defineProps<{
  entry: CatalogEntry
}>()

let runFn: ((code: string) => Promise<RunResult>) | null = null

async function loadRunner() {
  try {
    const mod = await import('./composables/useRunner')
    const { run } = mod.useRunner()
    runFn = run
  } catch {
    runFn = async () => ({ error: 'Runner no disponible' })
  }
}

onMounted(() => {
  loadRunner()
})

function parseArgsFromSignature(sig: string): string {
  const match = sig.match(/^\(([^)]*)\)/)
  if (!match || !match[1].trim()) return ''
  return match[1]
    .split(',')
    .map((part) => {
      const name = part.trim().split(/[:\s=]/)[0].replace('?', '')
      const optional = part.includes('=') || part.includes('?')
      return optional ? `/* ${name}? */` : `/* ${name} */`
    })
    .join(', ')
}

function buildDefaultCode(entry: typeof props.entry): string {
  if (entry.examples[0]) return entry.examples[0]
  // Try @param metadata first, fall back to parsing the signature
  const args = entry.params.length
    ? entry.params
        .filter((p) => !p.optional)
        .map((p) => `/* ${p.name}: ${p.type} */`)
        .join(', ')
    : parseArgsFromSignature(entry.signature)
  return `return ${entry.name}(${args})`
}

const code = ref(buildDefaultCode(props.entry))
const running = ref(false)
const runResult = ref<RunResult>({})

async function runCode() {
  if (running.value || !runFn) return
  running.value = true
  runResult.value = {}
  try {
    runResult.value = await runFn(code.value)
  } catch (e) {
    runResult.value = { error: String(e) }
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div class="repl-section">
    <div class="repl-title">Prueba interactiva</div>

    <MonacoEditor v-model="code" language="javascript" />

    <button
      class="run-btn"
      :disabled="running"
      :aria-busy="running"
      @click="runCode"
    >
      {{ running ? 'Ejecutando...' : '▶ Ejecutar' }}
    </button>

    <OutputDisplay
      :result="runResult.result"
      :error="runResult.error"
      :running="running"
    />

    <div v-if="entry.examples.length" class="examples-section" style="margin-top:20px;">
      <div class="repl-title">Ejemplos</div>
      <pre
        v-for="(ex, i) in entry.examples"
        :key="i"
        class="example-block"
        style="cursor:pointer;"
        title="Cargar en el editor"
        @click="code = ex"
      >{{ ex }}</pre>
    </div>
  </div>
</template>
