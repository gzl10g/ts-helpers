/**
 * Tests for CSV utilities
 */

/* eslint-disable max-lines-per-function */

import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest'
import * as fs from 'fs/promises'
import { exportCSV, importCSV } from '../src/csv'

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

describe('[CSV Utilities] Export and Import Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('[CSV Export] File Generation', () => {
    test('[Node.js] should export CSV with UTF-8 BOM and proper encoding', async ({ annotate }) => {
      await annotate('🔧 Setup: Mock Node.js environment and prepare test data')
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const testData = [
        { name: 'John', age: 30, city: 'Madrid' },
        { name: 'Jane', age: 25, city: 'Barcelona' },
      ]

      await annotate('📁 Action: Export CSV data to file system with Node.js fs module')
      await exportCSV(testData, '/tmp/test.csv')

      await annotate('✅ Verification: File written with UTF-8 encoding and semicolon delimiter')
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/test.csv',
        expect.stringContaining('name;age;city'),
        { encoding: 'utf-8' }
      )
    })

    test('[Browser] should trigger download with Blob and DOM manipulation', async ({
      annotate,
    }) => {
      await annotate('🌐 Setup: Mock browser environment and DOM APIs')
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(false)

      const mockElement = createMockDOM()
      const testData = [{ name: 'Test', value: 123 }]

      await annotate('⬇️ Action: Trigger browser download using Blob API and temporary link')
      await exportCSV(testData, 'test.csv')

      await annotate('✅ Verification: Blob created with CSV content and download initiated')
      expect(global.Blob).toHaveBeenCalledWith([expect.stringContaining('name;value')], {
        type: 'text/csv;charset=utf-8',
      })
      expect(mockElement.download).toBe('test.csv')
      expect(mockElement.click).toHaveBeenCalled()
    })

    test('[Options] should respect custom delimiter and header settings', async ({ annotate }) => {
      await annotate('⚙️ Setup: Configure custom CSV options with comma delimiter and no headers')
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const testData = [{ a: 1, b: 2 }]
      const options = { delimiter: ',', header: false }

      await annotate('📝 Action: Export with custom options overriding defaults')
      await exportCSV(testData, '/tmp/test.csv', options)

      await annotate('✅ Verification: Output uses comma delimiter instead of default semicolon')
      expect(fs.writeFile).toHaveBeenCalledWith('/tmp/test.csv', expect.stringContaining('1,2'), {
        encoding: 'utf-8',
      })
    })
  })

  describe('[CSV Import] File Reading and Parsing', () => {
    test('[Node.js] should read file and parse with semicolon delimiter', async ({ annotate }) => {
      await annotate('📂 Setup: Mock file system with Spanish CSV format (semicolon delimiter)')
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const csvContent = 'name;age;city\nJohn;30;Madrid\nJane;25;Barcelona'
      vi.mocked(fs.readFile).mockResolvedValue(csvContent)

      await annotate('📖 Action: Read and parse CSV file using default semicolon delimiter')
      const result = await importCSV('/tmp/test.csv')

      await annotate('✅ Verification: File read correctly and parsed into object array')
      expect(fs.readFile).toHaveBeenCalledWith('/tmp/test.csv', { encoding: 'utf-8' })
      expect(result).toEqual([
        { name: 'John', age: '30', city: 'Madrid' },
        { name: 'Jane', age: '25', city: 'Barcelona' },
      ])
    })

    test('[Browser] should throw informative error for unsupported operation', async ({
      annotate,
    }) => {
      await annotate('🚫 Setup: Mock browser environment where file system access is restricted')
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(false)

      await annotate('⚠️ Action: Attempt CSV import in browser (should fail with clear message)')
      await expect(importCSV('test.csv')).rejects.toThrow('CSV import not supported in browser')
      await annotate('✅ Verification: Clear error message guides user to use File API instead')
    })

    test('[Options] should parse with custom delimiter and settings', async ({ annotate }) => {
      await annotate('🔧 Setup: Mock CSV file with comma delimiter (English format)')
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      const csvContent = 'a,b\n1,2\n3,4'
      vi.mocked(fs.readFile).mockResolvedValue(csvContent)

      await annotate('⚙️ Action: Parse with custom comma delimiter option')
      const options = { delimiter: ',' }
      const result = await importCSV('/tmp/test.csv', options)

      await annotate('✅ Verification: Correctly parsed with comma instead of default semicolon')
      expect(result).toEqual([
        { a: '1', b: '2' },
        { a: '3', b: '4' },
      ])
    })

    test('[Edge Case] should return empty array for empty file content', async ({ annotate }) => {
      await annotate('📄 Setup: Mock empty CSV file to test edge case handling')
      const { isNode } = await import('../src/environment')
      vi.mocked(isNode).mockReturnValue(true)

      vi.mocked(fs.readFile).mockResolvedValue('')

      await annotate('🔍 Action: Attempt to parse completely empty file')
      const result = await importCSV('/tmp/empty.csv')

      await annotate('✅ Verification: Gracefully returns empty array instead of crashing')
      expect(result).toEqual([])
    })
  })

  describe('[CRITICAL] Error Handling & Edge Cases', () => {
    describe('Malformed CSV Data', () => {
      test('should handle CSV with inconsistent column counts', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const malformed = 'name;age\nJohn;30\nJane;25;extra;columns'
        vi.mocked(fs.readFile).mockResolvedValue(malformed)

        const result = await importCSV('/tmp/malformed.csv')

        // Should handle gracefully - extra columns ignored or added
        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
      })

      test('should handle CSV with missing columns', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const missing = 'name;age;city\nJohn;30\nJane;25;Barcelona'
        vi.mocked(fs.readFile).mockResolvedValue(missing)

        const result = await importCSV('/tmp/missing.csv')

        expect(result).toBeDefined()
        expect(result[0]).toHaveProperty('name')
        // First row missing city should have empty or undefined value
      })

      test('should handle CSV with embedded delimiters in quoted fields', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const quoted = 'name;description\nJohn;"Contains ; semicolon"\nJane;"Normal text"'
        vi.mocked(fs.readFile).mockResolvedValue(quoted)

        const result = await importCSV('/tmp/quoted.csv')

        expect(result).toBeDefined()
        // Should handle quoted fields correctly
        expect(result.length).toBeGreaterThan(0)
      })

      test('should handle CSV with only headers', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const headersOnly = 'name;age;city'
        vi.mocked(fs.readFile).mockResolvedValue(headersOnly)

        const result = await importCSV('/tmp/headers-only.csv')

        expect(result).toEqual([])
      })

      test('should handle CSV with empty lines', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const emptyLines = 'name;age\n\nJohn;30\n\n\nJane;25\n\n'
        vi.mocked(fs.readFile).mockResolvedValue(emptyLines)

        const result = await importCSV('/tmp/empty-lines.csv')

        expect(result).toBeDefined()
        expect(result.length).toBe(2) // Should skip empty lines
      })

      test('should handle CSV with special characters', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const special = 'name;message\nJohn;Hello\nWorld\nJane;Test\tTab'
        vi.mocked(fs.readFile).mockResolvedValue(special)

        const result = await importCSV('/tmp/special.csv')

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
      })
    })

    describe('Invalid Input Handling', () => {
      test('should reject null/undefined data on export', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        await expect(exportCSV(null as any, '/tmp/test.csv')).rejects.toThrow()
        await expect(exportCSV(undefined as any, '/tmp/test.csv')).rejects.toThrow()
      })

      test('should reject empty array on export', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        await expect(exportCSV([], '/tmp/test.csv')).rejects.toThrow()
      })

      test('should reject non-array data on export', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        await expect(exportCSV({ name: 'test' } as any, '/tmp/test.csv')).rejects.toThrow()
      })

      test('should reject invalid path on export', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const data = [{ name: 'test' }]

        await expect(exportCSV(data, '')).rejects.toThrow()
        await expect(exportCSV(data, null as any)).rejects.toThrow()
      })

      test('should reject invalid path on import', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        await expect(importCSV('')).rejects.toThrow()
        await expect(importCSV(null as any)).rejects.toThrow()
      })
    })

    describe('File System Errors', () => {
      test('should handle file read errors gracefully', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: file not found'))

        await expect(importCSV('/tmp/nonexistent.csv')).rejects.toThrow()
      })

      test('should handle file write errors gracefully', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        vi.mocked(fs.writeFile).mockRejectedValue(new Error('EACCES: permission denied'))

        const data = [{ name: 'test' }]
        await expect(exportCSV(data, '/root/protected.csv')).rejects.toThrow()
      })

      test('should handle disk full errors', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        vi.mocked(fs.writeFile).mockRejectedValue(new Error('ENOSPC: no space left on device'))

        const data = [{ name: 'test' }]
        await expect(exportCSV(data, '/tmp/test.csv')).rejects.toThrow()
      })
    })

    describe('Data Type Edge Cases', () => {
      test('should handle arrays with mixed types', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const mixed = [
          { name: 'John', age: 30 },
          { name: 'Jane', age: '25' }, // String age
          { name: 'Bob', age: null }, // Null age
        ]

        await exportCSV(mixed, '/tmp/mixed.csv')

        expect(fs.writeFile).toHaveBeenCalled()
      })

      test('should handle objects with undefined values', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const withUndefined = [
          { name: 'John', age: undefined, city: 'Madrid' },
          { name: 'Jane', age: 25, city: undefined },
        ]

        await exportCSV(withUndefined, '/tmp/undefined.csv')

        expect(fs.writeFile).toHaveBeenCalled()
      })

      test('should handle objects with nested structures', async () => {
        const { isNode } = await import('../src/environment')
        vi.mocked(isNode).mockReturnValue(true)

        const nested = [
          { name: 'John', address: { city: 'Madrid', zip: '28001' } },
          { name: 'Jane', address: { city: 'Barcelona', zip: '08001' } },
        ]

        await exportCSV(nested, '/tmp/nested.csv')

        // Should stringify nested objects
        expect(fs.writeFile).toHaveBeenCalled()
      })
    })
  })
})
