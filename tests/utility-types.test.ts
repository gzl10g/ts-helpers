import { describe, expect, test } from 'vitest'
import type {
  Brand,
  DeepPartial,
  NonNullableDeep,
  Nullable,
  Opaque,
  RequireAtLeastOne,
} from '../src/utility-types'

// ---------------------------------------------------------------------------
// Compile-time assertion helpers (zero runtime overhead)
// ---------------------------------------------------------------------------
type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false
type Assert<T extends true> = T

// ---------------------------------------------------------------------------

describe('Utility types', () => {
  describe('DeepPartial', () => {
    test('makes nested properties optional', () => {
      type Result = DeepPartial<{ a: { b: number } }>
      type Expected = { a?: { b?: number | undefined } | undefined }
      type _test = Assert<Equals<Result, Expected>>
      expect(true).toBe(true)
    })

    test('handles arrays correctly (not mapping over Array prototype)', () => {
      type Result = DeepPartial<string[]>
      // DeepPartial<string[]> → DeepPartial<string>[] → string[]
      type _isArray = Assert<Equals<Result, string[]>>
      expect(true).toBe(true)
    })

    test('handles readonly arrays', () => {
      type Result = DeepPartial<readonly number[]>
      type _isReadonlyArray = Assert<Equals<Result, readonly number[]>>
      expect(true).toBe(true)
    })

    test('leaves primitives unchanged', () => {
      type _str = Assert<Equals<DeepPartial<string>, string>>
      type _num = Assert<Equals<DeepPartial<number>, number>>
      expect(true).toBe(true)
    })
  })

  describe('Brand', () => {
    test('creates nominal type incompatible with raw type', () => {
      type UserId = Brand<string, 'UserId'>
      // @ts-expect-error — UserId is not directly assignable to plain string
      const _: string = 'test' as UserId
      expect(true).toBe(true)
    })

    test('raw value is not assignable to brand without cast', () => {
      type Meters = Brand<number, 'Meters'>
      // @ts-expect-error — plain number is not assignable to Meters
      const _m: Meters = 42
      expect(true).toBe(true)
    })
  })

  describe('Opaque', () => {
    test('creates distinct types with unique symbol', () => {
      type Cents = Opaque<number, 'Cents'>
      type Euros = Opaque<number, 'Euros'>
      // @ts-expect-error — Cents is not assignable to Euros (unique symbol key differs)
      const _: Euros = 100 as Cents
      expect(true).toBe(true)
    })

    test('requires explicit cast from base type', () => {
      type SafeHtml = Opaque<string, 'SafeHtml'>
      // @ts-expect-error — raw string is not assignable to SafeHtml
      const _: SafeHtml = '<b>hello</b>'
      expect(true).toBe(true)
    })
  })

  describe('RequireAtLeastOne', () => {
    test('rejects empty object', () => {
      type Filter = RequireAtLeastOne<{ a?: number; b?: string }>
      // @ts-expect-error — {} satisfies none of the required-at-least-one variants
      const _: Filter = {}
      expect(true).toBe(true)
    })

    test('accepts object with at least one property', () => {
      type Filter = RequireAtLeastOne<{ a?: number; b?: string }>
      const valid: Filter = { a: 1 }
      expect(valid.a).toBe(1)
    })

    test('accepts object with all properties', () => {
      type Filter = RequireAtLeastOne<{ a?: number; b?: string }>
      const valid: Filter = { a: 1, b: 'hello' }
      expect(valid.b).toBe('hello')
    })
  })

  describe('Nullable', () => {
    test('unions type with null', () => {
      type N = Nullable<string>
      type _test = Assert<Equals<N, string | null>>
      expect(true).toBe(true)
    })

    test('allows null assignment', () => {
      type MaybeNum = Nullable<number>
      const val: MaybeNum = null
      expect(val).toBeNull()
    })
  })

  describe('NonNullableDeep', () => {
    test('removes null from nested array elements', () => {
      type Input = { a: (string | null)[] }
      type Result = NonNullableDeep<Input>
      type _test = Assert<Equals<Result, { a: string[] }>>
      expect(true).toBe(true)
    })

    test('removes undefined from nested object properties', () => {
      type Input = { x: number | null | undefined }
      type Result = NonNullableDeep<Input>
      type _test = Assert<Equals<Result, { x: number }>>
      expect(true).toBe(true)
    })

    test('turns null/undefined top-level to never', () => {
      type _null = Assert<Equals<NonNullableDeep<null>, never>>
      type _undef = Assert<Equals<NonNullableDeep<undefined>, never>>
      expect(true).toBe(true)
    })

    test('handles readonly arrays', () => {
      type Input = { tags: readonly (string | null)[] }
      type Result = NonNullableDeep<Input>
      type _test = Assert<Equals<Result, { tags: readonly string[] }>>
      expect(true).toBe(true)
    })
  })
})
