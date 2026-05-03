/**
 * Data manipulation utilities for multiple formats with automatic detection
 * Consolidated from data/index module
 */

/* eslint-disable max-lines-per-function */

import { DataError, TsHelpersErrorCode, createValidationError } from './errors'
import { isNode, isBrowser } from './environment'

// =============================================================================
// SHARED TYPES
// =============================================================================

/**
 * Type for data - array of objects or array of arrays (for CSV, etc.)
 */
export type ExportData = Record<string, any>[] | string[][]

/**
 * Type for imported data - can include string for .tree files
 */
export type ImportData = ExportData | string | any

/**
 * Type for CSV data (backward compatibility)
 */
export type CSVData = ExportData

/**
 * Supported format types
 */
export type ExportFormat = 'csv' | 'json' | 'tree' | 'txt'

/**
 * Universal file format detection - detects any file extension
 */
export type FileFormat = string

// =============================================================================
// ENVIRONMENT UTILITIES
// =============================================================================

/**
 * Reads a file as text in any environment (Node.js or Browser)
 *
 * Universal file reading utility that adapts to the runtime environment.
 * In Node.js, reads from filesystem. In Browser, reads from File object.
 *
 * Environment behavior:
 * - **Node.js**: Pass file path as string, reads from filesystem
 * - **Browser**: Pass File object (from input[type="file"]), reads with FileReader API
 *
 * @param fileOrPath - File path string (Node.js) or File object (Browser)
 * @param encoding - Text encoding for Node.js filesystem read (default: 'utf8')
 * @returns Promise<string> File contents as text
 *
 * @example
 * ```typescript
 * // Node.js - Read from filesystem
 * const config = await readFileAsText('./config.json')
 * const data = JSON.parse(config)
 *
 * // Browser - Read from File input
 * // HTML: <input type="file" id="fileInput">
 * const input = document.getElementById('fileInput') as HTMLInputElement
 * input.addEventListener('change', async (e) => {
 *   const file = e.target.files[0]
 *   const content = await readFileAsText(file)
 *   console.log('File content:', content)
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Load and parse CSV from user upload (Browser)
 * async function handleCSVUpload(file: File) {
 *   const csvText = await readFileAsText(file)
 *   const rows = csvText.split('\n').map(row => row.split(';'))
 *   console.log(`Loaded ${rows.length} rows`)
 *   return rows
 * }
 * ```
 *
 * @throws {DataError} If called with invalid parameter for current environment
 * @see {@link importData} for format-aware file importing
 */
export const readFileAsText = async (
  fileOrPath: string | File,
  encoding: BufferEncoding = 'utf8'
): Promise<string> => {
  if (isNode() && typeof fileOrPath === 'string') {
    // Node.js environment - read from filesystem
    const fs = await import('fs/promises')
    return fs.readFile(fileOrPath, encoding)
  } else if (isBrowser() && fileOrPath instanceof File) {
    // Browser environment - read File object
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsText(fileOrPath)
    })
  } else {
    throw new DataError(
      'Invalid parameter for current environment',
      TsHelpersErrorCode.ENVIRONMENT_NOT_SUPPORTED,
      {
        data: {
          isNodeEnv: isNode(),
          isBrowserEnv: isBrowser(),
          parameterType: typeof fileOrPath,
        },
      }
    )
  }
}

// =============================================================================
// DATA VALIDATION
// =============================================================================

/**
 * Validates that data is exportable (array of objects or array of arrays)
 *
 * Ensures data structure is compatible with export formats (CSV, JSON).
 * Validates consistency: all elements must be same type, arrays must have equal length.
 *
 * Validation rules:
 * - Must be non-empty array
 * - If first element is object → all must be objects (no arrays/primitives)
 * - If first element is array → all must be arrays with equal length
 * - Null/undefined not allowed
 *
 * @param data - Data to validate for export
 * @returns `true` if data is valid (type guard for ExportData)
 *
 * @example
 * ```typescript
 * // Valid: Array of objects (typical use case)
 * const users = [
 *   { id: 1, name: 'Alice', role: 'Admin' },
 *   { id: 2, name: 'Bob', role: 'User' }
 * ]
 * validateExportData(users) // ✅ true
 * await exportData(users, 'users.csv')
 * ```
 *
 * @example
 * ```typescript
 * // Valid: Array of arrays (matrix/tabular data)
 * const matrix = [
 *   ['Name', 'Age', 'City'],
 *   ['Alice', 25, 'Madrid'],
 *   ['Bob', 30, 'Barcelona']
 * ]
 * validateExportData(matrix) // ✅ true
 * await exportData(matrix, 'data.csv')
 * ```
 *
 * @example
 * ```typescript
 * // Invalid: Mixed types - throws ValidationError
 * const mixed = [
 *   { id: 1, name: 'Alice' },
 *   ['Bob', 30] // ❌ Array mixed with object
 * ]
 * try {
 *   validateExportData(mixed)
 * } catch (error) {
 *   console.error(error.message)
 *   // 'All elements must be objects if first one is an object'
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Invalid: Inconsistent array lengths - throws ValidationError
 * const uneven = [
 *   ['Alice', 25, 'Madrid'],
 *   ['Bob', 30] // ❌ Missing city
 * ]
 * try {
 *   validateExportData(uneven)
 * } catch (error) {
 *   console.error(error.message)
 *   // 'Row 1 has 2 columns, but first has 3'
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Pre-export validation with error handling
 * async function safeExportUsers(users: any[], filename: string) {
 *   try {
 *     // Validate before export
 *     validateExportData(users)
 *     await exportData(users, filename)
 *     console.log(`✅ Exported ${users.length} users to ${filename}`)
 *   } catch (error) {
 *     console.error('Export failed:', error.message)
 *     // Log validation errors for debugging
 *     if (error.code === 'VALIDATION_ERROR') {
 *       console.error('Invalid data structure:', error.details)
 *     }
 *   }
 * }
 * ```
 *
 * @throws {ValidationError} If data is not an array
 * @throws {ValidationError} If array is empty
 * @throws {ValidationError} If elements have inconsistent types
 * @throws {ValidationError} If array rows have different lengths
 *
 * @see {@link exportData} for universal export using validated data
 * @see {@link ExportData} for type definition
 */
export function validateExportData(data: any): data is ExportData {
  if (!Array.isArray(data)) {
    throw createValidationError('Data must be an array', 'data', typeof data)
  }

  if (data.length === 0) {
    throw createValidationError('Data array cannot be empty', 'data.length', data.length)
  }

  const firstItem = data[0]
  const isObjectArray =
    typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)
  const isArrayOfArrays = Array.isArray(firstItem)

  if (!isObjectArray && !isArrayOfArrays) {
    throw createValidationError(
      'Data must be an array of objects or an array of arrays',
      'data[0]',
      typeof firstItem
    )
  }

  // Validate consistency according to first element type
  if (isObjectArray) {
    // If first element is object, all must be objects
    for (let i = 1; i < data.length; i++) {
      const item = data[i]
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        throw createValidationError(
          'All elements must be objects if first one is an object',
          `data[${i}]`,
          typeof item
        )
      }
    }
  } else if (isArrayOfArrays) {
    // If first element is array, all must be arrays with equal length
    const firstRowLength = firstItem.length
    for (let i = 1; i < data.length; i++) {
      if (!Array.isArray(data[i])) {
        throw createValidationError(`Row ${i} is not an array`, `data[${i}]`, typeof data[i])
      }
      if (data[i].length !== firstRowLength) {
        throw createValidationError(
          `Row ${i} has ${data[i].length} columns, but first has ${firstRowLength}`,
          `data[${i}].length`,
          { expected: firstRowLength, actual: data[i].length }
        )
      }
    }
  }

  return true
}

/**
 * Alias for validateExportData for CSV backward compatibility
 */
export const validateCSVData = validateExportData

// =============================================================================
// FORMAT DETECTION
// =============================================================================

/**
 * Detects file format based on filename extension
 *
 * Analyzes filename to determine export format for automatic format selection.
 * Supports CSV, JSON, Tree, and TXT formats. Case-insensitive.
 *
 * @param filename - Filename with extension
 * @returns Detected format ('csv' | 'json' | 'tree' | 'txt')
 *
 * @example
 * ```typescript
 * // CSV detection
 * detectFormatFromFilename('users.csv') // 'csv'
 * detectFormatFromFilename('DATA.CSV') // 'csv' (case-insensitive)
 * ```
 *
 * @example
 * ```typescript
 * // JSON detection
 * detectFormatFromFilename('config.json') // 'json'
 * detectFormatFromFilename('data.JSON') // 'json'
 * ```
 *
 * @example
 * ```typescript
 * // Tree structure detection
 * detectFormatFromFilename('structure.tree') // 'tree'
 * ```
 *
 * @example
 * ```typescript
 * // Plain text detection
 * detectFormatFromFilename('notes.txt') // 'txt'
 * detectFormatFromFilename('log.TXT') // 'txt'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Dynamic export routing
 * async function smartExport(data: any[], filename: string) {
 *   const format = detectFormatFromFilename(filename)
 *   console.log(`Exporting as ${format.toUpperCase()}...`)
 *
 *   await exportData(data, filename)
 *   console.log(`✅ Export completed: ${filename}`)
 * }
 *
 * smartExport(users, 'users.csv')   // Exports as CSV
 * smartExport(config, 'config.json') // Exports as JSON
 * ```
 *
 * @throws {DataError} If filename has no extension
 * @throws {DataError} If extension is not supported (.csv, .json, .tree, .txt)
 *
 * @see {@link detectFileExtension} for universal extension detection (any file type)
 * @see {@link detectUniversalFormat} for detailed format metadata
 * @see {@link exportData} for universal export using detected format
 *
 * @deprecated Use detectFileExtension for universal detection, or use exportData directly (auto-detects)
 */
export function detectFormatFromFilename(filename: string): ExportFormat {
  const parts = filename.toLowerCase().split('.')
  const extension = parts.length > 1 ? parts.pop() : undefined

  switch (extension) {
    case 'csv':
      return 'csv'
    case 'json':
      return 'json'
    case 'tree':
      return 'tree'
    case 'txt':
      return 'txt'
    default:
      if (!extension) {
        throw new DataError(
          'Could not detect file format. Must have a valid extension (.csv, .json, .tree, .txt)',
          TsHelpersErrorCode.UNSUPPORTED_FORMAT,
          { data: { filename } }
        )
      }
      throw new DataError(
        `Unsupported file format: .${extension}. Use .csv, .json, .tree or .txt`,
        TsHelpersErrorCode.UNSUPPORTED_FORMAT,
        { data: { filename, extension } }
      )
  }
}

/**
 * Universal file extension detector - detects any file extension
 *
 * Extracts file extension from filename (without dot) for any file type.
 * Returns last extension for compound extensions (e.g., '.tar.gz' → 'gz').
 * Case-insensitive, trims whitespace, returns null if no extension found.
 *
 * @param filename - Filename with extension
 * @returns File extension (lowercase, without dot) or `null` if no extension
 *
 * @example
 * ```typescript
 * // Common file types
 * detectFileExtension('document.pdf')    // 'pdf'
 * detectFileExtension('image.jpg')       // 'jpg'
 * detectFileExtension('data.json')       // 'json'
 * detectFileExtension('styles.css')      // 'css'
 * ```
 *
 * @example
 * ```typescript
 * // Compound extensions (returns last extension)
 * detectFileExtension('archive.tar.gz')  // 'gz'
 * detectFileExtension('backup.sql.bz2')  // 'bz2'
 * detectFileExtension('file.test.ts')    // 'ts'
 * ```
 *
 * @example
 * ```typescript
 * // Edge cases
 * detectFileExtension('noextension')     // null
 * detectFileExtension('.hidden')         // 'hidden' (Unix hidden files)
 * detectFileExtension('file.')           // '' (empty string)
 * detectFileExtension('  file.txt  ')    // 'txt' (trims whitespace)
 * detectFileExtension('FILE.PDF')        // 'pdf' (case-insensitive)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Conditional file processing
 * async function processUploadedFile(filename: string, data: any) {
 *   const ext = detectFileExtension(filename)
 *
 *   switch (ext) {
 *     case 'csv':
 *       return await importCSV(filename)
 *     case 'json':
 *       return await importJSON(filename)
 *     case 'pdf':
 *       return await extractPdfText(filename)
 *     case null:
 *       throw new Error('File must have an extension')
 *     default:
 *       throw new Error(`Unsupported file type: .${ext}`)
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: File type validation
 * function validateUpload(file: File) {
 *   const ext = detectFileExtension(file.name)
 *   const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif']
 *
 *   if (!ext) {
 *     return { valid: false, error: 'File must have an extension' }
 *   }
 *
 *   if (!allowedExtensions.includes(ext)) {
 *     return {
 *       valid: false,
 *       error: `Invalid file type .${ext}. Allowed: ${allowedExtensions.join(', ')}`
 *     }
 *   }
 *
 *   return { valid: true }
 * }
 * ```
 *
 * @see {@link detectUniversalFormat} for detailed format metadata (category, MIME type)
 * @see {@link detectFormatFromFilename} for export format detection (csv/json/tree/txt only)
 */
export function detectFileExtension(filename: string): FileFormat | null {
  if (!filename || typeof filename !== 'string') {
    return null
  }

  const parts = filename.trim().split('.')

  if (parts.length < 2) {
    return null
  }

  const extension = parts.pop()?.toLowerCase()
  return extension || null
}

/**
 * Universal filename format detection with comprehensive extension support
 *
 * Analyzes filename extension and returns detailed format metadata including:
 * category, MIME type, text/binary classification. Supports 80+ file formats
 * across data, code, documents, images, audio, video, archives, and fonts.
 *
 * @param filename - Filename with extension
 * @returns Object with extension, category, isText, isBinary, mimeType properties
 *
 * @example
 * ```typescript
 * // Data formats
 * detectUniversalFormat('config.json')
 * // { extension: 'json', category: 'data', isText: true, isBinary: false, mimeType: 'application/json' }
 *
 * detectUniversalFormat('users.csv')
 * // { extension: 'csv', category: 'data', isText: true, isBinary: false, mimeType: 'text/csv' }
 * ```
 *
 * @example
 * ```typescript
 * // Programming languages
 * detectUniversalFormat('app.ts')
 * // { extension: 'ts', category: 'code', isText: true, isBinary: false, mimeType: 'application/typescript' }
 *
 * detectUniversalFormat('main.py')
 * // { extension: 'py', category: 'code', isText: true, isBinary: false, mimeType: 'text/x-python' }
 * ```
 *
 * @example
 * ```typescript
 * // Documents
 * detectUniversalFormat('report.pdf')
 * // { extension: 'pdf', category: 'document', isText: false, isBinary: true, mimeType: 'application/pdf' }
 *
 * detectUniversalFormat('doc.docx')
 * // { extension: 'docx', category: 'document', isText: false, isBinary: true, mimeType: '...' }
 * ```
 *
 * @example
 * ```typescript
 * // Images
 * detectUniversalFormat('photo.jpg')
 * // { extension: 'jpg', category: 'image', isText: false, isBinary: true, mimeType: 'image/jpeg' }
 *
 * detectUniversalFormat('icon.svg')
 * // { extension: 'svg', category: 'image', isText: true, isBinary: false, mimeType: 'image/svg+xml' }
 * ```
 *
 * @example
 * ```typescript
 * // Archives
 * detectUniversalFormat('backup.zip')
 * // { extension: 'zip', category: 'archive', isText: false, isBinary: true, mimeType: 'application/zip' }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Smart file processing routing
 * async function processFile(filename: string, content: any) {
 *   const format = detectUniversalFormat(filename)
 *
 *   console.log(`Processing ${format.extension} file (${format.category})`)
 *
 *   if (format.isText) {
 *     // Can read as text
 *     const text = await readFileAsText(filename)
 *     return parseTextFormat(text, format.extension)
 *   } else if (format.isBinary) {
 *     // Needs binary processing
 *     return processBinaryFile(filename, format.mimeType)
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Content-Type header generation
 * function getResponseHeaders(filename: string) {
 *   const format = detectUniversalFormat(filename)
 *
 *   return {
 *     'Content-Type': format.mimeType || 'application/octet-stream',
 *     'Content-Disposition': `attachment; filename="${filename}"`,
 *     'X-File-Category': format.category
 *   }
 * }
 * ```
 *
 * @see {@link detectFileExtension} for simple extension extraction
 * @see {@link detectFormatFromFilename} for export format detection
 */
export function detectUniversalFormat(filename: string) {
  const extension = detectFileExtension(filename)

  if (!extension) {
    return {
      extension: null,
      category: 'unknown',
      isText: false,
      isBinary: false,
      mimeType: null,
    }
  }

  // Comprehensive file format database with 80+ common formats
  const formatInfo = {
    // Data formats
    json: { category: 'data', isText: true, isBinary: false, mimeType: 'application/json' },
    csv: { category: 'data', isText: true, isBinary: false, mimeType: 'text/csv' },
    xml: { category: 'data', isText: true, isBinary: false, mimeType: 'application/xml' },
    yaml: { category: 'data', isText: true, isBinary: false, mimeType: 'application/yaml' },
    yml: { category: 'data', isText: true, isBinary: false, mimeType: 'application/yaml' },
    tree: { category: 'data', isText: true, isBinary: false, mimeType: 'text/plain' },
    tsv: { category: 'data', isText: true, isBinary: false, mimeType: 'text/tab-separated-values' },
    sql: { category: 'data', isText: true, isBinary: false, mimeType: 'application/sql' },
    db: { category: 'data', isText: false, isBinary: true, mimeType: 'application/x-sqlite3' },
    sqlite: { category: 'data', isText: false, isBinary: true, mimeType: 'application/x-sqlite3' },

    // Text and code formats
    txt: { category: 'text', isText: true, isBinary: false, mimeType: 'text/plain' },
    md: { category: 'text', isText: true, isBinary: false, mimeType: 'text/markdown' },
    rst: { category: 'text', isText: true, isBinary: false, mimeType: 'text/x-rst' },
    rtf: { category: 'text', isText: true, isBinary: false, mimeType: 'application/rtf' },
    log: { category: 'text', isText: true, isBinary: false, mimeType: 'text/plain' },

    // Web formats
    html: { category: 'web', isText: true, isBinary: false, mimeType: 'text/html' },
    htm: { category: 'web', isText: true, isBinary: false, mimeType: 'text/html' },
    css: { category: 'web', isText: true, isBinary: false, mimeType: 'text/css' },
    scss: { category: 'web', isText: true, isBinary: false, mimeType: 'text/x-scss' },
    sass: { category: 'web', isText: true, isBinary: false, mimeType: 'text/x-sass' },
    less: { category: 'web', isText: true, isBinary: false, mimeType: 'text/x-less' },

    // Programming languages
    js: { category: 'code', isText: true, isBinary: false, mimeType: 'application/javascript' },
    mjs: { category: 'code', isText: true, isBinary: false, mimeType: 'application/javascript' },
    jsx: { category: 'code', isText: true, isBinary: false, mimeType: 'text/jsx' },
    ts: { category: 'code', isText: true, isBinary: false, mimeType: 'application/typescript' },
    tsx: { category: 'code', isText: true, isBinary: false, mimeType: 'text/tsx' },
    py: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-python' },
    java: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-java-source' },
    php: { category: 'code', isText: true, isBinary: false, mimeType: 'application/x-httpd-php' },
    rb: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-ruby' },
    go: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-go' },
    rs: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-rust' },
    c: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-c' },
    cpp: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-c++' },
    cc: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-c++' },
    h: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-c' },
    cs: { category: 'code', isText: true, isBinary: false, mimeType: 'text/x-csharp' },
    sh: { category: 'code', isText: true, isBinary: false, mimeType: 'application/x-sh' },
    bash: { category: 'code', isText: true, isBinary: false, mimeType: 'application/x-sh' },
    ps1: { category: 'code', isText: true, isBinary: false, mimeType: 'application/x-powershell' },

    // Microsoft Office documents
    doc: { category: 'document', isText: false, isBinary: true, mimeType: 'application/msword' },
    docx: {
      category: 'document',
      isText: false,
      isBinary: true,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    xls: {
      category: 'spreadsheet',
      isText: false,
      isBinary: true,
      mimeType: 'application/vnd.ms-excel',
    },
    xlsx: {
      category: 'spreadsheet',
      isText: false,
      isBinary: true,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    ppt: {
      category: 'presentation',
      isText: false,
      isBinary: true,
      mimeType: 'application/vnd.ms-powerpoint',
    },
    pptx: {
      category: 'presentation',
      isText: false,
      isBinary: true,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },

    // LibreOffice/OpenOffice
    odt: {
      category: 'document',
      isText: false,
      isBinary: true,
      mimeType: 'application/vnd.oasis.opendocument.text',
    },
    ods: {
      category: 'spreadsheet',
      isText: false,
      isBinary: true,
      mimeType: 'application/vnd.oasis.opendocument.spreadsheet',
    },
    odp: {
      category: 'presentation',
      isText: false,
      isBinary: true,
      mimeType: 'application/vnd.oasis.opendocument.presentation',
    },

    // Other document formats
    pdf: { category: 'document', isText: false, isBinary: true, mimeType: 'application/pdf' },
    epub: { category: 'document', isText: false, isBinary: true, mimeType: 'application/epub+zip' },
    mobi: {
      category: 'document',
      isText: false,
      isBinary: true,
      mimeType: 'application/x-mobipocket-ebook',
    },

    // Image formats
    jpg: { category: 'image', isText: false, isBinary: true, mimeType: 'image/jpeg' },
    jpeg: { category: 'image', isText: false, isBinary: true, mimeType: 'image/jpeg' },
    png: { category: 'image', isText: false, isBinary: true, mimeType: 'image/png' },
    gif: { category: 'image', isText: false, isBinary: true, mimeType: 'image/gif' },
    svg: { category: 'image', isText: true, isBinary: false, mimeType: 'image/svg+xml' },
    webp: { category: 'image', isText: false, isBinary: true, mimeType: 'image/webp' },
    avif: { category: 'image', isText: false, isBinary: true, mimeType: 'image/avif' },
    bmp: { category: 'image', isText: false, isBinary: true, mimeType: 'image/bmp' },
    tiff: { category: 'image', isText: false, isBinary: true, mimeType: 'image/tiff' },
    tif: { category: 'image', isText: false, isBinary: true, mimeType: 'image/tiff' },
    ico: { category: 'image', isText: false, isBinary: true, mimeType: 'image/x-icon' },
    psd: {
      category: 'image',
      isText: false,
      isBinary: true,
      mimeType: 'image/vnd.adobe.photoshop',
    },

    // Audio formats
    mp3: { category: 'audio', isText: false, isBinary: true, mimeType: 'audio/mpeg' },
    wav: { category: 'audio', isText: false, isBinary: true, mimeType: 'audio/wav' },
    flac: { category: 'audio', isText: false, isBinary: true, mimeType: 'audio/flac' },
    ogg: { category: 'audio', isText: false, isBinary: true, mimeType: 'audio/ogg' },
    aac: { category: 'audio', isText: false, isBinary: true, mimeType: 'audio/aac' },
    m4a: { category: 'audio', isText: false, isBinary: true, mimeType: 'audio/m4a' },
    wma: { category: 'audio', isText: false, isBinary: true, mimeType: 'audio/x-ms-wma' },

    // Video formats
    mp4: { category: 'video', isText: false, isBinary: true, mimeType: 'video/mp4' },
    avi: { category: 'video', isText: false, isBinary: true, mimeType: 'video/x-msvideo' },
    mov: { category: 'video', isText: false, isBinary: true, mimeType: 'video/quicktime' },
    wmv: { category: 'video', isText: false, isBinary: true, mimeType: 'video/x-ms-wmv' },
    flv: { category: 'video', isText: false, isBinary: true, mimeType: 'video/x-flv' },
    webm: { category: 'video', isText: false, isBinary: true, mimeType: 'video/webm' },
    mkv: { category: 'video', isText: false, isBinary: true, mimeType: 'video/x-matroska' },
    '3gp': { category: 'video', isText: false, isBinary: true, mimeType: 'video/3gpp' },

    // Archive formats
    zip: { category: 'archive', isText: false, isBinary: true, mimeType: 'application/zip' },
    rar: {
      category: 'archive',
      isText: false,
      isBinary: true,
      mimeType: 'application/x-rar-compressed',
    },
    '7z': {
      category: 'archive',
      isText: false,
      isBinary: true,
      mimeType: 'application/x-7z-compressed',
    },
    tar: { category: 'archive', isText: false, isBinary: true, mimeType: 'application/x-tar' },
    gz: { category: 'archive', isText: false, isBinary: true, mimeType: 'application/gzip' },
    bz2: { category: 'archive', isText: false, isBinary: true, mimeType: 'application/x-bzip2' },
    xz: { category: 'archive', isText: false, isBinary: true, mimeType: 'application/x-xz' },

    // Configuration files
    ini: { category: 'config', isText: true, isBinary: false, mimeType: 'text/plain' },
    cfg: { category: 'config', isText: true, isBinary: false, mimeType: 'text/plain' },
    conf: { category: 'config', isText: true, isBinary: false, mimeType: 'text/plain' },
    toml: { category: 'config', isText: true, isBinary: false, mimeType: 'application/toml' },
    env: { category: 'config', isText: true, isBinary: false, mimeType: 'text/plain' },

    // Font formats
    ttf: { category: 'font', isText: false, isBinary: true, mimeType: 'font/ttf' },
    otf: { category: 'font', isText: false, isBinary: true, mimeType: 'font/otf' },
    woff: { category: 'font', isText: false, isBinary: true, mimeType: 'font/woff' },
    woff2: { category: 'font', isText: false, isBinary: true, mimeType: 'font/woff2' },
    eot: {
      category: 'font',
      isText: false,
      isBinary: true,
      mimeType: 'application/vnd.ms-fontobject',
    },
  } as const

  const info = formatInfo[extension as keyof typeof formatInfo] || {
    category: 'unknown',
    isText: false,
    isBinary: false,
    mimeType: null,
  }

  return {
    extension,
    ...info,
  }
}

// =============================================================================
// TREE EXPORT OPTIONS
// =============================================================================

export interface TreeExportOptions {
  /** Property to display as node name (default: 'name') */
  labelField?: string
  /** Characters for vertical line (default: '│   ') */
  verticalLine?: string
  /** Characters for middle branch (default: '├── ') */
  middleBranch?: string
  /** Characters for last branch (default: '└── ') */
  lastBranch?: string
  /** Spacing for nodes without vertical line (default: '    ') */
  emptySpace?: string
  /** Custom function to get node label */
  labelFunction?: (node: any) => string
}

/**
 * Exports a tree structure as a text file with visual format
 *
 * Converts hierarchical data (nodes with `children` arrays) into ASCII/Unicode tree
 * visualization and saves as .tree file. Supports Node.js (filesystem) and Browser (download).
 *
 * @param data - Array of root nodes (each with optional `children` property)
 * @param filePath - Output file path (Node.js) or filename (Browser)
 * @param options - Tree rendering options (labelField, box-drawing characters, labelFunction)
 *
 * @example
 * ```typescript
 * // Basic tree export - File structure
 * const fileTree = [
 *   {
 *     name: 'src',
 *     children: [
 *       { name: 'index.ts' },
 *       { name: 'utils.ts' },
 *       {
 *         name: 'components',
 *         children: [
 *           { name: 'Button.tsx' },
 *           { name: 'Input.tsx' }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 *
 * await exportTree(fileTree, 'structure.tree')
 * // Creates file:
 * // └── src
 * //     ├── index.ts
 * //     ├── utils.ts
 * //     └── components
 * //         ├── Button.tsx
 * //         └── Input.tsx
 * ```
 *
 * @example
 * ```typescript
 * // Custom label field - Organization chart
 * const orgChart = [
 *   {
 *     title: 'CEO',
 *     children: [
 *       {
 *         title: 'CTO',
 *         children: [
 *           { title: 'Dev Lead' },
 *           { title: 'QA Lead' }
 *         ]
 *       },
 *       { title: 'CFO' }
 *     ]
 *   }
 * ]
 *
 * await exportTree(orgChart, 'org-chart.tree', { labelField: 'title' })
 * ```
 *
 * @example
 * ```typescript
 * // ASCII characters - Better terminal compatibility
 * await exportTree(data, 'structure.tree', {
 *   verticalLine: '|   ',
 *   middleBranch: '+-- ',
 *   lastBranch: '`-- ',
 *   emptySpace: '    '
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Custom label function - Rich formatting
 * const tasks = [
 *   {
 *     name: 'Backend',
 *     status: 'in-progress',
 *     assignee: 'Alice',
 *     children: [
 *       { name: 'API', status: 'done', assignee: 'Bob' },
 *       { name: 'Database', status: 'pending', assignee: 'Charlie' }
 *     ]
 *   }
 * ]
 *
 * await exportTree(tasks, 'tasks.tree', {
 *   labelFunction: (node) => `[${node.status}] ${node.name} (@${node.assignee})`
 * })
 * // Output:
 * // └── [in-progress] Backend (@Alice)
 * //     ├── [done] API (@Bob)
 * //     └── [pending] Database (@Charlie)
 * ```
 *
 * @throws {ValidationError} If data is not an array of nodes
 *
 * @see {@link importTree} for importing .tree files as text
 * @see {@link renderTreeAsText} for tree rendering without file export
 * @see {@link TreeExportOptions} for configuration options
 */
export async function exportTree(
  data: any[],
  filePath: string,
  options?: TreeExportOptions
): Promise<void> {
  if (!Array.isArray(data)) {
    throw createValidationError(
      'Data for tree format must be an array of nodes',
      'data',
      typeof data
    )
  }

  // Import render function from specialized/tree
  const { renderTreeAsText } = await import('./tree')

  // Render tree as text
  const treeText = renderTreeAsText(data, options)

  // Write file according to environment
  if (isNode()) {
    // Node.js - write file to system
    const fs = await import('fs/promises')
    await fs.writeFile(filePath, treeText, { encoding: 'utf-8' })
  } else {
    // Browser - download as file
    const blob = new Blob([treeText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filePath.split('/').pop() || 'tree.tree'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }
}

/**
 * Imports a .tree file as plain text (Node.js only)
 *
 * Reads tree structure visualization files created with exportTree() as plain text.
 * Returns the ASCII/Unicode tree diagram as string. Only supported in Node.js environment.
 *
 * @param filePath - Path to .tree file (Node.js only)
 * @param _options - Reserved for future use
 * @returns Promise<string> Tree structure as text
 *
 * @example
 * ```typescript
 * // Import tree structure
 * const treeText = await importTree('./structure.tree')
 * console.log(treeText)
 * // Output:
 * // └── src
 * //     ├── index.ts
 * //     ├── utils.ts
 * //     └── components
 * //         ├── Button.tsx
 * //         └── Input.tsx
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Display tree structure in terminal
 * async function showProjectStructure(filePath: string) {
 *   try {
 *     const structure = await importTree(filePath)
 *     console.log('📁 Project Structure:')
 *     console.log(structure)
 *   } catch (error) {
 *     console.error('Failed to load structure:', error.message)
 *   }
 * }
 * ```
 *
 * @throws {DataError} If called in Browser environment (use readFileAsText with File object instead)
 *
 * @see {@link exportTree} for creating .tree files
 * @see {@link readFileAsText} for browser-compatible file reading
 */
export async function importTree(filePath: string): Promise<string> {
  if (isNode()) {
    // Node.js - read file from system
    const fs = await import('fs/promises')
    return fs.readFile(filePath, { encoding: 'utf-8' })
  } else {
    // Browser - cannot read files from system directly
    throw new DataError(
      '.tree file import is not supported in browser. Use readFileAsText() with a File object.',
      TsHelpersErrorCode.ENVIRONMENT_NOT_SUPPORTED,
      { data: { environment: 'browser', operation: 'importTree' } }
    )
  }
}

// =============================================================================
// TEXT EXPORT OPTIONS
// =============================================================================

export interface TxtExportOptions {
  /** Separator between array elements (default: '\n') */
  separator?: string
  /** Custom function to convert objects to string */
  stringify?: (obj: any) => string
  /** Indentation for JSON objects (default: 2) */
  indent?: number
}

/**
 * Exports any type of data as plain text file
 *
 * Universal text file exporter supporting strings, arrays, objects, and primitives.
 * Automatically formats data based on type. Supports Node.js (filesystem) and Browser (download).
 *
 * Features:
 * - **Strings**: Direct output
 * - **Arrays**: One element per line (or custom separator)
 * - **Objects**: Formatted JSON with indentation
 * - **Primitives**: String conversion
 * - **Custom stringify**: Optional transform function
 *
 * @param data - Data to export (string, array, object, or primitive)
 * @param filePath - Output file path (Node.js) or filename (Browser)
 * @param options - Export options (separator, stringify function, indent)
 *
 * @example
 * ```typescript
 * // Export string - Direct output
 * await exportTxt('Hello, World!', 'message.txt')
 * // Creates: Hello, World!
 * ```
 *
 * @example
 * ```typescript
 * // Export array - One per line
 * const logs = [
 *   '[INFO] Server started',
 *   '[WARN] High memory usage',
 *   '[ERROR] Connection failed'
 * ]
 * await exportTxt(logs, 'server.log')
 * // Creates:
 * // [INFO] Server started
 * // [WARN] High memory usage
 * // [ERROR] Connection failed
 * ```
 *
 * @example
 * ```typescript
 * // Export object - Formatted JSON
 * const config = {
 *   server: { host: 'localhost', port: 3000 },
 *   database: { url: 'mongodb://localhost' }
 * }
 * await exportTxt(config, 'config.txt', { indent: 2 })
 * // Creates formatted JSON
 * ```
 *
 * @example
 * ```typescript
 * // Custom separator - Comma-separated list
 * const tags = ['typescript', 'nodejs', 'express', 'mongodb']
 * await exportTxt(tags, 'tags.txt', { separator: ', ' })
 * // Creates: typescript, nodejs, express, mongodb
 * ```
 *
 * @example
 * ```typescript
 * // Custom stringify function - Markdown list
 * const tasks = [
 *   { id: 1, title: 'Setup project', done: true },
 *   { id: 2, title: 'Write tests', done: false }
 * ]
 * await exportTxt(tasks, 'tasks.txt', {
 *   stringify: (tasks) =>
 *     tasks.map(t => `- [${t.done ? 'x' : ' '}] ${t.title}`).join('\n')
 * })
 * // Creates:
 * // - [x] Setup project
 * // - [ ] Write tests
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Export error log with timestamps
 * async function exportErrorLog(errors: Error[]) {
 *   const timestamp = new Date().toISOString()
 *   const filename = `errors-${timestamp}.txt`
 *
 *   await exportTxt(errors, filename, {
 *     stringify: (errors) =>
 *       errors.map(e => `[${new Date().toISOString()}] ${e.message}\n${e.stack}`).join('\n\n')
 *   })
 *
 *   console.log(`✅ Exported ${errors.length} errors to ${filename}`)
 * }
 * ```
 *
 * @see {@link importTxt} for importing text files with security validations
 * @see {@link TxtExportOptions} for configuration options
 */
export async function exportTxt(
  data: any,
  filePath: string,
  options?: TxtExportOptions
): Promise<void> {
  const { separator = '\n', stringify, indent = 2 } = options || {}

  let textContent: string

  if (stringify) {
    // Use custom function
    textContent = stringify(data)
  } else if (typeof data === 'string') {
    // Already string
    textContent = data
  } else if (Array.isArray(data)) {
    // Array: each element on a line (or custom separator)
    textContent = data
      .map(item => (typeof item === 'string' ? item : JSON.stringify(item, null, indent)))
      .join(separator)
  } else if (typeof data === 'object' && data !== null) {
    // Object: formatted JSON
    textContent = JSON.stringify(data, null, indent)
  } else {
    // Primitives: convert to string
    textContent = String(data)
  }

  // Write file according to environment
  if (isNode()) {
    // Node.js - write file to system
    const fs = await import('fs/promises')
    await fs.writeFile(filePath, textContent, { encoding: 'utf-8' })
  } else {
    // Browser - download as file
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filePath.split('/').pop() || 'file.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }
}

export interface TxtImportOptions {
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize?: number
  /** Maximum content length in characters (default: 1M characters) */
  maxLength?: number
  /** Whether to validate content for security (default: true) */
  validateSecurity?: boolean
  /** Whether to sanitize content (default: true) */
  sanitize?: boolean
}

/**
 * Sanitizes text content removing problematic characters
 */
function sanitizeTextContent(content: string): string {
  return (
    content
      // Normalize different types of line breaks
      .replace(/\r\n|\r/g, '\n')
      // Remove dangerous control characters (keep \n, \t)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '')
      // Limit multiple consecutive line breaks
      .replace(/\n{4,}/g, '\n\n\n')
      // Remove trailing spaces from lines
      .replace(/[ \t]+$/gm, '')
  )
}

/**
 * Imports a .txt file as plain text with security validations (Node.js only)
 *
 * Reads text files with comprehensive security checks: file size limits, content length validation,
 * path traversal prevention, and dangerous character sanitization. Only supported in Node.js.
 *
 * Security features:
 * - **File size limit**: Default 10MB (configurable)
 * - **Content length limit**: Default 1M characters (configurable)
 * - **Path validation**: Prevents directory traversal attacks
 * - **Content sanitization**: Removes dangerous control characters
 * - **Line break normalization**: Standardizes to \n
 *
 * @param filePath - Path to .txt file (Node.js only)
 * @param options - Security and sanitization options
 *
 * @example
 * ```typescript
 * // Basic import - Default security settings
 * const content = await importTxt('./notes.txt')
 * console.log(content)
 * ```
 *
 * @example
 * ```typescript
 * // Custom size limits - Large file support
 * const largeFile = await importTxt('./large-log.txt', {
 *   maxFileSize: 50 * 1024 * 1024,  // 50MB
 *   maxLength: 10_000_000            // 10M characters
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Disable sanitization - Raw content
 * const rawContent = await importTxt('./data.txt', {
 *   sanitize: false,
 *   validateSecurity: false
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Safe log file reader with error handling
 * async function readServerLog(logPath: string) {
 *   try {
 *     const log = await importTxt(logPath, {
 *       maxFileSize: 100 * 1024 * 1024,  // 100MB logs
 *       maxLength: 50_000_000,            // 50M chars
 *       sanitize: true,
 *       validateSecurity: true
 *     })
 *
 *     const lines = log.split('\n')
 *     const errors = lines.filter(line => line.includes('[ERROR]'))
 *
 *     console.log(`📊 Log stats:`)
 *     console.log(`   Total lines: ${lines.length}`)
 *     console.log(`   Errors: ${errors.length}`)
 *
 *     return { lines, errors }
 *   } catch (error) {
 *     if (error.message.includes('too large')) {
 *       console.error('Log file exceeds size limit')
 *     } else if (error.message.includes('not found')) {
 *       console.error('Log file does not exist')
 *     } else {
 *       console.error('Failed to read log:', error.message)
 *     }
 *     throw error
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Secure user file upload processing
 * async function processUserUpload(uploadedFilePath: string) {
 *   // Enforce strict limits for user-uploaded files
 *   const content = await importTxt(uploadedFilePath, {
 *     maxFileSize: 5 * 1024 * 1024,   // 5MB max
 *     maxLength: 1_000_000,            // 1M chars max
 *     validateSecurity: true,          // Check for dangerous content
 *     sanitize: true                   // Remove control chars
 *   })
 *
 *   // Process sanitized content safely
 *   return analyzeText(content)
 * }
 * ```
 *
 * @throws {Error} If file exceeds maxFileSize
 * @throws {Error} If content exceeds maxLength
 * @throws {Error} If file path is invalid or unsafe
 * @throws {Error} If file not found
 * @throws {Error} If called in Browser environment
 *
 * @see {@link exportTxt} for creating text files
 * @see {@link TxtImportOptions} for configuration options
 * @see {@link readFileAsText} for browser-compatible file reading
 */
export async function importTxt(filePath: string, options: TxtImportOptions = {}): Promise<string> {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    maxLength = 1_000_000, // 1M characters default
    validateSecurity = true,
    sanitize = true,
  } = options

  if (isNode()) {
    // Node.js - read file from system with validations
    const fs = await import('fs/promises')
    const path = await import('path')

    // Validate file path for security using our validator
    const { isValidFilePath, isValidFileSize, isValidTextContent } = await import('./validators')

    if (!isValidFilePath(filePath)) {
      throw new Error('Invalid or unsafe file path')
    }

    const resolvedPath = path.resolve(filePath)

    // Check file size before reading
    try {
      const stats = await fs.stat(resolvedPath)

      if (!isValidFileSize(stats.size, maxFileSize)) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${maxFileSize})`)
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`)
      }
      throw error
    }

    // Read and validate content
    const content = await fs.readFile(resolvedPath, { encoding: 'utf-8' })

    // Validate content security using our validator
    if (validateSecurity && !isValidTextContent(content, { maxLength })) {
      throw new Error('File contains potentially dangerous content or exceeds security limits')
    }

    return sanitize ? sanitizeTextContent(content) : content
  } else {
    // Browser - cannot read files from system directly
    throw new Error(
      '.txt file import is not supported in browser. Use readFileAsText() with a File object.'
    )
  }
}

// =============================================================================
// UNIVERSAL FUNCTIONS
// =============================================================================

/**
 * Exports data in specified format based on file extension (Universal dispatcher)
 *
 * Universal export function that automatically detects format from filename extension
 * and delegates to specialized exporters (CSV, JSON, Tree, TXT). Simplifies data export
 * with a single unified API for all formats.
 *
 * Automatic format detection:
 * - **.csv** → exportCSV (PapaParse, UTF-8 BOM, semicolon delimiter)
 * - **.json** → exportJSON (pretty-printed JSON)
 * - **.tree** → exportTree (ASCII/Unicode tree visualization)
 * - **.txt** → exportTxt (plain text with auto-formatting)
 *
 * Environment support:
 * - **Node.js**: Writes to filesystem
 * - **Browser**: Triggers download
 *
 * @param data - Data to export (structure depends on format)
 * @param filePath - Output file path with extension (determines format)
 * @param options - Format-specific options (passed to specialized exporter)
 *
 * @example
 * ```typescript
 * // CSV export - Array of objects
 * const users = [
 *   { id: 1, name: 'Alice', email: 'alice@example.com' },
 *   { id: 2, name: 'Bob', email: 'bob@example.com' }
 * ]
 * await exportData(users, 'users.csv')
 * // Auto-detects CSV format, exports with semicolon delimiter
 * ```
 *
 * @example
 * ```typescript
 * // JSON export - Any data structure
 * const config = {
 *   server: { host: 'localhost', port: 3000 },
 *   database: { url: 'mongodb://localhost' },
 *   features: { auth: true, cache: false }
 * }
 * await exportData(config, 'config.json', { indent: 2 })
 * // Auto-detects JSON format, pretty-prints with 2-space indent
 * ```
 *
 * @example
 * ```typescript
 * // Tree export - Hierarchical structure
 * const fileTree = [
 *   {
 *     name: 'src',
 *     children: [
 *       { name: 'index.ts' },
 *       { name: 'utils.ts' },
 *       {
 *         name: 'components',
 *         children: [
 *           { name: 'Button.tsx' },
 *           { name: 'Input.tsx' }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 * await exportData(fileTree, 'structure.tree')
 * // Auto-detects tree format, renders as ASCII tree
 * ```
 *
 * @example
 * ```typescript
 * // Text export - Logs/strings
 * const logs = [
 *   '[2024-01-15 10:30:00] Server started',
 *   '[2024-01-15 10:30:15] Connected to database',
 *   '[2024-01-15 10:31:00] Ready to accept connections'
 * ]
 * await exportData(logs, 'server.log')
 * // Auto-detects txt format, one line per array element
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Multi-format export function
 * async function exportReport(data: any[], format: 'csv' | 'json' | 'txt') {
 *   const timestamp = new Date().toISOString().split('T')[0]
 *   const filename = `report-${timestamp}.${format}`
 *
 *   try {
 *     await exportData(data, filename)
 *     console.log(`✅ Report exported: ${filename}`)
 *     return { success: true, filename }
 *   } catch (error) {
 *     console.error(`❌ Export failed:`, error.message)
 *     return { success: false, error: error.message }
 *   }
 * }
 *
 * // Usage
 * exportReport(users, 'csv')   // users-2024-01-15.csv
 * exportReport(stats, 'json')  // report-2024-01-15.json
 * exportReport(logs, 'txt')    // report-2024-01-15.txt
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: User-selected format export
 * async function exportWithUserChoice(data: any[], filename: string) {
 *   // User provides filename with desired extension
 *   // exportData automatically routes to correct exporter
 *
 *   await exportData(data, filename)
 *
 *   const format = detectFormatFromFilename(filename)
 *   console.log(`Exported as ${format.toUpperCase()}`)
 * }
 *
 * // Works with any supported extension
 * exportWithUserChoice(data, 'data.csv')
 * exportWithUserChoice(data, 'data.json')
 * exportWithUserChoice(data, 'data.txt')
 * ```
 *
 * @throws {DataError} If file extension is not supported
 * @throws {ValidationError} If data structure is invalid for format (e.g., CSV requires array)
 *
 * @see {@link importData} for universal import
 * @see {@link exportCSV} for CSV-specific export
 * @see {@link exportJSON} for JSON-specific export
 * @see {@link exportTree} for tree-specific export
 * @see {@link exportTxt} for text-specific export
 */
export async function exportData(
  data: unknown,
  filePath: string,
  options?: Record<string, unknown>
): Promise<void> {
  const format = detectFormatFromFilename(filePath)

  // Only validate as ExportData for formats that require it (CSV)
  if (format === 'csv') {
    validateExportData(data)
  }

  switch (format) {
    case 'csv': {
      const { exportCSV } = await import('./csv')
      return exportCSV(data as unknown[], filePath, options)
    }
    case 'json': {
      const { exportJSON } = await import('./json')
      return exportJSON(data, filePath, options)
    }
    case 'tree': {
      return exportTree(data as unknown[], filePath, options)
    }
    case 'txt': {
      return exportTxt(data, filePath, options)
    }
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

/**
 * Imports data from specified file based on extension (Universal dispatcher)
 *
 * Universal import function that automatically detects format from filename extension
 * and delegates to specialized importers (CSV, JSON, Tree, TXT). Simplifies data import
 * with a single unified API for all formats. Node.js only.
 *
 * Automatic format detection:
 * - **.csv** → importCSV (PapaParse with header detection)
 * - **.json** → importJSON (native JSON.parse)
 * - **.tree** → importTree (plain text tree visualization)
 * - **.txt** → importTxt (plain text with security validations)
 *
 * @param filePath - Input file path with extension (determines format)
 * @param options - Format-specific options (passed to specialized importer)
 * @returns Promise<ImportData> Imported data (type depends on format)
 *
 * @example
 * ```typescript
 * // CSV import - Returns array of objects
 * const users = await importData('./users.csv')
 * // [
 * //   { id: '1', name: 'Alice', email: 'alice@example.com' },
 * //   { id: '2', name: 'Bob', email: 'bob@example.com' }
 * // ]
 * ```
 *
 * @example
 * ```typescript
 * // JSON import - Returns original data structure
 * const config = await importData('./config.json')
 * console.log(config.server.host)  // 'localhost'
 * console.log(config.server.port)  // 3000
 * ```
 *
 * @example
 * ```typescript
 * // Tree import - Returns plain text visualization
 * const treeText = await importData('./structure.tree')
 * console.log(treeText)
 * // └── src
 * //     ├── index.ts
 * //     ├── utils.ts
 * //     └── components
 * ```
 *
 * @example
 * ```typescript
 * // Text import - Returns file content as string
 * const log = await importData('./server.log')
 * const lines = log.split('\n')
 * const errors = lines.filter(line => line.includes('[ERROR]'))
 * console.log(`Found ${errors.length} errors`)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Dynamic file processor
 * async function processFile(filePath: string) {
 *   const ext = detectFileExtension(filePath)
 *   console.log(`Processing ${ext} file...`)
 *
 *   const data = await importData(filePath)
 *
 *   switch (ext) {
 *     case 'csv':
 *       return processCSVData(data as any[])
 *     case 'json':
 *       return processJSONData(data)
 *     case 'txt':
 *       return processTextData(data as string)
 *     default:
 *       throw new Error(`Unsupported format: ${ext}`)
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Batch file import with error handling
 * async function importAllFiles(directory: string) {
 *   const files = await fs.readdir(directory)
 *   const results = []
 *
 *   for (const file of files) {
 *     const filePath = path.join(directory, file)
 *     const ext = detectFileExtension(file)
 *
 *     // Skip unsupported formats
 *     if (!['csv', 'json', 'txt', 'tree'].includes(ext || '')) {
 *       console.log(`⏭️  Skipping unsupported file: ${file}`)
 *       continue
 *     }
 *
 *     try {
 *       const data = await importData(filePath)
 *       results.push({ file, data, success: true })
 *       console.log(`✅ Imported: ${file}`)
 *     } catch (error) {
 *       results.push({ file, error: error.message, success: false })
 *       console.error(`❌ Failed: ${file} - ${error.message}`)
 *     }
 *   }
 *
 *   return results
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Import with custom options per format
 * async function smartImport(filePath: string) {
 *   const format = detectFormatFromFilename(filePath)
 *
 *   let options: any = {}
 *
 *   if (format === 'csv') {
 *     options = { delimiter: ';', header: true }
 *   } else if (format === 'json') {
 *     options = { reviver: (key, value) => key === 'date' ? new Date(value) : value }
 *   } else if (format === 'txt') {
 *     options = { maxFileSize: 50 * 1024 * 1024, sanitize: true }
 *   }
 *
 *   return await importData(filePath, options)
 * }
 * ```
 *
 * @throws {DataError} If file extension is not supported
 * @throws {Error} If file not found or cannot be read
 * @throws {Error} If file format is invalid
 * @throws {DataError} If called in Browser environment (use readFileAsText with File object instead)
 *
 * @see {@link exportData} for universal export
 * @see {@link importCSV} for CSV-specific import
 * @see {@link importJSON} for JSON-specific import
 * @see {@link importTree} for tree-specific import
 * @see {@link importTxt} for text-specific import
 */
export async function importData(
  filePath: string,
  options?: Record<string, unknown>
): Promise<unknown> {
  const format = detectFormatFromFilename(filePath)

  switch (format) {
    case 'csv': {
      const { importCSV } = await import('./csv')
      return importCSV(filePath, options)
    }
    case 'json': {
      const { importJSON } = await import('./json')
      return importJSON(filePath, options)
    }
    case 'tree': {
      return importTree(filePath)
    }
    case 'txt': {
      return importTxt(filePath, options)
    }
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}
