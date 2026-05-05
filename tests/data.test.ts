/**
 * Test suite for data module
 * Tests for data manipulation, format detection, validation and import/export utilities
 */

/* eslint-disable max-lines-per-function */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { TxtImportOptions } from '../src/data'
import {
  // Validation
  validateExportData,
  validateCSVData,

  // Format detection
  detectFormatFromFilename,
  detectFileExtension,
  detectUniversalFormat,

  // File operations
  readFileAsText,
  exportData,
  importData,
  exportTree,
  importTree,
  exportTxt,
  importTxt,
} from '../src/data'

// Mock environment functions
vi.mock('../src/environment', () => ({
  isNode: vi.fn(),
  isBrowser: vi.fn(),
}))

// Mock fs/promises for Node.js tests
const mockFs = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
}

vi.mock('fs/promises', () => mockFs)

// Mock path module
const mockPath = {
  resolve: vi.fn().mockImplementation((p: string) => p),
}

vi.mock('path', () => mockPath)

// Import real validators - NO MOCKS to ensure actual security validation
// (Currently not used directly, but needed for comprehensive security testing)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { isValidFilePath, isValidFileSize, isValidTextContent } from '../src/validators'

// Mock CSV and JSON modules
vi.mock('../src/csv', () => ({
  exportCSV: vi.fn(),
  importCSV: vi.fn(),
}))

vi.mock('../src/json', () => ({
  exportJSON: vi.fn(),
  importJSON: vi.fn(),
}))

vi.mock('../src/tree', () => ({
  renderTreeAsText: vi.fn().mockReturnValue('mock tree text'),
}))

import { isNode, isBrowser } from '../src/environment'

const mockIsNode = vi.mocked(isNode)
const mockIsBrowser = vi.mocked(isBrowser)

describe('Data Validation', () => {
  test('validateExportData should validate array of objects', () => {
    const validObjectArray = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]

    expect(validateExportData(validObjectArray)).toBe(true)
  })

  test('validateExportData should validate array of arrays', () => {
    const validArrayArray = [
      ['id', 'name'],
      [1, 'John'],
      [2, 'Jane'],
    ]

    expect(validateExportData(validArrayArray)).toBe(true)
  })

  test('validateExportData should reject non-arrays', () => {
    expect(() => validateExportData('not an array')).toThrow('Data must be an array')
    expect(() => validateExportData(123)).toThrow('Data must be an array')
    expect(() => validateExportData({})).toThrow('Data must be an array')
  })

  test('validateExportData should reject empty arrays', () => {
    expect(() => validateExportData([])).toThrow('Data array cannot be empty')
  })

  test('validateExportData should reject mixed types', () => {
    const invalidMixed = [{ id: 1 }, 'string', 123]

    expect(() => validateExportData(invalidMixed)).toThrow(
      'All elements must be objects if first one is an object'
    )
  })

  test('validateExportData should reject inconsistent array lengths', () => {
    const invalidArrays = [
      [1, 2, 3],
      [4, 5], // Different length
    ]

    expect(() => validateExportData(invalidArrays)).toThrow('has 2 columns, but first has 3')
  })

  test('validateExportData should reject arrays with non-array elements', () => {
    const invalidArrayMix = [[1, 2, 3], 'not an array']

    expect(() => validateExportData(invalidArrayMix)).toThrow('Row 1 is not an array')
  })

  test('validateCSVData should be alias for validateExportData', () => {
    const validData = [{ test: 1 }]

    expect(validateCSVData(validData)).toBe(true)
    expect(() => validateCSVData([])).toThrow('Data array cannot be empty')
  })
})

describe('Format Detection', () => {
  test('detectFormatFromFilename should detect supported formats', () => {
    expect(detectFormatFromFilename('data.csv')).toBe('csv')
    expect(detectFormatFromFilename('config.json')).toBe('json')
    expect(detectFormatFromFilename('structure.tree')).toBe('tree')
    expect(detectFormatFromFilename('readme.txt')).toBe('txt')
  })

  test('detectFormatFromFilename should handle case insensitive extensions', () => {
    expect(detectFormatFromFilename('DATA.CSV')).toBe('csv')
    expect(detectFormatFromFilename('Config.JSON')).toBe('json')
    expect(detectFormatFromFilename('Structure.TREE')).toBe('tree')
    expect(detectFormatFromFilename('ReadMe.TXT')).toBe('txt')
  })

  test('detectFormatFromFilename should handle multiple dots', () => {
    expect(detectFormatFromFilename('backup.data.csv')).toBe('csv')
    expect(detectFormatFromFilename('config.prod.json')).toBe('json')
  })

  test('detectFormatFromFilename should reject unsupported formats', () => {
    expect(() => detectFormatFromFilename('file.xlsx')).toThrow('Unsupported file format: .xlsx')
    expect(() => detectFormatFromFilename('file.pdf')).toThrow('Unsupported file format: .pdf')
  })

  test('detectFormatFromFilename should reject files without extension', () => {
    expect(() => detectFormatFromFilename('filename')).toThrow(
      'Could not detect file format. Must have a valid extension'
    )
    expect(() => detectFormatFromFilename('')).toThrow(
      'Could not detect file format. Must have a valid extension'
    )
  })
})

describe('Universal Format Detection', () => {
  describe('detectFileExtension', () => {
    test('should detect common file extensions', () => {
      expect(detectFileExtension('document.pdf')).toBe('pdf')
      expect(detectFileExtension('image.jpg')).toBe('jpg')
      expect(detectFileExtension('spreadsheet.xlsx')).toBe('xlsx')
      expect(detectFileExtension('presentation.pptx')).toBe('pptx')
      expect(detectFileExtension('code.ts')).toBe('ts')
    })

    test('should handle case insensitive extensions', () => {
      expect(detectFileExtension('Document.PDF')).toBe('pdf')
      expect(detectFileExtension('Image.JPG')).toBe('jpg')
      expect(detectFileExtension('SPREADSHEET.XLSX')).toBe('xlsx')
    })

    test('should handle multiple dots and return last extension', () => {
      expect(detectFileExtension('backup.data.json')).toBe('json')
      expect(detectFileExtension('archive.tar.gz')).toBe('gz')
      expect(detectFileExtension('config.prod.yaml')).toBe('yaml')
    })

    test('should return null for files without extension', () => {
      expect(detectFileExtension('filename')).toBe(null)
      expect(detectFileExtension('')).toBe(null)
      expect(detectFileExtension('  ')).toBe(null)
    })

    test('should handle edge cases', () => {
      expect(detectFileExtension('.hidden')).toBe('hidden') // Hidden file with extension
      expect(detectFileExtension('file.')).toBe(null) // Empty extension becomes null
      expect(detectFileExtension(null as any)).toBe(null)
      expect(detectFileExtension(undefined as any)).toBe(null)
    })
  })

  describe('detectUniversalFormat', () => {
    test('should detect Microsoft Office formats', () => {
      const docx = detectUniversalFormat('report.docx')
      expect(docx.extension).toBe('docx')
      expect(docx.category).toBe('document')
      expect(docx.isText).toBe(false)
      expect(docx.isBinary).toBe(true)
      expect(docx.mimeType).toContain('wordprocessingml.document')

      const xlsx = detectUniversalFormat('data.xlsx')
      expect(xlsx.extension).toBe('xlsx')
      expect(xlsx.category).toBe('spreadsheet')
      expect(xlsx.mimeType).toContain('spreadsheetml.sheet')

      const pptx = detectUniversalFormat('slides.pptx')
      expect(pptx.extension).toBe('pptx')
      expect(pptx.category).toBe('presentation')
      expect(pptx.mimeType).toContain('presentationml.presentation')
    })

    test('should detect legacy Office formats', () => {
      const doc = detectUniversalFormat('old.doc')
      expect(doc.extension).toBe('doc')
      expect(doc.category).toBe('document')
      expect(doc.mimeType).toBe('application/msword')

      const xls = detectUniversalFormat('legacy.xls')
      expect(xls.extension).toBe('xls')
      expect(xls.category).toBe('spreadsheet')
      expect(xls.mimeType).toBe('application/vnd.ms-excel')

      const ppt = detectUniversalFormat('old-slides.ppt')
      expect(ppt.extension).toBe('ppt')
      expect(ppt.category).toBe('presentation')
      expect(ppt.mimeType).toBe('application/vnd.ms-powerpoint')
    })

    test('should detect programming languages', () => {
      const ts = detectUniversalFormat('app.ts')
      expect(ts.extension).toBe('ts')
      expect(ts.category).toBe('code')
      expect(ts.isText).toBe(true)
      expect(ts.mimeType).toBe('application/typescript')

      const py = detectUniversalFormat('script.py')
      expect(py.extension).toBe('py')
      expect(py.category).toBe('code')
      expect(py.mimeType).toBe('text/x-python')

      const java = detectUniversalFormat('Main.java')
      expect(java.extension).toBe('java')
      expect(java.category).toBe('code')
      expect(java.mimeType).toBe('text/x-java-source')
    })

    test('should detect image formats', () => {
      const jpg = detectUniversalFormat('photo.jpg')
      expect(jpg.extension).toBe('jpg')
      expect(jpg.category).toBe('image')
      expect(jpg.isText).toBe(false)
      expect(jpg.isBinary).toBe(true)
      expect(jpg.mimeType).toBe('image/jpeg')

      const svg = detectUniversalFormat('icon.svg')
      expect(svg.extension).toBe('svg')
      expect(svg.category).toBe('image')
      expect(svg.isText).toBe(true) // SVG is text-based
      expect(svg.isBinary).toBe(false)
      expect(svg.mimeType).toBe('image/svg+xml')

      const webp = detectUniversalFormat('modern.webp')
      expect(webp.extension).toBe('webp')
      expect(webp.category).toBe('image')
      expect(webp.mimeType).toBe('image/webp')
    })

    test('should detect media formats', () => {
      const mp4 = detectUniversalFormat('video.mp4')
      expect(mp4.extension).toBe('mp4')
      expect(mp4.category).toBe('video')
      expect(mp4.isText).toBe(false)
      expect(mp4.mimeType).toBe('video/mp4')

      const mp3 = detectUniversalFormat('song.mp3')
      expect(mp3.extension).toBe('mp3')
      expect(mp3.category).toBe('audio')
      expect(mp3.mimeType).toBe('audio/mpeg')
    })

    test('should detect archive formats', () => {
      const zip = detectUniversalFormat('package.zip')
      expect(zip.extension).toBe('zip')
      expect(zip.category).toBe('archive')
      expect(zip.mimeType).toBe('application/zip')

      const sevenZ = detectUniversalFormat('backup.7z')
      expect(sevenZ.extension).toBe('7z')
      expect(sevenZ.category).toBe('archive')
      expect(sevenZ.mimeType).toBe('application/x-7z-compressed')
    })

    test('should detect configuration files', () => {
      const yaml = detectUniversalFormat('config.yaml')
      expect(yaml.extension).toBe('yaml')
      expect(yaml.category).toBe('data')
      expect(yaml.isText).toBe(true)
      expect(yaml.mimeType).toBe('application/yaml')

      const toml = detectUniversalFormat('Cargo.toml')
      expect(toml.extension).toBe('toml')
      expect(toml.category).toBe('config')
      expect(toml.mimeType).toBe('application/toml')
    })

    test('should detect font formats', () => {
      const ttf = detectUniversalFormat('font.ttf')
      expect(ttf.extension).toBe('ttf')
      expect(ttf.category).toBe('font')
      expect(ttf.isText).toBe(false)
      expect(ttf.isBinary).toBe(true)
      expect(ttf.mimeType).toBe('font/ttf')

      const woff2 = detectUniversalFormat('webfont.woff2')
      expect(woff2.extension).toBe('woff2')
      expect(woff2.category).toBe('font')
      expect(woff2.mimeType).toBe('font/woff2')
    })

    test('should handle unknown extensions', () => {
      const unknown = detectUniversalFormat('file.unknown')
      expect(unknown.extension).toBe('unknown')
      expect(unknown.category).toBe('unknown')
      expect(unknown.isText).toBe(false)
      expect(unknown.isBinary).toBe(false)
      expect(unknown.mimeType).toBe(null)
    })

    test('should handle files without extension', () => {
      const noExt = detectUniversalFormat('filename')
      expect(noExt.extension).toBe(null)
      expect(noExt.category).toBe('unknown')
      expect(noExt.isText).toBe(false)
      expect(noExt.isBinary).toBe(false)
      expect(noExt.mimeType).toBe(null)
    })

    test('should handle edge cases', () => {
      expect(detectUniversalFormat('')).toEqual({
        extension: null,
        category: 'unknown',
        isText: false,
        isBinary: false,
        mimeType: null,
      })

      expect(detectUniversalFormat('  ')).toEqual({
        extension: null,
        category: 'unknown',
        isText: false,
        isBinary: false,
        mimeType: null,
      })
    })

    test('should be case insensitive', () => {
      const upperCase = detectUniversalFormat('DOCUMENT.PDF')
      const lowerCase = detectUniversalFormat('document.pdf')

      expect(upperCase).toEqual(lowerCase)
      expect(upperCase.extension).toBe('pdf')
      expect(upperCase.category).toBe('document')
    })
  })
})

describe('File Reading (Node.js)', () => {
  beforeEach(() => {
    mockIsNode.mockReturnValue(true)
    mockIsBrowser.mockReturnValue(false)
  })

  test('readFileAsText should read file in Node.js environment', async () => {
    const mockContent = 'test file content'
    mockFs.readFile.mockResolvedValue(mockContent)

    const result = await readFileAsText('/path/to/file.txt')

    expect(result).toBe(mockContent)
    expect(mockFs.readFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf8')
  })

  test('readFileAsText should use custom encoding in Node.js', async () => {
    const mockContent = 'content with custom encoding'
    mockFs.readFile.mockResolvedValue(mockContent)

    await readFileAsText('/path/to/file.txt', 'latin1')

    expect(mockFs.readFile).toHaveBeenCalledWith('/path/to/file.txt', 'latin1')
  })
})

describe('File Reading (Browser)', () => {
  beforeEach(() => {
    mockIsNode.mockReturnValue(false)
    mockIsBrowser.mockReturnValue(true)

    // Mock FileReader
    global.FileReader = class {
      onload: ((e: any) => void) | null = null
      onerror: (() => void) | null = null

      readAsText(_file: File) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'file content from browser' } })
          }
        }, 0)
      }
    } as any
  })

  test('readFileAsText should read File object in browser', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

    const result = await readFileAsText(mockFile)

    expect(result).toBe('file content from browser')
  })

  test('readFileAsText should handle FileReader errors', async () => {
    global.FileReader = class {
      onload: ((e: any) => void) | null = null
      onerror: (() => void) | null = null

      readAsText() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror()
          }
        }, 0)
      }
    } as any

    const mockFile = new File(['test'], 'test.txt')

    await expect(readFileAsText(mockFile)).rejects.toThrow('Error reading file')
  })
})

describe('Export Functions', () => {
  beforeEach(() => {
    mockIsNode.mockReturnValue(true)
    mockIsBrowser.mockReturnValue(false)
    vi.clearAllMocks()
  })

  test('exportData should delegate to CSV module', async () => {
    const { exportCSV } = await import('../src/csv')
    const mockExportCSV = vi.mocked(exportCSV)

    const testData = [{ id: 1, name: 'test' }]
    await exportData(testData, 'output.csv')

    expect(mockExportCSV).toHaveBeenCalledWith(testData, 'output.csv', undefined)
  })

  test('exportData should delegate to JSON module', async () => {
    const { exportJSON } = await import('../src/json')
    const mockExportJSON = vi.mocked(exportJSON)

    const testData = { key: 'value' }
    await exportData(testData, 'output.json')

    expect(mockExportJSON).toHaveBeenCalledWith(testData, 'output.json', undefined)
  })

  test('exportTree should write tree file in Node.js', async () => {
    const testData = [{ name: 'root', children: [{ name: 'child' }] }]

    await exportTree(testData, 'output.tree')

    expect(mockFs.writeFile).toHaveBeenCalledWith('output.tree', 'mock tree text', {
      encoding: 'utf-8',
    })
  })

  test('exportTxt should handle string data', async () => {
    const testData = 'Simple text content'

    await exportTxt(testData, 'output.txt')

    expect(mockFs.writeFile).toHaveBeenCalledWith('output.txt', testData, { encoding: 'utf-8' })
  })

  test('exportTxt should handle array data with default separator', async () => {
    const testData = ['line1', 'line2', 'line3']

    await exportTxt(testData, 'output.txt')

    expect(mockFs.writeFile).toHaveBeenCalledWith('output.txt', 'line1\nline2\nline3', {
      encoding: 'utf-8',
    })
  })

  test('exportTxt should handle object data as JSON', async () => {
    const testData = { key: 'value', number: 42 }

    await exportTxt(testData, 'output.txt')

    const expectedContent = JSON.stringify(testData, null, 2)
    expect(mockFs.writeFile).toHaveBeenCalledWith('output.txt', expectedContent, {
      encoding: 'utf-8',
    })
  })

  test('exportTxt should use custom stringify function', async () => {
    const testData = { test: 'value' }
    const options = {
      stringify: (obj: any) => `Custom: ${obj.test}`,
    }

    await exportTxt(testData, 'output.txt', options)

    expect(mockFs.writeFile).toHaveBeenCalledWith('output.txt', 'Custom: value', {
      encoding: 'utf-8',
    })
  })
})

describe('Import Functions', () => {
  beforeEach(() => {
    mockIsNode.mockReturnValue(true)
    mockIsBrowser.mockReturnValue(false)
    vi.clearAllMocks()
  })

  test('importData should delegate to CSV module', async () => {
    const { importCSV } = await import('../src/csv')
    const mockImportCSV = vi.mocked(importCSV)
    mockImportCSV.mockResolvedValue([{ id: 1 }])

    const result = await importData('input.csv')

    expect(mockImportCSV).toHaveBeenCalledWith('input.csv', undefined)
    expect(result).toEqual([{ id: 1 }])
  })

  test('importData should delegate to JSON module', async () => {
    const { importJSON } = await import('../src/json')
    const mockImportJSON = vi.mocked(importJSON)
    mockImportJSON.mockResolvedValue({ key: 'value' })

    const result = await importData('input.json')

    expect(mockImportJSON).toHaveBeenCalledWith('input.json', undefined)
    expect(result).toEqual({ key: 'value' })
  })

  test('importTree should read file in Node.js', async () => {
    const mockContent = 'tree content'
    mockFs.readFile.mockResolvedValue(mockContent)

    const result = await importTree('input.tree')

    expect(mockFs.readFile).toHaveBeenCalledWith('input.tree', { encoding: 'utf-8' })
    expect(result).toBe(mockContent)
  })

  test('importTxt should read and validate file with REAL validators', async () => {
    const mockContent = 'text file content'
    mockFs.readFile.mockResolvedValue(mockContent)
    mockFs.stat.mockResolvedValue({ size: 1000 })

    const result = await importTxt('input.txt')

    expect(mockFs.stat).toHaveBeenCalled()
    expect(mockFs.readFile).toHaveBeenCalled()
    // REAL validators are used - no mocks, actual security checks happen
    expect(result).toBe(mockContent)
  })

  test('importTxt should handle file not found error', async () => {
    const error = new Error('File not found')
    ;(error as any).code = 'ENOENT'
    mockFs.stat.mockRejectedValue(error)

    await expect(importTxt('nonexistent.txt')).rejects.toThrow('File not found: nonexistent.txt')
  })

  test('importTxt should reject oversized files with REAL validator', async () => {
    const largeFileSize = 20 * 1024 * 1024 // 20MB
    mockFs.stat.mockResolvedValue({ size: largeFileSize })
    // REAL validator will reject files > 10MB limit

    await expect(importTxt('large.txt')).rejects.toThrow(
      `File too large: ${largeFileSize} bytes (max: 10485760)`
    )
  })

  test('importTxt should reject unsafe file paths with REAL path traversal attack', async () => {
    // REAL path traversal attack - validator will detect this
    await expect(importTxt('../../../etc/passwd')).rejects.toThrow('Invalid or unsafe file path')
    await expect(importTxt('..\\..\\..\\windows\\system32')).rejects.toThrow(
      'Invalid or unsafe file path'
    )
  })

  test('importTxt should reject REAL XSS attack content', async () => {
    const xssContent = '<script>alert("XSS")</script>'
    mockFs.readFile.mockResolvedValue(xssContent)
    mockFs.stat.mockResolvedValue({ size: xssContent.length })

    // REAL validator will detect XSS attack
    await expect(importTxt('xss-attack.txt')).rejects.toThrow(
      'File contains potentially dangerous content or exceeds security limits'
    )
  })

  test('importTxt should reject REAL SQL injection content', async () => {
    const sqlInjection = "admin'; DROP TABLE users; --"
    mockFs.readFile.mockResolvedValue(sqlInjection)
    mockFs.stat.mockResolvedValue({ size: sqlInjection.length })

    // REAL validator will detect SQL injection patterns in path
    await expect(importTxt(sqlInjection)).rejects.toThrow('Invalid or unsafe file path')
  })

  test('importTxt should skip validation when disabled', async () => {
    const dangerousContent = '<script>alert(1)</script>'
    mockFs.readFile.mockResolvedValue(dangerousContent)
    mockFs.stat.mockResolvedValue({ size: dangerousContent.length })

    const options = { validateSecurity: false, sanitize: false }
    const result = await importTxt('input.txt', options)

    // When validation is disabled, dangerous content passes through
    expect(result).toBe(dangerousContent)
  })
})

describe('Browser Export/Import Limitations', () => {
  beforeEach(() => {
    mockIsNode.mockReturnValue(false)
    mockIsBrowser.mockReturnValue(true)
  })

  test('importTree should reject in browser environment', async () => {
    await expect(importTree('test.tree')).rejects.toThrow(
      '.tree file import is not supported in browser'
    )
  })

  test('importTxt should reject in browser environment', async () => {
    await expect(importTxt('test.txt')).rejects.toThrow(
      '.txt file import is not supported in browser'
    )
  })

  test('exportTree should trigger download in browser', async () => {
    // Mock DOM APIs
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }

    const mockBlob = {}
    const mockURL = 'blob:mock-url'

    global.document = {
      createElement: vi.fn().mockReturnValue(mockLink),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    } as any

    global.Blob = vi.fn().mockReturnValue(mockBlob) as any
    global.URL = {
      createObjectURL: vi.fn().mockReturnValue(mockURL),
      revokeObjectURL: vi.fn(),
    } as any

    const testData = [{ name: 'test' }]
    await exportTree(testData, 'path/to/test.tree')

    expect(global.Blob).toHaveBeenCalledWith(['mock tree text'], {
      type: 'text/plain;charset=utf-8',
    })
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
    expect(mockLink.href).toBe(mockURL)
    expect(mockLink.download).toBe('test.tree')
    expect(mockLink.click).toHaveBeenCalled()
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockURL)
  })
})

describe('Environment Error Handling', () => {
  test('readFileAsText should throw for invalid environment/parameter combination', async () => {
    mockIsNode.mockReturnValue(false)
    mockIsBrowser.mockReturnValue(false)

    await expect(readFileAsText('file.txt')).rejects.toThrow(
      'Invalid parameter for current environment'
    )
  })

  test('readFileAsText should throw when Node.js receives File object', async () => {
    mockIsNode.mockReturnValue(true)
    mockIsBrowser.mockReturnValue(false)

    const mockFile = new File(['content'], 'test.txt')

    await expect(readFileAsText(mockFile as any)).rejects.toThrow(
      'Invalid parameter for current environment'
    )
  })

  test('readFileAsText should throw when browser receives string path', async () => {
    mockIsNode.mockReturnValue(false)
    mockIsBrowser.mockReturnValue(true)

    await expect(readFileAsText('file.txt')).rejects.toThrow(
      'Invalid parameter for current environment'
    )
  })
})

describe('Edge Cases and Error Handling', () => {
  test('exportTree should validate input data', async () => {
    mockIsNode.mockReturnValue(true)

    await expect(exportTree('not an array' as any, 'output.tree')).rejects.toThrow(
      'Data for tree format must be an array of nodes'
    )

    await expect(exportTree(null as any, 'output.tree')).rejects.toThrow(
      'Data for tree format must be an array of nodes'
    )
  })

  test('exportTxt should handle primitive values', async () => {
    mockIsNode.mockReturnValue(true)

    await exportTxt(42, 'number.txt')
    expect(mockFs.writeFile).toHaveBeenCalledWith('number.txt', '42', { encoding: 'utf-8' })

    await exportTxt(true, 'boolean.txt')
    expect(mockFs.writeFile).toHaveBeenCalledWith('boolean.txt', 'true', { encoding: 'utf-8' })

    await exportTxt(null, 'null.txt')
    expect(mockFs.writeFile).toHaveBeenCalledWith('null.txt', 'null', { encoding: 'utf-8' })
  })

  test('exportTxt should handle custom separator for arrays', async () => {
    mockIsNode.mockReturnValue(true)

    const testData = [1, 2, 3]
    const options = { separator: ' | ' }

    await exportTxt(testData, 'output.txt', options)

    expect(mockFs.writeFile).toHaveBeenCalledWith('output.txt', '1 | 2 | 3', { encoding: 'utf-8' })
  })

  test('importTxt should use custom options with REAL validators', async () => {
    mockIsNode.mockReturnValue(true)
    mockFs.readFile.mockResolvedValue('test content')
    mockFs.stat.mockResolvedValue({ size: 500 })

    const options: TxtImportOptions = {
      maxFileSize: 1024,
      maxLength: 2000,
      validateSecurity: true,
      sanitize: false,
    }

    const result = await importTxt('test.txt', options)

    // REAL validators check file size (500 < 1024) and content length (12 < 2000)
    expect(result).toBe('test content')
  })

  test('exportData should throw for unsupported format', async () => {
    // Mock detectFormatFromFilename to return unsupported format

    await expect(exportData({}, 'file.unsupported')).rejects.toThrow(
      'Unsupported file format: .unsupported'
    )
  })

  test('importData should throw for unsupported format', async () => {
    await expect(importData('file.unsupported')).rejects.toThrow(
      'Unsupported file format: .unsupported'
    )
  })
})
