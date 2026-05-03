/**
 * Test suite for async module - SIMPLIFIED VERSION
 * Tests for asynchronous utilities, delay functions, batch processing and operation handling
 */

import { describe, test, expect } from 'vitest'
import { sleep, wait, runBatch, handleOperation } from '../src/async'

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
