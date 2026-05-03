# Changelog

## 4.2.7

### Patch Changes

- Limpieza de documentación interna: simplifica CLAUDE.md, corrige nombres de
  funciones en llms.txt y USAGE_GUIDE.md, elimina ficheros de tracking
  obsoletos.

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
