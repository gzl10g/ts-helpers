/**
 * JSON Import/Export utilities
 *
 * Provides reliable JSON file operations for both Node.js and Browser environments.
 * Features:
 * - UTF-8 encoding for international character support
 * - Pretty-printing with configurable indentation
 * - Dual-mode: filesystem (Node.js) vs download trigger (Browser)
 * - Native JSON.stringify/parse for maximum compatibility
 *
 * @module json
 */

import { isNode } from './environment'

/**
 * Exports data as JSON file with UTF-8 encoding
 *
 * Works in both Node.js (writes to filesystem) and Browser (triggers download).
 * Uses native JSON.stringify for serialization with optional pretty-printing.
 *
 * Features:
 * - UTF-8 encoding for international characters
 * - Configurable indentation (default: 2 spaces)
 * - Automatic filename extraction in browser
 * - Pretty-printed by default for readability
 *
 * Environment behavior:
 * - **Node.js**: Writes file to filesystem at specified path
 * - **Browser**: Triggers automatic download with filename extracted from path
 *
 * ⚠️ WARNING: Cannot serialize:
 * - Functions (removed silently)
 * - Symbols (removed silently)
 * - Circular references (throws TypeError)
 * - undefined values (removed from objects, converted to null in arrays)
 * - BigInt values (throws TypeError unless custom replacer provided)
 *
 * @param data - Any serializable JavaScript value (object, array, primitive)
 * @param filePath - File path (Node.js) or download filename (Browser)
 * @param options - Export options (optional)
 * @param options.indent - Number of spaces for indentation (default: 2, use 0 for compact)
 * @returns Promise that resolves when export completes
 *
 * @example
 * ```typescript
 * // Basic export - Object
 * const config = {
 *   database: { host: 'localhost', port: 5432 },
 *   features: { auth: true, payments: false }
 * }
 *
 * // Node.js - Write to file
 * await exportJSON(config, './config/app.json')
 * // Creates: ./config/app.json with 2-space indentation
 *
 * // Browser - Trigger download
 * await exportJSON(config, 'app-config.json')
 * // Downloads: app-config.json to browser's download folder
 *
 * // Compact output (no pretty-printing)
 * await exportJSON(config, 'config.json', { indent: 0 })
 * // Single-line JSON: {"database":{"host":"localhost","port":5432}}
 * ```
 *
 * @example
 * ```typescript
 * // Array export
 * const users = [
 *   { id: 1, name: 'Alice', email: 'alice@example.com' },
 *   { id: 2, name: 'Bob', email: 'bob@example.com' }
 * ]
 * await exportJSON(users, 'users.json')
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Configuration backup system
 * async function backupConfiguration(config: AppConfig) {
 *   const timestamp = new Date().toISOString().split('T')[0]
 *   const filename = `config-backup-${timestamp}.json`
 *
 *   try {
 *     await exportJSON(config, `./backups/${filename}`, { indent: 2 })
 *     console.log(`✅ Configuration backed up to ${filename}`)
 *   } catch (error) {
 *     console.error('❌ Backup failed:', error)
 *     throw error
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Export API response for debugging
 * async function debugApiResponse(endpoint: string, data: any) {
 *   const filename = `api-${endpoint.replace(/\//g, '-')}.json`
 *   await exportJSON({
 *     endpoint,
 *     timestamp: new Date().toISOString(),
 *     data
 *   }, filename)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Handle circular references
 * const obj = { name: 'test' }
 * obj.self = obj  // Circular reference
 *
 * try {
 *   await exportJSON(obj, 'circular.json')
 * } catch (error) {
 *   console.error('Cannot serialize circular structure')
 *   // Use custom replacer to handle circular refs
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Different indentation levels
 * await exportJSON(data, 'compact.json', { indent: 0 })     // Single line
 * await exportJSON(data, 'readable.json', { indent: 2 })    // 2 spaces (default)
 * await exportJSON(data, 'spacious.json', { indent: 4 })    // 4 spaces
 * ```
 *
 * @throws {TypeError} If data contains circular references or BigInt values
 * @throws {Error} If file write fails in Node.js (permissions, disk space, etc.)
 * @see {@link importJSON} for importing JSON files
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify JSON.stringify Documentation}
 */
export async function exportJSON(
  data: any,
  filePath: string,
  options?: { indent?: number }
): Promise<void> {
  // ✅ Input validation
  if (data === null || data === undefined) {
    throw new TypeError('Data cannot be null or undefined')
  }

  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    throw new TypeError('File path must be a non-empty string')
  }

  const { indent = 2 } = options || {}

  // ✅ Detect circular references before stringify
  let jsonText: string
  try {
    jsonText = JSON.stringify(data, null, indent)
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('circular')) {
      throw new TypeError('Cannot serialize data with circular references')
    }
    throw error
  }

  if (isNode()) {
    const fs = await import('fs/promises')
    await fs.writeFile(filePath, jsonText, { encoding: 'utf-8' })
  } else {
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filePath.split('/').pop() || 'data.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Imports JSON file and parses it to JavaScript value
 *
 * Reads JSON file from filesystem (Node.js only) and parses using native JSON.parse.
 * Returns the parsed JavaScript value (object, array, primitive).
 *
 * Features:
 * - UTF-8 encoding support for international characters
 * - Native JSON.parse for standard-compliant parsing
 * - Automatic type inference
 * - Whitespace and comment tolerance (standard JSON only)
 *
 * ⚠️ BROWSER LIMITATION: File reading from filesystem is not supported in browsers
 * for security reasons. For browser file uploads, use `readFileAsText()` with a File object
 * obtained from an input[type="file"] element.
 *
 * @param filePath - Path to JSON file (Node.js only)
 * @param _options - Reserved for future options (currently unused)
 * @returns Promise<any> Parsed JavaScript value (object, array, primitive, null)
 *
 * @example
 * ```typescript
 * // Basic import - Node.js only
 * const config = await importJSON('./config/app.json')
 * // Returns: { database: { host: 'localhost', port: 5432 }, ... }
 *
 * console.log(config.database.host)  // 'localhost'
 *
 * // Array import
 * const users = await importJSON('./data/users.json')
 * // Returns: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
 *
 * // Primitive values (valid JSON)
 * const version = await importJSON('./version.json')  // "1.2.3"
 * const enabled = await importJSON('./feature.json')   // true
 * const count = await importJSON('./count.json')       // 42
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Load configuration with fallback
 * async function loadConfiguration(configPath: string): Promise<AppConfig> {
 *   try {
 *     const config = await importJSON(configPath)
 *
 *     // Validate loaded config
 *     if (!config.database || !config.database.host) {
 *       throw new Error('Invalid configuration: missing database.host')
 *     }
 *
 *     return config
 *   } catch (error) {
 *     console.warn(`Failed to load config from ${configPath}:`, error)
 *     console.log('Using default configuration')
 *     return getDefaultConfig()
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Restore configuration backup
 * async function restoreBackup(backupFile: string) {
 *   console.log(`Restoring configuration from ${backupFile}...`)
 *
 *   const backup = await importJSON(`./backups/${backupFile}`)
 *
 *   // Verify backup integrity
 *   if (!backup.timestamp || !backup.config) {
 *     throw new Error('Invalid backup file format')
 *   }
 *
 *   // Restore configuration
 *   await saveConfiguration(backup.config)
 *
 *   console.log(`✅ Configuration restored from ${backup.timestamp}`)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Browser alternative using File API
 * // HTML: <input type="file" id="jsonFile" accept=".json">
 *
 * document.getElementById('jsonFile').addEventListener('change', async (e) => {
 *   const file = e.target.files[0]
 *
 *   // Read file content
 *   const content = await readFileAsText(file)
 *
 *   // Parse JSON
 *   try {
 *     const data = JSON.parse(content)
 *     console.log('Imported JSON:', data)
 *   } catch (error) {
 *     console.error('Invalid JSON file:', error)
 *   }
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Handle parsing errors
 * async function safeImportJSON(filePath: string): Promise<any | null> {
 *   try {
 *     return await importJSON(filePath)
 *   } catch (error) {
 *     if (error.message.includes('not supported in browser')) {
 *       console.error('Use File API for browser uploads')
 *     } else if (error.code === 'ENOENT') {
 *       console.error(`File not found: ${filePath}`)
 *     } else if (error instanceof SyntaxError) {
 *       console.error(`Invalid JSON syntax in ${filePath}:`, error.message)
 *     } else {
 *       console.error('JSON import failed:', error)
 *     }
 *     return null
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Type-safe import with validation
 * interface DatabaseConfig {
 *   host: string
 *   port: number
 *   database: string
 * }
 *
 * async function loadDatabaseConfig(path: string): Promise<DatabaseConfig> {
 *   const raw = await importJSON(path)
 *
 *   // Runtime validation
 *   if (typeof raw.host !== 'string' || typeof raw.port !== 'number') {
 *     throw new Error('Invalid database configuration structure')
 *   }
 *
 *   return raw as DatabaseConfig
 * }
 * ```
 *
 * @throws {Error} 'JSON import not supported in browser' when called in browser environment
 * @throws {SyntaxError} If file contains invalid JSON syntax
 * @throws {Error} File system errors (ENOENT, EACCES, etc.) in Node.js
 * @see {@link exportJSON} for exporting JSON files
 * @see {@link readFileAsText} for browser file reading
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse JSON.parse Documentation}
 */
export async function importJSON(filePath: string, _options?: any): Promise<any> {
  // ✅ Input validation
  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    throw new TypeError('File path must be a non-empty string')
  }

  if (isNode()) {
    const fs = await import('fs/promises')
    const content = await fs.readFile(filePath, { encoding: 'utf-8' })

    // ✅ Validate content is not empty
    const trimmed = content.trim()
    if (trimmed === '') {
      throw new SyntaxError('JSON file is empty')
    }

    // ✅ Better error message for invalid JSON
    try {
      return JSON.parse(content)
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new SyntaxError(`Invalid JSON in file ${filePath}: ${error.message}`)
      }
      throw error
    }
  } else {
    throw new Error(
      'JSON import not supported in browser. Use readFileAsText() with a File object.'
    )
  }
}
