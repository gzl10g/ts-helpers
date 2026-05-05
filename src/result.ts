/**
 * Result type — discriminated union for explicit error handling
 *
 * @fileoverview Provides the `Result<T, E>` discriminated union type and its
 * companion helpers (`ok`, `err`, `isOk`, `isErr`) for railway-oriented
 * programming without throwing exceptions.
 *
 * Also provides `tryCatch` / `tryCatchAsync` for Go-style error-first tuples
 * and `assertNever` for exhaustive switch/union checks.
 *
 * The field is named `value` (not `data`) to avoid collision with
 * `TsHelpersErrorOptions.data` used across the rest of the library.
 */

import { TsHelpersError, TsHelpersErrorCode } from './errors'

// =============================================================================
// RESULT TYPE
// =============================================================================

/**
 * Represents a successful result containing a value of type `T`.
 *
 * The field is named `value` — deliberately distinct from `TsHelpersErrorOptions.data`
 * used elsewhere in the library to prevent name collisions when composing types.
 *
 * @template T - The type of the success value
 */
export type Ok<T> = {
  readonly ok: true
  readonly value: T
}

/**
 * Represents a failed result containing an error of type `E`.
 *
 * @template E - The type of the error, defaults to `Error`
 */
export type Err<E> = {
  readonly ok: false
  readonly error: E
}

/**
 * A discriminated union that is either a success (`Ok<T>`) or a failure (`Err<E>`).
 *
 * Use `isOk` / `isErr` to narrow the type and access the inner value safely.
 *
 * @template T - The type of the success value
 * @template E - The type of the error, defaults to `Error`
 *
 * @example
 * function divide(a: number, b: number): Result<number> {
 *   if (b === 0) return err(new Error('Division by zero'))
 *   return ok(a / b)
 * }
 *
 * @example
 * type ApiResult = Result<User, ApiError>
 */
export type Result<T, E = Error> = Ok<T> | Err<E>

// =============================================================================
// CONSTRUCTORS
// =============================================================================

/**
 * Creates a successful `Ok<T>` result wrapping the given value.
 *
 * @param value - The success value to wrap
 * @returns An `Ok<T>` result with `ok: true` and the provided value
 *
 * @example
 * const r = ok(42)
 * // r.ok === true, r.value === 42
 *
 * @example
 * function parse(s: string): Result<number> {
 *   const n = Number(s)
 *   return isNaN(n) ? err(new Error('Not a number')) : ok(n)
 * }
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

/**
 * Creates a failed `Err<E>` result wrapping the given error.
 *
 * @param error - The error value to wrap
 * @returns An `Err<E>` result with `ok: false` and the provided error
 *
 * @example
 * const r = err(new Error('something went wrong'))
 * // r.ok === false, r.error.message === 'something went wrong'
 *
 * @example
 * function findUser(id: string): Result<User> {
 *   if (!db.has(id)) return err(new Error(`User ${id} not found`))
 *   return ok(db.get(id)!)
 * }
 */
export function err<E>(error: E): Err<E> {
  return { ok: false, error }
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard that narrows a `Result<T, E>` to `Ok<T>`.
 *
 * After this guard passes, TypeScript knows `r.value` exists and `r.error` does not.
 *
 * @param r - The result to test
 * @returns `true` if the result is a success, narrowing to `Ok<T>`
 *
 * @example
 * const r: Result<number> = ok(1)
 * if (isOk(r)) {
 *   console.log(r.value) // number — safe access
 * }
 *
 * @example
 * const results = [ok(1), err(new Error()), ok(3)]
 * const values = results.filter(isOk).map(r => r.value) // [1, 3]
 */
export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  return r.ok === true
}

/**
 * Type guard that narrows a `Result<T, E>` to `Err<E>`.
 *
 * After this guard passes, TypeScript knows `r.error` exists and `r.value` does not.
 *
 * @param r - The result to test
 * @returns `true` if the result is a failure, narrowing to `Err<E>`
 *
 * @example
 * const r: Result<number> = err(new Error('oops'))
 * if (isErr(r)) {
 *   console.error(r.error.message) // string — safe access
 * }
 *
 * @example
 * const results = [ok(1), err(new Error('bad')), ok(3)]
 * const errors = results.filter(isErr).map(r => r.error) // [Error('bad')]
 */
export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  return r.ok === false
}

// =============================================================================
// TRY-CATCH TUPLE (Go-style, error-first)
// =============================================================================

/**
 * A readonly error-first tuple in the style of Go's `(value, error)` pattern.
 *
 * Either `[Error, undefined]` on failure or `[undefined, T]` on success.
 * Use index access (`result[0]`, `result[1]`) or destructuring for access.
 *
 * @template T - The type of the success value
 */
export type TryResult<T> = readonly [Error, undefined] | readonly [undefined, T]

/**
 * Normalises any thrown value into an `Error` instance.
 * Non-Error values are wrapped with the original as `cause`.
 */
function normalizeError(e: unknown): Error {
  if (e instanceof Error) return e
  const error = new Error(String(e))
  ;(error as Error & { cause: unknown }).cause = e
  return error
}

/**
 * Wraps a synchronous function in a Go-style error-first tuple.
 *
 * Returns `[undefined, value]` when the function succeeds and
 * `[Error, undefined]` when it throws. Non-Error throws are normalised to
 * `Error` with the original value set as `cause`.
 *
 * **Gotcha — TypeScript narrowing with destructuring:**
 * TypeScript does NOT automatically narrow `value` when you check `error` on a
 * destructured tuple. Both `error` and `value` remain `Error | undefined` and
 * `T | undefined` regardless of the check:
 *
 * ```typescript
 * const [error, value] = tryCatch(() => JSON.parse(raw))
 * if (!error) {
 *   console.log(value) // TS type is still `T | undefined` — no narrowing!
 * }
 * ```
 *
 * For automatic narrowing use the discriminated `Result` type with `isOk` /
 * `isErr` instead:
 *
 * ```typescript
 * const r = error ? err(error) : ok(value!)
 * if (isOk(r)) {
 *   console.log(r.value) // TS narrows to T — safe access
 * }
 * ```
 *
 * **Anti-Promise restriction:** this function does not accept async functions.
 * TypeScript will produce an error if `fn` returns a `Promise`. Use
 * `tryCatchAsync` for async functions.
 *
 * @template T - The type of the success value (must not be a Promise)
 * @param fn - A synchronous function to execute
 * @returns A `TryResult<T>` tuple: `[undefined, T]` on success or `[Error, undefined]` on failure
 *
 * @example
 * const [error, parsed] = tryCatch(() => JSON.parse('{"a":1}'))
 * if (!error) console.log(parsed) // { a: 1 } — but TS still sees `typeof parsed` as T | undefined
 *
 * @example
 * const [error, value] = tryCatch(() => { throw new RangeError('out of bounds') })
 * // error instanceof RangeError === true, value === undefined
 */
export function tryCatch<T extends Exclude<unknown, Promise<unknown>>>(
  fn: () => T,
): TryResult<T> {
  try {
    return [undefined, fn()]
  } catch (e) {
    return [normalizeError(e), undefined]
  }
}

/**
 * Wraps an async function in a Go-style error-first tuple.
 *
 * Returns `[undefined, value]` when the promise resolves and
 * `[Error, undefined]` when it rejects. Non-Error rejections are normalised to
 * `Error` with the original value set as `cause`.
 *
 * @template T - The type of the resolved value
 * @param fn - An async function (or function returning a Promise) to execute
 * @returns A `Promise<TryResult<T>>` — `[undefined, T]` on resolve or `[Error, undefined]` on reject
 *
 * @example
 * const [error, data] = await tryCatchAsync(() => fetch('/api/users').then(r => r.json()))
 * if (!error) console.log(data)
 *
 * @example
 * const [error] = await tryCatchAsync(async () => { throw new Error('network timeout') })
 * // error.message === 'network timeout'
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
): Promise<TryResult<T>> {
  try {
    return [undefined, await fn()]
  } catch (e) {
    return [normalizeError(e), undefined]
  }
}

// =============================================================================
// ASSERT NEVER
// =============================================================================

/**
 * Asserts that a value is of type `never`, throwing a `TsHelpersError` at
 * runtime if it is not.
 *
 * Use in exhaustive `switch` statements or union checks to get a compile-time
 * guarantee that all cases have been handled. TypeScript will produce an error
 * if any union branch is not covered before reaching this call.
 *
 * @param value - The value that should be `never` (all union branches exhausted)
 * @param message - Optional custom error message; defaults to a serialisation of the unexpected value
 * @returns `never` — this function always throws
 * @throws {TsHelpersError} Always, with `code: 'INVALID_OPERATION'`
 *
 * @example
 * type Direction = 'north' | 'south' | 'east' | 'west'
 * function move(d: Direction): void {
 *   switch (d) {
 *     case 'north': return
 *     case 'south': return
 *     case 'east':  return
 *     case 'west':  return
 *     default: assertNever(d) // compile error if any case is missing
 *   }
 * }
 *
 * @example
 * // Runtime behaviour — throws TsHelpersError
 * assertNever('unexpected' as never)
 * // TsHelpersError: Unexpected value: "unexpected"  (code: INVALID_OPERATION)
 */
export function assertNever(
  value: never,
  message = `Unexpected value: ${JSON.stringify(value as unknown)}`,
): never {
  throw new TsHelpersError(message, {
    code: TsHelpersErrorCode.INVALID_OPERATION,
    data: { unexpected: value },
  })
}
