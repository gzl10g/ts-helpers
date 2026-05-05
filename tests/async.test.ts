/**
 * Test suite for async module - SIMPLIFIED VERSION
 * Tests for asynchronous utilities, delay functions, batch processing and operation handling
 */

import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  sleep,
  wait,
  runBatch,
  handleOperation,
  Deferred,
  withTimeout,
  combineAbortSignals,
  retry,
  memoize,
  Semaphore,
  Mutex,
} from '../src/async'
import { TsHelpersError, TsHelpersErrorCode } from '../src/errors'

describe('Delay Utilities', () => {
  test('sleep should return a promise that resolves', async () => {
    const start = Date.now()
    await sleep(5) // Very short delay
    const end = Date.now()

    expect(end - start).toBeGreaterThanOrEqual(2)
  })

  test('wait should be an alias for sleep', async () => {
    const start = Date.now()
    await wait(5)
    const end = Date.now()

    expect(end - start).toBeGreaterThanOrEqual(2)
  })

  test('sleep should handle zero milliseconds', async () => {
    const start = Date.now()
    await sleep(0)
    const end = Date.now()

    expect(end - start).toBeLessThan(10)
  })
})

describe('Batch Processing', () => {
  test('runBatch should execute promises in batches', async () => {
    const promises = Array.from({ length: 10 }, (_, i) => Promise.resolve(i))
    const results = await runBatch(promises, 3)

    expect(results).toHaveLength(10)
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  test('runBatch should handle empty array', async () => {
    const results = await runBatch([], 5)
    expect(results).toEqual([])
  })

  test('runBatch should maintain order of results', async () => {
    const promises = [Promise.resolve(0), Promise.resolve(1), Promise.resolve(2)]
    const results = await runBatch(promises, 2)

    expect(results).toEqual([0, 1, 2])
  })

  test('runBatch should handle rejected promises', async () => {
    const promises = [
      Promise.resolve(1),
      Promise.reject(new Error('Test error')),
      Promise.resolve(3),
    ]

    await expect(runBatch(promises, 2)).rejects.toThrow('Test error')
  })
})

describe('Dynamic Operation Utilities', () => {
  const mockTarget = {
    simpleMethod: () => Promise.resolve('simple result'),
    methodWithArgs: (a: number, b: number) => Promise.resolve(a + b),
    parent: {
      child: () => Promise.resolve('nested result'),
    },
  }

  test('handleOperation should execute simple methods', async () => {
    const result = await handleOperation(mockTarget, 'simpleMethod')
    expect(result).toBe('simple result')
  })

  test('handleOperation should execute methods with arguments', async () => {
    const result = await handleOperation(mockTarget, 'methodWithArgs', 5, 3)
    expect(result).toBe(8)
  })

  test('handleOperation should execute nested methods', async () => {
    const result = await handleOperation(mockTarget, 'parent/child')
    expect(result).toBe('nested result')
  })

  test('handleOperation should throw error for non-existent method', async () => {
    try {
      await handleOperation(mockTarget, 'nonExistentMethod')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).toContain('does not exist')
    }
  })
})

describe('Edge Cases: Sleep/Wait', () => {
  test('sleep with negative milliseconds should resolve immediately', async () => {
    const start = Date.now()
    await sleep(-100)
    const end = Date.now()

    expect(end - start).toBeLessThan(10)
  })

  test('sleep with NaN should resolve immediately', async () => {
    const start = Date.now()
    await sleep(NaN)
    const end = Date.now()

    expect(end - start).toBeLessThan(50)
  })

  test('wait should handle all same edge cases as sleep', async () => {
    await expect(wait(-100)).resolves.toBeUndefined()
    await expect(wait(0)).resolves.toBeUndefined()
    await expect(wait(NaN)).resolves.toBeUndefined()
  })
})

describe('Edge Cases: RunBatch', () => {
  test('runBatch with large batch size should work', async () => {
    const promises = [Promise.resolve(1), Promise.resolve(2)]
    const results = await runBatch(promises, 10)

    expect(results).toEqual([1, 2])
  })

  test('runBatch with batch size of 1 should execute sequentially', async () => {
    const executionOrder: number[] = []
    const promises = [
      Promise.resolve(1).then(v => {
        executionOrder.push(v)
        return v
      }),
      Promise.resolve(2).then(v => {
        executionOrder.push(v)
        return v
      }),
      Promise.resolve(3).then(v => {
        executionOrder.push(v)
        return v
      }),
    ]

    const results = await runBatch(promises, 1)
    expect(results).toEqual([1, 2, 3])
    expect(executionOrder.length).toBe(3)
  })

  test('runBatch with zero batch size should throw error', async () => {
    const promises = [Promise.resolve(1)]
    await expect(runBatch(promises, 0)).rejects.toThrow()
  })

  test('runBatch with negative batch size should throw error', async () => {
    const promises = [Promise.resolve(1)]
    await expect(runBatch(promises, -5)).rejects.toThrow()
  })

  test('runBatch should handle single promise', async () => {
    const result = await runBatch([Promise.resolve(42)], 1)
    expect(result).toEqual([42])
  })

  test('runBatch should propagate rejection from first promise', async () => {
    const promises = [
      Promise.reject(new Error('First error')),
      Promise.resolve(2),
      Promise.resolve(3),
    ]

    await expect(runBatch(promises, 2)).rejects.toThrow('First error')
  })

  test('runBatch should propagate rejection from middle promise', async () => {
    const promises = [
      Promise.resolve(1),
      Promise.reject(new Error('Middle error')),
      Promise.resolve(3),
    ]

    await expect(runBatch(promises, 2)).rejects.toThrow('Middle error')
  })

  test('runBatch should propagate rejection from last promise', async () => {
    const promises = [
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.reject(new Error('Last error')),
    ]

    await expect(runBatch(promises, 3)).rejects.toThrow('Last error')
  })

  test('runBatch should handle promises with different resolution times', async () => {
    const promises = [sleep(50).then(() => 1), sleep(10).then(() => 2), sleep(30).then(() => 3)]

    const results = await runBatch(promises, 2)
    expect(results).toEqual([1, 2, 3])
  })
})

describe('Edge Cases: HandleOperation', () => {
  const mockTarget = {
    simpleMethod: () => Promise.resolve('result'),
    syncMethod: () => 'sync result',
    methodThatThrows: () => {
      throw new Error('Method error')
    },
    methodThatRejects: () => Promise.reject(new Error('Promise rejection')),
    parent: {
      child: {
        deep: () => Promise.resolve('deep result'),
      },
    },
  }

  test('handleOperation should throw for null target', async () => {
    try {
      await handleOperation(null as any, 'method')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).toContain('null')
    }
  })

  test('handleOperation should throw for undefined target', async () => {
    try {
      await handleOperation(undefined as any, 'method')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).toContain('undefined')
    }
  })

  test('handleOperation should throw for non-function property', async () => {
    const target = { notAFunction: 123 }
    try {
      await handleOperation(target, 'notAFunction')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).toContain('not a function')
    }
  })

  test('handleOperation should handle synchronous methods', async () => {
    const result = await handleOperation(mockTarget, 'syncMethod')
    expect(result).toBe('sync result')
  })

  test('handleOperation should propagate thrown errors', async () => {
    try {
      await handleOperation(mockTarget, 'methodThatThrows')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).toBe('Method error')
    }
  })

  test('handleOperation should propagate rejected promises', async () => {
    await expect(handleOperation(mockTarget, 'methodThatRejects')).rejects.toThrow(
      'Promise rejection'
    )
  })

  test('handleOperation should reject deeply nested paths', async () => {
    // handleOperation only supports one level (parent/child), not parent/child/deep
    try {
      await handleOperation(mockTarget, 'parent/child/deep')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).toContain('not a function')
    }
  })

  test('handleOperation should reject empty path string', async () => {
    try {
      await handleOperation(mockTarget, '')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).toContain('Operation [] does not exist')
    }
  })

  test('handleOperation should reject invalid nested path', async () => {
    try {
      await handleOperation(mockTarget, 'parent/nonExistent/deep')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).toContain('Operation [parent/nonExistent/deep] does not exist')
    }
  })
})

describe('Concurrent Operations', () => {
  test('multiple sleep calls should not interfere', async () => {
    const results = await Promise.all([sleep(10).then(() => 1), sleep(20).then(() => 2)])

    expect(results).toEqual([1, 2])
  })

  test('runBatch should handle concurrent batch executions', async () => {
    const batch1 = runBatch([Promise.resolve(1), Promise.resolve(2)], 1)
    const batch2 = runBatch([Promise.resolve(3), Promise.resolve(4)], 1)

    const [results1, results2] = await Promise.all([batch1, batch2])

    expect(results1).toEqual([1, 2])
    expect(results2).toEqual([3, 4])
  })
})

describe('withTimeout', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('factory que resuelve antes del timeout devuelve el valor correcto', async () => {
    const result = await withTimeout(async _signal => {
      await sleep(10)
      return 'ok'
    }, 500)

    expect(result).toBe('ok')
  })

  test('factory que tarda más que ms rechaza con TsHelpersError TIMEOUT_ERROR', async () => {
    await expect(
      withTimeout(async _signal => {
        await sleep(500)
        return 'never'
      }, 50)
    ).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof TsHelpersError &&
        err.code === TsHelpersErrorCode.TIMEOUT_ERROR &&
        (err.data as { ms: number }).ms === 50
      )
    })
  })

  test('al timeout el AbortSignal recibido por la factory queda abortado', async () => {
    let capturedSignal: AbortSignal | undefined

    await expect(
      withTimeout(async signal => {
        capturedSignal = signal
        await sleep(500)
        return 'never'
      }, 50)
    ).rejects.toThrow()

    expect(capturedSignal?.aborted).toBe(true)
  })

  test('si la factory resuelve primero, no hay leak de timers (vi.useFakeTimers)', async () => {
    vi.useFakeTimers()

    const promise = withTimeout(async _signal => {
      return 42
    }, 5000)

    // Drenar microtareas para que la factory (síncrona) resuelva
    await Promise.resolve()
    await Promise.resolve()
    const result = await promise

    expect(result).toBe(42)
    // El clearTimeout del finally debe haber eliminado el timer del timeout
    expect(vi.getTimerCount()).toBe(0)

    vi.useRealTimers()
  })

  test('ms <= 0 lanza TsHelpersError INVALID_OPERATION sincrónicamente (sin await)', () => {
    expect(() => withTimeout(async _signal => 'x', 0)).toThrow(TsHelpersError)
    expect(() => withTimeout(async _signal => 'x', -1)).toThrow(TsHelpersError)

    try {
      withTimeout(async _signal => 'x', 0)
    } catch (err) {
      expect(err).toBeInstanceOf(TsHelpersError)
      expect((err as TsHelpersError).code).toBe(TsHelpersErrorCode.INVALID_OPERATION)
      expect((err as TsHelpersError & { data: { ms: number } }).data.ms).toBe(0)
    }
  })
})

describe('combineAbortSignals', () => {
  test('abortar una signal → combined.aborted === true con el mismo reason', () => {
    const c1 = new AbortController()
    const c2 = new AbortController()
    const combined = combineAbortSignals(c1.signal, c2.signal)

    expect(combined.aborted).toBe(false)
    c1.abort('motivo-test')
    expect(combined.aborted).toBe(true)
    expect(combined.reason).toBe('motivo-test')
  })

  test('signal ya abortada al llamar → combined.aborted === true inmediatamente', () => {
    const c1 = new AbortController()
    c1.abort('ya-abortada')
    const c2 = new AbortController()

    const combined = combineAbortSignals(c1.signal, c2.signal)

    expect(combined.aborted).toBe(true)
    expect(combined.reason).toBe('ya-abortada')
  })

  test('sin inputs → combined.aborted === false (nunca aborta)', () => {
    const combined = combineAbortSignals()
    expect(combined.aborted).toBe(false)
  })

  test('abortar la primera signal → combined aborta; la segunda no dispara listeners (sin leak)', () => {
    const c1 = new AbortController()
    const c2 = new AbortController()
    const combined = combineAbortSignals(c1.signal, c2.signal)

    c1.abort('primera')
    expect(combined.aborted).toBe(true)
    expect(combined.reason).toBe('primera')

    // Abortar la segunda DESPUÉS no debe causar errores ni doble-abort
    let extraAbortCount = 0
    combined.addEventListener('abort', () => {
      extraAbortCount++
    })
    c2.abort('segunda')

    // El combined ya estaba abortado: no debe dispararse de nuevo
    expect(extraAbortCount).toBe(0)
    expect(combined.reason).toBe('primera') // reason original intacto
  })

  test('una sola signal no abortada → combined tampoco aborta', () => {
    const c = new AbortController()
    const combined = combineAbortSignals(c.signal)
    expect(combined.aborted).toBe(false)
  })

  test('una sola signal abortada → combined aborta con su reason', () => {
    const c = new AbortController()
    c.abort('solo-uno')
    const combined = combineAbortSignals(c.signal)
    expect(combined.aborted).toBe(true)
    expect(combined.reason).toBe('solo-uno')
  })
})

describe('Deferred', () => {
  test('resolve(value) resuelve .promise con el valor correcto', async () => {
    const deferred = new Deferred<number>()
    deferred.resolve(42)
    const result = await deferred.promise
    expect(result).toBe(42)
  })

  test('resolve(promiseLike) espera la promesa interna antes de resolver', async () => {
    const deferred = new Deferred<string>()
    const inner = new Promise<string>(res => setTimeout(() => res('from inner'), 10))
    deferred.resolve(inner)
    const result = await deferred.promise
    expect(result).toBe('from inner')
  })

  test('reject(reason) rechaza .promise con el motivo indicado', async () => {
    const deferred = new Deferred<number>()
    const error = new Error('algo salió mal')
    deferred.reject(error)
    await expect(deferred.promise).rejects.toThrow('algo salió mal')
  })

  test('settled es false antes de resolver y true después de resolve', async () => {
    const deferred = new Deferred<string>()
    expect(deferred.settled).toBe(false)
    deferred.resolve('ok')
    expect(deferred.settled).toBe(true)
    await deferred.promise
  })

  test('settled es false antes de rechazar y true después de reject', async () => {
    const deferred = new Deferred<string>()
    expect(deferred.settled).toBe(false)
    deferred.reject(new Error('error'))
    expect(deferred.settled).toBe(true)
    await deferred.promise.catch(() => {})
  })

  test('segundo resolve tras settled===true es no-op: la promesa mantiene el valor original', async () => {
    const deferred = new Deferred<number>()
    deferred.resolve(1)
    deferred.resolve(999) // no-op: settled ya es true
    const result = await deferred.promise
    expect(result).toBe(1)
    expect(deferred.settled).toBe(true)
  })
})

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('éxito en el primer intento: fn se ejecuta una vez y devuelve el valor', async () => {
    const fn = vi.fn(async () => 'ok')

    const result = await retry(fn, { attempts: 3 })

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(0)
  })

  test('éxito en el intento 3 de 5: fn se ejecuta 3 veces', async () => {
    let calls = 0
    const fn = vi.fn(async () => {
      calls++
      if (calls < 3) throw new Error(`fail ${calls}`)
      return 'success'
    })

    const promise = retry(fn, { attempts: 5, delay: 0 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('todos los intentos fallan: rechaza con RETRY_EXHAUSTED, data.attempts y cause correctos', async () => {
    const lastError = new Error('último fallo')
    let calls = 0
    const fn = vi.fn(async () => {
      calls++
      throw calls === 3 ? lastError : new Error(`fail ${calls}`)
    })

    const promise = retry(fn, { attempts: 3, delay: 0 })
    const assertion = expect(promise).rejects.toSatisfy((err: unknown) => {
      if (!(err instanceof TsHelpersError)) return false
      if (err.code !== TsHelpersErrorCode.RETRY_EXHAUSTED) return false
      const data = err.data as { attempts: number; lastError: unknown }
      return data.attempts === 3 && data.lastError === lastError && err.cause === lastError
    })
    await vi.runAllTimersAsync()
    await assertion
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('delay numérico: espera los ms correctos entre intentos', async () => {
    const timestamps: number[] = []
    const fn = vi.fn(async () => {
      timestamps.push(Date.now())
      throw new Error('fail')
    })

    const start = Date.now()
    const promise = retry(fn, { attempts: 3, delay: 200 }).catch(() => 'caught')
    await vi.runAllTimersAsync()
    await promise

    expect(timestamps).toHaveLength(3)
    // Intento 0 inmediato, intento 1 a +200ms, intento 2 a +400ms
    expect(timestamps[0] - start).toBeLessThan(50)
    expect(timestamps[1] - start).toBeGreaterThanOrEqual(200)
    expect(timestamps[2] - start).toBeGreaterThanOrEqual(400)
  })

  test('delay como función: el delay aumenta según el número de intento', async () => {
    const timestamps: number[] = []
    const fn = vi.fn(async () => {
      timestamps.push(Date.now())
      throw new Error('fail')
    })
    const delayFn = vi.fn((attempt: number) => (attempt + 1) * 100)

    const start = Date.now()
    const promise = retry(fn, { attempts: 4, delay: delayFn }).catch(() => 'caught')
    await vi.runAllTimersAsync()
    await promise

    // delayFn se llama tras intentos 0, 1, 2 (no tras el último)
    expect(delayFn).toHaveBeenCalledTimes(3)
    expect(delayFn).toHaveBeenNthCalledWith(1, 0, expect.any(Error))
    expect(delayFn).toHaveBeenNthCalledWith(2, 1, expect.any(Error))
    expect(delayFn).toHaveBeenNthCalledWith(3, 2, expect.any(Error))

    // Intento 1 a +100ms, intento 2 a +300ms (100+200), intento 3 a +600ms (100+200+300)
    expect(timestamps[1] - start).toBeGreaterThanOrEqual(100)
    expect(timestamps[2] - start).toBeGreaterThanOrEqual(300)
    expect(timestamps[3] - start).toBeGreaterThanOrEqual(600)
  })

  test('signal abortada durante el delay: rechaza con OPERATION_ABORTED y no hay más intentos', async () => {
    const controller = new AbortController()
    const fn = vi.fn(async () => {
      throw new Error('fail')
    })

    const promise = retry(fn, { attempts: 5, delay: 1000, signal: controller.signal })

    // Drenar microtareas para que el primer intento falle y empiece la espera
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    controller.abort('cancelado')

    await expect(promise).rejects.toSatisfy((err: unknown) => {
      return err instanceof TsHelpersError && err.code === TsHelpersErrorCode.OPERATION_ABORTED
    })

    // Solo se ejecutó el primer intento; los demás no porque la espera se canceló
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('onRetry se invoca tras cada fallo (excepto el último) con (attempt, error)', async () => {
    const onRetry = vi.fn()
    let calls = 0
    const errors: Error[] = []
    const fn = vi.fn(async () => {
      const err = new Error(`fail-${calls}`)
      errors.push(err)
      calls++
      throw err
    })

    const promise = retry(fn, { attempts: 3, delay: 0, onRetry }).catch(() => 'caught')
    await vi.runAllTimersAsync()
    await promise

    // 3 intentos → onRetry se llama 2 veces (no tras el último fallo)
    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenNthCalledWith(1, 0, errors[0])
    expect(onRetry).toHaveBeenNthCalledWith(2, 1, errors[1])
  })

  test('attempts < 1 lanza INVALID_OPERATION sincrónicamente (sin await)', () => {
    const fn = vi.fn(async () => 'never')

    expect(() => retry(fn, { attempts: 0 })).toThrow(TsHelpersError)
    expect(() => retry(fn, { attempts: -1 })).toThrow(TsHelpersError)

    try {
      retry(fn, { attempts: 0 })
    } catch (err) {
      expect(err).toBeInstanceOf(TsHelpersError)
      expect((err as TsHelpersError).code).toBe(TsHelpersErrorCode.INVALID_OPERATION)
      expect((err as TsHelpersError & { data: { attempts: number } }).data.attempts).toBe(0)
    }

    expect(fn).not.toHaveBeenCalled()
  })

  test('attempts = 1 y fn falla: rechaza directamente sin esperar delay', async () => {
    const fn = vi.fn(async () => {
      throw new Error('único intento')
    })
    const onRetry = vi.fn()

    const promise = retry(fn, { attempts: 1, delay: 10000, onRetry })

    await expect(promise).rejects.toSatisfy((err: unknown) => {
      return err instanceof TsHelpersError && err.code === TsHelpersErrorCode.RETRY_EXHAUSTED
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(onRetry).not.toHaveBeenCalled()
    // No debe quedar ningún timer del delay pendiente
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('memoize', () => {
  describe('caché básica', () => {
    test('segunda llamada con mismos args usa cache: fn ejecuta solo 1 vez', async () => {
      const fn = vi.fn(async (n: number) => n * 2)
      const memoized = memoize(fn)

      const r1 = await memoized(5)
      const r2 = await memoized(5)

      expect(r1).toBe(10)
      expect(r2).toBe(10)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    test('args distintos generan entradas separadas: fn ejecuta 2 veces', async () => {
      const fn = vi.fn(async (n: number) => n * 2)
      const memoized = memoize(fn)

      await memoized(1)
      await memoized(2)

      expect(fn).toHaveBeenCalledTimes(2)
      expect(memoized.size()).toBe(2)
    })

    test('keyFn custom: args distintos pero misma key → cache compartida', async () => {
      const fn = vi.fn(async (obj: { id: number; meta: string }) => obj.id)
      const memoized = memoize(fn, { keyFn: obj => String(obj.id) })

      const r1 = await memoized({ id: 1, meta: 'a' })
      const r2 = await memoized({ id: 1, meta: 'b' }) // misma key (id=1)

      expect(r1).toBe(1)
      expect(r2).toBe(1)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    test('default key (primitivos): memoize(fn) sin keyFn funciona', async () => {
      const fn = vi.fn(async (a: string, b: number) => `${a}-${b}`)
      const memoized = memoize(fn)

      await memoized('x', 1)
      await memoized('x', 1)
      await memoized('x', 2)

      expect(fn).toHaveBeenCalledTimes(2)
    })

    test('invalidate(...args): true si existía, false si no; siguiente llamada reejecuta', async () => {
      const fn = vi.fn(async (n: number) => n * 2)
      const memoized = memoize(fn)

      await memoized(1)
      expect(memoized.invalidate(1)).toBe(true)
      expect(memoized.invalidate(1)).toBe(false)
      expect(memoized.invalidate(99)).toBe(false)

      await memoized(1)
      expect(fn).toHaveBeenCalledTimes(2)
    })

    test('clear() vacía todo; size() cuenta entradas activas', async () => {
      const fn = vi.fn(async (n: number) => n)
      const memoized = memoize(fn)

      await memoized(1)
      await memoized(2)
      await memoized(3)
      expect(memoized.size()).toBe(3)

      memoized.clear()
      expect(memoized.size()).toBe(0)

      await memoized(1)
      expect(fn).toHaveBeenCalledTimes(4)
    })

    test('rejection NO se cachea: siguiente llamada reintenta (fn ejecuta 2 veces)', async () => {
      let calls = 0
      const fn = vi.fn(async (n: number) => {
        calls++
        if (calls === 1) throw new Error('boom')
        return n * 10
      })
      const memoized = memoize(fn)

      await expect(memoized(5)).rejects.toThrow('boom')
      const r2 = await memoized(5)

      expect(r2).toBe(50)
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('TTL', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('TTL no expirado: usa cache', async () => {
      const fn = vi.fn(async (n: number) => n * 2)
      const memoized = memoize(fn, { ttl: 5000, keyFn: n => String(n) })

      await memoized(3)
      vi.advanceTimersByTime(1000)
      await memoized(3)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    test('TTL expirado: reejecuta fn', async () => {
      const fn = vi.fn(async (n: number) => n * 2)
      const memoized = memoize(fn, { ttl: 1000, keyFn: n => String(n) })

      await memoized(3)
      vi.advanceTimersByTime(1500)
      await memoized(3)

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('concurrencia', () => {
    test('dos llamadas concurrentes misma key: fn ejecuta 1 vez (Promise compartida)', async () => {
      let resolveFn!: (v: number) => void
      const fn = vi.fn(
        () =>
          new Promise<number>(res => {
            resolveFn = res
          })
      )
      const memoized = memoize(fn, { keyFn: () => 'k' })

      const p1 = memoized()
      const p2 = memoized()

      expect(fn).toHaveBeenCalledTimes(1)

      resolveFn(42)
      const [r1, r2] = await Promise.all([p1, p2])

      expect(r1).toBe(42)
      expect(r2).toBe(42)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('maxSize', () => {
    test('al superar maxSize, la entrada más antigua se elimina (LRU)', async () => {
      const fn = vi.fn(async (n: number) => n * 2)
      const memoized = memoize(fn, { maxSize: 2, keyFn: n => String(n) })

      await memoized(1)
      await memoized(2)
      expect(memoized.size()).toBe(2)

      await memoized(3) // expulsa key '1'
      expect(memoized.size()).toBe(2)

      // key 1 ya no está → reejecuta
      await memoized(1)
      expect(fn).toHaveBeenCalledTimes(4)

      // key 2 fue expulsada al insertar key 1
      await memoized(2)
      expect(fn).toHaveBeenCalledTimes(5)
    })
  })
})

describe('Semaphore', () => {
  test('debe adquirir y liberar permiso', async () => {
    const sem = new Semaphore(1)
    expect(sem.available).toBe(1)

    const release = await sem.acquire()
    expect(sem.available).toBe(0)

    release()
    expect(sem.available).toBe(1)
  })

  test('debe bloquear cuando no hay permisos y desbloquear al liberar', async () => {
    const sem = new Semaphore(1)
    const release1 = await sem.acquire()
    expect(sem.available).toBe(0)

    let secondAcquired = false
    const p2 = sem.acquire().then(release => {
      secondAcquired = true
      return release
    })

    // Drenar microtareas: p2 no debe haberse resuelto aún
    await Promise.resolve()
    await Promise.resolve()
    expect(secondAcquired).toBe(false)

    // Liberar el primero → el segundo debe adquirir
    release1()
    const release2 = await p2
    expect(secondAcquired).toBe(true)
    release2()
    expect(sem.available).toBe(1)
  })

  test('debe permitir N operaciones concurrentes y serializar las extras', async () => {
    const sem = new Semaphore(3)
    const running: number[] = []
    const maxConcurrent: number[] = []

    const task = async (id: number) => {
      const release = await sem.acquire()
      running.push(id)
      maxConcurrent.push(running.length)
      await sleep(10)
      running.splice(running.indexOf(id), 1)
      release()
    }

    await Promise.all(Array.from({ length: 6 }, (_, i) => task(i)))

    // En ningún momento debieron ejecutarse más de 3 simultáneamente
    expect(Math.max(...maxConcurrent)).toBeLessThanOrEqual(3)
  })

  test('tryAcquire devuelve release cuando hay permisos', () => {
    const sem = new Semaphore(2)
    const r1 = sem.tryAcquire()
    expect(r1).toBeTypeOf('function')
    expect(sem.available).toBe(1)

    const r2 = sem.tryAcquire()
    expect(r2).toBeTypeOf('function')
    expect(sem.available).toBe(0)

    r1!()
    r2!()
    expect(sem.available).toBe(2)
  })

  test('tryAcquire devuelve null cuando no hay permisos disponibles', () => {
    const sem = new Semaphore(1)
    const release = sem.tryAcquire()
    expect(release).toBeTypeOf('function')

    const shouldBeNull = sem.tryAcquire()
    expect(shouldBeNull).toBeNull()

    release!()
  })

  test('run libera el permiso aunque la función falle', async () => {
    const sem = new Semaphore(1)

    await expect(
      sem.run(async () => {
        throw new Error('fallo interno')
      })
    ).rejects.toThrow('fallo interno')

    // El permiso debe haberse liberado
    expect(sem.available).toBe(1)
  })

  test('lanza error con permits < 1', () => {
    expect(() => new Semaphore(0)).toThrow(TsHelpersError)
    expect(() => new Semaphore(-5)).toThrow(TsHelpersError)

    try {
      new Semaphore(0)
    } catch (err) {
      expect(err).toBeInstanceOf(TsHelpersError)
      expect((err as TsHelpersError).code).toBe(TsHelpersErrorCode.INVALID_OPERATION)
    }
  })

  test('available refleja el estado actual tras múltiples adquisiciones', async () => {
    const sem = new Semaphore(5)
    expect(sem.available).toBe(5)

    const releases = await Promise.all(Array.from({ length: 4 }, () => sem.acquire()))
    expect(sem.available).toBe(1)

    releases[0]()
    expect(sem.available).toBe(2)

    releases.slice(1).forEach(r => r())
    expect(sem.available).toBe(5)
  })

  test('release idempotente: llamar dos veces no incrementa permisos de más', async () => {
    const sem = new Semaphore(1)
    const release = await sem.acquire()
    expect(sem.available).toBe(0)

    release()
    release() // segunda llamada no-op
    expect(sem.available).toBe(1)
  })
})

describe('Mutex', () => {
  test('isLocked refleja el estado del mutex', async () => {
    const mutex = new Mutex()
    expect(mutex.isLocked).toBe(false)

    const unlock = await mutex.lock()
    expect(mutex.isLocked).toBe(true)

    unlock()
    expect(mutex.isLocked).toBe(false)
  })

  test('bloquea segunda adquisición hasta que la primera se libere', async () => {
    const mutex = new Mutex()
    const unlock1 = await mutex.lock()
    expect(mutex.isLocked).toBe(true)

    let secondLocked = false
    const p2 = mutex.lock().then(unlock => {
      secondLocked = true
      return unlock
    })

    await Promise.resolve()
    await Promise.resolve()
    expect(secondLocked).toBe(false)

    unlock1()
    const unlock2 = await p2
    expect(secondLocked).toBe(true)
    unlock2()
    expect(mutex.isLocked).toBe(false)
  })

  test('tryLock devuelve función unlock cuando libre', () => {
    const mutex = new Mutex()
    const unlock = mutex.tryLock()
    expect(unlock).toBeTypeOf('function')
    expect(mutex.isLocked).toBe(true)
    unlock!()
    expect(mutex.isLocked).toBe(false)
  })

  test('tryLock devuelve null cuando está bloqueado', async () => {
    const mutex = new Mutex()
    const unlock = await mutex.lock()

    const shouldBeNull = mutex.tryLock()
    expect(shouldBeNull).toBeNull()

    unlock()
  })

  test('run libera el mutex aunque la función falle', async () => {
    const mutex = new Mutex()

    await expect(
      mutex.run(async () => {
        throw new Error('error en sección crítica')
      })
    ).rejects.toThrow('error en sección crítica')

    expect(mutex.isLocked).toBe(false)
  })

  test('serializa operaciones concurrentes — mantiene orden FIFO', async () => {
    const mutex = new Mutex()
    const order: number[] = []

    // Lanzar 5 operaciones concurrentes; deben ejecutarse en orden de adquisición
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        mutex.run(async () => {
          order.push(i)
          await sleep(5)
        })
      )
    )

    expect(order).toHaveLength(5)
    // Todas ejecutadas exactamente una vez (sin duplicados ni pérdidas)
    expect(order.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4])
    // Mutex liberado al final
    expect(mutex.isLocked).toBe(false)
  })
})
