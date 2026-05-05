/**
 * @fileoverview TypeScript utility types for advanced type-level programming.
 *
 * All exports are pure types — zero runtime footprint. Safe for any environment
 * (Node, browser, workers). Compatible with `isolatedModules`.
 *
 * @module utility-types
 */

/**
 * Recursively makes all properties (and nested properties) of `T` optional.
 *
 * Handles arrays correctly by distributing over element types rather than
 * mapping over `Array.prototype` methods, which would produce unexpected results.
 *
 * @typeParam T - The type to transform.
 *
 * @remarks
 * **Circular type limitation**: circular/recursive types (e.g. `type Tree = { left: Tree }`)
 * may cause TypeScript to report "Type alias circularly references itself". In those cases,
 * break the cycle with an intermediate interface.
 *
 * @example
 * ```ts
 * type Config = { db: { host: string; port: number }; debug: boolean }
 * type PartialConfig = DeepPartial<Config>
 * // { db?: { host?: string; port?: number } | undefined; debug?: boolean | undefined }
 * const partial: PartialConfig = { db: { host: 'localhost' } }
 * ```
 *
 * @example
 * ```ts
 * type Matrix = number[][]
 * type PartialMatrix = DeepPartial<Matrix>
 * // number[][] — elements distributed, not Array prototype mapped
 * const m: PartialMatrix = [[1, 2], [3]]
 * ```
 */
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T

/**
 * Attaches a compile-time brand `B` to a base type `T`, creating a soft nominal type.
 *
 * "Soft" means the brand is encoded as a string literal on `__brand`, so two brands
 * sharing the same string value would structurally overlap. For stronger isolation use
 * {@link Opaque}, which leverages a `unique symbol`.
 *
 * @typeParam T - The underlying primitive or object type.
 * @typeParam B - A string literal used as the brand discriminant.
 *
 * @example
 * ```ts
 * type UserId = Brand<string, 'UserId'>
 * type OrderId = Brand<string, 'OrderId'>
 *
 * declare function getUser(id: UserId): void
 * const raw = 'abc'
 * // getUser(raw)            // ✗ Error — string is not UserId
 * getUser(raw as UserId)     // ✓ Explicit cast required
 * ```
 *
 * @example
 * ```ts
 * type Meters = Brand<number, 'Meters'>
 * const distance = 42 as Meters
 * const doubled: Meters = (distance * 2) as Meters
 * ```
 */
export type Brand<T, B extends string> = T & { readonly __brand: B }

/**
 * @internal Unique symbol used as the key for the Opaque brand.
 * Declared with `declare const` — no runtime value is emitted.
 */
declare const _opaque: unique symbol

/**
 * Attaches a hard nominal brand `K` to a base type `T` via a `unique symbol`.
 *
 * Unlike {@link Brand} (which uses a plain string property), `Opaque` uses a
 * `unique symbol` as the property key. This means two `Opaque` types with different
 * `K` parameters are always structurally incompatible — even if `K` happens to share
 * the same string at the value level.
 *
 * @typeParam T - The underlying primitive or object type.
 * @typeParam K - A string literal that identifies this opaque type.
 *
 * @example
 * ```ts
 * type Cents = Opaque<number, 'Cents'>
 * type Euros = Opaque<number, 'Euros'>
 *
 * declare function addTax(price: Euros): Euros
 * const price = 100 as Cents
 * // addTax(price)           // ✗ Error — Cents is not assignable to Euros
 * ```
 *
 * @example
 * ```ts
 * type SafeHtml = Opaque<string, 'SafeHtml'>
 * declare function render(html: SafeHtml): void
 * const sanitized = sanitize(input) as SafeHtml
 * render(sanitized)          // ✓
 * ```
 */
export type Opaque<T, K extends string> = T & { readonly [_opaque]: K }

/**
 * Constructs a type from `T` that requires at least one of the properties
 * listed in `Keys` to be present, while keeping all other properties as-is.
 *
 * Defaults to requiring at least one of *all* keys when `Keys` is omitted.
 *
 * @typeParam T    - The source object type.
 * @typeParam Keys - Union of keys from `T` that the constraint applies to.
 *                  Defaults to `keyof T`.
 *
 * @example
 * ```ts
 * type Filter = RequireAtLeastOne<{ name?: string; email?: string; id?: number }>
 * const byName: Filter = { name: 'Alice' }    // ✓
 * const byBoth: Filter = { name: 'A', id: 1 } // ✓
 * // const none: Filter = {}                  // ✗ Error
 * ```
 *
 * @example
 * ```ts
 * type Contact = { phone?: string; fax?: string; address: string }
 * type ReachableContact = RequireAtLeastOne<Contact, 'phone' | 'fax'>
 * // address stays required; at least one of phone/fax must be present
 * const c: ReachableContact = { address: '1 Main St', phone: '555-0100' } // ✓
 * ```
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys]

/**
 * Unions type `T` with `null`, marking a value as explicitly nullable.
 *
 * Useful as a lightweight alternative to `T | null` in type signatures where
 * the intent should be clear from the name.
 *
 * @typeParam T - The base type.
 *
 * @example
 * ```ts
 * type MaybeUser = Nullable<User>
 * function findUser(id: string): MaybeUser {
 *   return db.users.find(u => u.id === id) ?? null
 * }
 * ```
 *
 * @example
 * ```ts
 * interface Row { id: number; deletedAt: Nullable<Date> }
 * const row: Row = { id: 1, deletedAt: null }
 * ```
 */
export type Nullable<T> = T | null

/**
 * Recursively removes `null` and `undefined` from all nested properties of `T`.
 *
 * Handles arrays correctly by distributing over element types, mirroring the
 * same pattern used in {@link DeepPartial}.
 *
 * @typeParam T - The type to strip nullability from.
 *
 * @remarks
 * **Circular type limitation**: circular/recursive types may cause TypeScript to
 * report "Type alias circularly references itself". Break cycles with interfaces
 * when needed.
 *
 * @example
 * ```ts
 * type Raw = { name: string | null; tags: (string | null | undefined)[] }
 * type Clean = NonNullableDeep<Raw>
 * // { name: string; tags: string[] }
 * ```
 *
 * @example
 * ```ts
 * type ApiResponse = { data: { id: number | null; items: (Item | null)[] } | undefined }
 * type Resolved = NonNullableDeep<ApiResponse>
 * // { data: { id: number; items: Item[] } }
 * ```
 */
export type NonNullableDeep<T> = T extends null | undefined
  ? never
  : T extends (infer U)[]
    ? NonNullableDeep<U>[]
    : T extends readonly (infer U)[]
      ? readonly NonNullableDeep<U>[]
      : T extends object
        ? { [K in keyof T]: NonNullableDeep<T[K]> }
        : T
