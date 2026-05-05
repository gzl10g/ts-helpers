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

/**
 * Selects a subset of properties from an object
 *
 * Returns a new object containing only the specified keys.
 * If a key does not exist in the source object, it is not included in the result
 * (never adds properties with `undefined` value). The operation is immutable:
 * the original object is not modified.
 *
 * Use cases: building API payloads, projecting DTOs, isolating form fields.
 *
 * @param obj - Source object (not mutated)
 * @param keys - Array of keys to select
 * @returns New object containing only the specified properties
 *
 * @example
 * // Basic property selection
 * const user = { id: 1, name: 'Ana', email: 'ana@example.com', password: 'secret' }
 * pick(user, ['id', 'name', 'email'])
 * // → { id: 1, name: 'Ana', email: 'ana@example.com' }
 *
 * @example
 * // Non-existent key — not added to result
 * const obj = { a: 1, b: 2 }
 * pick(obj, ['a', 'c' as keyof typeof obj])
 * // → { a: 1 }
 *
 * @example
 * // Prepare partial update payload
 * const fullRecord = { id: 42, title: 'Draft', body: 'Content', createdAt: new Date() }
 * const updatePayload = pick(fullRecord, ['title', 'body'])
 * // → { title: 'Draft', body: 'Content' }
 */
export const pick = <T extends object, K extends keyof T>(
  obj: Readonly<T>,
  keys: readonly K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * Returns a new object excluding the specified properties
 *
 * The operation is immutable: the original object is not modified.
 * Useful for removing sensitive fields, preparing API responses, or
 * filtering properties before persisting data.
 *
 * @param obj - Source object (not mutated)
 * @param keys - Array of keys to exclude
 * @returns New object without the specified properties
 *
 * @example
 * // Remove sensitive field before sending response
 * const user = { id: 1, name: 'Ana', password: 'secret', token: 'abc' }
 * omit(user, ['password', 'token'])
 * // → { id: 1, name: 'Ana' }
 *
 * @example
 * // Omit all keys → empty object
 * const obj = { a: 1, b: 2 }
 * omit(obj, ['a', 'b'])
 * // → {}
 *
 * @example
 * // Empty keys array → shallow copy of the object
 * const config = { host: 'localhost', port: 5432, ssl: true }
 * omit(config, [])
 * // → { host: 'localhost', port: 5432, ssl: true }
 */
export const omit = <T extends object, K extends keyof T>(
  obj: Readonly<T>,
  keys: readonly K[]
): Omit<T, K> => {
  const keysSet = new Set<string>(keys as unknown as string[])
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keysSet.has(k))) as Omit<T, K>
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
export const formatToReadableString = (data: Record<string, unknown>): string =>
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
export const calculateDifferences = <T extends object>(
  oldObj: Partial<T>,
  newObj: T
): Partial<T> => {
  return transform(
    newObj as any,
    (result: any, value: unknown, key: string) => {
      const oldValue = (oldObj as Record<string, unknown>)[key]
      // If both values are dates, compare them ignoring milliseconds
      if (isDateTime(value) && isDateTime(oldValue)) {
        if (!areDatesEqualWithTolerance(toDate(value), toDate(oldValue))) {
          result[key] = value
        }
      } else if (!isEqual(value, oldValue)) {
        result[key] = value
      }
    },
    {} as Partial<T>
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
export const updateArrayElementsBy = <T extends object>(
  data: T[],
  objUpd: Partial<T>,
  objSearch: Partial<T>
): T[] => {
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
export const updateArrayElementById = <T extends object>(
  data: T[],
  objUpd: Partial<T>,
  idField: keyof T
): T[] => {
  const index = data.findIndex(x => x[idField] === objUpd[idField])
  if (index !== -1) data.splice(index, 1, objUpd as T)
  return data
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
export const deleteArrayElementsBy = <T extends object>(data: T[], objSearch: Partial<T>): T[] => {
  const searchKeys = Object.keys(objSearch) as Array<keyof T>
  nativeRemove(data, x => deepEqual(pick<T, keyof T>(x, searchKeys), objSearch))
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

// Private helper: resolves an iteratee (key name or function) to its value for a given item
const resolveIteratee = <T>(item: T, iteratee: keyof T | ((item: T) => unknown)): unknown =>
  typeof iteratee === 'function' ? iteratee(item) : item[iteratee]

/**
 * Groups array elements by a key property or iteratee function
 *
 * Partitions an array into groups where each group contains all elements that
 * produce the same key. The key is derived from a property name or a function
 * that receives each element and returns a string or number.
 *
 * The result is a `Record<string, T[]>` where each value is an array of elements
 * that share the same key. Not all keys are guaranteed to exist in the result —
 * only keys produced by at least one element will be present (sparse result).
 *
 * Use cases: grouping orders by status, partitioning users by role,
 * building lookup tables from flat arrays.
 *
 * @param arr - Source array to group (not mutated)
 * @param iteratee - Property key or function that returns the group key for each element
 * @returns Record mapping each group key to an array of matching elements
 *
 * @example
 * // Group by string property
 * const items = [{ type: 'a' }, { type: 'b' }, { type: 'a' }]
 * groupBy(items, 'type')
 * // → { a: [{ type: 'a' }, { type: 'a' }], b: [{ type: 'b' }] }
 *
 * @example
 * // Group by function iteratee
 * const numbers = [1, 2, 3, 4, 5]
 * groupBy(numbers, n => n % 2 === 0 ? 'even' : 'odd')
 * // → { odd: [1, 3, 5], even: [2, 4] }
 *
 * @example
 * // Group users by role for batch processing
 * const users = [
 *   { id: 1, name: 'Alice', role: 'admin' },
 *   { id: 2, name: 'Bob', role: 'user' },
 *   { id: 3, name: 'Charlie', role: 'admin' }
 * ]
 * const byRole = groupBy(users, 'role')
 * // → { admin: [Alice, Charlie], user: [Bob] }
 * // Note: result is sparse — only keys present in data appear
 */
export const groupBy = <T>(
  arr: T[],
  iteratee: keyof T | ((item: T) => string | number)
): Record<string, T[]> => {
  return arr.reduce(
    (acc, item) => {
      const key = String(resolveIteratee(item, iteratee))
      ;(acc[key] ??= []).push(item)
      return acc
    },
    {} as Record<string, T[]>
  )
}

/**
 * Indexes array elements by a key property or iteratee function
 *
 * Creates a lookup object (index) where each element is stored under the key
 * derived from a property name or function. If multiple elements produce the
 * same key, the last one wins (previous value is overwritten).
 *
 * The result is a `Record<string, T>` mapping each key to a single element.
 * Only keys produced by at least one element appear in the result (sparse result).
 *
 * Use cases: building fast O(1) lookup tables, converting arrays to maps by ID,
 * de-duplicating lists keeping last value.
 *
 * @param arr - Source array to index (not mutated)
 * @param iteratee - Property key or function that returns the index key for each element
 * @returns Record mapping each key to the last element that produced that key
 *
 * @example
 * // Index by ID property
 * const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
 * keyBy(users, 'id')
 * // → { '1': { id: 1, name: 'Alice' }, '2': { id: 2, name: 'Bob' } }
 *
 * @example
 * // Last element wins on key collision
 * const items = [{ id: 1, v: 'a' }, { id: 1, v: 'b' }]
 * keyBy(items, 'id')
 * // → { '1': { id: 1, v: 'b' } }
 *
 * @example
 * // Index using a function iteratee
 * const products = [{ sku: 'A-1', price: 10 }, { sku: 'B-2', price: 20 }]
 * keyBy(products, p => p.sku.split('-')[0])
 * // → { A: { sku: 'A-1', price: 10 }, B: { sku: 'B-2', price: 20 } }
 */
export const keyBy = <T>(
  arr: T[],
  iteratee: keyof T | ((item: T) => string | number)
): Record<string, T> => {
  return arr.reduce(
    (acc, item) => {
      acc[String(resolveIteratee(item, iteratee))] = item
      return acc
    },
    {} as Record<string, T>
  )
}

/**
 * Splits an array into consecutive chunks of the given size.
 *
 * The last chunk may be smaller than `size` if the array length is not evenly
 * divisible. The original array is never mutated.
 *
 * @param arr - Source array to split (not mutated)
 * @param size - Maximum number of elements per chunk. Must be >= 1.
 * @returns Array of chunks, each an array of at most `size` elements
 * @throws {Error} If `size` is less than 1
 *
 * @example
 * // Even split
 * chunk([1, 2, 3, 4], 2)
 * // → [[1, 2], [3, 4]]
 *
 * @example
 * // Remainder in last chunk
 * chunk([1, 2, 3, 4, 5], 2)
 * // → [[1, 2], [3, 4], [5]]
 *
 * @example
 * // Size equal to array length
 * chunk([1, 2, 3], 3)
 * // → [[1, 2, 3]]
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  if (size < 1) throw new Error(`chunk: size must be >= 1, got ${size}`)
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

/**
 * Zips multiple arrays together, producing an array of tuples.
 *
 * Each element in the result is an array containing the elements at the same
 * index from each input array. The output length equals the length of the
 * longest input array. If arrays have different lengths, shorter ones produce
 * `undefined` at missing positions (the element type becomes `T | undefined`).
 *
 * @param arrays - One or more arrays to zip together
 * @returns Array of tuples, one per index position across all input arrays
 *
 * @example
 * // Two arrays of equal length
 * zip([1, 2, 3], ['a', 'b', 'c'])
 * // → [[1, 'a'], [2, 'b'], [3, 'c']]
 *
 * @example
 * // Arrays of different lengths — shorter produces undefined
 * zip([1, 2], ['a', 'b', 'c'])
 * // → [[1, 'a'], [2, 'b'], [undefined, 'c']]
 *
 * @example
 * // Single array
 * zip([1, 2, 3])
 * // → [[1], [2], [3]]
 */
export const zip = <T>(...arrays: T[][]): T[][] => {
  const length = Math.max(0, ...arrays.map(a => a.length))
  return Array.from({ length }, (_, i) => arrays.map(a => a[i]))
}

/**
 * Flattens a nested array up to the specified depth.
 *
 * Delegates to the native `Array.prototype.flat` method. By default flattens
 * one level deep. Pass `Infinity` to fully flatten any depth.
 *
 * @param arr - Nested array to flatten (not mutated)
 * @param depth - Number of levels to flatten. Defaults to 1.
 * @returns New flattened array
 *
 * @example
 * // One level (default)
 * flatten([1, [2, [3]]])
 * // → [1, 2, [3]]
 *
 * @example
 * // Custom depth
 * flatten([1, [2, [3, [4]]]], 2)
 * // → [1, 2, 3, [4]]
 *
 * @example
 * // Already flat — no-op
 * flatten([1, 2, 3])
 * // → [1, 2, 3]
 */
export const flatten = <T, D extends number = 1>(arr: T[], depth?: D): FlatArray<T[], D>[] =>
  arr.flat(depth as D)

/**
 * Splits an array into two groups based on a predicate function.
 *
 * Returns a tuple `[pass, fail]` where `pass` contains elements for which the
 * predicate returned `true` and `fail` contains the rest. Order within each
 * group is preserved. The input array is not mutated.
 *
 * @param arr - Source array to partition (not mutated)
 * @param predicate - Function that returns `true` to place an element in the first group
 * @returns Tuple `[pass, fail]` — elements that satisfy the predicate, then those that don't
 *
 * @example
 * // Split numbers into even and odd
 * partition([1, 2, 3, 4], n => n % 2 === 0)
 * // → [[2, 4], [1, 3]]
 *
 * @example
 * // All elements pass
 * partition([1, 2, 3], n => n > 0)
 * // → [[1, 2, 3], []]
 *
 * @example
 * // No elements pass
 * partition([1, 2, 3], n => n > 10)
 * // → [[], [1, 2, 3]]
 */
export const partition = <T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] => {
  const pass: T[] = []
  const fail: T[] = []
  for (const item of arr) {
    ;(predicate(item) ? pass : fail).push(item)
  }
  return [pass, fail]
}

/**
 * Returns a new array with duplicate values removed, preserving insertion order.
 *
 * Deduplication uses `Set` semantics: primitives are compared by value, objects
 * by reference. Use {@link uniqBy} when you need deep equality or key-based
 * deduplication for objects.
 *
 * @param arr - Source array (not mutated)
 * @returns New array with duplicate values removed
 *
 * @example
 * // Primitive deduplication
 * uniq([1, 2, 2, 3, 1])
 * // → [1, 2, 3]
 *
 * @example
 * // Strings
 * uniq(['a', 'b', 'a', 'c'])
 * // → ['a', 'b', 'c']
 *
 * @example
 * // Objects compared by reference — distinct references are kept
 * const a = { x: 1 }
 * uniq([a, a, { x: 1 }])
 * // → [{ x: 1 }, { x: 1 }]  (two items: a and the new literal)
 */
export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)]

/**
 * Returns a new array with duplicates removed based on a key property or iteratee function.
 *
 * When multiple elements produce the same key, only the **first occurrence** is kept.
 * Delegates key resolution to the private `resolveIteratee` helper already used by
 * {@link groupBy} and {@link keyBy}. The input array is not mutated.
 *
 * @param arr - Source array (not mutated)
 * @param iteratee - Property key or function that returns the deduplication key for each element
 * @returns New array with duplicates removed (first occurrence wins)
 *
 * @example
 * // Deduplicate objects by property key
 * const items = [{ id: 1, v: 'a' }, { id: 2, v: 'b' }, { id: 1, v: 'c' }]
 * uniqBy(items, 'id')
 * // → [{ id: 1, v: 'a' }, { id: 2, v: 'b' }]
 *
 * @example
 * // Deduplicate numbers using a function iteratee
 * uniqBy([1.1, 1.4, 2.5, 2.9], Math.floor)
 * // → [1.1, 2.5]
 *
 * @example
 * // Empty input
 * uniqBy([], 'id')
 * // → []
 */
export const uniqBy = <T>(arr: T[], iteratee: keyof T | ((item: T) => unknown)): T[] => {
  const seen = new Map<unknown, T>()
  for (const item of arr) {
    const key = resolveIteratee(item, iteratee)
    if (!seen.has(key)) seen.set(key, item)
  }
  return [...seen.values()]
}

/**
 * Maps the values of an object while preserving its keys.
 *
 * Applies the given function to each value (and optionally key) of the source object,
 * returning a new object with the same keys but transformed values. The original object
 * is not mutated.
 *
 * @param obj - Source object (not mutated)
 * @param fn - Transformation function receiving the value and its key
 * @returns New object with the same keys and transformed values
 *
 * @example
 * // Double all values
 * mapValues({ a: 1, b: 2, c: 3 }, v => v * 2)
 * // → { a: 2, b: 4, c: 6 }
 *
 * @example
 * // Use key in transformation
 * mapValues({ x: 10, y: 20 }, (v, k) => `${k}=${v}`)
 * // → { x: 'x=10', y: 'y=20' }
 *
 * @example
 * // Convert string values to uppercase
 * mapValues({ name: 'alice', city: 'madrid' }, v => v.toUpperCase())
 * // → { name: 'ALICE', city: 'MADRID' }
 */
export const mapValues = <K extends string, T, U>(
  obj: Record<K, T>,
  fn: (value: T, key: K) => U
): Record<K, U> =>
  Object.fromEntries((Object.entries(obj) as [K, T][]).map(([k, v]) => [k, fn(v, k)])) as Record<
    K,
    U
  >

/**
 * Filters an object's entries by a predicate applied to each value (and optionally key).
 *
 * Returns a new object containing only the entries for which the predicate returns `true`.
 * Returns `Partial<Record<K, T>>` because not all keys of the original object are guaranteed
 * to be present in the result. The original object is not mutated.
 *
 * @param obj - Source object (not mutated)
 * @param fn - Predicate function receiving the value and its key; keep entry when `true`
 * @returns New partial object containing only the matching entries
 *
 * @example
 * // Keep only positive values
 * filterValues({ a: 1, b: 0, c: 2, d: -1 }, v => v > 0)
 * // → { a: 1, c: 2 }
 *
 * @example
 * // Filter using both value and key
 * filterValues({ foo: 1, bar: 2, baz: 3 }, (v, k) => k.startsWith('b') && v > 1)
 * // → { bar: 2, baz: 3 }
 *
 * @example
 * // Remove nullish values
 * filterValues({ a: 'hello', b: null, c: undefined, d: 'world' }, v => v != null)
 * // → { a: 'hello', d: 'world' }
 */
export const filterValues = <K extends string, T>(
  obj: Record<K, T>,
  fn: (value: T, key: K) => boolean
): Partial<Record<K, T>> =>
  Object.fromEntries((Object.entries(obj) as [K, T][]).filter(([k, v]) => fn(v, k))) as Partial<
    Record<K, T>
  >

/**
 * Sorts an array by one or more iteratees (object keys or extractor functions).
 *
 * Performs a stable multi-key sort: when two elements are equal according to the
 * first iteratee, the second iteratee is used as a tiebreaker, and so on.
 * `null` and `undefined` values always sort **last**, regardless of direction.
 * The original array is never mutated — a new sorted array is returned.
 *
 * @param arr - Source array to sort (not mutated)
 * @param iteratees - One or more keys of `T` or extractor functions `(item: T) => unknown`
 * @returns New array sorted according to the given iteratees
 *
 * @example
 * // Sort by a single key ascending
 * sortBy([{ age: 30 }, { age: 20 }, { age: 25 }], 'age')
 * // → [{ age: 20 }, { age: 25 }, { age: 30 }]
 *
 * @example
 * // Sort by multiple keys — second key breaks ties on the first
 * sortBy(
 *   [{ dept: 'eng', name: 'Zoe' }, { dept: 'eng', name: 'Ana' }, { dept: 'art', name: 'Bob' }],
 *   'dept', 'name'
 * )
 * // → [{ dept: 'art', name: 'Bob' }, { dept: 'eng', name: 'Ana' }, { dept: 'eng', name: 'Zoe' }]
 *
 * @example
 * // Sort descending using a function iteratee (negate the value)
 * sortBy([{ n: 1 }, { n: 3 }, { n: 2 }], item => -item.n)
 * // → [{ n: 3 }, { n: 2 }, { n: 1 }]
 *
 * @example
 * // null / undefined values sort last
 * sortBy([{ v: 1 }, { v: null }, { v: 2 }], 'v')
 * // → [{ v: 1 }, { v: 2 }, { v: null }]
 */
export const sortBy = <T>(arr: T[], ...iteratees: Array<keyof T | ((item: T) => unknown)>): T[] =>
  [...arr].sort((a, b) => {
    for (const iteratee of iteratees) {
      const va = resolveIteratee(a, iteratee)
      const vb = resolveIteratee(b, iteratee)
      if (va == null && vb == null) continue
      if (va == null) return 1 // nulls/undefined go last
      if (vb == null) return -1
      if (va < vb) return -1
      if (va > vb) return 1
    }
    return 0
  })
