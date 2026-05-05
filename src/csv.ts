/**
 * CSV Import/Export utilities
 *
 * Provides reliable CSV operations for both Node.js and Browser environments using PapaParse.
 * Features:
 * - UTF-8 BOM encoding for Excel compatibility
 * - Semicolon delimiter by default (European standard)
 * - Automatic header detection
 * - Dual-mode: filesystem (Node.js) vs download trigger (Browser)
 *
 * @module csv
 */

import Papa from 'papaparse'
import { isNode } from './environment'

/**
 * Exports data as CSV file with UTF-8 BOM encoding
 *
 * Works in both Node.js (writes to filesystem) and Browser (triggers download).
 * Uses PapaParse library for reliable CSV generation with proper escaping and formatting.
 *
 * Features:
 * - UTF-8 BOM prepended (\\ufeff) for Excel compatibility
 * - Semicolon delimiter by default (European/Spanish standard)
 * - Automatic header row from object keys
 * - Custom delimiters and options via PapaParse config
 *
 * Environment behavior:
 * - **Node.js**: Writes file to filesystem at specified path
 * - **Browser**: Triggers automatic download with filename extracted from path
 *
 * @param data - Array of objects or array of arrays to export as CSV
 * @param filePath - File path (Node.js) or download filename (Browser)
 * @param options - PapaParse unparse options (optional)
 * @param options.delimiter - Column separator (default: ';' semicolon)
 * @param options.header - Include header row (default: true)
 * @param options.quotes - Quote all fields (default: false)
 * @param options.newline - Line ending (default: '\\r\\n')
 * @returns Promise that resolves when export completes
 *
 * @example
 * ```typescript
 * // Basic export - Array of objects
 * const users = [
 *   { name: 'Alice', age: 30, city: 'Madrid' },
 *   { name: 'Bob', age: 25, city: 'Barcelona' },
 *   { name: 'Carlos', age: 35, city: 'Valencia' }
 * ]
 *
 * // Node.js - Write to file
 * await exportCSV(users, './reports/users.csv')
 * // Creates: ./reports/users.csv with BOM and semicolon delimiter
 *
 * // Browser - Trigger download
 * await exportCSV(users, 'users.csv')
 * // Downloads: users.csv to browser's download folder
 *
 * // Custom delimiter (comma for international)
 * await exportCSV(users, 'users_intl.csv', { delimiter: ',' })
 * ```
 *
 * @example
 * ```typescript
 * // Array of arrays (no header auto-detection)
 * const matrix = [
 *   ['Name', 'Age', 'City'],       // Header row
 *   ['Alice', 30, 'Madrid'],
 *   ['Bob', 25, 'Barcelona']
 * ]
 * await exportCSV(matrix, 'matrix.csv')
 *
 * // Without header row
 * const data = [['A1', 'B1'], ['A2', 'B2']]
 * await exportCSV(data, 'no_header.csv', { header: false })
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Export sales report
 * async function exportSalesReport(sales: Sale[]) {
 *   const reportData = sales.map(sale => ({
 *     Fecha: formatDate(sale.date),
 *     Cliente: sale.customerName,
 *     Producto: sale.productName,
 *     Cantidad: sale.quantity,
 *     Total: `${sale.total.toFixed(2)}€`
 *   }))
 *
 *   const filename = `ventas_${new Date().toISOString().split('T')[0]}.csv`
 *   await exportCSV(reportData, filename)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Custom PapaParse options
 * await exportCSV(data, 'quotes.csv', {
 *   delimiter: ',',
 *   quotes: true,        // Quote all fields
 *   quoteChar: '"',
 *   escapeChar: '"',
 *   newline: '\\n'       // Unix line endings
 * })
 * ```
 *
 * @throws {Error} If file write fails in Node.js
 * @see {@link importCSV} for importing CSV files
 * @see {@link https://www.papaparse.com/docs#unparse PapaParse Unparse Documentation}
 */
export async function exportCSV(data: any[], filePath: string, options?: any): Promise<void> {
  // ✅ Input validation
  if (data == null) {
    throw new TypeError('Data cannot be null or undefined')
  }

  if (!Array.isArray(data)) {
    throw new TypeError('Data must be an array')
  }

  if (data.length === 0) {
    throw new Error('Data array cannot be empty')
  }

  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    throw new TypeError('File path must be a non-empty string')
  }

  const csvText = Papa.unparse(data, {
    delimiter: ';',
    header: true,
    ...options,
  })

  if (isNode()) {
    const fs = await import('fs/promises')
    await fs.writeFile(filePath, `\ufeff${csvText}`, { encoding: 'utf-8' })
  } else {
    const blob = new Blob([`\ufeff${csvText}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filePath.split('/').pop() || 'data.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Imports CSV file and parses it to array of objects
 *
 * Reads CSV file from filesystem (Node.js only) and parses using PapaParse.
 * Automatically detects headers and converts rows to objects.
 *
 * Features:
 * - Automatic header detection from first row
 * - Semicolon delimiter by default (European standard)
 * - Empty line skipping
 * - Type inference for numbers and booleans
 * - UTF-8 BOM handling
 *
 * ⚠️ BROWSER LIMITATION: File reading from filesystem is not supported in browsers
 * for security reasons. For browser file uploads, use `readFileAsText()` with a File object
 * obtained from an input[type="file"] element.
 *
 * @param filePath - Path to CSV file (Node.js only)
 * @param options - PapaParse parse options (optional)
 * @param options.delimiter - Column separator (default: ';' semicolon)
 * @param options.header - Parse first row as headers (default: true)
 * @param options.skipEmptyLines - Skip empty rows (default: true)
 * @param options.dynamicTyping - Convert numeric/boolean values (default: false)
 * @returns Promise<Array<Object>> Array of objects with keys from header row
 *
 * @example
 * ```typescript
 * // Basic import - Node.js only
 * const users = await importCSV('./data/users.csv')
 * // Returns: [
 * //   { name: 'Alice', age: '30', city: 'Madrid' },
 * //   { name: 'Bob', age: '25', city: 'Barcelona' }
 * // ]
 *
 * // Custom delimiter (comma)
 * const intlData = await importCSV('./data/users_intl.csv', {
 *   delimiter: ','
 * })
 *
 * // With type conversion
 * const typed = await importCSV('./data/sales.csv', {
 *   dynamicTyping: true  // Converts '123' → 123, 'true' → true
 * })
 * // Returns: { quantity: 10, total: 299.99, active: true }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Import and process sales data
 * async function importSalesReport(filePath: string) {
 *   try {
 *     const sales = await importCSV(filePath, {
 *       delimiter: ';',
 *       dynamicTyping: true,
 *       skipEmptyLines: true
 *     })
 *
 *     // Process imported data
 *     const totalSales = sales.reduce((sum, sale) =>
 *       sum + (sale.total || 0), 0
 *     )
 *
 *     console.log(`Imported ${sales.length} sales, total: €${totalSales}`)
 *     return sales
 *   } catch (error) {
 *     console.error('Failed to import CSV:', error)
 *     throw error
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Browser alternative using File API
 * // HTML: <input type="file" id="csvFile" accept=".csv">
 *
 * document.getElementById('csvFile').addEventListener('change', async (e) => {
 *   const file = e.target.files[0]
 *
 *   // Read file content
 *   const content = await readFileAsText(file)
 *
 *   // Parse with PapaParse
 *   const parsed = Papa.parse(content, {
 *     header: true,
 *     delimiter: ';',
 *     skipEmptyLines: true
 *   })
 *
 *   const data = parsed.data
 *   console.log('Imported data:', data)
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Handle parsing errors
 * const result = await importCSV('./malformed.csv')
 *   .catch(error => {
 *     if (error.message.includes('not supported in browser')) {
 *       console.error('Use File API for browser uploads')
 *     } else if (error.code === 'ENOENT') {
 *       console.error('File not found')
 *     } else {
 *       console.error('CSV parsing failed:', error)
 *     }
 *     return []  // Return empty array as fallback
 *   })
 * ```
 *
 * @throws {Error} 'CSV import not supported in browser' when called in browser environment
 * @throws {Error} File system errors (ENOENT, EACCES, etc.) in Node.js
 * @see {@link exportCSV} for exporting CSV files
 * @see {@link readFileAsText} for browser file reading
 * @see {@link https://www.papaparse.com/docs#parse PapaParse Parse Documentation}
 */
export async function importCSV(filePath: string, options?: any): Promise<any[]> {
  // ✅ Input validation
  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    throw new TypeError('File path must be a non-empty string')
  }

  if (isNode()) {
    const fs = await import('fs/promises')
    const content = await fs.readFile(filePath, { encoding: 'utf-8' })
    const parseResult = Papa.parse(content, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      ...options,
    }) as any
    return parseResult.data || []
  } else {
    throw new Error('CSV import not supported in browser. Use readFileAsText() with a File object.')
  }
}
