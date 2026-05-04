/**
 * Tests for JSON utilities
 */

/* eslint-disable max-lines-per-function */

import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest'
import * as fs from 'fs/promises'
import { exportJSON, importJSON } from '../src/json'

// Mock fs module for Node.js tests
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  readFile: vi.fn(),
}))

// Mock environment
vi.mock('../src/environment', () => ({
  isNode: vi.fn(),
}))

// Mock DOM for browser tests
const createMockDOM = () => {
  const mockElement = {
    href: '',
    download: '',
    click: vi.fn(),
  }

  global.document = {
    createElement: vi.fn(() => mockElement),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  } as any

  global.URL = {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  } as any

  global.Blob = vi.fn() as any

  return mockElement
}

describe('JSON Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportJSON', () => {
    test('should export JSON in Node.js environment', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const testData = { name: 'John', age: 30, city: 'Madrid' }

      await exportJSON(testData, '/tmp/test.json')

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/test.json',
        JSON.stringify(testData, null, 2),
        { encoding: 'utf-8' }
      )
    })

    test('should export JSON in browser environment', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(false)

      const mockElement = createMockDOM()
      const testData = { name: 'Test', value: 123 }

      await exportJSON(testData, 'test.json')

      expect(global.Blob).toHaveBeenCalledWith([JSON.stringify(testData, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      expect(mockElement.download).toBe('test.json')
      expect(mockElement.click).toHaveBeenCalled()
    })

    test('should use custom indent option', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const testData = { a: 1, b: 2 }
      const options = { indent: 4 }

      await exportJSON(testData, '/tmp/test.json', options)

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/test.json',
        JSON.stringify(testData, null, 4),
        { encoding: 'utf-8' }
      )
    })

    test('should handle complex data structures', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const testData = {
        users: [
          { id: 1, name: 'John', tags: ['admin', 'user'] },
          { id: 2, name: 'Jane', tags: ['user'] },
        ],
        meta: { total: 2, page: 1 },
      }

      await exportJSON(testData, '/tmp/complex.json')

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/complex.json',
        JSON.stringify(testData, null, 2),
        { encoding: 'utf-8' }
      )
    })

    test('should extract filename from path in browser', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(false)

      const mockElement = createMockDOM()
      const testData = { test: true }

      await exportJSON(testData, '/path/to/my-file.json')

      expect(mockElement.download).toBe('my-file.json')
    })

    test('should use default filename when path is invalid in browser', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(false)

      const mockElement = createMockDOM()
      const testData = { test: true }

      await exportJSON(testData, '/')

      expect(mockElement.download).toBe('data.json')
    })
  })

  describe('importJSON', () => {
    test('should import JSON in Node.js environment', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const testData = { name: 'John', age: 30, city: 'Madrid' }
      const jsonContent = JSON.stringify(testData)
      vi.mocked(fs.readFile).mockResolvedValue(jsonContent)

      const result = await importJSON('/tmp/test.json')

      expect(fs.readFile).toHaveBeenCalledWith('/tmp/test.json', { encoding: 'utf-8' })
      expect(result).toEqual(testData)
    })

    test('should throw error in browser environment', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(false)

      await expect(importJSON('test.json')).rejects.toThrow('JSON import not supported in browser')
    })

    test('should handle arrays', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const testData = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const jsonContent = JSON.stringify(testData)
      vi.mocked(fs.readFile).mockResolvedValue(jsonContent)

      const result = await importJSON('/tmp/array.json')

      expect(result).toEqual(testData)
    })

    test('should handle nested objects', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const testData = {
        user: {
          profile: {
            name: 'John',
            settings: { theme: 'dark', notifications: true },
          },
        },
      }
      const jsonContent = JSON.stringify(testData)
      vi.mocked(fs.readFile).mockResolvedValue(jsonContent)

      const result = await importJSON('/tmp/nested.json')

      expect(result).toEqual(testData)
    })

    test('should throw error for invalid JSON', async () => {
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const invalidJson = '{ invalid json }'
      vi.mocked(fs.readFile).mockResolvedValue(invalidJson)

      await expect(importJSON('/tmp/invalid.json')).rejects.toThrow()
    })
  })

  describe('[CRITICAL] Error Handling & Edge Cases', () => {
    describe('Circular References', () => {
      test('should detect and reject circular references on export', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const obj: any = { name: 'Parent' }
        obj.self = obj // Circular reference

        await expect(exportJSON(obj, '/tmp/circular.json')).rejects.toThrow()
      })

      test('should handle nested circular references', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const parent: any = { name: 'Parent', children: [] }
        const child: any = { name: 'Child', parent }
        parent.children.push(child)

        await expect(exportJSON(parent, '/tmp/nested-circular.json')).rejects.toThrow()
      })

      test('should handle sibling circular references', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const node1: any = { name: 'Node1' }
        const node2: any = { name: 'Node2', ref: node1 }
        node1.ref = node2

        await expect(exportJSON(node1, '/tmp/sibling-circular.json')).rejects.toThrow()
      })
    })

    describe('Malformed JSON Import', () => {
      test('should reject JSON with trailing comma', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const malformed = '{"name": "John", "age": 30,}'
        vi.mocked(fs.readFile).mockResolvedValue(malformed)

        await expect(importJSON('/tmp/trailing-comma.json')).rejects.toThrow()
      })

      test('should reject JSON with single quotes', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const malformed = "{'name': 'John'}"
        vi.mocked(fs.readFile).mockResolvedValue(malformed)

        await expect(importJSON('/tmp/single-quotes.json')).rejects.toThrow()
      })

      test('should reject JSON with unquoted keys', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const malformed = '{name: "John"}'
        vi.mocked(fs.readFile).mockResolvedValue(malformed)

        await expect(importJSON('/tmp/unquoted.json')).rejects.toThrow()
      })

      test('should reject incomplete JSON', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const incomplete = '{"name": "John", "age":'
        vi.mocked(fs.readFile).mockResolvedValue(incomplete)

        await expect(importJSON('/tmp/incomplete.json')).rejects.toThrow()
      })

      test('should reject JSON with comments', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const withComments = '{"name": "John" /* comment */ }'
        vi.mocked(fs.readFile).mockResolvedValue(withComments)

        await expect(importJSON('/tmp/comments.json')).rejects.toThrow()
      })
    })

    describe('Invalid Input Handling', () => {
      test('should reject null/undefined data on export', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        await expect(exportJSON(null as any, '/tmp/test.json')).rejects.toThrow()
        await expect(exportJSON(undefined as any, '/tmp/test.json')).rejects.toThrow()
      })

      test('should reject invalid path on export', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const data = { test: 'data' }

        await expect(exportJSON(data, '')).rejects.toThrow()
        await expect(exportJSON(data, null as any)).rejects.toThrow()
      })

      test('should reject invalid path on import', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        await expect(importJSON('')).rejects.toThrow()
        await expect(importJSON(null as any)).rejects.toThrow()
      })

      test('should handle empty file', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        vi.mocked(fs.readFile).mockResolvedValue('')

        await expect(importJSON('/tmp/empty.json')).rejects.toThrow()
      })

      test('should handle whitespace-only file', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        vi.mocked(fs.readFile).mockResolvedValue('   \n\t  ')

        await expect(importJSON('/tmp/whitespace.json')).rejects.toThrow()
      })
    })

    describe('Extreme Data Sizes', () => {
      test('should handle deeply nested objects', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        // Create 50 levels deep nested object
        let deep: any = { value: 'bottom' }
        for (let i = 0; i < 50; i++) {
          deep = { level: i, child: deep }
        }

        await exportJSON(deep, '/tmp/deep.json')

        expect(fs.writeFile).toHaveBeenCalled()
      })

      test('should handle very large arrays', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, value: `item-${i}` }))

        await exportJSON(largeArray, '/tmp/large-array.json')

        expect(fs.writeFile).toHaveBeenCalled()
      })
    })

    describe('Special Characters & Unicode', () => {
      test('should handle unicode characters', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const unicode = {
          emoji: '😀🎉🚀',
          chinese: '你好世界',
          arabic: 'مرحبا بالعالم',
          special: '©®™€',
        }

        await exportJSON(unicode, '/tmp/unicode.json')

        expect(fs.writeFile).toHaveBeenCalled()
      })

      test('should handle escaped characters', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const escaped = {
          newline: 'Line1\nLine2',
          tab: 'Col1\tCol2',
          quote: 'He said "Hello"',
          backslash: 'Path\\to\\file',
        }

        await exportJSON(escaped, '/tmp/escaped.json')

        expect(fs.writeFile).toHaveBeenCalled()
      })
    })

    describe('File System Errors', () => {
      test('should handle file read errors', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: file not found'))

        await expect(importJSON('/tmp/nonexistent.json')).rejects.toThrow()
      })

      test('should handle file write errors', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        vi.mocked(fs.writeFile).mockRejectedValue(new Error('EACCES: permission denied'))

        const data = { test: 'data' }
        await expect(exportJSON(data, '/root/protected.json')).rejects.toThrow()
      })

      test('should handle disk full errors', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        vi.mocked(fs.writeFile).mockRejectedValue(new Error('ENOSPC: no space left'))

        const data = { test: 'data' }
        await expect(exportJSON(data, '/tmp/test.json')).rejects.toThrow()
      })
    })
  })
})
