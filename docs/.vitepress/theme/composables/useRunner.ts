import { onUnmounted } from 'vue'

export interface RunResult {
  result?: unknown
  error?: string
}

// Worker URL — Vite bundles it as a separate module
const WORKER_URL = new URL('../worker.ts', import.meta.url)

export function useRunner() {
  // Keep reference to the active worker for cleanup
  let activeWorker: Worker | null = null

  onUnmounted(() => {
    activeWorker?.terminate()
    activeWorker = null
  })

  async function run(code: string, timeoutMs = 3000): Promise<RunResult> {
    // Terminate any previously active worker
    activeWorker?.terminate()

    return new Promise<RunResult>((resolve) => {
      const worker = new Worker(WORKER_URL, { type: 'module' })
      activeWorker = worker

      const timer = setTimeout(() => {
        worker.terminate()
        if (activeWorker === worker) activeWorker = null
        resolve({ error: 'Timeout: la ejecución superó 3 segundos' })
      }, timeoutMs)

      worker.onmessage = ({ data }: MessageEvent<RunResult>) => {
        clearTimeout(timer)
        worker.terminate()
        if (activeWorker === worker) activeWorker = null
        resolve(data)
      }

      worker.onerror = (e) => {
        clearTimeout(timer)
        worker.terminate()
        if (activeWorker === worker) activeWorker = null
        resolve({ error: e.message ?? 'Worker error' })
      }

      worker.postMessage({ code })
    })
  }

  return { run }
}
