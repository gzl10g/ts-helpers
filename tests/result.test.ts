/**
 * Test suite for result module
 * Tests for the Result<T,E> discriminated union type and helpers ok/err/isOk/isErr
 */

import { describe, test, expect } from 'vitest'
import { ok, err, isOk, isErr, tryCatch, tryCatchAsync, assertNever } from '../src/result'
import { TsHelpersError } from '../src/errors'
import type { Result } from '../src/result'

describe('Result type', () => {
  test('ok(42) produces { ok: true, value: 42 }', () => {
    const r = ok(42)
    expect(r).toEqual({ ok: true, value: 42 })
  })

  test('err(new Error("x")) produces { ok: false, error: Error("x") }', () => {
    const e = new Error('x')
    const r = err(e)
    expect(r.ok).toBe(false)
    expect(r.error).toBe(e)
    expect(r.error.message).toBe('x')
  })

  test('isOk(ok(1)) returns true', () => {
    expect(isOk(ok(1))).toBe(true)
  })

  test('isOk(err(new Error())) returns false', () => {
    expect(isOk(err(new Error()))).toBe(false)
  })

  test('isErr(ok(1)) returns false', () => {
    expect(isErr(ok(1))).toBe(false)
  })

  test('isErr(err(new Error())) returns true', () => {
    expect(isErr(err(new Error()))).toBe(true)
  })

  test('type narrowing: isOk allows access to r.value', () => {
    const r: Result<number, Error> = Math.random() > -1 ? ok(99) : err(new Error('unreachable'))
    if (isOk(r)) {
      // TypeScript narrows to Ok<number> — r.value is accessible
      expect(r.value).toBe(99)
    } else {
      expect(true).toBe(true) // never reached in practice
    }
  })

  test('type narrowing: isErr allows access to r.error', () => {
    const r: Result<number, Error> = Math.random() > -1 ? err(new Error('fail')) : ok(0)
    if (isErr(r)) {
      // TypeScript narrows to Err<Error> — r.error is accessible
      expect(r.error.message).toBe('fail')
    } else {
      expect(true).toBe(true) // never reached in practice
    }
  })

  test('@ts-expect-error: accessing .value on Err fails at compile time', () => {
    const r = err(new Error('oops'))
    // @ts-expect-error — Err<Error> has no .value property
    void r.value
    // Runtime placeholder — the real check is the TS compiler error above
    expect(true).toBe(true)
  })

  test('@ts-expect-error: accessing .error on Ok fails at compile time', () => {
    const r = ok(42)
    // @ts-expect-error — Ok<number> has no .error property
    void r.error
    // Runtime placeholder — the real check is the TS compiler error above
    expect(true).toBe(true)
  })
})

describe('tryCatch', () => {
  test('sync ok: returns [undefined, value]', () => {
    const result = tryCatch(() => 42)
    expect(result[0]).toBeUndefined()
    expect(result[1]).toBe(42)
  })

  test('sync throw Error: returns [Error, undefined]', () => {
    const result = tryCatch(() => {
      throw new Error('x')
    })
    expect(result[0]).toBeInstanceOf(Error)
    expect((result[0] as Error).message).toBe('x')
    expect(result[1]).toBeUndefined()
  })

  test('sync throw non-Error (string): wraps in Error with cause', () => {
    const result = tryCatch(() => {
      // eslint-disable-next-line no-throw-literal
      throw 'oops'
    })
    expect(result[0]).toBeInstanceOf(Error)
    expect((result[0] as Error).cause).toBe('oops')
    expect(result[1]).toBeUndefined()
  })

  test('@ts-expect-error: tryCatch does not accept async functions (Promise restriction)', () => {
    // @ts-expect-error — tryCatch no debe aceptar funciones que devuelven Promise
    tryCatch(() => Promise.resolve(1))
    // Runtime placeholder — the real check is the TS compiler error above
    expect(true).toBe(true)
  })

  // Narrowing gotcha: destructuring `const [err, val] = tryCatch(fn)` does NOT
  // narrow `val` when checking `!err`. TypeScript still sees `val` as `T | undefined`.
  // Use the discriminated Result type with isOk/isErr for automatic narrowing.
  test('gotcha documented: index access works correctly at runtime despite TS narrowing limitation', () => {
    const result = tryCatch(() => 'hello')
    // Access via index works fine at runtime
    if (result[0] === undefined) {
      expect(result[1]).toBe('hello')
    }
  })
})

describe('tryCatchAsync', () => {
  test('async ok: returns [undefined, value]', async () => {
    const result = await tryCatchAsync(async () => 'hi')
    expect(result[0]).toBeUndefined()
    expect(result[1]).toBe('hi')
  })

  test('async reject Error: returns [Error, undefined]', async () => {
    const result = await tryCatchAsync(async () => {
      throw new Error('async err')
    })
    expect(result[0]).toBeInstanceOf(Error)
    expect((result[0] as Error).message).toBe('async err')
    expect(result[1]).toBeUndefined()
  })

  test('async reject non-Error (number): wraps in Error with cause', async () => {
    const result = await tryCatchAsync(async () => {
      // eslint-disable-next-line no-throw-literal
      throw 42
    })
    expect(result[0]).toBeInstanceOf(Error)
    expect((result[0] as Error).cause).toBe(42)
    expect(result[1]).toBeUndefined()
  })
})

describe('assertNever', () => {
  test('throws TsHelpersError with INVALID_OPERATION code', () => {
    expect(() => assertNever('unexpected' as never)).toThrow(TsHelpersError)
    try {
      assertNever('unexpected' as never)
    } catch (e) {
      expect(e).toBeInstanceOf(TsHelpersError)
      expect((e as TsHelpersError).code).toBe('INVALID_OPERATION')
    }
  })

  test('error message includes the serialised unexpected value', () => {
    try {
      assertNever('unexpected' as never)
    } catch (e) {
      expect((e as TsHelpersError).message).toContain('unexpected')
    }
  })

  test('custom message overrides the default', () => {
    try {
      assertNever(99 as never, 'custom message here')
    } catch (e) {
      expect((e as TsHelpersError).message).toBe('custom message here')
    }
  })
})
