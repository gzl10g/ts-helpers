<script setup lang="ts">
import './monaco-config'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

const props = defineProps<{
  modelValue: string
  language?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { isDark } = useData()
const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorContainer.value) return

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language ?? 'javascript',
    theme: isDark.value ? 'vs-dark' : 'vs',
    minimap: { enabled: false },
    lineNumbers: 'off',
    folding: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 13,
    fontFamily: 'var(--vp-font-family-mono)',
    accessibilitySupport: 'on',
    roundedSelection: false,
    overviewRulerLanes: 0,
    padding: { top: 8, bottom: 8 },
  })

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor!.getValue())
  })
})

watch(isDark, (dark) => {
  monaco.editor.setTheme(dark ? 'vs-dark' : 'vs')
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (editor && editor.getValue() !== newVal) {
      editor.setValue(newVal)
    }
  },
)

onUnmounted(() => {
  editor?.dispose()
  monaco.editor.getModels().forEach((m) => m.dispose())
  editor = null
})
</script>

<template>
  <div
    ref="editorContainer"
    class="monaco-container"
    style="height: 120px; border: 1px solid var(--vp-c-divider); border-radius: 6px; overflow: hidden;"
    role="textbox"
    aria-label="Editor de código"
    aria-multiline="true"
  />
</template>
