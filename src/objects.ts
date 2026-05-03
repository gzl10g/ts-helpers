/**
 * Object manipulation and comparison utilities
 * Consolidated from primitives/object and array modules
 */

import crc32 from 'crc/crc32'
import * as lodash from 'lodash'
const {
  isArray,
  isArrayBuffer,
  isBoolean,
  isBuffer,
  isEqual,
  isNil,
  isNumber,
  isObject,
  isPlainObject,
  isString,
  isTypedArray,
  transform,
} = lodash
import fastEqual from 'fast-deep-equal'
import { areDatesEqualWithTolerance, isDateTime, toDate } from './dates'

// Native implementations to replace lodash functions
const nativeFilter = <T>(array: T[], predicate: Partial<T>): T[] => {
  return array.filter(item => {
    return Object.keys(predicate).every(key => item[key as keyof T] === predicate[key as keyof T])
  })
}

const nativePick = <T extends object, K extends keyof T>(object: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in object) {
      result[key] = object[key]
    }
  })
  return result
}

const nativeRemove = <T>(array: T[], predicate: (item: T) => boolean): T[] => {
  const removed: T[] = []
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      removed.unshift(array.splice(i, 1)[0])
    }
  }
  return removed
}

/**
 * Compares two objects utilizing lodash deep comparison
 * @deprecated Use `deepEqual` instead for consistency
 * @param data1 First object to compare
 * @param data2 Second object to compare
 * @returns True if objects are deeply equal, false otherwise
 */
export const comparator = (data1: unknown, data2: unknown) => isEqual(data1, data2)

/**
 * Performs fast deep comparison between two values
 *
 * Compares values recursively including nested objects, arrays, dates, RegExp, and primitives.
 * Uses fast-deep-equal library for optimal performance (~5-10x faster than JSON.stringify).
 *
 * Comparison rules:
 * - Primitives: strict equality (===)
 * - Objects: recursive key-value comparison
 * - Arrays: length + element-by-element comparison
 * - Dates: compares timestamps
 * - RegExp: compares source and flags
 * - null/undefined: strict equality
 *
 * Use cases: Testing, change detection, cache invalidation, data validation
 *
 * @param data1 - First value to compare (any type)
 * @param data2 - Second value to compare (any type)
 * @returns True if values are deeply equal, false otherwise
 *
 * @example
 * ```typescript
 * // Primitive values
 * deepEqual(42, 42)                    // true
 * deepEqual('hello', 'hello')          // true
 * deepEqual(null, null)                // true
 * deepEqual(42, '42')                  // false (different types)
 *
 * // Objects
 * deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })  // true
 * deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })  // true (order doesn't matter)
 * deepEqual({ a: 1 }, { a: 1, b: undefined }) // false
 *
 * // Arrays
 * deepEqual([1, 2, 3], [1, 2, 3])      // true
 * deepEqual([1, 2, 3], [3, 2, 1])      // false (order matters)
 *
 * // Nested structures
 * deepEqual(
 *   { user: { name: 'Alice', tags: ['admin'] } },
 *   { user: { name: 'Alice', tags: ['admin'] } }
 * )  // true
 *
 * // Dates
 * deepEqual(new Date('2024-01-01'), new Date('2024-01-01'))  // true
 * deepEqual(new Date('2024-01-01'), new Date('2024-01-02'))  // false
 *
 * // RegExp
 * deepEqual(/test/gi, /test/gi)        // true
 * deepEqual(/test/g, /test/i)          // false
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Detect if form data changed
 * const originalData = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   preferences: { theme: 'dark', notifications: true }
 * }
 *
 * const currentData = {
 *   name: 'John Doe',
 *   email: 'john.doe@example.com',  // Changed!
 *   preferences: { theme: 'dark', notifications: true }
 * }
 *
 * const hasChanges = !deepEqual(originalData, currentData)
 * if (hasChanges) {
 *   console.log('⚠️ You have unsaved changes')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Cache invalidation
 * const cache = new Map<string, { params: any; result: any }>()
 *
 * function cachedApiCall(params: any) {
 *   const cacheKey = 'api-call'
 *   const cached = cache.get(cacheKey)
 *
 *   // Check if cached params match current params
 *   if (cached && deepEqual(cached.params, params)) {
 *     console.log('✅ Cache hit')
 *     return cached.result
 *   }
 *
 *   console.log('❌ Cache miss - fetching')
 *   const result = fetchData(params)
 *   cache.set(cacheKey, { params, result })
 *   return result
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: React shouldComponentUpdate optimization
 * class UserProfile extends React.Component {
 *   shouldComponentUpdate(nextProps: any) {
 *     // Only re-render if props actually changed
 *     return !deepEqual(this.props, nextProps)
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Testing
 * import { deepEqual } from '@g10/ts-helpers'
 *
 * test('API returns expected user structure', async () => {
 *   const response = await api.getUser(123)
 *
 *   const expected = {
 *     id: 123,
 *     name: 'Alice',
 *     roles: ['user', 'admin'],
 *     metadata: { lastLogin: expect.any(Date) }
 *   }
 *
 *   // Deep comparison ignoring date instance
 *   expect(deepEqual(
 *     { ...response, metadata: { ...response.metadata, lastLogin: null } },
 *     { ...expected, metadata: { ...expected.metadata, lastLogin: null } }
 *   )).toBe(true)
 * })
 * ```
 *
 * @see {@link calculateDifferences} for finding specific differences between objects
 * @see {@link comparator} for lodash-based comparison (deprecated)
 * @see {@link https://github.com/epoberezkin/fast-deep-equal fast-deep-equal library}
 */
export const deepEqual = (data1: unknown, data2: unknown) => fastEqual(data1, data2)

/**
 * Converts an object to a human-readable string representation
 *
 * Transforms JSON object to clean, readable text by removing braces, quotes, and
 * adding spacing. Useful for logging, debugging, UI displays, and error messages.
 *
 * Transformation:
 * 1. Stringify object to JSON
 * 2. Remove braces `{}` and quotes `"`
 * 3. Replace commas with comma+space for readability
 *
 * @param data - Object to format (must be JSON-serializable)
 * @returns Human-readable string representation
 *
 * @example
 * ```typescript
 * // Simple object
 * formatToReadableString({ name: 'Alice', age: 25 })
 * // 'name: Alice, age: 25'
 *
 * // Multiple properties
 * formatToReadableString({ id: 1, status: 'active', verified: true })
 * // 'id: 1, status: active, verified: true'
 *
 * // Nested objects (flattened)
 * formatToReadableString({ user: { name: 'Bob' }, role: 'admin' })
 * // 'user: name: Bob, role: admin'
 *
 * // Empty object
 * formatToReadableString({})
 * // ''
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Log request parameters
 * function logApiRequest(endpoint: string, params: any) {
 *   const paramsStr = formatToReadableString(params)
 *   console.log(`API Request: ${endpoint} | Params: ${paramsStr}`)
 * }
 *
 * logApiRequest('/users', { page: 1, limit: 20, role: 'admin' })
 * // API Request: /users | Params: page: 1, limit: 20, role: admin
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Display validation errors
 * const errors = { email: 'Invalid format', password: 'Too short' }
 * const message = `Validation failed: ${formatToReadableString(errors)}`
 * console.log(message)
 * // Validation failed: email: Invalid format, password: Too short
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Format metadata for display
 * const metadata = {
 *   author: 'John Doe',
 *   created: '2024-01-01',
 *   tags: ['javascript', 'typescript']
 * }
 *
 * const metadataDisplay = formatToReadableString(metadata)
 * // 'author: John Doe, created: 2024-01-01, tags: javascript, typescript'
 * ```
 *
 * @see {@link JSON.stringify} for full JSON serialization
 */
export const formatToReadableString = (data: { [key: string]: any }): string =>
  JSON.stringify(data).replace(/[{}"]/g, '').replace(/,/g, ', ')

/**
 * Extracts only top-level primitive properties from an object
 *
 * Filters out nested objects, arrays, and functions, returning only primitive values
 * (string, number, boolean, null, undefined, symbol). Useful for serialization,
 * API payloads, and database operations.
 *
 * Included types: string, number, boolean, null, undefined, symbol
 * Excluded types: object, array, function
 *
 * @param obj - Object from which to extract properties (null/undefined returns {})
 * @returns New object containing only primitive top-level properties
 *
 * @example
 * ```typescript
 * // Mixed types object
 * const user = {
 *   id: 123,
 *   name: 'Alice',
 *   email: 'alice@example.com',
 *   age: 25,
 *   active: true,
 *   metadata: { lastLogin: '2024-01-01' },  // Excluded (object)
 *   roles: ['admin', 'user'],                // Excluded (array)
 *   save: () => {}                           // Excluded (function)
 * }
 *
 * getShallowProperties(user)
 * // { id: 123, name: 'Alice', email: 'alice@example.com', age: 25, active: true }
 *
 * // Only primitives
 * const config = { host: 'localhost', port: 5432, ssl: false }
 * getShallowProperties(config)
 * // { host: 'localhost', port: 5432, ssl: false } (unchanged)
 *
 * // Null/undefined values preserved
 * const partial = { a: 1, b: null, c: undefined, d: { nested: true } }
 * getShallowProperties(partial)
 * // { a: 1, b: null, c: undefined }
 *
 * // Empty/null input
 * getShallowProperties({})    // {}
 * getShallowProperties(null)  // {}
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Prepare data for SQL insert (exclude nested objects)
 * const formData = {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   age: 30,
 *   address: { street: '123 Main St', city: 'NYC' },  // Excluded
 *   preferences: { theme: 'dark' }                      // Excluded
 * }
 *
 * const insertData = getShallowProperties(formData)
 * // { firstName: 'John', lastName: 'Doe', email: 'john@example.com', age: 30 }
 *
 * // Now safe to insert into flat database table
 * await db.insert('users', insertData)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Extract searchable fields for indexing
 * const product = {
 *   sku: 'ABC123',
 *   name: 'Widget',
 *   price: 29.99,
 *   inStock: true,
 *   category: { id: 1, name: 'Electronics' },  // Excluded
 *   reviews: [{ rating: 5 }],                    // Excluded
 *   images: ['img1.jpg', 'img2.jpg']            // Excluded
 * }
 *
 * const searchableFields = getShallowProperties(product)
 * // { sku: 'ABC123', name: 'Widget', price: 29.99, inStock: true }
 *
 * // Index only primitive fields for search
 * searchIndex.add(product.sku, searchableFields)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Extract flat properties for CSV export
 * const users = [
 *   {
 *     id: 1,
 *     name: 'Alice',
 *     email: 'alice@example.com',
 *     profile: { bio: 'Developer' },
 *     tags: ['admin']
 *   },
 *   {
 *     id: 2,
 *     name: 'Bob',
 *     email: 'bob@example.com',
 *     profile: { bio: 'Designer' },
 *     tags: ['user']
 *   }
 * ]
 *
 * const csvData = users.map(getShallowProperties)
 * // [
 * //   { id: 1, name: 'Alice', email: 'alice@example.com' },
 * //   { id: 2, name: 'Bob', email: 'bob@example.com' }
 * // ]
 * // Now safe to convert to CSV
 * ```
 *
 * @see {@link calculateDifferences} for comparing objects
 * @see {@link deepEqual} for deep comparison including nested objects
 */
export const getShallowProperties = <T extends object>(obj: T): Partial<T> => {
  if (!obj) return {}
  const topLevelProps: any = {}
  for (const prop in obj) {
    if (Object.hasOwnProperty.call(obj, prop)) {
      const value = obj[prop]
      const type = typeof value
      // Include primitives: string, number, boolean, undefined, symbol, and null
      if ((type !== 'object' && type !== 'function') || value === null) {
        topLevelProps[prop] = value
      }
    }
  }
  return topLevelProps
}

/**
 * Calculates differences between two objects
 *
 * Compares two objects and returns only the properties that differ. Useful for
 * change tracking, audit logs, delta updates, and optimistic UI updates.
 *
 * Special features:
 * - Date comparison: Compares dates ignoring milliseconds (tolerance-based)
 * - Shallow comparison: Only checks top-level properties
 * - One-way diff: Returns changed properties from newObj (not deletions)
 *
 * @param oldObj - Original object to compare against (baseline)
 * @param newObj - New object to compare (current state)
 * @returns Object containing only properties that changed in newObj
 *
 * @example
 * ```typescript
 * // Simple property changes
 * const old = { name: 'Alice', age: 25, city: 'NYC' }
 * const updated = { name: 'Alice', age: 26, city: 'NYC' }
 *
 * calculateDifferences(old, updated)
 * // { age: 26 } - only changed property
 *
 * // Multiple changes
 * const old2 = { a: 1, b: 2, c: 3 }
 * const new2 = { a: 1, b: 999, c: 3 }
 * calculateDifferences(old2, new2)
 * // { b: 999 }
 *
 * // No changes
 * const old3 = { x: 10 }
 * const new3 = { x: 10 }
 * calculateDifferences(old3, new3)
 * // {} - empty object
 *
 * // Date comparison (ignores milliseconds)
 * const oldDate = { timestamp: new Date('2024-01-01T10:00:00.123Z') }
 * const newDate = { timestamp: new Date('2024-01-01T10:00:00.456Z') }
 * calculateDifferences(oldDate, newDate)
 * // {} - dates considered equal (same second)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Track form changes for audit log
 * const originalUser = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   role: 'user',
 *   lastLogin: new Date('2024-01-01')
 * }
 *
 * const updatedUser = {
 *   name: 'John Doe',
 *   email: 'john.doe@company.com',  // Changed
 *   role: 'admin',                   // Changed
 *   lastLogin: new Date('2024-01-01')
 * }
 *
 * const changes = calculateDifferences(originalUser, updatedUser)
 * console.log('User changes:', changes)
 * // { email: 'john.doe@company.com', role: 'admin' }
 *
 * // Save to audit log
 * auditLog.push({
 *   userId: user.id,
 *   timestamp: new Date(),
 *   changes: changes
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Optimistic UI updates (send only changed fields)
 * function updateUserProfile(userId: string, formData: any) {
 *   const originalData = getCurrentUserData(userId)
 *
 *   // Only send changed fields to API
 *   const delta = calculateDifferences(originalData, formData)
 *
 *   if (Object.keys(delta).length === 0) {
 *     console.log('✅ No changes to save')
 *     return
 *   }
 *
 *   // Send PATCH request with only changed fields
 *   return api.patch(`/users/${userId}`, delta)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Configuration change detection
 * const previousConfig = {
 *   database: { host: 'localhost', port: 5432 },
 *   cache: { ttl: 3600 },
 *   features: { darkMode: true }
 * }
 *
 * const newConfig = {
 *   database: { host: 'prod-db.example.com', port: 5432 },
 *   cache: { ttl: 7200 },
 *   features: { darkMode: true }
 * }
 *
 * const configChanges = calculateDifferences(previousConfig, newConfig)
 * // {
 * //   database: { host: 'prod-db.example.com', port: 5432 },
 * //   cache: { ttl: 7200 }
 * // }
 *
 * // Note: Returns entire nested object if any property changed
 * if (configChanges.database) {
 *   console.log('⚠️ Database configuration changed - restart required')
 * }
 * ```
 *
 * @see {@link deepEqual} for full equality check
 * @see {@link getShallowProperties} for extracting only primitive properties
 */
export const calculateDifferences = (oldObj: any, newObj: any): any => {
  return transform(
    newObj,
    (result, value, key) => {
      const oldValue = oldObj[key]
      // If both values are dates, compare them ignoring milliseconds
      if (isDateTime(value) && isDateTime(oldValue)) {
        if (!areDatesEqualWithTolerance(toDate(value), toDate(oldValue))) {
          result[key] = value
        }
      } else if (!isEqual(value, oldValue)) {
        result[key] = value
      }
    },
    {}
  )
}

/**
 * Generates CRC32 hash from various input types
 *
 * Creates a 32-bit cyclic redundancy check (CRC32) hash as hexadecimal string.
 * Fast, deterministic fingerprinting for data integrity, caching, and change detection.
 *
 * Supported types:
 * - String: Direct hash
 * - Buffer/Uint8Array/ArrayBuffer: Binary hash
 * - Number: Converts to string then hash
 * - Boolean: 'true'/'false' then hash
 * - Object/Array: JSON.stringify then hash
 * - null/undefined: Hash of '-'
 *
 * Use cases: Content fingerprinting, ETags, cache keys, data deduplication
 *
 * ⚠️ NOTE: CRC32 is NOT cryptographically secure. Use for checksums, not security.
 *
 * @param str - Input data of any type (string, Buffer, object, array, primitive)
 * @returns CRC32 hash as hexadecimal string (8 characters)
 *
 * @example
 * ```typescript
 * // String inputs
 * generateCrcHash('hello')          // '3610a686'
 * generateCrcHash('Hello')          // 'f7d18982' (case-sensitive)
 * generateCrcHash('')               // '0'
 *
 * // Numbers
 * generateCrcHash(123)              // '884863d2' (hashes '123')
 * generateCrcHash(0)                // 'f4dbdf21'
 *
 * // Booleans
 * generateCrcHash(true)             // 'cc2c5c10' (hashes 'true')
 * generateCrcHash(false)            // 'cc0c5c10' (hashes 'false')
 *
 * // Objects (deterministic)
 * generateCrcHash({ a: 1, b: 2 })   // Same hash for same object
 * generateCrcHash({ b: 2, a: 1 })   // Different hash (key order matters)
 *
 * // Arrays
 * generateCrcHash([1, 2, 3])        // Consistent hash
 *
 * // null/undefined
 * generateCrcHash(null)             // '4e08bfb4' (hashes '-')
 * generateCrcHash(undefined)        // '4e08bfb4' (hashes '-')
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Generate ETag for HTTP caching
 * function generateETag(content: string): string {
 *   const hash = generateCrcHash(content)
 *   return `"${hash}"`
 * }
 *
 * const html = '<html><body>Hello World</body></html>'
 * const etag = generateETag(html)
 * // "a3c2f1b8"
 *
 * // Client sends: If-None-Match: "a3c2f1b8"
 * // Server compares ETags, returns 304 Not Modified if match
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Content-based cache key
 * const cache = new Map<string, any>()
 *
 * function cacheApiResponse(params: any, response: any) {
 *   const cacheKey = generateCrcHash(JSON.stringify(params))
 *   cache.set(cacheKey, response)
 * }
 *
 * function getCachedResponse(params: any) {
 *   const cacheKey = generateCrcHash(JSON.stringify(params))
 *   return cache.get(cacheKey)
 * }
 *
 * // Same params = same hash = cache hit
 * cacheApiResponse({ userId: 123, page: 1 }, { data: [...] })
 * const cached = getCachedResponse({ userId: 123, page: 1 })
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Detect duplicate content
 * const seen = new Set<string>()
 *
 * function isDuplicate(content: string): boolean {
 *   const hash = generateCrcHash(content)
 *   if (seen.has(hash)) {
 *     return true
 *   }
 *   seen.add(hash)
 *   return false
 * }
 *
 * isDuplicate('Hello')  // false (first time)
 * isDuplicate('World')  // false
 * isDuplicate('Hello')  // true (duplicate!)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: File versioning/fingerprinting
 * const fileContents = [
 *   { path: 'app.js', content: 'console.log("v1")' },
 *   { path: 'style.css', content: 'body { color: red; }' }
 * ]
 *
 * const manifest = fileContents.map(file => ({
 *   path: file.path,
 *   hash: generateCrcHash(file.content),
 *   url: `${file.path}?v=${generateCrcHash(file.content)}`
 * }))
 *
 * // [
 * //   { path: 'app.js', hash: 'a3c2f1b8', url: 'app.js?v=a3c2f1b8' },
 * //   { path: 'style.css', hash: 'b4d3e2c1', url: 'style.css?v=b4d3e2c1' }
 * // ]
 * // Cache-busting URLs change only when content changes
 * ```
 *
 * @see {@link deepEqual} for comparing objects for equality
 * @see {@link https://en.wikipedia.org/wiki/Cyclic_redundancy_check CRC32 Algorithm}
 */
export const generateCrcHash = (str: unknown): string => {
  if (isNil(str)) return crc32('-').toString(16)
  if (isString(str)) return crc32(str).toString(16)
  if (isBuffer(str)) return crc32(str as Buffer).toString(16)
  if (isArrayBuffer(str)) return crc32(str).toString(16)
  if (isBoolean(str)) return crc32(str ? 'true' : 'false').toString(16)
  if (isNumber(str)) return crc32(str.toString()).toString(16)
  if (isArray(str) || isObject(str)) return generateCrcHash(JSON.stringify(str))
  return crc32((str as string) || '').toString(16)
}

/**
 * Verifies if two variables have the same type
 *
 * Performs strict type comparison with special handling for arrays, typed arrays,
 * plain objects, and primitives. Uses runtime type checking for accurate validation.
 *
 * Type detection hierarchy:
 * 1. Arrays: Standard Array.isArray() check
 * 2. Typed Arrays: Int8Array, Uint8Array, Float32Array, etc. (checks exact typed array class)
 * 3. Plain Objects: Object literals (not class instances or built-in objects)
 * 4. Primitives: typeof comparison (string, number, boolean, undefined, symbol)
 *
 * Special features:
 * - Differentiates between arrays and typed arrays
 * - Typed array class matching (Int8Array ≠ Uint8Array)
 * - Plain object vs class instance detection
 * - null/undefined handling
 *
 * @param sourceTarget - First value to check type
 * @param destinationTarget - Second value to check type
 * @returns True if both values have the same type, false otherwise
 *
 * @example
 * ```typescript
 * // Basic types - Primitives
 * hasSameType('hello', 'world')           // true (both string)
 * hasSameType(42, 100)                    // true (both number)
 * hasSameType(true, false)                // true (both boolean)
 * hasSameType('hello', 42)                // false (string vs number)
 * hasSameType(null, undefined)            // false (different types)
 * ```
 *
 * @example
 * ```typescript
 * // Arrays and objects
 * hasSameType([1, 2, 3], [4, 5])          // true (both arrays)
 * hasSameType({ a: 1 }, { b: 2 })         // true (both plain objects)
 * hasSameType([1, 2], { a: 1 })           // false (array vs object)
 * hasSameType([], {})                     // false (array vs object)
 * ```
 *
 * @example
 * ```typescript
 * // Typed arrays - Strict class matching
 * const int8 = new Int8Array([1, 2, 3])
 * const int8_2 = new Int8Array([4, 5])
 * const uint8 = new Uint8Array([1, 2, 3])
 * const float32 = new Float32Array([1.5, 2.5])
 *
 * hasSameType(int8, int8_2)               // true (both Int8Array)
 * hasSameType(int8, uint8)                // false (Int8Array vs Uint8Array)
 * hasSameType(uint8, float32)             // false (Uint8Array vs Float32Array)
 * hasSameType(int8, [1, 2, 3])            // false (typed array vs regular array)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Type-safe data merging
 * function safeMerge<T>(source: T, updates: any): T | null {
 *   if (!hasSameType(source, updates)) {
 *     console.error('❌ Type mismatch: cannot merge incompatible types')
 *     return null
 *   }
 *
 *   if (Array.isArray(source)) {
 *     return [...source, ...updates] as T
 *   }
 *
 *   if (typeof source === 'object' && source !== null) {
 *     return { ...source, ...updates }
 *   }
 *
 *   return updates  // Replace primitive values
 * }
 *
 * // Valid merges
 * const user = { name: 'John', age: 30 }
 * const updated = safeMerge(user, { age: 31, city: 'NYC' })
 * // { name: 'John', age: 31, city: 'NYC' }
 *
 * // Type mismatch prevented
 * const invalid = safeMerge(user, [1, 2, 3])
 * // null (with error logged)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: API response validation
 * function validateResponseShape(expected: any, actual: any): boolean {
 *   // Check if response has the same structure
 *   if (!hasSameType(expected, actual)) {
 *     console.error('Invalid response type:', {
 *       expected: typeof expected,
 *       actual: typeof actual
 *     })
 *     return false
 *   }
 *
 *   // Additional validation for objects/arrays
 *   if (typeof expected === 'object' && expected !== null) {
 *     for (const key of Object.keys(expected)) {
 *       if (!hasSameType(expected[key], actual[key])) {
 *         console.error(`Type mismatch at key "${key}"`)
 *         return false
 *       }
 *     }
 *   }
 *
 *   return true
 * }
 *
 * const expectedUser = {
 *   id: 0,
 *   name: '',
 *   active: false,
 *   tags: [] as string[]
 * }
 *
 * const validResponse = {
 *   id: 123,
 *   name: 'Alice',
 *   active: true,
 *   tags: ['admin', 'verified']
 * }
 *
 * validateResponseShape(expectedUser, validResponse)  // true
 *
 * const invalidResponse = {
 *   id: '123',        // ❌ string instead of number
 *   name: 'Alice',
 *   active: true,
 *   tags: ['admin']
 * }
 *
 * validateResponseShape(expectedUser, invalidResponse)  // false
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Buffer/TypedArray validation before processing
 * function processImageBuffer(buffer: Uint8Array | Uint8ClampedArray): void {
 *   const validBufferTypes = [
 *     new Uint8Array(0),
 *     new Uint8ClampedArray(0)
 *   ]
 *
 *   const isValidType = validBufferTypes.some(validType =>
 *     hasSameType(buffer, validType)
 *   )
 *
 *   if (!isValidType) {
 *     throw new TypeError('Expected Uint8Array or Uint8ClampedArray for image data')
 *   }
 *
 *   // Safe to process buffer
 *   console.log(`Processing ${buffer.length} bytes of image data`)
 * }
 *
 * // Valid buffers
 * const imageData = new Uint8ClampedArray([255, 0, 0, 255])  // RGBA pixel
 * processImageBuffer(imageData)  // ✅ Works
 *
 * // Invalid buffer type
 * const float32Buffer = new Float32Array([1.0, 0.5])
 * processImageBuffer(float32Buffer)  // ❌ TypeError
 * ```
 *
 * @example
 * ```typescript
 * // Edge cases
 * hasSameType(null, null)                 // true (both null)
 * hasSameType(undefined, undefined)       // true (both undefined)
 * hasSameType(null, undefined)            // false (different types)
 * hasSameType(NaN, NaN)                   // true (both number)
 * hasSameType(Infinity, -Infinity)        // true (both number)
 *
 * // Class instances vs plain objects
 * class User { name = 'John' }
 * const userInstance = new User()
 * const plainUser = { name: 'John' }
 * hasSameType(userInstance, plainUser)    // false (class instance vs plain object)
 *
 * // Functions
 * const fn1 = () => {}
 * const fn2 = function() {}
 * hasSameType(fn1, fn2)                   // true (both functions)
 * ```
 *
 * @see {@link deepEqual} for value comparison (not just type)
 * @see {@link isArray} for array checking
 * @see {@link isPlainObject} for plain object detection
 */
export const hasSameType = (sourceTarget: unknown, destinationTarget: unknown) => {
  if (isArray(sourceTarget) && isArray(destinationTarget)) return true
  if (isArray(sourceTarget) !== isArray(destinationTarget)) return false
  if (isTypedArray(sourceTarget) && isTypedArray(destinationTarget)) {
    return (
      Object.prototype.toString.call(sourceTarget) ===
      Object.prototype.toString.call(destinationTarget)
    )
  }
  if (isTypedArray(sourceTarget) !== isTypedArray(destinationTarget)) return false
  if (isPlainObject(sourceTarget) && isPlainObject(destinationTarget)) return true

  // Check if one is object and the other is not
  if (isPlainObject(sourceTarget) !== isPlainObject(destinationTarget)) return false

  return typeof sourceTarget === typeof destinationTarget
}

/**
 * Updates array elements that match search criteria
 *
 * Finds all elements matching the search criteria and merges update object into them.
 * Mutates the original array. Useful for batch updates on filtered data.
 *
 * Algorithm:
 * 1. Filter array to find elements matching objSearch
 * 2. For each match, merge objUpd properties using Object.assign
 * 3. Return the mutated array
 *
 * @param data - Array to update (will be mutated)
 * @param objUpd - Object with properties to merge into matching elements
 * @param objSearch - Object with search criteria (all properties must match)
 * @returns The mutated array with updated elements
 *
 * @example
 * ```typescript
 * // Update all users with role 'user' to 'member'
 * const users = [
 *   { id: 1, name: 'Alice', role: 'user', active: true },
 *   { id: 2, name: 'Bob', role: 'admin', active: true },
 *   { id: 3, name: 'Charlie', role: 'user', active: false }
 * ]
 *
 * updateArrayElementsBy(users, { role: 'member' }, { role: 'user' })
 * // users is now:
 * // [
 * //   { id: 1, name: 'Alice', role: 'member', active: true },
 * //   { id: 2, name: 'Bob', role: 'admin', active: true },
 * //   { id: 3, name: 'Charlie', role: 'member', active: false }
 * // ]
 *
 * // Update multiple properties
 * const products = [
 *   { sku: 'A1', status: 'draft', published: false },
 *   { sku: 'A2', status: 'draft', published: false },
 *   { sku: 'B1', status: 'active', published: true }
 * ]
 *
 * updateArrayElementsBy(
 *   products,
 *   { status: 'active', published: true },
 *   { status: 'draft' }
 * )
 * // All draft products now active and published
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Bulk activate pending users
 * const pendingUsers = [
 *   { email: 'user1@example.com', status: 'pending', verified: false },
 *   { email: 'user2@example.com', status: 'pending', verified: false },
 *   { email: 'user3@example.com', status: 'active', verified: true }
 * ]
 *
 * // Activate all pending users
 * updateArrayElementsBy(
 *   pendingUsers,
 *   { status: 'active', verified: true, activatedAt: new Date() },
 *   { status: 'pending' }
 * )
 *
 * console.log(pendingUsers.filter(u => u.status === 'active').length)
 * // 3 (all users now active)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Mark completed tasks as archived
 * const tasks = [
 *   { id: 1, title: 'Task 1', completed: true, archived: false },
 *   { id: 2, title: 'Task 2', completed: false, archived: false },
 *   { id: 3, title: 'Task 3', completed: true, archived: false }
 * ]
 *
 * updateArrayElementsBy(
 *   tasks,
 *   { archived: true, archivedAt: new Date() },
 *   { completed: true }
 * )
 *
 * const archivedCount = tasks.filter(t => t.archived).length
 * console.log(`Archived ${archivedCount} completed tasks`)
 * ```
 *
 * @see {@link updateArrayElementById} for updating single element by ID
 * @see {@link deleteArrayElementsBy} for deleting elements by criteria
 */
export const updateArrayElementsBy = (data: any[], objUpd: any, objSearch: any) => {
  nativeFilter(data, objSearch).forEach(element => Object.assign(element, objUpd))
  return data
}

/**
 * Updates a single array element by its ID field
 *
 * Finds element by matching ID field value and replaces entire element with new object.
 * Mutates the original array. Use for updating single records by primary key.
 *
 * Algorithm:
 * 1. Find index of element where element[idField] === objUpd[idField]
 * 2. If found, replace entire element with objUpd
 * 3. If not found, array remains unchanged
 *
 * @param data - Array to update (will be mutated)
 * @param objUpd - New object to replace the found element (must contain idField)
 * @param idField - Name of field to use as identifier (default: 'id')
 * @returns void (modifies array in-place)
 *
 * @example
 * ```typescript
 * // Update user by ID
 * const users = [
 *   { id: 1, name: 'Alice', email: 'alice@example.com' },
 *   { id: 2, name: 'Bob', email: 'bob@example.com' },
 *   { id: 3, name: 'Charlie', email: 'charlie@example.com' }
 * ]
 *
 * updateArrayElementById(
 *   users,
 *   { id: 2, name: 'Robert', email: 'robert@example.com', verified: true },
 *   'id'
 * )
 * // users[1] is now: { id: 2, name: 'Robert', email: 'robert@example.com', verified: true }
 *
 * // ID not found - no change
 * updateArrayElementById(users, { id: 999, name: 'Unknown' }, 'id')
 * // users array unchanged
 *
 * // Custom ID field
 * const products = [
 *   { sku: 'ABC123', name: 'Widget', price: 10 },
 *   { sku: 'DEF456', name: 'Gadget', price: 20 }
 * ]
 *
 * updateArrayElementById(
 *   products,
 *   { sku: 'ABC123', name: 'Super Widget', price: 15 },
 *   'sku'
 * )
 * // products[0] is now: { sku: 'ABC123', name: 'Super Widget', price: 15 }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Update cached user after API response
 * const userCache = [
 *   { id: 1, name: 'Alice', role: 'user' },
 *   { id: 2, name: 'Bob', role: 'admin' },
 * ]
 *
 * async function updateUser(userId: number, updates: any) {
 *   // API call
 *   const response = await api.patch(`/users/${userId}`, updates)
 *
 *   // Update local cache with full response
 *   updateArrayElementById(userCache, response.data, 'id')
 *
 *   console.log('✅ Cache updated')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Replace product in shopping cart
 * const cart = [
 *   { productId: 'P1', name: 'Laptop', qty: 1, price: 1000 },
 *   { productId: 'P2', name: 'Mouse', qty: 2, price: 25 }
 * ]
 *
 * function updateCartItem(updatedItem: any) {
 *   updateArrayElementById(cart, updatedItem, 'productId')
 *   recalculateTotal()
 * }
 *
 * // User changes laptop quantity
 * updateCartItem({ productId: 'P1', name: 'Laptop', qty: 2, price: 1000 })
 * ```
 *
 * @see {@link updateArrayElementsBy} for updating multiple elements by criteria
 * @see {@link deleteArrayElementsBy} for deleting elements
 */
export const updateArrayElementById = (data: any[], objUpd: any, idField: string) => {
  const index = data.findIndex(x => x[idField] === objUpd[idField])
  if (index !== -1) data.splice(index, 1, objUpd)
}

/**
 * Removes array elements that match search criteria
 *
 * Filters out elements matching all properties in the search object.
 * Mutates the original array. Useful for batch deletions based on criteria.
 *
 * Algorithm:
 * 1. Pick properties from each element matching objSearch keys
 * 2. Deep compare picked properties with objSearch
 * 3. Remove element if all properties match
 * 4. Return the mutated array
 *
 * @param data - Array to modify (will be mutated)
 * @param objSearch - Object with search criteria (all properties must match for deletion)
 * @returns The mutated array with matching elements removed
 *
 * @example
 * ```typescript
 * // Delete users with role 'guest'
 * const users = [
 *   { id: 1, name: 'Alice', role: 'admin' },
 *   { id: 2, name: 'Bob', role: 'guest' },
 *   { id: 3, name: 'Charlie', role: 'guest' },
 *   { id: 4, name: 'Dave', role: 'user' }
 * ]
 *
 * deleteArrayElementsBy(users, { role: 'guest' })
 * // users is now: [
 * //   { id: 1, name: 'Alice', role: 'admin' },
 * //   { id: 4, name: 'Dave', role: 'user' }
 * // ]
 *
 * // Multiple criteria (AND condition)
 * const tasks = [
 *   { id: 1, status: 'done', archived: true },
 *   { id: 2, status: 'done', archived: false },
 *   { id: 3, status: 'pending', archived: false }
 * ]
 *
 * deleteArrayElementsBy(tasks, { status: 'done', archived: true })
 * // Removes only tasks that are BOTH done AND archived
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Clean up expired sessions
 * const sessions = [
 *   { sessionId: 'abc', userId: 1, expired: false },
 *   { sessionId: 'def', userId: 2, expired: true },
 *   { sessionId: 'ghi', userId: 3, expired: true },
 *   { sessionId: 'jkl', userId: 4, expired: false }
 * ]
 *
 * // Remove all expired sessions
 * deleteArrayElementsBy(sessions, { expired: true })
 *
 * console.log(`Active sessions: ${sessions.length}`)
 * // Active sessions: 2
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Remove cancelled orders from pending list
 * const orders = [
 *   { orderId: 'O1', status: 'pending', cancelled: false },
 *   { orderId: 'O2', status: 'pending', cancelled: true },
 *   { orderId: 'O3', status: 'shipped', cancelled: false },
 *   { orderId: 'O4', status: 'pending', cancelled: true }
 * ]
 *
 * // Clean up cancelled pending orders
 * deleteArrayElementsBy(orders, { status: 'pending', cancelled: true })
 *
 * // orders now only has valid pending and shipped orders
 * console.log(orders.length)  // 2
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Clear failed upload queue
 * const uploadQueue = [
 *   { fileId: 'F1', status: 'uploading', retries: 0 },
 *   { fileId: 'F2', status: 'failed', retries: 3 },
 *   { fileId: 'F3', status: 'failed', retries: 3 },
 *   { fileId: 'F4', status: 'completed', retries: 0 }
 * ]
 *
 * // Remove permanently failed uploads (max retries reached)
 * deleteArrayElementsBy(uploadQueue, { status: 'failed', retries: 3 })
 *
 * console.log(`Remaining in queue: ${uploadQueue.length}`)
 * // Remaining in queue: 2 (uploading + completed)
 * ```
 *
 * @see {@link updateArrayElementsBy} for updating elements by criteria
 * @see {@link updateArrayElementById} for updating single element by ID
 */
export const deleteArrayElementsBy = (data: any[], objSearch: any) => {
  nativeRemove(data, x => deepEqual(nativePick(x, Object.keys(objSearch) as any), objSearch))
  return data
}

/**
 * Sets a value at a deep path in an object using dot notation
 *
 * Creates intermediate objects/arrays as needed. Supports nested paths
 * and array indices. Mutates the original object.
 *
 * @param obj - Object to modify (will be mutated)
 * @param path - Dot-notation path (e.g., 'database.connection.timeout')
 * @param value - Value to set at the path
 * @returns The modified object (same reference as input)
 *
 * @example
 * ```typescript
 * // Simple nested path
 * const config = {}
 * setDeepValue(config, 'database.host', 'localhost')
 * // config = { database: { host: 'localhost' } }
 *
 * // Multi-level nesting
 * const obj = {}
 * setDeepValue(obj, 'app.server.port', 3000)
 * // obj = { app: { server: { port: 3000 } } }
 *
 * // Array indices
 * const data = { users: [] }
 * setDeepValue(data, 'users.0.name', 'Alice')
 * // data = { users: [{ name: 'Alice' }] }
 *
 * // Overwriting existing values
 * const settings = { database: { host: 'old' } }
 * setDeepValue(settings, 'database.host', 'new')
 * // settings = { database: { host: 'new' } }
 *
 * // Complex paths
 * const complex = {}
 * setDeepValue(complex, 'features.authentication.oauth.providers.0', 'google')
 * // complex = { features: { authentication: { oauth: { providers: ['google'] } } } }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Dynamic configuration
 * const config = {}
 * const envVars = {
 *   'DATABASE_HOST': 'localhost',
 *   'DATABASE_PORT': '5432',
 *   'CACHE_TTL': '3600'
 * }
 *
 * // Convert flat env vars to nested config
 * setDeepValue(config, 'database.host', envVars.DATABASE_HOST)
 * setDeepValue(config, 'database.port', parseInt(envVars.DATABASE_PORT))
 * setDeepValue(config, 'cache.ttl', parseInt(envVars.CACHE_TTL))
 * // config = {
 * //   database: { host: 'localhost', port: 5432 },
 * //   cache: { ttl: 3600 }
 * // }
 * ```
 */
export function setDeepValue<T = any>(obj: T, path: string, value: any): T {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('setDeepValue: target must be an object')
  }

  if (!path || typeof path !== 'string') {
    throw new TypeError('setDeepValue: path must be a non-empty string')
  }

  const keys = path.split('.')
  let current: any = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]

    // Determine if next level should be an array or object
    const isNextArray = /^\d+$/.test(nextKey)

    // Create intermediate level if it doesn't exist
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = isNextArray ? [] : {}
    }

    current = current[key]
  }

  // Set the final value
  const lastKey = keys[keys.length - 1]
  current[lastKey] = value

  return obj
}

/**
 * Gets a value at a deep path in an object using dot notation
 *
 * Safely retrieves values from nested objects/arrays. Returns undefined
 * or a default value if path doesn't exist.
 *
 * @param obj - Object to read from
 * @param path - Dot-notation path (e.g., 'database.connection.timeout')
 * @param defaultValue - Value to return if path doesn't exist (default: undefined)
 * @returns Value at the path, or defaultValue if not found
 *
 * @example
 * ```typescript
 * // Simple nested access
 * const config = { database: { host: 'localhost' } }
 * getDeepValue(config, 'database.host')  // 'localhost'
 *
 * // Non-existent path returns undefined
 * getDeepValue(config, 'database.port')  // undefined
 *
 * // With default value
 * getDeepValue(config, 'database.port', 5432)  // 5432
 *
 * // Array access
 * const data = { users: [{ name: 'Alice' }, { name: 'Bob' }] }
 * getDeepValue(data, 'users.0.name')  // 'Alice'
 * getDeepValue(data, 'users.1.name')  // 'Bob'
 *
 * // Deep paths
 * const app = { features: { auth: { enabled: true } } }
 * getDeepValue(app, 'features.auth.enabled')  // true
 * getDeepValue(app, 'features.payments.enabled', false)  // false (default)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Safe config access
 * const config = {
 *   database: { host: 'localhost' },
 *   cache: { ttl: 3600 }
 * }
 *
 * const dbHost = getDeepValue(config, 'database.host', '127.0.0.1')
 * const dbPort = getDeepValue(config, 'database.port', 5432)
 * const cacheTtl = getDeepValue(config, 'cache.ttl', 1800)
 * const redisHost = getDeepValue(config, 'redis.host', 'localhost')
 *
 * // All values are safely retrieved with fallbacks
 * ```
 */
export function getDeepValue<T = any>(obj: any, path: string, defaultValue?: T): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return defaultValue
  }

  if (!path || typeof path !== 'string') {
    return defaultValue
  }

  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue
    }

    if (!(key in current)) {
      return defaultValue
    }

    current = current[key]
  }

  return current !== undefined ? current : defaultValue
}
