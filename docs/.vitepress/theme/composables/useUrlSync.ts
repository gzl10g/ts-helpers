import { computed } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'

export function useUrlSync() {
  // 'history' mode: uses ?fn=validateNIF without colliding with VitePress anchors
  const params = useUrlSearchParams<{ fn?: string }>('history')

  const selectedName = computed<string | null>({
    get: () => params.fn || null,
    set: (v) => {
      params.fn = v ?? undefined
    },
  })

  return { selectedName }
}
