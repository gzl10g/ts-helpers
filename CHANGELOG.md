# Changelog

## 4.4.0

### Minor Changes

- 5d1ecf2: Adds 13 lodash-lite collection helpers: `pick`, `omit`, `groupBy`,
  `keyBy`, `chunk`, `zip`, `flatten`, `partition`, `uniq`, `uniqBy`,
  `mapValues`, `filterValues`, `sortBy`. Native implementations with strict
  generics, no runtime lodash dependency. Also fixes `any` in public API of
  `calculateDifferences`, `updateArrayElementsBy`, `updateArrayElementById`,
  `deleteArrayElementsBy`, and `formatToReadableString`.

## 4.3.0

### Minor Changes

- Adds async resilience primitives: `retry` with exponential backoff and jitter,
  `withTimeout`, `combineAbortSignals`, `memoize` with TTL and LRU cache,
  `Deferred<T>`, `Semaphore`, and `Mutex`.

## 4.2.7

### Patch Changes

- Internal documentation cleanup: simplified CLAUDE.md, fixed function names in
  llms.txt and USAGE_GUIDE.md, removed obsolete tracking files.

## 4.2.6

- ci: añade mirror automático GitLab → GitHub en cada release
- fix: amplía threshold de timing en test sleep NaN (flaky)
- chore: actualiza dependencias patches/minors
- refactor: type safety y eliminación de any (typescript quick wins)
- Renamed package to `@gzl10/ts-helpers`
- Simplified README and translated to English
- Lint cleanup with eslint-disable for complex functions

## 4.2.0

### Breaking Changes

- `isDevelopment()` now returns `false` when `NODE_ENV=test`
- Use `isNonProduction()` for previous behavior (includes dev, test, undefined)

### Added

- `isTest()` - Explicit test environment detection
- `isNonProduction()` - Returns true for dev, test, and undefined environments

## 4.1.0

### Added

- `parseEnvValue(str)` - Parse env strings to native types (boolean, number,
  array, JSON)
- `setDeepValue(obj, path, value)` - Set nested object values with dot notation
- `getDeepValue(obj, path, default?)` - Get nested object values with dot
  notation
- `matchPathPattern(path, pattern)` - Wildcard path matching
- `isValidDotNotationPath(path)` - Validate dot notation paths
- `envKeyToPath(envKey)` / `pathToEnvKey(path)` - Convert between env keys and
  paths

## 4.0.x

### 4.0.7

- Added `isNumericValue()` for numeric validation

### 4.0.6

- Universal multi-environment certification (Browser + Node.js + Workers)
- Conditional exports with automatic environment resolution

### 4.0.5

- Deprecated `detectFormatFromFilename` in favor of `detectFileExtension`

### 4.0.1

- Fixed type file extensions (.d.mts → .d.ts)

## 4.0.0

### Breaking Changes

- Flat API: `g.validateNIF()` instead of `g.validation.validators.validateNIF()`
- Removed nested structure (src/lib/core/, src/lib/primitives/)
- Removed re-exports of lodash, axios, dayjs, numeral, qs, ms

### Performance

- 70-90% faster builds with tsup (~40ms vs ~45s)
- 69% bundle size reduction (603KB → 185KB)
- Migrated from npm to pnpm

## 3.x

Legacy versions with nested API structure. See git history for details.
