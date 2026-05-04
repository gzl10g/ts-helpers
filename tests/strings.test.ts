/**
 * Test suite for strings module
 * Tests for string manipulation, formatting, validation and utility functions
 */

import { describe, test, expect } from 'vitest'
import {
  // String cleaning and sanitization
  sanitizeString,
  cleanJsonChars,
  truncateString,
  unescapeUnicode,

  // String manipulation
  ensureEndsWith,
  stripFromEnd,
  ensureStartsWith,
  stripFromStart,
  toLowerCase,
  toUpperCase,
  capitalizeFirst,
  capitalizeEachWord,

  // Case conversions
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  toPascalCase,

  // String checking
  contains,
  startsWith,
  endsWith,
  isEmpty,
  isEmail,

  // String padding and trimming
  padStart,
  padEnd,
  trim,
  trimStart,
  trimEnd,

  // String transformation
  reverseString,
  repeatString,
  replaceAllOccurrences,
  countOccurrences,

  // Path and environment utilities
  matchPathPattern,
  envKeyToPath,
  pathToEnvKey,

  // URL and HTML utilities
  toUrlSlug,
  removeAccents,
  escapeHtmlChars,
  unescapeHtmlChars,
} from '../src/strings'

describe('String Cleaning and Sanitization', () => {
  test('sanitizeString should remove special characters and convert to lowercase with dashes', () => {
    expect(sanitizeString('Hello World!')).toBe('hello-world')
    expect(sanitizeString('Test@Example.com')).toBe('testexamplecom')
    expect(sanitizeString('Mixed 123 Numbers')).toBe('mixed-123-numbers')
    expect(sanitizeString('')).toBe('')
    expect(sanitizeString(null)).toBe('')
  })

  test('cleanJsonChars should remove JSON-like characters', () => {
    expect(cleanJsonChars('text{with}braces')).toBe('textwithbraces')
    expect(cleanJsonChars('text&amp;more')).toBe('textmore')
    expect(cleanJsonChars('textgt;here')).toBe('texthere')
    expect(cleanJsonChars('')).toBe('')
    expect(cleanJsonChars(null)).toBe('')
  })

  test('truncateString should truncate long strings with suffix', () => {
    expect(truncateString('This is a very long string', 10)).toBe('This is a ...')
    expect(truncateString('Short', 10)).toBe('Short')
    expect(truncateString('Exactly ten', 11)).toBe('Exactly ten')
    expect(truncateString('Custom suffix', 6, '---')).toBe('Custom---')
    expect(truncateString('', 10)).toBe('')
  })

  test('unescapeUnicode should convert Unicode escape sequences', () => {
    expect(unescapeUnicode('Hello\\nWorld')).toBe('Hello\\nWorld')
    // Note: This function has complex behavior, testing basic functionality
  })
})

describe('String Manipulation', () => {
  test('ensureEndsWith should add trailing string if not present', () => {
    expect(ensureEndsWith('test', '/')).toBe('test/')
    expect(ensureEndsWith('test/', '/')).toBe('test/')
    expect(ensureEndsWith('', '.txt')).toBe('.txt')
  })

  test('stripFromEnd should remove trailing string if present', () => {
    expect(stripFromEnd('test.txt', '.txt')).toBe('test')
    expect(stripFromEnd('test', '.txt')).toBe('test')
    expect(stripFromEnd('test/', '/')).toBe('test')
  })

  test('ensureStartsWith should add leading string if not present', () => {
    expect(ensureStartsWith('path', '/')).toBe('/path')
    expect(ensureStartsWith('/path', '/')).toBe('/path')
    expect(ensureStartsWith('', 'prefix')).toBe('prefix')
  })

  test('stripFromStart should remove leading string if present', () => {
    expect(stripFromStart('/path', '/')).toBe('path')
    expect(stripFromStart('path', '/')).toBe('path')
    expect(stripFromStart('prefix-text', 'prefix')).toBe('-text')
  })

  test('toLowerCase should convert to lowercase', () => {
    expect(toLowerCase('HELLO WORLD')).toBe('hello world')
    expect(toLowerCase('MiXeD cAsE')).toBe('mixed case')
    expect(toLowerCase('')).toBe('')
  })

  test('toUpperCase should convert to uppercase', () => {
    expect(toUpperCase('hello world')).toBe('HELLO WORLD')
    expect(toUpperCase('MiXeD cAsE')).toBe('MIXED CASE')
    expect(toUpperCase('')).toBe('')
  })

  test('capitalizeFirst should capitalize first letter only', () => {
    expect(capitalizeFirst('hello world')).toBe('Hello world')
    expect(capitalizeFirst('HELLO WORLD')).toBe('Hello world')
    expect(capitalizeFirst('')).toBe('')
    expect(capitalizeFirst('a')).toBe('A')
  })

  test('capitalizeEachWord should capitalize each word', () => {
    expect(capitalizeEachWord('hello world')).toBe('Hello World')
    expect(capitalizeEachWord('the quick brown fox')).toBe('The Quick Brown Fox')
    expect(capitalizeEachWord('')).toBe('')
    expect(capitalizeEachWord('single')).toBe('Single')
  })
})

describe('Case Conversions', () => {
  test('toCamelCase should convert to camelCase', () => {
    expect(toCamelCase('hello-world')).toBe('helloWorld')
    expect(toCamelCase('hello_world')).toBe('helloWorld')
    expect(toCamelCase('hello world')).toBe('helloWorld')
    expect(toCamelCase('HelloWorld')).toBe('helloWorld')
    expect(toCamelCase('HELLO-WORLD')).toBe('helloWorld')
    expect(toCamelCase('')).toBe('')
  })

  test('toSnakeCase should convert to snake_case', () => {
    expect(toSnakeCase('helloWorld')).toBe('hello_world')
    expect(toSnakeCase('HelloWorld')).toBe('hello_world')
    expect(toSnakeCase('hello-world')).toBe('hello_world')
    expect(toSnakeCase('hello world')).toBe('hello_world')
    expect(toSnakeCase('')).toBe('')
  })

  test('toKebabCase should convert to kebab-case', () => {
    expect(toKebabCase('helloWorld')).toBe('hello-world')
    expect(toKebabCase('HelloWorld')).toBe('hello-world')
    expect(toKebabCase('hello_world')).toBe('hello-world')
    expect(toKebabCase('hello world')).toBe('hello-world')
    expect(toKebabCase('')).toBe('')
  })

  test('toPascalCase should convert to PascalCase', () => {
    expect(toPascalCase('hello-world')).toBe('HelloWorld')
    expect(toPascalCase('hello_world')).toBe('HelloWorld')
    expect(toPascalCase('hello world')).toBe('HelloWorld')
    expect(toPascalCase('helloWorld')).toBe('HelloWorld')
    expect(toPascalCase('')).toBe('')
  })
})

describe('String Checking', () => {
  test('contains should check if string contains substring', () => {
    expect(contains('Hello World', 'World')).toBe(true)
    expect(contains('Hello World', 'world')).toBe(true) // Case insensitive by default
    expect(contains('Hello World', 'world', true)).toBe(false) // Case sensitive
    expect(contains('Hello World', 'World', true)).toBe(true) // Case sensitive match
    expect(contains('Hello World', 'xyz')).toBe(false)
  })

  test('startsWith should check if string starts with substring', () => {
    expect(startsWith('Hello World', 'Hello')).toBe(true)
    expect(startsWith('Hello World', 'hello')).toBe(true) // Case insensitive by default
    expect(startsWith('Hello World', 'hello', true)).toBe(false) // Case sensitive
    expect(startsWith('Hello World', 'World')).toBe(false)
  })

  test('endsWith should check if string ends with substring', () => {
    expect(endsWith('Hello World', 'World')).toBe(true)
    expect(endsWith('Hello World', 'world')).toBe(true) // Case insensitive by default
    expect(endsWith('Hello World', 'world', true)).toBe(false) // Case sensitive
    expect(endsWith('Hello World', 'Hello')).toBe(false)
  })

  test('isEmpty should check if string is empty or whitespace', () => {
    expect(isEmpty('')).toBe(true)
    expect(isEmpty(' ')).toBe(true)
    expect(isEmpty('   ')).toBe(true)
    expect(isEmpty('\n\t ')).toBe(true)
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('text')).toBe(false)
    expect(isEmpty(' text ')).toBe(false)
  })

  test('isEmail should validate email format', () => {
    expect(isEmail('test@example.com')).toBe(true)
    expect(isEmail('user.name@domain.co.uk')).toBe(true)
    expect(isEmail('test+tag@example.com')).toBe(true)
    expect(isEmail('invalid-email')).toBe(false)
    expect(isEmail('@example.com')).toBe(false)
    expect(isEmail('test@')).toBe(false)
    expect(isEmail('')).toBe(false)
  })
})

describe('String Padding and Trimming', () => {
  test('padStart should pad string at the beginning', () => {
    expect(padStart('test', 8)).toBe('    test')
    expect(padStart('test', 8, '0')).toBe('0000test')
    expect(padStart('test', 4)).toBe('test') // No padding needed
    expect(padStart('test', 2)).toBe('test') // String longer than target
  })

  test('padEnd should pad string at the end', () => {
    expect(padEnd('test', 8)).toBe('test    ')
    expect(padEnd('test', 8, '0')).toBe('test0000')
    expect(padEnd('test', 4)).toBe('test') // No padding needed
    expect(padEnd('test', 2)).toBe('test') // String longer than target
  })

  test('trim should remove whitespace from both ends', () => {
    expect(trim('  hello world  ')).toBe('hello world')
    expect(trim('\n\ttest\r\n')).toBe('test')
    expect(trim('no-whitespace')).toBe('no-whitespace')
    expect(trim('')).toBe('')
  })

  test('trimStart should remove whitespace from beginning', () => {
    expect(trimStart('  hello world  ')).toBe('hello world  ')
    expect(trimStart('\n\ttest')).toBe('test')
    expect(trimStart('no-whitespace')).toBe('no-whitespace')
  })

  test('trimEnd should remove whitespace from end', () => {
    expect(trimEnd('  hello world  ')).toBe('  hello world')
    expect(trimEnd('test\r\n')).toBe('test')
    expect(trimEnd('no-whitespace')).toBe('no-whitespace')
  })
})

describe('String Transformation', () => {
  test('reverseString should reverse character order', () => {
    expect(reverseString('hello')).toBe('olleh')
    expect(reverseString('12345')).toBe('54321')
    expect(reverseString('a')).toBe('a')
    expect(reverseString('')).toBe('')
  })

  test('repeatString should repeat string specified times', () => {
    expect(repeatString('abc', 3)).toBe('abcabcabc')
    expect(repeatString('x', 5)).toBe('xxxxx')
    expect(repeatString('test', 1)).toBe('test')
    expect(repeatString('test', 0)).toBe('')
  })

  test('replaceAllOccurrences should replace all instances', () => {
    expect(replaceAllOccurrences('hello hello hello', 'hello', 'hi')).toBe('hi hi hi')
    expect(replaceAllOccurrences('test string', 'test', 'new')).toBe('new string')
    expect(replaceAllOccurrences('no match', 'xyz', 'abc')).toBe('no match')
  })

  test('countOccurrences should count substring occurrences', () => {
    expect(countOccurrences('hello hello hello', 'hello')).toBe(3)
    expect(countOccurrences('test string test', 'test')).toBe(2)
    expect(countOccurrences('no match here', 'xyz')).toBe(0)
    expect(countOccurrences('aaaaa', 'aa')).toBe(4) // Overlapping matches
    expect(countOccurrences('test', '')).toBe(0)
  })
})

describe('URL and HTML Utilities', () => {
  test('toUrlSlug should create URL-friendly slugs', () => {
    expect(toUrlSlug('Hello World!')).toBe('hello-world')
    expect(toUrlSlug('This is a TEST')).toBe('this-is-a-test')
    expect(toUrlSlug('Special@Characters#Here')).toBe('specialcharactershere')
    expect(toUrlSlug('Multiple   Spaces')).toBe('multiple-spaces')
    expect(toUrlSlug('---Leading-and-Trailing---')).toBe('leading-and-trailing')
  })

  test('removeAccents should remove diacritical marks', () => {
    expect(removeAccents('café')).toBe('cafe')
    expect(removeAccents('résumé')).toBe('resume')
    expect(removeAccents('naïve')).toBe('naive')
    expect(removeAccents('piñata')).toBe('pinata')
    expect(removeAccents('Zürich')).toBe('Zurich')
    expect(removeAccents('regular text')).toBe('regular text')
  })

  test('escapeHtmlChars should escape HTML special characters', () => {
    expect(escapeHtmlChars('<div>Hello World</div>')).toBe('&lt;div&gt;Hello World&lt;/div&gt;')
    expect(escapeHtmlChars('Tom & Jerry')).toBe('Tom &amp; Jerry')
    expect(escapeHtmlChars('"quoted text"')).toBe('&quot;quoted text&quot;')
    expect(escapeHtmlChars("'single quotes'")).toBe('&#39;single quotes&#39;')
    expect(escapeHtmlChars('regular text')).toBe('regular text')
  })

  test('unescapeHtmlChars should convert HTML entities back', () => {
    expect(unescapeHtmlChars('&lt;div&gt;Hello World&lt;/div&gt;')).toBe('<div>Hello World</div>')
    expect(unescapeHtmlChars('Tom &amp; Jerry')).toBe('Tom & Jerry')
    expect(unescapeHtmlChars('&quot;quoted text&quot;')).toBe('"quoted text"')
    expect(unescapeHtmlChars('&#39;single quotes&#39;')).toBe("'single quotes'")
    expect(unescapeHtmlChars('regular text')).toBe('regular text')
  })
})

describe('Edge Cases and Error Handling', () => {
  test('functions should handle empty strings gracefully', () => {
    expect(toCamelCase('')).toBe('')
    expect(toUrlSlug('')).toBe('')
    expect(capitalizeFirst('')).toBe('')
    expect(reverseString('')).toBe('')
    expect(removeAccents('')).toBe('')
  })

  test('functions should handle null/undefined inputs', () => {
    expect(sanitizeString(null)).toBe('')
    expect(cleanJsonChars(null)).toBe('')
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
  })

  test('case conversion functions should handle special characters', () => {
    expect(toCamelCase('hello-world-123')).toBe('helloWorld123')
    expect(toSnakeCase('hello123World')).toBe('hello123_world')
    expect(toKebabCase('hello123World')).toBe('hello123-world')
    expect(toPascalCase('hello-world-123')).toBe('HelloWorld123')
  })

  test('padding functions should handle edge cases', () => {
    expect(padStart('', 5, 'x')).toBe('xxxxx')
    expect(padEnd('', 5, 'x')).toBe('xxxxx')
    expect(padStart('long string', 5)).toBe('long string')
    expect(padEnd('long string', 5)).toBe('long string')
  })

  test('string checking functions should handle edge cases', () => {
    expect(contains('', '')).toBe(true)
    expect(contains('test', '')).toBe(true)
    expect(startsWith('', '')).toBe(true)
    expect(endsWith('', '')).toBe(true)
  })

  test('transformation functions should handle special cases', () => {
    expect(countOccurrences('', 'test')).toBe(0)
    expect(replaceAllOccurrences('', 'test', 'new')).toBe('')
    expect(repeatString('', 5)).toBe('')
  })
})

describe('Path Pattern Matching', () => {
  test('matchPathPattern should match exact paths', () => {
    expect(matchPathPattern('features.auth', 'features.auth')).toBe(true)
    expect(matchPathPattern('features.auth', 'features.payments')).toBe(false)
  })

  test('matchPathPattern should match wildcard at end', () => {
    expect(matchPathPattern('features.auth', 'features.*')).toBe(true)
    expect(matchPathPattern('features.payments', 'features.*')).toBe(true)
    expect(matchPathPattern('other.value', 'features.*')).toBe(false)
  })

  test('matchPathPattern should match wildcard in middle', () => {
    expect(matchPathPattern('features.auth.enabled', 'features.*.enabled')).toBe(true)
    expect(matchPathPattern('features.payments.enabled', 'features.*.enabled')).toBe(true)
    expect(matchPathPattern('features.auth.disabled', 'features.*.enabled')).toBe(false)
  })

  test('matchPathPattern should match multiple wildcards', () => {
    expect(matchPathPattern('app.features.auth.oauth', 'app.*.*.oauth')).toBe(true)
    expect(matchPathPattern('app.features.auth.saml', 'app.*.*.oauth')).toBe(false)
  })

  test('matchPathPattern should handle no wildcard', () => {
    expect(matchPathPattern('exact.path.match', 'exact.path.match')).toBe(true)
    expect(matchPathPattern('exact.path.nomatch', 'exact.path.match')).toBe(false)
  })

  test('matchPathPattern should return false for invalid inputs', () => {
    expect(matchPathPattern('', 'pattern')).toBe(false)
    expect(matchPathPattern('path', '')).toBe(false)
    expect(matchPathPattern(null as any, 'pattern')).toBe(false)
    expect(matchPathPattern('path', null as any)).toBe(false)
  })
})

describe('Environment Key Conversion', () => {
  test('envKeyToPath should convert env keys with default prefix', () => {
    expect(envKeyToPath('NX_FEATURES_AUTH')).toBe('features.auth')
    expect(envKeyToPath('NX_FEATURES_PAYMENTS')).toBe('features.payments')
    expect(envKeyToPath('NX_DATABASE_HOST')).toBe('database.host')
  })

  test('envKeyToPath should convert with custom prefix', () => {
    expect(envKeyToPath('APP_DATABASE_HOST', 'APP')).toBe('database.host')
    expect(envKeyToPath('MY_CONFIG_VALUE', 'MY')).toBe('config.value')
  })

  test('envKeyToPath should convert without prefix', () => {
    expect(envKeyToPath('DATABASE_HOST', '')).toBe('database.host')
    expect(envKeyToPath('FEATURES_AUTH', '')).toBe('features.auth')
  })

  test('envKeyToPath should handle invalid inputs', () => {
    expect(envKeyToPath('')).toBe('')
    expect(envKeyToPath(null as any)).toBe('')
    expect(envKeyToPath('  ')).toBe('')
  })

  test('envKeyToPath should trim whitespace', () => {
    expect(envKeyToPath('  NX_FEATURES_AUTH  ')).toBe('features.auth')
  })

  test('pathToEnvKey should convert paths with default prefix', () => {
    expect(pathToEnvKey('features.auth')).toBe('NX_FEATURES_AUTH')
    expect(pathToEnvKey('features.payments')).toBe('NX_FEATURES_PAYMENTS')
    expect(pathToEnvKey('database.host')).toBe('NX_DATABASE_HOST')
  })

  test('pathToEnvKey should convert with custom prefix', () => {
    expect(pathToEnvKey('database.host', 'APP')).toBe('APP_DATABASE_HOST')
    expect(pathToEnvKey('config.value', 'MY')).toBe('MY_CONFIG_VALUE')
  })

  test('pathToEnvKey should convert without prefix', () => {
    expect(pathToEnvKey('database.host', '')).toBe('DATABASE_HOST')
    expect(pathToEnvKey('features.auth', '')).toBe('FEATURES_AUTH')
  })

  test('pathToEnvKey should handle invalid inputs', () => {
    expect(pathToEnvKey('')).toBe('')
    expect(pathToEnvKey(null as any)).toBe('')
    expect(pathToEnvKey('  ')).toBe('')
  })

  test('pathToEnvKey should trim whitespace', () => {
    expect(pathToEnvKey('  features.auth  ')).toBe('NX_FEATURES_AUTH')
  })

  test('envKeyToPath and pathToEnvKey should be reversible', () => {
    const original = 'features.auth.enabled'
    const envKey = pathToEnvKey(original, 'APP')
    const backToPath = envKeyToPath(envKey, 'APP')

    expect(backToPath).toBe(original)
  })
})
