<script setup lang="ts">
defineProps<{
  result?: unknown
  error?: string
  running?: boolean
}>()

const UNDEFINED_SENTINEL = '__undefined__'

function isUndefinedResult(val: unknown): boolean {
  return val === UNDEFINED_SENTINEL
}

function formatResult(val: unknown): string {
  if (val === UNDEFINED_SENTINEL) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'string') return JSON.stringify(val)
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}
</script>

<template>
  <div
    class="output-panel"
    role="status"
    aria-live="polite"
    :aria-busy="running"
  >
    <span v-if="running" style="color: var(--vp-c-text-3);">Ejecutando...</span>
    <span v-else-if="error" class="output-error">{{ error }}</span>
    <span v-else-if="result !== undefined && !isUndefinedResult(result)">{{ formatResult(result) }}</span>
    <span v-else-if="isUndefinedResult(result)" style="color: var(--vp-c-text-3); font-style: italic;">undefined</span>
    <span v-else style="color: var(--vp-c-text-3);">— ejecuta código para ver el resultado —</span>
  </div>
</template>
