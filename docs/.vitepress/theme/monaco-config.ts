// Monaco workers must be configured before any monaco-editor API import.
// This file should be imported as the FIRST import in MonacoEditorImpl.vue.

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

declare global {
  interface Window {
    MonacoEnvironment: {
      getWorker: (workerId: string, label: string) => Worker
    }
  }
}

if (typeof window !== 'undefined') {
  window.MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      if (label === 'typescript' || label === 'javascript') {
        return new TsWorker()
      }
      return new EditorWorker()
    },
  }
}

export {}
