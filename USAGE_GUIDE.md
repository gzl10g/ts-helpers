# @gzl10/ts-helpers - API Reference

> **Tip:** You can explore and test all functions interactively in the [Function Explorer](https://gzl10.gitlab.io/ts-helpers/playground).

## Flat API

```typescript
import g from '@gzl10/ts-helpers'
```

### Validation (Spanish)

```typescript
g.validateNIF('12345678Z')
g.validateNIE('X0000000T')
g.validateCIF('A12345674')
g.isValidSpanishIBAN('ES...')
g.isValidSpanishPhone('+34612345678')
g.isValidSpanishPostalCode('28001')
g.generateSpanishNIF()
g.generateSpanishNIE()
g.generateSpanishCIF()
g.generateSpanishIBAN()
```

### Validation (General)

```typescript
g.isValidEmail('test@example.com')
g.isValidURL('https://example.com')
g.isValidJSON('{"key":"value"}')
g.validatePassword('MyP@ssw0rd!', { minLength: 8 })
g.generateSecureToken(32)
```

### Strings

```typescript
g.toCamelCase('hello-world') // 'helloWorld'
g.toKebabCase('HelloWorld') // 'hello-world'
g.toSnakeCase('HelloWorld') // 'hello_world'
g.toPascalCase('hello-world') // 'HelloWorld'
g.capitalizeFirst('hello') // 'Hello'
g.sanitizeString('<script>') // ''
g.removeAccents('café') // 'cafe'
g.truncateString('long text', 5) // 'lo...'
```

### Objects

```typescript
g.deepEqual(obj1, obj2)
g.setDeepValue(config, 'database.host', 'localhost')
g.getDeepValue(config, 'database.port', 5432)
g.updateArrayElementsBy(array, { id: 1 }, { name: 'new' })
g.deleteArrayElementsBy(array, { status: 'inactive' })
g.generateCrcHash(data)

// Lodash-lite collection helpers (v4.4.0+)
g.pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // {a:1, c:3}
g.omit({ a: 1, b: 2, c: 3 }, ['b']) // {a:1, c:3}
g.groupBy([{ t: 'a' }, { t: 'b' }, { t: 'a' }], 't') // {a:[...], b:[...]}
g.keyBy(
  [
    { id: 1, n: 'a' },
    { id: 2, n: 'b' },
  ],
  'id'
) // {'1':{...}, '2':{...}}
g.chunk([1, 2, 3, 4, 5], 2) // [[1,2],[3,4],[5]]
g.zip([1, 2, 3], ['a', 'b', 'c']) // [[1,'a'],[2,'b'],[3,'c']]
g.flatten([1, [2, [3]]]) // [1,2,[3]]
g.partition([1, 2, 3, 4], n => n % 2 === 0) // [[2,4],[1,3]]
g.uniq([1, 2, 2, 3]) // [1,2,3]
g.uniqBy([{ id: 1 }, { id: 2 }, { id: 1 }], 'id') // [{id:1},{id:2}]
g.mapValues({ a: 1, b: 2 }, v => v * 2) // {a:2, b:4}
g.filterValues({ a: 1, b: 0 }, v => v > 0) // {a:1}
g.sortBy([{ a: 2 }, { a: 1 }], 'a') // [{a:1},{a:2}]
```

### Dates

```typescript
g.formatNow('DD/MM/YYYY') // '03/01/2026'
g.format(date, 'YYYY-MM-DD')
g.addDays(date, 7)
g.diffDays(date1, date2)
g.diffBusinessDays(date1, date2)
g.isWeekday(date)
g.fromNow(date) // '2 hours ago'
```

### Math & Statistics

```typescript
g.calculateMedian([1, 2, 3, 4, 5])
g.calculateMode([1, 1, 2, 3])
g.calculateStandardDeviation(data)
g.calculatePercentile(data, 95)
g.calculateNPV(0.1, [-1000, 300, 400])
g.calculateIRR(cashFlows)
g.simpleKMeans(points, 3)
```

### Async

```typescript
await g.sleep(1000)
await g.runBatch(items, processFn, { concurrency: 5 })
```

### Data Import/Export

```typescript
await g.exportData(data, 'file.csv')
await g.importData('file.xlsx')
g.detectFileExtension('report.xlsx') // 'xlsx'
g.detectUniversalFormat('doc.pdf') // { category: 'document', mimeType: '...' }
```

### Environment

```typescript
g.isNode // true in Node.js
g.isBrowser // true in browser
g.isDevelopment() // true if NODE_ENV === 'development' (v4.2.0+: excluye test)
g.isTest() // true if NODE_ENV === 'test'
g.isProduction() // true if NODE_ENV === 'production'
g.isNonProduction() // true if not production
g.parseEnvValue('true') // true (boolean)
g.parseEnvValue('[1,2,3]') // [1,2,3] (array)
g.detectProtocol(req) // 'https'
```

### Path & Config

```typescript
g.matchPathPattern('features.auth', 'features.*') // true
g.isValidDotNotationPath('database.host') // true
g.envKeyToPath('APP_DB_HOST', 'APP') // 'db.host'
g.pathToEnvKey('db.host', 'APP') // 'APP_DB_HOST'
```

## Tree-shaking Imports

```typescript
import { validateNIF, generateSpanishNIF } from '@gzl10/ts-helpers/validation'
import { toCamelCase, sanitizeString } from '@gzl10/ts-helpers/strings'
import { deepEqual, setDeepValue } from '@gzl10/ts-helpers/objects'
import { formatNow, addDays } from '@gzl10/ts-helpers/dates'
import { calculateNPV, calculateMedian } from '@gzl10/ts-helpers/math'
import { sleep, runBatch } from '@gzl10/ts-helpers/async'
import { exportData, importData } from '@gzl10/ts-helpers/data'
import { isDevelopment, parseEnvValue } from '@gzl10/ts-helpers/environment'
```

## Supported File Formats (80+)

| Category      | Extensions                       |
| ------------- | -------------------------------- |
| Documents     | doc, docx, pdf, odt, rtf         |
| Spreadsheets  | xls, xlsx, csv, ods              |
| Presentations | ppt, pptx, odp                   |
| Images        | jpg, png, gif, svg, webp, avif   |
| Audio         | mp3, wav, flac, ogg, aac         |
| Video         | mp4, avi, mov, webm, mkv         |
| Code          | js, ts, py, java, go, rs, c, cpp |
| Config        | json, yaml, toml, ini, env       |
| Archives      | zip, rar, 7z, tar, gz            |
| Fonts         | ttf, otf, woff, woff2            |
