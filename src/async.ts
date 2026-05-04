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

// =============================================================================
// DEFERRED PROMISE
// =============================================================================

/**
 * Promesa diferida con control explícito de resolución y rechazo
 *
 * Permite exponer las funciones `resolve` y `reject` de una Promise fuera del
 * constructor, facilitando el patrón "deferred" para comunicación asíncrona
 * entre componentes desacoplados.
 *
 * Características:
 * - `settled` refleja si la promesa ya fue resuelta o rechazada
 * - Segundo `resolve`/`reject` tras `settled === true` es no-op silencioso
 * - Compatible con `PromiseLike<T>` (resolve encadena promesas internas)
 * - No usa `Promise.withResolvers` (requiere ES2024/Node 22+)
 *
 * Casos de uso:
 * - Puente de callbacks hacia Promises
 * - Coordinación entre EventEmitters y código async/await
 * - Cancelación externa o timeout manual
 * - Tests que necesitan controlar la resolución de forma imperativa
 *
 * @template T - Tipo del valor con el que se resuelve la promesa
 *
 * @example
 * ```typescript
 * // 1. Puente callback → Promise
 * function readFileAsync(path: string): Promise<string> {
 *   const deferred = new Deferred<string>()
 *
 *   fs.readFile(path, 'utf-8', (err, data) => {
 *     if (err) deferred.reject(err)
 *     else deferred.resolve(data)
 *   })
 *
 *   return deferred.promise
 * }
 *
 * const content = await readFileAsync('./config.json')
 * ```
 *
 * @example
 * ```typescript
 * // 2. EventEmitter → Promise
 * function waitForEvent(emitter: EventEmitter, event: string): Promise<unknown> {
 *   const deferred = new Deferred<unknown>()
 *
 *   emitter.once(event, (data) => deferred.resolve(data))
 *   emitter.once('error', (err) => deferred.reject(err))
 *
 *   return deferred.promise
 * }
 *
 * const data = await waitForEvent(socket, 'message')
 * ```
 *
 * @example
 * ```typescript
 * // 3. Cancelación externa / timeout manual
 * function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
 *   const deferred = new Deferred<T>()
 *
 *   const timer = setTimeout(() => {
 *     deferred.reject(new Error(`Timeout after ${ms}ms`))
 *   }, ms)
 *
 *   promise
 *     .then(value => deferred.resolve(value))
 *     .catch(err => deferred.reject(err))
 *     .finally(() => clearTimeout(timer))
 *
 *   return deferred.promise
 * }
 *
 * // Lanza error si la operación tarda más de 5s
 * const result = await withTimeout(fetch('/api/data'), 5000)
 * ```
 *
 * @see {@link sleep} para delays simples sin control externo
 * @see {@link runBatch} para control de concurrencia en lotes
 */
export class Deferred<T> {
  /** Promesa controlada externamente */
  readonly promise: Promise<T>

  /** Función para resolver la promesa con un valor o PromiseLike */
  readonly resolve: (value: T | PromiseLike<T>) => void

  /** Función para rechazar la promesa con un motivo opcional */
  readonly reject: (reason?: unknown) => void

  private _settled = false

  /**
   * Indica si la promesa ya fue resuelta o rechazada.
   * Un segundo `resolve`/`reject` tras `settled === true` es no-op silencioso.
   */
  get settled(): boolean {
    return this._settled
  }

  constructor() {
    let resolveFn!: (value: T | PromiseLike<T>) => void
    let rejectFn!: (reason?: unknown) => void

    this.promise = new Promise<T>((res, rej) => {
      resolveFn = res
      rejectFn = rej
    })

    this.resolve = (value: T | PromiseLike<T>) => {
      if (this._settled) return
      this._settled = true
      resolveFn(value)
    }

    this.reject = (reason?: unknown) => {
      if (this._settled) return
      this._settled = true
      rejectFn(reason)
    }
  }
}

// =============================================================================
// TIMEOUT
// =============================================================================

/**
 * Ejecuta una factory asíncrona con un límite de tiempo máximo
 *
 * Recibe una función `factory` que acepta un `AbortSignal` y devuelve una Promise.
 * Si la Promise no resuelve dentro de `ms` milisegundos, se aborta la operación
 * y se rechaza con un `TsHelpersError` de código `TIMEOUT_ERROR`.
 *
 * El `AbortSignal` permite a la factory cancelar recursos subyacentes (fetch, streams,
 * consultas DB) tan pronto como expire el timeout. Cuando la factory resuelve antes
 * del límite, el timeout se limpia y el `AbortController` también se aborta para
 * liberar cualquier listener pendiente.
 *
 * @param factory - Función que recibe un `AbortSignal` y devuelve una Promise con el resultado
 * @param ms - Tiempo máximo en milisegundos. Debe ser > 0; de lo contrario lanza de forma síncrona
 * @returns Promise que resuelve con el resultado de la factory, o rechaza con `TsHelpersError`
 *
 * @throws {TsHelpersError} `INVALID_OPERATION` si `ms <= 0` (lanzado de forma síncrona)
 * @throws {TsHelpersError} `TIMEOUT_ERROR` si la factory no resuelve dentro del límite
 *
 * @example
 * ```typescript
 * // 1. Fetch cancelable con AbortSignal
 * const data = await withTimeout(
 *   async (signal) => {
 *     const response = await fetch('https://api.example.com/data', { signal })
 *     return response.json()
 *   },
 *   5000  // 5 segundos máximo
 * )
 * ```
 *
 * @example
 * ```typescript
 * // 2. Query de base de datos con timeout
 * const rows = await withTimeout(
 *   async (signal) => {
 *     // El signal puede pasarse a drivers que lo soporten (e.g. node-postgres)
 *     return db.query('SELECT * FROM users WHERE active = true', { signal })
 *   },
 *   3000  // 3 segundos máximo
 * ).catch((err) => {
 *   if (err instanceof TsHelpersError && err.code === TsHelpersErrorCode.TIMEOUT_ERROR) {
 *     console.warn(`Query abortada tras ${err.data?.ms}ms`)
 *     return []
 *   }
 *   throw err
 * })
 * ```
 *
 * @example
 * ```typescript
 * // 3. Composición con retry: reintenta hasta 3 veces con timeout por intento
 * async function fetchWithRetryAndTimeout(url: string): Promise<unknown> {
 *   for (let attempt = 1; attempt <= 3; attempt++) {
 *     try {
 *       return await withTimeout(
 *         (signal) => fetch(url, { signal }).then(r => r.json()),
 *         2000
 *       )
 *     } catch (err) {
 *       const isTimeout = err instanceof TsHelpersError
 *         && err.code === TsHelpersErrorCode.TIMEOUT_ERROR
 *       if (!isTimeout || attempt === 3) throw err
 *       console.warn(`Intento ${attempt} superó el timeout, reintentando...`)
 *       await sleep(500 * attempt)
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link Deferred} para control explícito de resolución/rechazo
 * @see {@link sleep} para delays simples sin cancelación
 * @see {@link TsHelpersError} para la estructura del error lanzado
 */
// =============================================================================
// ABORT SIGNAL UTILITIES
// =============================================================================

/**
 * Combina múltiples `AbortSignal` en uno solo que se aborta cuando cualquiera de los inputs se aborta
 *
 * Utiliza `AbortSignal.any` de forma nativa en entornos que lo soporten (Node ≥20.3,
 * navegadores modernos). En entornos más antiguos como Node 18 aplica un fallback
 * manual con `addEventListener`, limpiando todos los listeners en cuanto se dispara
 * el primero para evitar fugas de memoria.
 *
 * Comportamientos garantizados:
 * - Si alguna signal ya está abortada al llamar, el resultado queda abortado inmediatamente
 * - Si se pasan cero signals, devuelve una signal que nunca se aborta (AbortController sin abortar)
 * - El `reason` del abort se propaga desde la signal original que disparó
 *
 * @param signals - Señales de cancelación a combinar (variadic)
 * @returns `AbortSignal` combinada que se aborta cuando cualquiera de las inputs se aborta
 *
 * @example
 * ```typescript
 * // 1. Request con timeout + cancelación manual del usuario
 * const timeoutController = new AbortController()
 * const userController = new AbortController()
 * setTimeout(() => timeoutController.abort('timeout'), 5000)
 *
 * const combined = combineAbortSignals(timeoutController.signal, userController.signal)
 * await fetch('/api/data', { signal: combined })
 * // El fetch se cancela si pasan 5s O si el usuario cancela manualmente
 * ```
 *
 * @example
 * ```typescript
 * // 2. Fetch + signal de navegación del browser (React Router, etc.)
 * function useFetch(url: string, navigationSignal: AbortSignal) {
 *   const timeoutController = new AbortController()
 *   setTimeout(() => timeoutController.abort(), 10_000)
 *
 *   const combined = combineAbortSignals(navigationSignal, timeoutController.signal)
 *   return fetch(url, { signal: combined })
 * }
 * // Se cancela si el usuario navega fuera O si tarda más de 10s
 * ```
 *
 * @example
 * ```typescript
 * // 3. Retry interno + abort externo
 * async function fetchWithRetry(url: string, externalSignal: AbortSignal): Promise<Response> {
 *   for (let attempt = 1; attempt <= 3; attempt++) {
 *     const attemptController = new AbortController()
 *     // Cada intento tiene su propio timeout de 2s, pero también respeta el abort externo
 *     setTimeout(() => attemptController.abort('attempt-timeout'), 2000)
 *     const combined = combineAbortSignals(externalSignal, attemptController.signal)
 *
 *     try {
 *       return await fetch(url, { signal: combined })
 *     } catch (err) {
 *       if (externalSignal.aborted) throw err   // Abort externo → no reintentar
 *       if (attempt === 3) throw err             // Último intento → propagar error
 *       await sleep(500 * attempt)               // Espera exponencial entre reintentos
 *     }
 *   }
 *   throw new Error('Unreachable')
 * }
 * ```
 *
 * @see {@link withTimeout} para cancelación automática por tiempo
 * @see {@link Deferred} para control explícito de resolución/rechazo
 */
export function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  // Feature-detect AbortSignal.any (Node ≥20.3, navegadores modernos)
  if (
    typeof AbortSignal !== 'undefined' &&
    typeof (AbortSignal as unknown as { any?: unknown }).any === 'function'
  ) {
    return (AbortSignal as unknown as { any: (sigs: AbortSignal[]) => AbortSignal }).any(signals)
  }

  // Fallback manual para Node 18 y entornos sin AbortSignal.any
  const controller = new AbortController()

  if (signals.length === 0) {
    return controller.signal
  }

  // Handlers indexados para poder eliminarlos individualmente
  const handlers: Array<() => void> = []

  const abortAll = (reason: unknown): void => {
    if (controller.signal.aborted) return
    // Eliminar todos los listeners antes de abortar para evitar disparos extra
    signals.forEach((sig, i) => {
      sig.removeEventListener('abort', handlers[i])
    })
    controller.abort(reason)
  }

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i]

    // Si ya está abortada → abortar inmediatamente y salir
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }

    // Crear handler con índice capturado y registrar
    handlers[i] = () => abortAll(signal.reason)
    signal.addEventListener('abort', handlers[i], { once: true })
  }

  return controller.signal
}

export function withTimeout<T>(factory: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) {
    throw new TsHelpersError(`withTimeout: ms must be greater than 0, got ${ms}`, {
      code: TsHelpersErrorCode.INVALID_OPERATION,
      data: { ms },
    })
  }

  const controller = new AbortController()
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      controller.abort()
      reject(
        new TsHelpersError(`Operation timed out after ${ms}ms`, {
          code: TsHelpersErrorCode.TIMEOUT_ERROR,
          data: { ms },
        }),
      )
    }, ms)
  })

  return Promise.race([factory(controller.signal), timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle)
    controller.abort()
  })
}

// =============================================================================
// RETRY
// =============================================================================

/**
 * Opciones de configuración para {@link retry}
 */
export interface RetryOptions {
  /** Número máximo de intentos. Debe ser >= 1. Default: 3 */
  readonly attempts?: number
  /**
   * Delay entre intentos. Puede ser:
   * - Un número fijo de milisegundos
   * - Una función `(attempt, error) => number` para backoff dinámico
   * Default: 0 (sin espera)
   */
  readonly delay?: number | ((attempt: number, error: unknown) => number)
  /** Signal opcional para cancelar la espera entre intentos */
  readonly signal?: AbortSignal
  /** Callback invocado tras cada fallo antes del próximo intento */
  readonly onRetry?: (attempt: number, error: unknown) => void
}

/**
 * Calcula el delay efectivo entre intentos según la configuración
 */
function resolveDelay(
  delay: RetryOptions['delay'],
  attempt: number,
  error: unknown,
): number {
  if (delay === undefined) return 0
  if (typeof delay === 'number') return delay
  return delay(attempt, error)
}

/**
 * Espera `ms` milisegundos respetando un AbortSignal opcional.
 * Si la signal se aborta durante la espera, rechaza con `OPERATION_ABORTED`.
 */
async function waitWithAbort(ms: number, signal: AbortSignal | undefined): Promise<void> {
  if (!signal) {
    await sleep(ms)
    return
  }

  if (signal.aborted) {
    throw new TsHelpersError('Operation aborted', {
      code: TsHelpersErrorCode.OPERATION_ABORTED,
      data: { reason: signal.reason },
    })
  }

  const deferred = new Deferred<never>()
  const onAbort = (): void => {
    deferred.reject(
      new TsHelpersError('Operation aborted', {
        code: TsHelpersErrorCode.OPERATION_ABORTED,
        data: { reason: signal.reason },
      }),
    )
  }

  signal.addEventListener('abort', onAbort, { once: true })
  try {
    await Promise.race([sleep(ms), deferred.promise])
  } finally {
    signal.removeEventListener('abort', onAbort)
  }
}

/**
 * Reintenta una operación asíncrona hasta `attempts` veces, con delay configurable
 *
 * Ejecuta `fn(attempt)` y, si rechaza, espera el delay calculado antes del próximo intento.
 * Soporta delay fijo o dinámico (backoff exponencial, jitter, etc.) y cancelación
 * mediante `AbortSignal`. Si todos los intentos fallan, lanza `RETRY_EXHAUSTED` con
 * el último error como `cause`.
 *
 * Comportamientos garantizados:
 * - Si `fn` resuelve en cualquier intento, retorna inmediatamente
 * - El último intento NO espera delay tras fallar (lanza directamente)
 * - `onRetry` se llama solo cuando habrá otro intento (no en el último fallo)
 * - Cancelar via `signal` durante la espera → rechaza con `OPERATION_ABORTED`
 *
 * @template T - Tipo del valor que resuelve la operación
 * @param fn - Operación a reintentar; recibe el número de intento (0-indexed)
 * @param options - Configuración opcional ({@link RetryOptions})
 * @returns Promise con el valor del primer intento exitoso
 *
 * @throws {TsHelpersError} `INVALID_OPERATION` si `attempts < 1` (síncrono)
 * @throws {TsHelpersError} `RETRY_EXHAUSTED` si todos los intentos fallan
 * @throws {TsHelpersError} `OPERATION_ABORTED` si la signal se aborta durante la espera
 *
 * @example
 * ```typescript
 * // 1. Retry simple con delay fijo
 * const data = await retry(
 *   async () => fetch('/api/data').then(r => r.json()),
 *   { attempts: 5, delay: 1000 }
 * )
 * ```
 *
 * @example
 * ```typescript
 * // 2. Backoff exponencial con jitter
 * const result = await retry(
 *   async (attempt) => fetch(url),
 *   {
 *     attempts: 4,
 *     delay: (attempt) => Math.pow(2, attempt) * 100 + Math.random() * 50,
 *     onRetry: (attempt, err) => console.warn(`Intento ${attempt + 1} falló:`, err),
 *   }
 * )
 * ```
 *
 * @example
 * ```typescript
 * // 3. Retry cancelable via AbortSignal
 * const controller = new AbortController()
 * setTimeout(() => controller.abort(), 5000)
 *
 * try {
 *   await retry(() => unstableOperation(), {
 *     attempts: 10,
 *     delay: 500,
 *     signal: controller.signal,
 *   })
 * } catch (err) {
 *   if (err instanceof TsHelpersError && err.code === TsHelpersErrorCode.OPERATION_ABORTED) {
 *     console.log('Cancelado por timeout global')
 *   }
 * }
 * ```
 *
 * @see {@link withTimeout} para limitar el tiempo total de la operación
 * @see {@link combineAbortSignals} para combinar múltiples signals
 */
export function retry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3

  if (attempts < 1) {
    throw new TsHelpersError(`retry: attempts must be >= 1, got ${attempts}`, {
      code: TsHelpersErrorCode.INVALID_OPERATION,
      data: { attempts },
    })
  }

  return retryLoop(fn, options, attempts)
}

async function retryLoop<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions,
  attempts: number,
): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn(attempt)
    } catch (error) {
      if (attempt === attempts - 1) {
        throw new TsHelpersError(`Retry exhausted after ${attempts} attempts`, {
          code: TsHelpersErrorCode.RETRY_EXHAUSTED,
          data: { attempts, lastError: error },
          cause: error,
        })
      }

      options.onRetry?.(attempt, error)

      const ms = resolveDelay(options.delay, attempt, error)
      await waitWithAbort(ms, options.signal)
    }
  }

  // Inalcanzable: el loop siempre retorna o lanza
  /* istanbul ignore next */
  throw new TsHelpersError('retry: unreachable state', {
    code: TsHelpersErrorCode.INVALID_OPERATION,
  })
}

// =============================================================================
// MEMOIZE
// =============================================================================

/**
 * Opciones de configuración para {@link memoize}
 *
 * @template TArgs - Tipos de los argumentos de la función memoizada
 */
export interface MemoizeOptions<TArgs extends unknown[]> {
  /** Tiempo de vida en milisegundos. `undefined` o `0` → sin TTL (nunca expira) */
  readonly ttl?: number
  /** Tamaño máximo del cache. Al superarse, se elimina la entrada más antigua (LRU) */
  readonly maxSize?: number
  /** Función que genera la clave de cache a partir de los argumentos */
  readonly keyFn: (...args: TArgs) => string
}

/**
 * Función memoizada con métodos de control del cache
 *
 * @template TArgs - Tipos de los argumentos
 * @template TResult - Tipo del valor resuelto
 */
export type MemoizedFn<TArgs extends unknown[], TResult> = ((
  ...args: TArgs
) => Promise<TResult>) & {
  /** Vacía completamente el cache */
  readonly clear: () => void
  /** Elimina la entrada para los args dados; devuelve `true` si existía */
  readonly invalidate: (...args: TArgs) => boolean
  /** Número actual de entradas en el cache */
  readonly size: () => number
}

/**
 * Memoiza una función asíncrona con soporte para TTL, LRU y deduplicación de concurrencia
 *
 * Cachea la `Promise` completa (no el valor resuelto) para que llamadas concurrentes con
 * la misma clave compartan la misma operación en curso. Si la promise rechaza, la entrada
 * se elimina automáticamente del cache para que el siguiente intento reejecute `fn`.
 *
 * Comportamientos garantizados:
 * - Llamadas concurrentes con misma key → `fn` se ejecuta una única vez
 * - Rejections NO se cachean → siguiente llamada reintenta
 * - TTL usa `Date.now()` (compatible con `vi.useFakeTimers`)
 * - LRU simple basado en orden de inserción del `Map`
 * - `expiresAt = 0` → entrada sin TTL (nunca expira)
 *
 * @template TArgs - Tipos de los argumentos de `fn`
 * @template TResult - Tipo del valor que resuelve `fn`
 * @param fn - Función asíncrona a memoizar
 * @param options - Configuración opcional. Para args primitivos `keyFn` es opcional;
 *                  para args complejos es obligatoria
 * @returns Función memoizada con métodos `clear()`, `invalidate()` y `size()`
 *
 * @example
 * ```typescript
 * // 1. Memo simple con args primitivos (keyFn opcional)
 * const fetchUser = memoize(async (id: number) => {
 *   const res = await fetch(`/api/users/${id}`)
 *   return res.json()
 * })
 *
 * await fetchUser(1)  // ejecuta fetch
 * await fetchUser(1)  // devuelve del cache
 * await fetchUser(2)  // ejecuta fetch (key distinta)
 * ```
 *
 * @example
 * ```typescript
 * // 2. TTL + maxSize + keyFn custom para args complejos
 * const search = memoize(
 *   async (query: { term: string; page: number }) => {
 *     return api.search(query)
 *   },
 *   {
 *     ttl: 60_000,                                // 1 minuto
 *     maxSize: 100,                               // máximo 100 entradas (LRU)
 *     keyFn: (q) => `${q.term}:${q.page}`,        // clave estable
 *   }
 * )
 * ```
 *
 * @example
 * ```typescript
 * // 3. Deduplicación de concurrencia + invalidación manual
 * const loadConfig = memoize(async (env: string) => {
 *   return fetch(`/config/${env}`).then(r => r.json())
 * })
 *
 * // Las dos llamadas comparten una única ejecución
 * const [a, b] = await Promise.all([loadConfig('prod'), loadConfig('prod')])
 * console.assert(a === b)
 *
 * loadConfig.invalidate('prod')  // forzar refresco en la siguiente llamada
 * loadConfig.clear()             // vaciar todo el cache
 * console.log(loadConfig.size()) // 0
 * ```
 *
 * @see {@link retry} para reintentos con backoff
 * @see {@link withTimeout} para limitar el tiempo de operaciones
 */
export function memoize<TArgs extends (string | number | boolean)[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: Partial<MemoizeOptions<TArgs>>,
): MemoizedFn<TArgs, TResult>
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: MemoizeOptions<TArgs>,
): MemoizedFn<TArgs, TResult>
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: Partial<MemoizeOptions<TArgs>>,
): MemoizedFn<TArgs, TResult> {
  const ttl = options?.ttl ?? 0
  const maxSize = options?.maxSize
  const keyFn: (...args: TArgs) => string =
    options?.keyFn ?? ((...args: TArgs) => JSON.stringify(args))

  interface Entry {
    value: Promise<TResult>
    expiresAt: number
  }

  const cache = new Map<string, Entry>()

  const memoized = ((...args: TArgs): Promise<TResult> => {
    const key = keyFn(...args)
    const existing = cache.get(key)

    if (existing) {
      if (existing.expiresAt === 0 || existing.expiresAt > Date.now()) {
        return existing.value
      }
      cache.delete(key)
    }

    const promise = fn(...args)

    // Si la promise rechaza, eliminar entry para que el siguiente intento reejecute
    promise.catch(() => {
      const current = cache.get(key)
      if (current && current.value === promise) {
        cache.delete(key)
      }
    })

    const expiresAt = ttl > 0 ? Date.now() + ttl : 0
    cache.set(key, { value: promise, expiresAt })

    // LRU: evict entrada más antigua si superamos maxSize
    if (maxSize !== undefined && maxSize > 0 && cache.size > maxSize) {
      const oldestKey = cache.keys().next().value
      if (oldestKey !== undefined) {
        cache.delete(oldestKey)
      }
    }

    return promise
  }) as MemoizedFn<TArgs, TResult>

  Object.defineProperties(memoized, {
    clear: {
      value: (): void => cache.clear(),
      writable: false,
      enumerable: false,
      configurable: false,
    },
    invalidate: {
      value: (...args: TArgs): boolean => cache.delete(keyFn(...args)),
      writable: false,
      enumerable: false,
      configurable: false,
    },
    size: {
      value: (): number => cache.size,
      writable: false,
      enumerable: false,
      configurable: false,
    },
  })

  return memoized
}

// =============================================================================
// SEMAPHORE
// =============================================================================

/**
 * Semáforo de conteo para controlar el acceso concurrente a recursos compartidos
 *
 * Permite que hasta `permits` operaciones se ejecuten simultáneamente. Las demás
 * esperan en cola hasta que se libera un permiso. Garantiza orden FIFO para los
 * waiters encolados.
 *
 * Útil para limitar la concurrencia de llamadas a APIs externas, accesos a base
 * de datos, o cualquier recurso con capacidad limitada.
 *
 * @example
 * ```typescript
 * // 1. Limitar a 3 peticiones HTTP simultáneas
 * const sem = new Semaphore(3)
 *
 * const results = await Promise.all(
 *   urls.map(url => sem.run(async () => fetch(url).then(r => r.json())))
 * )
 * ```
 *
 * @example
 * ```typescript
 * // 2. Adquirir y liberar manualmente (RAII explícito)
 * const sem = new Semaphore(2)
 *
 * const release = await sem.acquire()
 * try {
 *   await doExpensiveWork()
 * } finally {
 *   release()  // siempre liberar, incluso si hay error
 * }
 * ```
 *
 * @example
 * ```typescript
 * // 3. tryAcquire para no bloquear (circuit-breaker ligero)
 * const sem = new Semaphore(5)
 *
 * const release = sem.tryAcquire()
 * if (release) {
 *   try {
 *     await processItem(item)
 *   } finally {
 *     release()
 *   }
 * } else {
 *   console.warn('Sistema saturado, descartando item')
 * }
 * ```
 */
export class Semaphore {
  private _permits: number
  private readonly _queue: Array<() => void> = []

  /**
   * @param permits - Número de permisos simultáneos permitidos. Debe ser >= 1.
   * @throws {TsHelpersError} `INVALID_OPERATION` si `permits` es menor que 1
   */
  constructor(permits: number) {
    if (permits < 1) {
      throw new TsHelpersError(`Semaphore requires at least 1 permit, got ${permits}`, {
        code: TsHelpersErrorCode.INVALID_OPERATION,
        data: { permits },
      })
    }
    this._permits = permits
  }

  /** Número de permisos disponibles en este momento */
  get available(): number {
    return this._permits
  }

  /**
   * Adquiere un permiso. Si no hay permisos disponibles, espera hasta que se libere uno.
   *
   * @returns Promise que resuelve con la función `release` que libera el permiso al llamarla.
   *          Llamar a `release` más de una vez es no-op seguro.
   */
  acquire(): Promise<() => void> {
    if (this._permits > 0) {
      this._permits--
      return Promise.resolve(this._release())
    }
    return new Promise<() => void>(resolve => {
      this._queue.push(() => resolve(this._release()))
    })
  }

  /**
   * Intenta adquirir un permiso sin bloquear.
   *
   * @returns Función `release` si había un permiso disponible, `null` si no.
   */
  tryAcquire(): (() => void) | null {
    if (this._permits > 0) {
      this._permits--
      return this._release()
    }
    return null
  }

  /**
   * Ejecuta `fn` con un permiso adquirido, liberándolo automáticamente al terminar (RAII).
   * El permiso se libera aunque `fn` lance una excepción.
   *
   * @param fn - Función asíncrona a ejecutar bajo el semáforo
   * @returns Promise con el valor devuelto por `fn`
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire()
    try {
      return await fn()
    } finally {
      release()
    }
  }

  /** Devuelve una función release idempotente que, al llamarse, cede el permiso al siguiente waiter o lo incrementa */
  private _release(): () => void {
    let released = false
    return () => {
      if (released) return
      released = true
      const next = this._queue.shift()
      if (next) {
        next()
      } else {
        this._permits++
      }
    }
  }
}

// =============================================================================
// MUTEX
// =============================================================================

/**
 * Mutex (exclusión mutua) para serializar el acceso a recursos compartidos
 *
 * Garantiza que solo una operación accede a la sección crítica a la vez.
 * Implementado por composición sobre {@link Semaphore}(1) — no usa herencia.
 *
 * @example
 * ```typescript
 * // 1. Proteger escrituras en un recurso compartido
 * const mutex = new Mutex()
 * let counter = 0
 *
 * await Promise.all(
 *   Array.from({ length: 100 }, () =>
 *     mutex.run(async () => { counter++ })
 *   )
 * )
 * // counter === 100, sin condiciones de carrera
 * ```
 *
 * @example
 * ```typescript
 * // 2. Adquirir y liberar manualmente
 * const mutex = new Mutex()
 *
 * const unlock = await mutex.lock()
 * try {
 *   await writeToDB(data)
 * } finally {
 *   unlock()
 * }
 * ```
 *
 * @example
 * ```typescript
 * // 3. tryLock para evitar bloqueos en rutas de alta frecuencia
 * const mutex = new Mutex()
 *
 * const unlock = mutex.tryLock()
 * if (unlock) {
 *   try {
 *     await flushBuffer()
 *   } finally {
 *     unlock()
 *   }
 * } else {
 *   // Otro flush ya está en curso — saltar esta iteración
 * }
 * ```
 */
export class Mutex {
  private readonly _sem = new Semaphore(1)

  /** `true` si el mutex está bloqueado (hay una operación en la sección crítica) */
  get isLocked(): boolean {
    return this._sem.available === 0
  }

  /**
   * Adquiere el mutex. Si ya está bloqueado, espera hasta que se libere.
   *
   * @returns Promise que resuelve con la función `unlock` que libera el mutex.
   */
  lock(): Promise<() => void> {
    return this._sem.acquire()
  }

  /**
   * Intenta adquirir el mutex sin bloquear.
   *
   * @returns Función `unlock` si se adquirió, `null` si el mutex ya está bloqueado.
   */
  tryLock(): (() => void) | null {
    return this._sem.tryAcquire()
  }

  /**
   * Ejecuta `fn` con el mutex adquirido, liberándolo automáticamente al terminar.
   * El mutex se libera aunque `fn` lance una excepción.
   *
   * @param fn - Función asíncrona a ejecutar en la sección crítica
   * @returns Promise con el valor devuelto por `fn`
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return this._sem.run(fn)
  }
}
