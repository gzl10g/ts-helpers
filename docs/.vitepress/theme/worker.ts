// Web Worker — module type (Safari ≥15 compatible)
// All functions from @gzl10/ts-helpers are exposed on globalThis
// so user code can call them without any prefix (e.g. validateNIF(...))

import * as helpers from '@gzl10/ts-helpers'

// Expose all exported helpers in the worker's global scope
Object.assign(globalThis, helpers)

function safeSerialize(value: unknown): unknown {
  if (value === undefined) return '__undefined__'
  if (value === null) return null
  if (typeof value === 'function') return `[Function: ${(value as { name?: string }).name || 'anonymous'}]`
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return String(value)
  }
}

self.onmessage = async ({ data }: MessageEvent<{ code: string }>) => {
  try {
    // AsyncFunction without with() — helpers are available via globalThis
    // new Function runs in sloppy mode (does not inherit strict from this module)
    const fn = new Function('return (async () => {\n' + data.code + '\n})()')
    const result = await (fn() as Promise<unknown>)
    self.postMessage({ result: safeSerialize(result) })
  } catch (e) {
    self.postMessage({
      error: e instanceof Error ? e.message : String(e),
    })
  }
}
