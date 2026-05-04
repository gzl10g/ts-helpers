/**
 * Test suite for validation module
 * Tests for Spanish document generators, validators, security functions and general utilities
 */

import { describe, test, expect } from 'vitest'
import {
  // Random generators
  generateRandomInteger,
  generateAlphaString,
  generateAlphaNumericString,
  generateComplexString,
  generateUsernameFromEmail,
  generateUsername,

  // Spanish generators
  generateSpanishNIF,
  generateSpanishNIE,
  generateSpanishCIF,
  generateSpanishPostalCode,
  generateSpanishIBAN,

  // General generators
  generateEmail,
  generatePassword,
  generateHexColor,

  // Spanish validators
  isValidNIF,
  isValidNIE,
  isValidCIF,
  isValidSpanishPostalCode,
  isValidSpanishPhone,
  isValidSpanishIBAN,

  // General validators
  isValidEmail,
  isValidURL,
  isValidJSON,
  isValidDotNotationPath,

  // Security functions
  validatePassword,
  sanitizeHtml,
  isValidJWTFormat,
  hashString,
  generateSecureToken,
  isValidBase64,
  escapeShellCommand,
  isSecureUrl,
  removeDangerousChars,
  generateNonce,
} from '../src/validation'

describe('[Random Generators] String and Number Generation', () => {
  test('[Integer] should generate numbers within specified min-max range', async ({ annotate }) => {
    await annotate('🔢 Testing: Random integer generation with boundary validation')
    for (let i = 0; i < 100; i++) {
      const result = generateRandomInteger(1, 10)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(10)
      expect(Number.isInteger(result)).toBe(true)
    }
  })

  test('[Alpha String] should generate mixed case alphabetic characters only', async ({
    annotate,
  }) => {
    await annotate('🔤 Testing: Pure alphabetic string generation without numbers or symbols')
    const result = generateAlphaString({ length: 10 })
    expect(result).toHaveLength(10)
    expect(/^[A-Za-z]+$/.test(result)).toBe(true)
  })

  test('[Alpha String] should respect uppercase casing option', async ({ annotate }) => {
    await annotate('🔠 Testing: Uppercase casing option forces all letters to uppercase')
    const result = generateAlphaString({ length: 10, casing: 'upper' })
    expect(result).toHaveLength(10)
    expect(result).toBe(result.toUpperCase())
    expect(/^[A-Z]+$/.test(result)).toBe(true)
  })

  test('generateAlphaNumericString should contain letters and numbers', () => {
    const result = generateAlphaNumericString({ length: 20 })
    expect(result).toHaveLength(20)
    expect(/^[A-Za-z0-9]+$/.test(result)).toBe(true)
  })

  test('generateComplexString should generate string of specified length', () => {
    const result = generateComplexString({ length: 15 })
    expect(result).toHaveLength(15)
  })

  test('generateUsernameFromEmail should create valid username', () => {
    const result = generateUsernameFromEmail('juan.perez@example.com', 2)
    expect(result.length).toBeGreaterThan(0)
    expect(/^[a-z0-9]+$/.test(result)).toBe(true)
  })

  test('generateUsernameFromEmail with invalid email should return default', () => {
    const result = generateUsernameFromEmail('invalid-email', 2)
    expect(result).toMatch(/^user\d+$/)
  })

  test('generateUsername should create valid usernames', () => {
    const result = generateUsername('_', 2, 15)
    expect(result.length).toBeLessThanOrEqual(15)
    expect(result.includes('_')).toBe(true)
  })
})

describe('Spanish Generators', () => {
  test('generateSpanishNIF should generate valid NIF', () => {
    for (let i = 0; i < 10; i++) {
      const nif = generateSpanishNIF()
      expect(nif).toHaveLength(9)
      expect(/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(nif)).toBe(true)
      expect(isValidNIF(nif)).toBe(true)
    }
  })

  test('generateSpanishNIE should generate valid NIE', () => {
    for (let i = 0; i < 10; i++) {
      const nie = generateSpanishNIE()
      expect(nie).toHaveLength(9)
      expect(/^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(nie)).toBe(true)
      expect(isValidNIE(nie)).toBe(true)
    }
  })

  test('generateSpanishCIF should generate valid CIF', () => {
    for (let i = 0; i < 10; i++) {
      const cif = generateSpanishCIF()
      expect(cif).toHaveLength(9)
      expect(/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(cif)).toBe(true)
      expect(isValidCIF(cif)).toBe(true)
    }
  })

  test('generateSpanishPostalCode should generate valid postal code', () => {
    for (let i = 0; i < 10; i++) {
      const postalCode = generateSpanishPostalCode()
      expect(postalCode).toHaveLength(5)
      expect(/^[0-5][0-9]{4}$/.test(postalCode)).toBe(true)
      expect(isValidSpanishPostalCode(postalCode)).toBe(true)
    }
  })

  test('generateSpanishIBAN should generate valid Spanish IBAN', () => {
    for (let i = 0; i < 5; i++) {
      const iban = generateSpanishIBAN()
      expect(iban).toHaveLength(24)
      expect(iban.startsWith('ES')).toBe(true)
      expect(isValidSpanishIBAN(iban)).toBe(true)
    }
  })
})

describe('General Generators', () => {
  test('generateEmail should generate valid email format', () => {
    const email = generateEmail()
    expect(email).toContain('@')
    expect(email).toContain('.')
    expect(isValidEmail(email)).toBe(true)
  })

  test('generateEmail with custom domain should use provided domain', () => {
    const email = generateEmail('test.com')
    expect(email.endsWith('@test.com')).toBe(true)
    expect(isValidEmail(email)).toBe(true)
  })

  test('generatePassword should create password with specified criteria', () => {
    const password = generatePassword({
      length: 12,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    })

    expect(password).toHaveLength(12)
    expect(/[A-Z]/.test(password)).toBe(true)
    expect(/[a-z]/.test(password)).toBe(true)
    expect(/\d/.test(password)).toBe(true)
    expect(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)).toBe(true)
  })

  test('generatePassword without symbols should not contain symbols', () => {
    const password = generatePassword({
      length: 10,
      includeSymbols: false,
    })

    expect(password).toHaveLength(10)
    expect(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)).toBe(false)
  })

  test('generateHexColor should generate valid hex colors', () => {
    const longColor = generateHexColor(false)
    const shortColor = generateHexColor(true)

    expect(longColor).toMatch(/^#[0-9A-F]{6}$/)
    expect(shortColor).toMatch(/^#[0-9A-F]{3}$/)
  })
})

describe('Spanish Validators', () => {
  test('isValidNIF should validate correct NIF numbers', () => {
    expect(isValidNIF('12345678Z')).toBe(true)
    expect(isValidNIF('87654321X')).toBe(true)
    expect(isValidNIF('00000000T')).toBe(true)
  })

  test('isValidNIF should reject invalid NIF numbers', () => {
    expect(isValidNIF('')).toBe(false)
    expect(isValidNIF('12345678A')).toBe(false) // Wrong letter
    expect(isValidNIF('1234567Z')).toBe(false) // Too short
    expect(isValidNIF('123456789Z')).toBe(false) // Too long
    expect(isValidNIF('abcdefghZ')).toBe(false) // Non-numeric
  })

  test('isValidNIE should validate correct NIE numbers', () => {
    expect(isValidNIE('X0000000T')).toBe(true)
    expect(isValidNIE('Y5555555B')).toBe(true) // Corrected letter
    expect(isValidNIE('Z9999999H')).toBe(true) // Corrected letter
  })

  test('isValidNIE should reject invalid NIE numbers', () => {
    expect(isValidNIE('')).toBe(false)
    expect(isValidNIE('X0000000A')).toBe(false) // Wrong letter
    expect(isValidNIE('A0000000T')).toBe(false) // Wrong prefix
    expect(isValidNIE('X000000T')).toBe(false) // Too short
  })

  test('isValidCIF should validate correct CIF numbers', () => {
    // We need to use actually valid CIFs
    expect(isValidCIF('A12345674')).toBe(true)
    expect(isValidCIF('B01234566')).toBe(true) // Corrected control digit
  })

  test('isValidCIF should reject invalid CIF numbers', () => {
    expect(isValidCIF('')).toBe(false)
    expect(isValidCIF('12345674')).toBe(false) // No letter prefix
    expect(isValidCIF('A1234567')).toBe(false) // Too short
    expect(isValidCIF('A123456789')).toBe(false) // Too long
  })

  test('isValidSpanishPostalCode should validate correct postal codes', () => {
    expect(isValidSpanishPostalCode('28001')).toBe(true) // Madrid
    expect(isValidSpanishPostalCode('08001')).toBe(true) // Barcelona
    expect(isValidSpanishPostalCode('41001')).toBe(true) // Sevilla
    expect(isValidSpanishPostalCode('50001')).toBe(true) // Zaragoza
  })

  test('isValidSpanishPostalCode should reject invalid postal codes', () => {
    expect(isValidSpanishPostalCode('')).toBe(false)
    expect(isValidSpanishPostalCode('00001')).toBe(false) // Invalid province
    expect(isValidSpanishPostalCode('53001')).toBe(false) // Invalid province
    expect(isValidSpanishPostalCode('2800')).toBe(false) // Too short
    expect(isValidSpanishPostalCode('280001')).toBe(false) // Too long
  })

  test('isValidSpanishPhone should validate Spanish phone numbers', () => {
    expect(isValidSpanishPhone('612345678')).toBe(true)
    expect(isValidSpanishPhone('912345678')).toBe(true)
    expect(isValidSpanishPhone('+34612345678')).toBe(true)
    expect(isValidSpanishPhone('0034612345678')).toBe(true)
    expect(isValidSpanishPhone('612 345 678')).toBe(true)
    expect(isValidSpanishPhone('612-345-678')).toBe(true)
  })

  test('isValidSpanishPhone should reject invalid phone numbers', () => {
    expect(isValidSpanishPhone('')).toBe(false)
    expect(isValidSpanishPhone('512345678')).toBe(false) // Invalid prefix
    expect(isValidSpanishPhone('61234567')).toBe(false) // Too short
    expect(isValidSpanishPhone('6123456789')).toBe(false) // Too long
  })

  test('isValidSpanishIBAN should validate Spanish IBAN numbers', () => {
    expect(isValidSpanishIBAN('ES9121000418450200051332')).toBe(true)
    expect(isValidSpanishIBAN('ES7100302053091234567895')).toBe(true)
  })

  test('isValidSpanishIBAN should reject invalid IBAN numbers', () => {
    expect(isValidSpanishIBAN('')).toBe(false)
    expect(isValidSpanishIBAN('ES91210004184502000513')).toBe(false) // Too short
    expect(isValidSpanishIBAN('FR9121000418450200051332')).toBe(false) // Not Spanish
    expect(isValidSpanishIBAN('ES9921000418450200051332')).toBe(false) // Invalid check digits
  })
})

describe('General Validators', () => {
  test('isValidEmail should validate email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    expect(isValidEmail('test+tag@example.com')).toBe(true)
  })

  test('isValidEmail should reject invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
  })

  test('isValidURL should validate URLs', () => {
    expect(isValidURL('https://example.com')).toBe(true)
    expect(isValidURL('http://localhost:3000')).toBe(true)
    expect(isValidURL('https://www.example.com/path?query=value')).toBe(true)
  })

  test('isValidURL should reject invalid URLs', () => {
    expect(isValidURL('')).toBe(false)
    expect(isValidURL('not-a-url')).toBe(false)
    expect(isValidURL('example.com')).toBe(false) // No protocol
  })

  test('isValidJSON should validate JSON strings', () => {
    expect(isValidJSON('{"key": "value"}')).toBe(true)
    expect(isValidJSON('[1, 2, 3]')).toBe(true)
    expect(isValidJSON('"string"')).toBe(true)
    expect(isValidJSON('123')).toBe(true)
    expect(isValidJSON('true')).toBe(true)
  })

  test('isValidJSON should reject invalid JSON strings', () => {
    expect(isValidJSON('')).toBe(false)
    expect(isValidJSON('{key: value}')).toBe(false) // Unquoted keys
    expect(isValidJSON("{'key': 'value'}")).toBe(false) // Single quotes
    expect(isValidJSON('{key: value,}')).toBe(false) // Trailing comma
  })
})

describe('Security Functions', () => {
  test('validatePassword should validate strong passwords', () => {
    const result = validatePassword('StrongP@ss123!')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(['good', 'strong']).toContain(result.strength)
  })

  test('validatePassword should reject weak passwords', () => {
    const result = validatePassword('weak')
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.strength).toBe('weak')
  })

  test('validatePassword with custom criteria should enforce rules', () => {
    const result = validatePassword('NoNumbers!', {
      requireNumbers: true,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('número'))).toBe(true)
  })

  test('sanitizeHtml should remove dangerous content', () => {
    const dangerous = '<script>alert("xss")</script><p>Safe content</p>'
    const result = sanitizeHtml(dangerous)
    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>Safe content</p>')
  })

  test('sanitizeHtml should remove event handlers', () => {
    const dangerous = '<div onclick="alert(\'xss\')">Content</div>'
    const result = sanitizeHtml(dangerous)
    expect(result).not.toContain('onclick')
    expect(result).toContain('<div>Content</div>')
  })

  test('isValidJWTFormat should validate JWT structure', () => {
    const validJWT =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    expect(isValidJWTFormat(validJWT)).toBe(true)
  })

  test('isValidJWTFormat should reject invalid JWT format', () => {
    expect(isValidJWTFormat('')).toBe(false)
    expect(isValidJWTFormat('invalid.jwt')).toBe(false)
    expect(isValidJWTFormat('header.payload')).toBe(false) // Missing signature
  })

  test('hashString should generate consistent hashes', () => {
    const input = 'test string'
    const hash1 = hashString(input)
    const hash2 = hashString(input)
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64) // SHA-256 hex length
  })

  test('generateSecureToken should generate random tokens', () => {
    const token1 = generateSecureToken(16)
    const token2 = generateSecureToken(16)
    expect(token1).toHaveLength(32) // Hex representation
    expect(token2).toHaveLength(32)
    expect(token1).not.toBe(token2)
  })

  test('isValidBase64 should validate base64 strings', () => {
    const validBase64 = btoa('hello world')
    expect(isValidBase64(validBase64)).toBe(true)
    expect(isValidBase64('')).toBe(false)
    expect(isValidBase64('invalid base64!')).toBe(false)
  })

  test('escapeShellCommand should escape dangerous characters', () => {
    const dangerous = 'rm -rf /; echo "dangerous"'
    const escaped = escapeShellCommand(dangerous)
    expect(escaped).not.toBe(dangerous)
    expect(escaped).toContain('\\"')
    expect(escaped).toContain('\\;')
  })

  test('isSecureUrl should validate secure URLs', () => {
    expect(isSecureUrl('https://example.com')).toBe(true)
    expect(isSecureUrl('http://localhost')).toBe(true)
    expect(isSecureUrl('http://127.0.0.1')).toBe(true)
    expect(isSecureUrl('http://example.com')).toBe(false)
  })

  test('isSecureUrl should return false for unparseable URLs', () => {
    expect(isSecureUrl(':::not-a-url')).toBe(false)
  })

  test('removeDangerousChars should remove dangerous characters', () => {
    const dangerous = '<script>alert("xss")</script>'
    const result = removeDangerousChars(dangerous)
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).not.toContain('"')
  })

  test('generateNonce should generate random nonces', () => {
    const nonce1 = generateNonce(16)
    const nonce2 = generateNonce(16)
    expect(nonce1).toHaveLength(16)
    expect(nonce2).toHaveLength(16)
    expect(nonce1).not.toBe(nonce2)
    expect(/^[A-Za-z0-9]+$/.test(nonce1)).toBe(true)
  })
})

describe('Edge Cases and Error Handling', () => {
  test('validators should handle null/undefined inputs', () => {
    expect(isValidNIF(null as any)).toBe(false)
    expect(isValidEmail(undefined as any)).toBe(false)
    expect(isValidURL(null as any)).toBe(false)
  })

  test('generators should handle invalid parameters gracefully', () => {
    expect(generateRandomInteger(-10, -5)).toBeLessThanOrEqual(-5)
    expect(generateRandomInteger(-10, -5)).toBeGreaterThanOrEqual(-10)
    expect(generateAlphaString({ length: 0 })).toBe('')
  })

  test('security functions should handle empty inputs', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(hashString('')).toBeDefined()
    expect(removeDangerousChars('')).toBe('')
  })
})

describe('Dot Notation Path Validation', () => {
  test('isValidDotNotationPath should accept valid paths', () => {
    expect(isValidDotNotationPath('database.host')).toBe(true)
    expect(isValidDotNotationPath('app.features.auth.enabled')).toBe(true)
    expect(isValidDotNotationPath('config_value')).toBe(true)
    expect(isValidDotNotationPath('nested-key.sub_key')).toBe(true)
    expect(isValidDotNotationPath('level1.level2.level3')).toBe(true)
  })

  test('isValidDotNotationPath should reject invalid paths', () => {
    expect(isValidDotNotationPath('')).toBe(false)
    expect(isValidDotNotationPath('.database')).toBe(false)
    expect(isValidDotNotationPath('database.')).toBe(false)
    expect(isValidDotNotationPath('path..value')).toBe(false)
    expect(isValidDotNotationPath('path with spaces')).toBe(false)
    expect(isValidDotNotationPath('path.with.special!chars')).toBe(false)
  })

  test('isValidDotNotationPath should handle invalid types', () => {
    expect(isValidDotNotationPath(null as any)).toBe(false)
    expect(isValidDotNotationPath(undefined as any)).toBe(false)
    expect(isValidDotNotationPath(42 as any)).toBe(false)
  })

  test('isValidDotNotationPath should handle whitespace correctly', () => {
    expect(isValidDotNotationPath('   ')).toBe(false)
    expect(isValidDotNotationPath('  valid.path  ')).toBe(true) // Trimmed
  })

  test('isValidDotNotationPath should accept alphanumeric, underscores, hyphens', () => {
    expect(isValidDotNotationPath('key123')).toBe(true)
    expect(isValidDotNotationPath('key_name')).toBe(true)
    expect(isValidDotNotationPath('key-name')).toBe(true)
    expect(isValidDotNotationPath('a1.b2.c3')).toBe(true)
    expect(isValidDotNotationPath('path_with-mixed.keys123')).toBe(true)
  })

  test('isValidDotNotationPath should reject special characters', () => {
    expect(isValidDotNotationPath('path@key')).toBe(false)
    expect(isValidDotNotationPath('path#key')).toBe(false)
    expect(isValidDotNotationPath('path$key')).toBe(false)
    expect(isValidDotNotationPath('path/key')).toBe(false)
    expect(isValidDotNotationPath('path\\key')).toBe(false)
  })
})
