/**
 * Asynchronous utilities and operations
 * Consolidated from core/async module
 */

/* eslint-disable no-await-in-loop */

import { TsHelpersError, TsHelpersErrorCode } from './errors'

// =============================================================================
// DELAY UTILITIES
// =============================================================================

/**
 * Creates an asynchronous delay for the specified number of milliseconds
 *
 * Pauses async execution without blocking the event loop. Uses Promise with setTimeout
 * internally to schedule resumption after the specified delay.
 *
 * Common use cases:
 * - Rate limiting API calls
 * - Retry delays with exponential backoff
 * - Animation/transition timing
 * - Polling intervals
 * - Debouncing operations
 *
 * @param ms - Milliseconds to sleep (delay duration)
 * @returns Promise that resolves after the specified delay
 *
 * @example
 * ```typescript
 * // Basic delay
 * console.log('Starting...')
 * await sleep(2000)  // Wait 2 seconds
 * console.log('Done!')
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Rate-limited API calls
 * async function fetchAllUsers(userIds: string[]): Promise<User[]> {
 *   const users: User[] = []
 *
 *   for (const id of userIds) {
 *     const user = await api.getUser(id)
 *     users.push(user)
 *
 *     // Rate limit: 100ms between requests (max 10 req/sec)
 *     await sleep(100)
 *   }
 *
 *   return users
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Exponential backoff retry
 * async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
 *   let lastError: Error | null = null
 *
 *   for (let attempt = 0; attempt < maxRetries; attempt++) {
 *     try {
 *       return await fetch(url)
 *     } catch (error) {
 *       lastError = error as Error
 *       const delay = Math.pow(2, attempt) * 1000  // 1s, 2s, 4s
 *       console.log(`Retry ${attempt + 1}/${maxRetries} in ${delay}ms`)
 *       await sleep(delay)
 *     }
 *   }
 *
 *   throw lastError
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Polling with timeout
 * async function pollUntilReady(
 *   checkFn: () => Promise<boolean>,
 *   timeoutMs = 30000
 * ): Promise<boolean> {
 *   const startTime = Date.now()
 *
 *   while (Date.now() - startTime < timeoutMs) {
 *     if (await checkFn()) {
 *       return true
 *     }
 *     await sleep(1000)  // Poll every second
 *   }
 *
 *   throw new Error('Timeout waiting for ready state')
 * }
 *
 * // Usage: Wait for service to be ready
 * await pollUntilReady(async () => {
 *   const response = await fetch('/health')
 *   return response.ok
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Animated progress bar
 * async function animateProgress(element: HTMLElement): Promise<void> {
 *   for (let i = 0; i <= 100; i += 5) {
 *     element.style.width = `${i}%`
 *     await sleep(50)  // 50ms per step = 1 second total
 *   }
 * }
 * ```
 *
 * @see {@link wait} for alias with same functionality
 * @see {@link runBatch} for controlled concurrent execution
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Simple alias for sleep - Pauses execution for specified milliseconds
 *
 * Identical to {@link sleep}, provided for semantic clarity in code.
 * Use `wait` when the context emphasizes waiting for a condition or event.
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified delay
 *
 * @example
 * ```typescript
 * // Semantically clearer in some contexts
 * await wait(1000)  // Wait 1 second before continuing
 *
 * // vs sleep (implies intentional delay)
 * await sleep(1000)  // Sleep for 1 second
 * ```
 *
 * @see {@link sleep} for full documentation and examples
 */
export const wait = (ms: number): Promise<void> => sleep(ms)

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Executes an array of Promises in batches to control concurrency
 *
 * Processes promises in sequential batches, waiting for each batch to complete before
 * starting the next. Prevents overwhelming systems with too many concurrent requests.
 *
 * Algorithm:
 * 1. Divide promises into batches of size `batchSize`
 * 2. Execute each batch with Promise.all (parallel within batch)
 * 3. Wait for batch completion before starting next batch
 * 4. Collect and return all results in original order
 *
 * Use cases:
 * - Rate-limited API calls (respect API quotas)
 * - Database bulk operations (avoid connection pool exhaustion)
 * - File system operations (prevent file descriptor limits)
 * - Memory-intensive operations (control memory usage)
 *
 * @param jobs - Array of Promises to execute
 * @param batchSize - Number of promises to execute concurrently per batch (default: 50)
 * @returns Promise resolving to array of all results in original order
 *
 * @example
 * ```typescript
 * // Basic batch processing
 * const urls = ['url1', 'url2', ..., 'url100']  // 100 URLs
 * const fetchPromises = urls.map(url => fetch(url))
 *
 * // Execute 10 at a time instead of all 100 simultaneously
 * const responses = await runBatch(fetchPromises, 10)
 * // Batch 1: urls 0-9 (parallel)
 * // Batch 2: urls 10-19 (parallel) - starts after batch 1 completes
 * // ... 10 batches total
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Bulk user data fetch respecting API rate limits
 * async function fetchUsersInBatches(userIds: string[]): Promise<User[]> {
 *   console.log(`Fetching ${userIds.length} users in batches of 20...`)
 *
 *   const fetchPromises = userIds.map(id =>
 *     fetch(`/api/users/${id}`).then(res => res.json())
 *   )
 *
 *   const users = await runBatch(fetchPromises, 20)
 *
 *   console.log(`✅ Fetched ${users.length} users`)
 *   return users
 * }
 *
 * // Fetches 1000 users: 50 batches of 20, not 1000 simultaneous requests
 * const allUsers = await fetchUsersInBatches(userIdArray)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Database bulk insert with connection pool limits
 * async function bulkInsertUsers(users: User[]): Promise<void> {
 *   // Database pool has 10 connections, use batch size of 5 for safety
 *   const insertPromises = users.map(user =>
 *     db.query('INSERT INTO users VALUES ($1, $2)', [user.name, user.email])
 *   )
 *
 *   await runBatch(insertPromises, 5)
 *   console.log(`✅ Inserted ${users.length} users`)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Image processing pipeline
 * async function processImages(imagePaths: string[]): Promise<Buffer[]> {
 *   console.log(`Processing ${imagePaths.length} images...`)
 *
 *   const processingPromises = imagePaths.map(async path => {
 *     const img = await loadImage(path)
 *     const resized = await resize(img, { width: 800, height: 600 })
 *     const compressed = await compress(resized, { quality: 80 })
 *     return compressed
 *   })
 *
 *   // Process 3 images at a time to avoid memory exhaustion
 *   const processed = await runBatch(processingPromises, 3)
 *
 *   console.log(`✅ Processed ${processed.length} images`)
 *   return processed
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Parallel file uploads with progress tracking
 * async function uploadFilesWithProgress(
 *   files: File[]
 * ): Promise<UploadResult[]> {
 *   let completed = 0
 *
 *   const uploadPromises = files.map(async file => {
 *     const result = await uploadToS3(file)
 *     completed++
 *     console.log(`Progress: ${completed}/${files.length} (${((completed/files.length)*100).toFixed(1)}%)`)
 *     return result
 *   })
 *
 *   // Upload 5 files at a time
 *   return await runBatch(uploadPromises, 5)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Scraping with politeness delay
 * async function scrapeWebsites(urls: string[]): Promise<ScrapedData[]> {
 *   const scrapePromises = urls.map(async url => {
 *     const html = await fetch(url).then(r => r.text())
 *     const data = parseHTML(html)
 *
 *     // Polite delay between requests in same batch
 *     await sleep(200)
 *
 *     return data
 *   })
 *
 *   // Only 3 concurrent requests to avoid overwhelming target server
 *   return await runBatch(scrapePromises, 3)
 * }
 * ```
 *
 * @see {@link sleep} for adding delays between operations
 * @see {@link handleOperation} for dynamic operation execution
 */
export async function runBatch<T>(jobs: Promise<T>[], batchSize: number = 50): Promise<T[]> {
  if (batchSize <= 0) {
    throw new TsHelpersError('Batch size must be greater than 0', {
      code: TsHelpersErrorCode.INVALID_OPERATION,
      data: { batchSize },
    })
  }

  const results: T[] = []
  const batches = Math.ceil(jobs.length / batchSize)

  for (let i = 0; i < batches; i++) {
    const batchStart = i * batchSize
    const batchEnd = batchStart + batchSize
    const batch = jobs.slice(batchStart, batchEnd)

    const batchResults = await Promise.all(batch.map(job => job))
    results.push(...batchResults)
  }

  return results
}

// =============================================================================
// DYNAMIC OPERATION UTILITIES
// =============================================================================

/**
 * Dynamically executes an operation on a target object by name
 *
 * Invokes methods on objects using string-based operation names. Supports nested
 * method access using 'parent/child' slash notation for organized operation namespacing.
 *
 * Features:
 * - Dynamic method invocation by string name
 * - Nested method access with '/' separator (e.g., 'api/getUser')
 * - Automatic error handling with descriptive messages
 * - Type-safe return value with generics
 *
 * Use cases:
 * - Dynamic API route handlers
 * - Plugin architectures with string-based commands
 * - RPC (Remote Procedure Call) implementations
 * - Command pattern implementations
 * - Configuration-driven operations
 *
 * @param target - Object containing methods to execute
 * @param operation - Method name or 'parent/child' path to execute
 * @param args - Arguments to pass to the operation
 * @returns Promise resolving to operation result
 * @throws {TsHelpersError} If operation doesn't exist on target
 *
 * @example
 * ```typescript
 * // Basic operation execution
 * const api = {
 *   getUser: async (id: string) => ({ id, name: 'John' }),
 *   createUser: async (data: any) => ({ id: '123', ...data })
 * }
 *
 * const user = await handleOperation<User>(api, 'getUser', 'user-123')
 * // { id: 'user-123', name: 'John' }
 * ```
 *
 * @example
 * ```typescript
 * // Nested operations with slash notation
 * const service = {
 *   users: {
 *     list: async () => [{ id: '1' }, { id: '2' }],
 *     create: async (data: any) => ({ id: 'new', ...data }),
 *     delete: async (id: string) => ({ success: true })
 *   },
 *   posts: {
 *     list: async () => [{ id: 'post-1' }],
 *     create: async (data: any) => ({ id: 'new-post', ...data })
 *   }
 * }
 *
 * // Execute nested operation
 * const users = await handleOperation(service, 'users/list')
 * const newUser = await handleOperation(service, 'users/create', { name: 'Alice' })
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Dynamic API router
 * interface ApiRequest {
 *   operation: string
 *   params: any[]
 * }
 *
 * const apiHandlers = {
 *   user: {
 *     get: async (id: string) => db.users.findById(id),
 *     create: async (data: UserInput) => db.users.create(data),
 *     update: async (id: string, data: Partial<UserInput>) =>
 *       db.users.update(id, data),
 *     delete: async (id: string) => db.users.delete(id)
 *   },
 *   product: {
 *     search: async (query: string) => db.products.search(query),
 *     list: async (page: number) => db.products.list(page)
 *   }
 * }
 *
 * async function handleApiRequest(req: ApiRequest): Promise<any> {
 *   try {
 *     return await handleOperation(
 *       apiHandlers,
 *       req.operation,
 *       ...req.params
 *     )
 *   } catch (error) {
 *     console.error(`Failed to execute ${req.operation}:`, error)
 *     throw error
 *   }
 * }
 *
 * // Usage
 * await handleApiRequest({ operation: 'user/get', params: ['user-123'] })
 * await handleApiRequest({ operation: 'product/search', params: ['laptop'] })
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Plugin system with dynamic commands
 * interface Plugin {
 *   name: string
 *   commands: Record<string, (...args: any[]) => Promise<any>>
 * }
 *
 * class PluginManager {
 *   private plugins: Map<string, Plugin> = new Map()
 *
 *   register(plugin: Plugin): void {
 *     this.plugins.set(plugin.name, plugin)
 *   }
 *
 *   async executeCommand(
 *     pluginName: string,
 *     command: string,
 *     ...args: any[]
 *   ): Promise<any> {
 *     const plugin = this.plugins.get(pluginName)
 *     if (!plugin) throw new Error(`Plugin ${pluginName} not found`)
 *
 *     return handleOperation(plugin.commands, command, ...args)
 *   }
 * }
 *
 * // Register plugins
 * const manager = new PluginManager()
 * manager.register({
 *   name: 'fileOps',
 *   commands: {
 *     read: async (path: string) => fs.readFile(path, 'utf-8'),
 *     write: async (path: string, content: string) =>
 *       fs.writeFile(path, content)
 *   }
 * })
 *
 * // Execute plugin commands dynamically
 * await manager.executeCommand('fileOps', 'read', './config.json')
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: RPC-style service calls
 * const rpcService = {
 *   math: {
 *     add: async (a: number, b: number) => a + b,
 *     multiply: async (a: number, b: number) => a * b
 *   },
 *   string: {
 *     reverse: async (s: string) => s.split('').reverse().join(''),
 *     uppercase: async (s: string) => s.toUpperCase()
 *   }
 * }
 *
 * async function rpcCall(method: string, ...params: any[]): Promise<any> {
 *   console.log(`RPC Call: ${method}(${params.join(', ')})`)
 *   const result = await handleOperation(rpcService, method, ...params)
 *   console.log(`RPC Result: ${result}`)
 *   return result
 * }
 *
 * await rpcCall('math/add', 5, 3)           // RPC Result: 8
 * await rpcCall('string/reverse', 'hello')  // RPC Result: olleh
 * ```
 *
 * @example
 * ```typescript
 * // Error handling
 * try {
 *   await handleOperation(api, 'nonexistent/method')
 * } catch (error) {
 *   console.error(error.message)
 *   // "Operation [nonexistent/method] does not exist"
 *   console.error(error.code)
 *   // TsHelpersErrorCode.INVALID_OPERATION
 * }
 * ```
 *
 * @see {@link TsHelpersError} for error structure
 * @see {@link TsHelpersErrorCode} for error codes
 */
export function handleOperation<T, TTarget extends Record<string, unknown>>(
  target: TTarget,
  operation: string,
  ...args: unknown[]
): Promise<T> {
  if (operation.includes('/')) {
    const [parentOp, childOp] = operation.split('/')

    if (!target[parentOp] || !target[parentOp][childOp]) {
      throw new TsHelpersError(`Operation [${operation}] does not exist`, {
        code: TsHelpersErrorCode.INVALID_OPERATION,
        data: { operation, parentOp, childOp },
      })
    }

    return (
      (target[parentOp] as Record<string, unknown>)[childOp] as (...args: unknown[]) => Promise<T>
    )(...args)
  }

  if (!target[operation]) {
    throw new TsHelpersError(`Operation [${operation}] does not exist`, {
      code: TsHelpersErrorCode.INVALID_OPERATION,
      data: { operation },
    })
  }

  return (target[operation] as (...args: unknown[]) => Promise<T>)(...args)
}
