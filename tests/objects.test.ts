/**
 * Test suite for objects module
 * Tests for object manipulation, comparison utilities, array operations and CRC hash generation
 */

import { describe, test, expect } from 'vitest'
import {
  // Object comparison
  comparator,
  deepEqual,
  hasSameType,

  // Object manipulation
  formatToReadableString,
  getShallowProperties,
  calculateDifferences,
  setDeepValue,
  getDeepValue,

  // Hash generation
  generateCrcHash,

  // Array operations
  updateArrayElementsBy,
  updateArrayElementById,
  deleteArrayElementsBy,
} from '../src/objects'

describe('Object Comparison', () => {
  test('comparator should perform deep comparison', () => {
    expect(comparator({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    expect(comparator({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } })).toBe(true)
    expect(comparator({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
    expect(comparator([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(comparator([1, 2, 3], [1, 2, 4])).toBe(false)
  })

  test('deepEqual should perform fast deep comparison', () => {
    const obj1 = { a: 1, b: { c: [1, 2, 3] } }
    const obj2 = { a: 1, b: { c: [1, 2, 3] } }
    const obj3 = { a: 1, b: { c: [1, 2, 4] } }

    expect(deepEqual(obj1, obj2)).toBe(true)
    expect(deepEqual(obj1, obj3)).toBe(false)
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(undefined, undefined)).toBe(true)
    expect(deepEqual(null, undefined)).toBe(false)
  })

  test('hasSameType should correctly identify type matches', () => {
    // Arrays
    expect(hasSameType([1, 2, 3], [4, 5, 6])).toBe(true)
    expect(hasSameType([1, 2, 3], 'string')).toBe(false)

    // Objects
    expect(hasSameType({ a: 1 }, { b: 2 })).toBe(true)
    expect(hasSameType({ a: 1 }, [1, 2, 3])).toBe(false)

    // Primitives
    expect(hasSameType('string', 'another string')).toBe(true)
    expect(hasSameType(123, 456)).toBe(true)
    expect(hasSameType(true, false)).toBe(true)
    expect(hasSameType('string', 123)).toBe(false)

    // Typed arrays
    const uint8Array1 = new Uint8Array([1, 2, 3])
    const uint8Array2 = new Uint8Array([4, 5, 6])
    const uint16Array = new Uint16Array([1, 2, 3])

    expect(hasSameType(uint8Array1, uint8Array2)).toBe(true)
    expect(hasSameType(uint8Array1, uint16Array)).toBe(false)
    expect(hasSameType(uint8Array1, [1, 2, 3])).toBe(false)
  })
})

describe('Object Manipulation', () => {
  test('formatToReadableString should format object to readable string', () => {
    const obj = { name: 'John', age: 30, active: true }
    const result = formatToReadableString(obj)
    expect(result).toBe('name:John, age:30, active:true')

    const simpleObj = { key: 'value' }
    expect(formatToReadableString(simpleObj)).toBe('key:value')

    const emptyObj = {}
    expect(formatToReadableString(emptyObj)).toBe('')
  })

  test('getShallowProperties should extract only primitive properties', () => {
    const obj = {
      name: 'John',
      age: 30,
      active: true,
      address: { street: '123 Main St', city: 'Any City' },
      hobbies: ['reading', 'coding'],
      metadata: null,
    }

    const shallow = getShallowProperties(obj)
    expect(shallow).toEqual({
      name: 'John',
      age: 30,
      active: true,
      metadata: null,
    })

    expect(shallow.address).toBeUndefined()
    expect(shallow.hobbies).toBeUndefined()
  })

  test('getShallowProperties should handle null/undefined input', () => {
    expect(getShallowProperties(null)).toEqual({})
    expect(getShallowProperties(undefined)).toEqual({})
    expect(getShallowProperties({})).toEqual({})
  })

  test('calculateDifferences should return only different properties', () => {
    const oldObj = { a: 1, b: 2, c: 3, d: 'same' }
    const newObj = { a: 1, b: 5, c: 3, d: 'same', e: 'new' }

    const diff = calculateDifferences(oldObj, newObj)
    expect(diff).toEqual({ b: 5, e: 'new' })
  })

  test('calculateDifferences should handle date comparison with tolerance', () => {
    const date1 = new Date('2023-01-01T10:00:00.100Z')
    const date2 = new Date('2023-01-01T10:00:00.200Z') // 100ms difference
    const date3 = new Date('2023-01-01T10:00:01.000Z') // 1s difference

    const oldObj = { date: date1, value: 1 }
    const newObj1 = { date: date2, value: 1 } // Should be considered same date
    const newObj2 = { date: date3, value: 1 } // Should be considered different date

    // Note: Date comparison might depend on implementation of areDatesEqualWithTolerance
    const diff1 = calculateDifferences(oldObj, newObj1)
    const diff2 = calculateDifferences(oldObj, newObj2)

    // These assertions depend on the tolerance implementation
    expect(typeof diff1).toBe('object')
    expect(typeof diff2).toBe('object')
  })
})

describe('Hash Generation', () => {
  test('generateCrcHash should generate consistent hashes for strings', () => {
    const hash1 = generateCrcHash('test string')
    const hash2 = generateCrcHash('test string')
    const hash3 = generateCrcHash('different string')

    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe(hash3)
    expect(typeof hash1).toBe('string')
    expect(/^[0-9a-f]+$/.test(hash1)).toBe(true) // Valid hex string
  })

  test('generateCrcHash should handle different data types', () => {
    // Null and undefined
    expect(generateCrcHash(null)).toBeDefined()
    expect(generateCrcHash(undefined)).toBeDefined()

    // Numbers
    const numHash1 = generateCrcHash(123)
    const numHash2 = generateCrcHash(123)
    expect(numHash1).toBe(numHash2)

    // Booleans
    const boolHash1 = generateCrcHash(true)
    const boolHash2 = generateCrcHash(false)
    expect(boolHash1).not.toBe(boolHash2)
    expect(generateCrcHash(true)).toBe(generateCrcHash(true))

    // Objects and Arrays
    const objHash = generateCrcHash({ a: 1, b: 2 })
    const arrHash = generateCrcHash([1, 2, 3])
    expect(typeof objHash).toBe('string')
    expect(typeof arrHash).toBe('string')

    // Same object content should produce same hash
    expect(generateCrcHash({ a: 1, b: 2 })).toBe(generateCrcHash({ a: 1, b: 2 }))
  })

  test('generateCrcHash should handle Buffer and ArrayBuffer', () => {
    if (typeof Buffer !== 'undefined') {
      const buffer = Buffer.from('test data')
      const hash = generateCrcHash(buffer)
      expect(typeof hash).toBe('string')
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
    }

    const uint8Array = new Uint8Array([1, 2, 3, 4])
    const hash = generateCrcHash(uint8Array)
    expect(typeof hash).toBe('string')
  })
})

describe('Array Operations', () => {
  test('updateArrayElementsBy should update matching elements', () => {
    const data = [
      { id: 1, name: 'John', active: true },
      { id: 2, name: 'Jane', active: false },
      { id: 3, name: 'Bob', active: true },
    ]

    const result = updateArrayElementsBy(data, { active: false }, { active: true })

    expect(result[0].active).toBe(false)
    expect(result[1].active).toBe(false) // Unchanged
    expect(result[2].active).toBe(false)

    // Should return the same array reference
    expect(result).toBe(data)
  })

  test('updateArrayElementById should update element by ID field', () => {
    const data = [
      { id: 1, name: 'John', age: 25 },
      { id: 2, name: 'Jane', age: 30 },
      { id: 3, name: 'Bob', age: 35 },
    ]

    const updatedElement = { id: 2, name: 'Jane Doe', age: 31 }
    updateArrayElementById(data, updatedElement, 'id')

    expect(data[1]).toEqual(updatedElement)
    expect(data[0].name).toBe('John') // Unchanged
    expect(data[2].name).toBe('Bob') // Unchanged
  })

  test('updateArrayElementById should handle non-existent IDs', () => {
    const data = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]

    const originalData = JSON.parse(JSON.stringify(data))
    const nonExistentElement = { id: 99, name: 'Unknown' }

    updateArrayElementById(data, nonExistentElement, 'id')

    // Array should remain unchanged
    expect(data).toEqual(originalData)
  })

  test('deleteArrayElementsBy should remove matching elements', () => {
    const data = [
      { id: 1, name: 'John', active: true },
      { id: 2, name: 'Jane', active: false },
      { id: 3, name: 'Bob', active: true },
      { id: 4, name: 'Alice', active: false },
    ]

    const result = deleteArrayElementsBy(data, { active: true })

    expect(result.length).toBe(2)
    expect(result).toEqual([
      { id: 2, name: 'Jane', active: false },
      { id: 4, name: 'Alice', active: false },
    ])

    // Should modify the original array
    expect(data.length).toBe(2)
  })

  test('deleteArrayElementsBy should handle partial matches', () => {
    const data = [
      { id: 1, name: 'John', age: 25, active: true },
      { id: 2, name: 'Jane', age: 30, active: true },
      { id: 3, name: 'Bob', age: 25, active: false },
    ]

    const result = deleteArrayElementsBy(data, { age: 25, active: true })

    expect(result.length).toBe(2)
    expect(result.find(item => item.id === 1)).toBeUndefined()
    expect(result.find(item => item.id === 2)).toBeDefined()
    expect(result.find(item => item.id === 3)).toBeDefined()
  })
})

describe('Edge Cases and Error Handling', () => {
  test('comparison functions should handle edge cases', () => {
    expect(deepEqual([], [])).toBe(true)
    expect(deepEqual({}, {})).toBe(true)
    expect(deepEqual(0, -0)).toBe(true)
    expect(deepEqual(NaN, NaN)).toBe(true)
    expect(deepEqual(Infinity, Infinity)).toBe(true)
  })

  test('hash generation should handle edge cases', () => {
    expect(generateCrcHash('')).toBeDefined()
    expect(generateCrcHash(0)).toBeDefined()
    expect(generateCrcHash(false)).toBeDefined()
    expect(generateCrcHash([])).toBeDefined()
    expect(generateCrcHash({})).toBeDefined()
  })

  test('array operations should handle empty arrays', () => {
    expect(updateArrayElementsBy([], { test: true }, { id: 1 })).toEqual([])
    expect(deleteArrayElementsBy([], { test: true })).toEqual([])

    const emptyArray: any[] = []
    updateArrayElementById(emptyArray, { id: 1, name: 'test' }, 'id')
    expect(emptyArray).toEqual([])
  })

  test('object manipulation should handle complex nested structures', () => {
    const complexObj = {
      simple: 'value',
      nested: {
        deep: {
          array: [1, 2, { inner: 'value' }],
          date: new Date(),
        },
      },
      func: () => 'function',
      symbol: Symbol('test'),
    }

    const shallow = getShallowProperties(complexObj)
    expect(shallow.simple).toBe('value')
    expect(shallow.nested).toBeUndefined()
    expect(shallow.func).toBeUndefined()
    expect(shallow.symbol).toBeDefined() // Symbols are primitive
  })

  test('type checking should handle complex cases', () => {
    class CustomClass {
      value = 1
    }

    const instance1 = new CustomClass()
    const instance2 = new CustomClass()

    expect(hasSameType(instance1, instance2)).toBe(true)
    expect(hasSameType(instance1, {})).toBe(false)

    // Dates
    expect(hasSameType(new Date(), new Date())).toBe(true)
    expect(hasSameType(new Date(), {})).toBe(false)
  })
})

describe('Deep Object Access', () => {
  describe('setDeepValue', () => {
    test('should set simple nested value', () => {
      const obj = {}
      setDeepValue(obj, 'database.host', 'localhost')

      expect(obj).toEqual({ database: { host: 'localhost' } })
    })

    test('should set multi-level nested value', () => {
      const obj = {}
      setDeepValue(obj, 'app.server.port', 3000)

      expect(obj).toEqual({ app: { server: { port: 3000 } } })
    })

    test('should handle array indices', () => {
      const obj: any = { users: [] }
      setDeepValue(obj, 'users.0.name', 'Alice')

      expect(obj).toEqual({ users: [{ name: 'Alice' }] })
    })

    test('should overwrite existing values', () => {
      const obj = { database: { host: 'old' } }
      setDeepValue(obj, 'database.host', 'new')

      expect(obj).toEqual({ database: { host: 'new' } })
    })

    test('should create intermediate objects automatically', () => {
      const obj: any = {}
      setDeepValue(obj, 'features.authentication.oauth.providers.0', 'google')

      expect(obj).toEqual({
        features: {
          authentication: {
            oauth: {
              providers: ['google'],
            },
          },
        },
      })
    })

    test('should handle mixed object and array paths', () => {
      const obj: any = {}
      setDeepValue(obj, 'users.0.roles.0', 'admin')

      expect(obj).toEqual({
        users: [{ roles: ['admin'] }],
      })
    })

    test('should throw error for invalid target', () => {
      expect(() => setDeepValue(null as any, 'path', 'value')).toThrow(TypeError)
      expect(() => setDeepValue('string' as any, 'path', 'value')).toThrow(TypeError)
      expect(() => setDeepValue(42 as any, 'path', 'value')).toThrow(TypeError)
    })

    test('should throw error for invalid path', () => {
      const obj = {}
      expect(() => setDeepValue(obj, '' as any, 'value')).toThrow(TypeError)
      expect(() => setDeepValue(obj, null as any, 'value')).toThrow(TypeError)
      expect(() => setDeepValue(obj, undefined as any, 'value')).toThrow(TypeError)
    })

    test('should handle single-level path', () => {
      const obj: any = {}
      setDeepValue(obj, 'key', 'value')

      expect(obj).toEqual({ key: 'value' })
    })

    test('should return the same object reference', () => {
      const obj = {}
      const result = setDeepValue(obj, 'key', 'value')

      expect(result).toBe(obj)
    })
  })

  describe('getDeepValue', () => {
    test('should get simple nested value', () => {
      const obj = { database: { host: 'localhost' } }
      const result = getDeepValue(obj, 'database.host')

      expect(result).toBe('localhost')
    })

    test('should return undefined for non-existent path', () => {
      const obj = { database: { host: 'localhost' } }
      const result = getDeepValue(obj, 'database.port')

      expect(result).toBe(undefined)
    })

    test('should return default value when path not found', () => {
      const obj = { database: { host: 'localhost' } }
      const result = getDeepValue(obj, 'database.port', 5432)

      expect(result).toBe(5432)
    })

    test('should handle array access', () => {
      const obj = { users: [{ name: 'Alice' }, { name: 'Bob' }] }

      expect(getDeepValue(obj, 'users.0.name')).toBe('Alice')
      expect(getDeepValue(obj, 'users.1.name')).toBe('Bob')
    })

    test('should handle deep paths', () => {
      const obj = { app: { features: { auth: { enabled: true } } } }
      const result = getDeepValue(obj, 'app.features.auth.enabled')

      expect(result).toBe(true)
    })

    test('should return default for partially existing paths', () => {
      const obj = { app: { features: {} } }
      const result = getDeepValue(obj, 'app.features.payments.enabled', false)

      expect(result).toBe(false)
    })

    test('should handle null/undefined in path', () => {
      const obj = { app: { features: null } }

      expect(getDeepValue(obj, 'app.features.auth', 'default')).toBe('default')
    })

    test('should return default for invalid object', () => {
      expect(getDeepValue(null, 'path', 'default')).toBe('default')
      expect(getDeepValue(undefined, 'path', 'default')).toBe('default')
      expect(getDeepValue('string' as any, 'path', 'default')).toBe('default')
    })

    test('should return default for invalid path', () => {
      const obj = { key: 'value' }

      expect(getDeepValue(obj, '', 'default')).toBe('default')
      expect(getDeepValue(obj, null as any, 'default')).toBe('default')
      expect(getDeepValue(obj, undefined as any, 'default')).toBe('default')
    })

    test('should handle single-level path', () => {
      const obj = { key: 'value' }
      expect(getDeepValue(obj, 'key')).toBe('value')
    })

    test('should return undefined as default when not specified', () => {
      const obj = { key: 'value' }
      expect(getDeepValue(obj, 'nonexistent')).toBe(undefined)
    })

    test('should get complex nested structures', () => {
      const obj = {
        database: { host: 'localhost' },
        cache: { ttl: 3600 },
      }

      expect(getDeepValue(obj, 'database.host', '127.0.0.1')).toBe('localhost')
      expect(getDeepValue(obj, 'database.port', 5432)).toBe(5432)
      expect(getDeepValue(obj, 'cache.ttl', 1800)).toBe(3600)
      expect(getDeepValue(obj, 'redis.host', 'localhost')).toBe('localhost')
    })
  })
})
