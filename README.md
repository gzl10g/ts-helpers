# @gzl10/ts-helpers

[![npm version](https://img.shields.io/npm/v/@gzl10/ts-helpers.svg)](https://www.npmjs.com/package/@gzl10/ts-helpers)
[![Pipeline Status](https://gitlab.gzl10.com/oss/ts-helpers/badges/main/pipeline.svg)](https://gitlab.gzl10.com/oss/ts-helpers/-/pipelines)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Universal TypeScript utility library for modern JavaScript environments.

## Features

- **Flat API**: Direct access to 170+ functions without nesting
- **Universal**: Works in Node.js, browsers, Web Workers, and all bundlers
- **Tree-shakeable**: Import only what you need for minimal bundles
- **TypeScript-first**: Full type inference and strict mode
- **Spanish validation**: NIF, NIE, CIF, IBAN, phone numbers, and more

## Installation

```bash
pnpm add @gzl10/ts-helpers
# or
npm install @gzl10/ts-helpers
```

## Playground

Explore all 160+ functions interactively in the browser:

**[→ Open the Function Explorer](https://gzl10.gitlab.io/ts-helpers/playground)**

Search by name or description, view signatures and JSDoc examples, and run code live in a browser REPL.

## Usage

### Flat API (Recommended)

```typescript
import g from '@gzl10/ts-helpers'

// Validation
g.validateNIF('12345678Z')
g.generateSpanishNIF()

// Strings
g.toCamelCase('hello-world')
g.sanitizeString('<script>alert("xss")</script>')

// Math & Finance
g.calculateNPV(0.1, [-1000, 300, 400, 500])
g.calculateIRR([-1000, 300, 400, 500])

// Async
g.sleep(1000)
g.runBatch(items, processFn, { concurrency: 5 })
await g.retry(() => fetchData(), { attempts: 3, delay: 500 })
await g.withTimeout(signal => fetch(url, { signal }), 5000)
const sem = new g.Semaphore(3) // Semaphore / Mutex also available

// Data
g.exportData(data, 'file.csv')
g.detectUniversalFormat('report.xlsx')

// Error handling (Result / tryCatch)
const [error, value] = g.tryCatch(() => JSON.parse(raw))  // Go-style tuple
const [err2, data] = await g.tryCatchAsync(async () => fetchUser(id))
const result = g.ok(42)             // Ok<number>
const failed = g.err(new Error())   // Err<Error>
if (g.isOk(result)) result.value    // type-narrowed to number

// Utility types (TypeScript only, zero runtime)
// type UserId = Brand<string, 'UserId'>
// type Cents = Opaque<number, 'Cents'>
// type PartialConfig = DeepPartial<Config>

// Objects
g.deepEqual(obj1, obj2)
g.setDeepValue(config, 'database.host', 'localhost')

// Dates
g.formatNow('DD/MM/YYYY')
g.addDays(new Date(), 7)

// Environment
g.isDevelopment()
g.isProduction()
g.detectProtocol(req)
```

### Tree-shaking Imports

```typescript
import { validateNIF, generateSpanishNIF } from '@gzl10/ts-helpers/validation'
import { exportData, importData } from '@gzl10/ts-helpers/data'
import { toCamelCase, sanitizeString } from '@gzl10/ts-helpers/strings'
import { sleep, runBatch } from '@gzl10/ts-helpers/async'
import { calculateNPV, calculateIRR } from '@gzl10/ts-helpers/math'
import { formatNow, addDays } from '@gzl10/ts-helpers/dates'
import { deepEqual, setDeepValue } from '@gzl10/ts-helpers/objects'
import { isDevelopment, isProduction } from '@gzl10/ts-helpers/environment'
import { tryCatch, tryCatchAsync, ok, err, isOk, isErr, assertNever } from '@gzl10/ts-helpers/result'
import type { DeepPartial, Brand, Opaque, Nullable, NonNullableDeep, RequireAtLeastOne } from '@gzl10/ts-helpers'
```

## Documentation

- **[API Reference](https://gitlab.gzl10.com/oss/ts-helpers/-/blob/main/USAGE_GUIDE.md)** -
  Complete function list
- **[Changelog](https://gitlab.gzl10.com/oss/ts-helpers/-/blob/main/CHANGELOG.md)** -
  Version history

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Support

<a href="https://www.buymeacoffee.com/gzl10g" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## License

MIT © [Gonzalo Díez](mailto:gonzalo@gzl10.com)
