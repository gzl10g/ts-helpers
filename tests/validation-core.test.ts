/**
 * Tests para src/universal/validation-core.ts y src/universal/environment-detection.ts
 *
 * La lógica ya está probada via validation.test.ts (que importa src/validation.ts).
 * Este archivo importa directamente desde universal/ para que el coverage
 * instrumente esos ficheros específicos y salgan del 0%.
 */

import { describe, test, expect, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// validation-core — importación directa desde universal/
// ─────────────────────────────────────────────────────────────────────────────

import {
  generateRandomInteger,
  generateAlphaString,
  generateAlphaNumericString,
  generateComplexString,
  generateUsernameFromEmail,
  generateUsername,
  generateSpanishNIF,
  generateSpanishNIE,
  generateSpanishCIF,
  generateSpanishPostalCode,
  generateSpanishIBAN,
  generateEmail,
  generatePassword,
  generateHexColor,
  isValidNIF,
  isValidNIE,
  isValidCIF,
  isValidSpanishPostalCode,
  isValidSpanishPhone,
  isValidEmail,
  isValidURL,
  isValidJSON,
  isValidSpanishIBAN,
} from '../src/universal/validation-core'

describe('[Universal] Generators — smoke tests', () => {
  test('generateRandomInteger retorna número dentro del rango', () => {
    const n = generateRandomInteger(5, 10)
    expect(n).toBeGreaterThanOrEqual(5)
    expect(n).toBeLessThanOrEqual(10)
  })

  test('generateAlphaString retorna string de la longitud pedida', () => {
    const s = generateAlphaString({ length: 8 })
    expect(s).toHaveLength(8)
    expect(/^[A-Za-z]+$/.test(s)).toBe(true)
  })

  test('generateAlphaString casing upper', () => {
    expect(generateAlphaString({ length: 5, casing: 'upper' })).toMatch(/^[A-Z]+$/)
  })

  test('generateAlphaString casing lower', () => {
    expect(generateAlphaString({ length: 5, casing: 'lower' })).toMatch(/^[a-z]+$/)
  })

  test('generateAlphaNumericString retorna alfanumérico', () => {
    const s = generateAlphaNumericString({ length: 12 })
    expect(s).toHaveLength(12)
    expect(/^[A-Za-z0-9]+$/.test(s)).toBe(true)
  })

  test('generateAlphaNumericString casing upper', () => {
    expect(generateAlphaNumericString({ length: 6, casing: 'upper' })).toMatch(/^[A-Z0-9]+$/)
  })

  test('generateComplexString retorna string de la longitud pedida', () => {
    expect(generateComplexString({ length: 10 })).toHaveLength(10)
  })

  test('generateUsernameFromEmail extrae username del email', () => {
    const u = generateUsernameFromEmail('john.doe@example.com', 2)
    expect(u).toMatch(/^johndoe\d{1,2}$/)
  })

  test('generateUsernameFromEmail con email inválido devuelve user+N', () => {
    const u = generateUsernameFromEmail('noemail', 1)
    expect(u).toMatch(/^user\d$/)
  })

  test('generateUsername retorna string no vacío', () => {
    const u = generateUsername()
    expect(u.length).toBeGreaterThan(0)
  })

  test('generateUsername con separator', () => {
    const u = generateUsername('_', 2, 20)
    expect(u).toContain('_')
  })

  test('generateSpanishNIF genera NIF válido', () => {
    const nif = generateSpanishNIF()
    expect(isValidNIF(nif)).toBe(true)
  })

  test('generateSpanishNIE genera NIE válido', () => {
    const nie = generateSpanishNIE()
    expect(isValidNIE(nie)).toBe(true)
  })

  test('generateSpanishCIF genera CIF válido', () => {
    const cif = generateSpanishCIF()
    expect(isValidCIF(cif)).toBe(true)
  })

  test('generateSpanishCIF genera CIFs válidos en múltiples ejecuciones (cubre ramas dígito y letra)', () => {
    // 50 iteraciones garantizan cobertura probabilística de ambas ramas de randomBool()
    const results = Array.from({ length: 50 }, () => generateSpanishCIF())
    results.forEach(cif => expect(isValidCIF(cif)).toBe(true))
  })

  test('generateSpanishPostalCode genera código postal válido', () => {
    const cp = generateSpanishPostalCode()
    expect(isValidSpanishPostalCode(cp)).toBe(true)
  })

  test('generateSpanishIBAN genera IBAN válido', () => {
    const iban = generateSpanishIBAN()
    expect(isValidSpanishIBAN(iban)).toBe(true)
  })

  test('generateEmail genera email válido', () => {
    const email = generateEmail()
    expect(isValidEmail(email)).toBe(true)
  })

  test('generateEmail con dominio personalizado', () => {
    const email = generateEmail('midominio.es')
    expect(email).toContain('@midominio.es')
    expect(isValidEmail(email)).toBe(true)
  })

  test('generatePassword genera contraseña de longitud correcta', () => {
    const pw = generatePassword({ length: 16 })
    expect(pw).toHaveLength(16)
  })

  test('generateHexColor retorna color hex válido (3 o 6 dígitos)', () => {
    expect(generateHexColor()).toMatch(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/)
  })

  test('generateHexColor formato largo', () => {
    expect(generateHexColor(false)).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test('generateHexColor formato corto', () => {
    expect(generateHexColor(true)).toMatch(/^#[0-9a-fA-F]{3}$/)
  })
})

describe('[Universal] Validators — smoke tests', () => {
  test('isValidNIF válido retorna true', () => {
    expect(isValidNIF(generateSpanishNIF())).toBe(true)
  })

  test('isValidNIF inválido retorna false', () => {
    expect(isValidNIF('00000000A')).toBe(false)
  })

  test('isValidNIE válido retorna true', () => {
    expect(isValidNIE(generateSpanishNIE())).toBe(true)
  })

  test('isValidCIF válido retorna true', () => {
    expect(isValidCIF(generateSpanishCIF())).toBe(true)
  })

  test('isValidSpanishPostalCode válido', () => {
    expect(isValidSpanishPostalCode('28080')).toBe(true)
  })

  test('isValidSpanishPostalCode inválido', () => {
    expect(isValidSpanishPostalCode('99999')).toBe(false)
  })

  test('isValidSpanishPhone válido', () => {
    expect(isValidSpanishPhone('612345678')).toBe(true)
  })

  test('isValidSpanishPhone inválido', () => {
    expect(isValidSpanishPhone('123')).toBe(false)
  })

  test('isValidEmail válido', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  test('isValidEmail inválido', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
  })

  test('isValidURL válida', () => {
    expect(isValidURL('https://example.com')).toBe(true)
  })

  test('isValidURL inválida', () => {
    expect(isValidURL('not-a-url')).toBe(false)
  })

  test('isValidJSON válido', () => {
    expect(isValidJSON('{"key":"value"}')).toBe(true)
  })

  test('isValidJSON inválido', () => {
    expect(isValidJSON('{bad json}')).toBe(false)
  })

  test('isValidSpanishIBAN válido', () => {
    expect(isValidSpanishIBAN(generateSpanishIBAN())).toBe(true)
  })

  // isValidCIF else-branch: type not in NPQRSW → control digit (left side of ||)
  test('isValidCIF accepts non-NPQRSW type with digit control', () => {
    // A0000001: sum=2, controlDigit=8, controlLetter='JABCDEFGHI'[8]='H'
    expect(isValidCIF('A00000018')).toBe(true)
  })

  // isValidCIF else-branch: type not in NPQRSW → control letter (right side of ||)
  test('isValidCIF accepts non-NPQRSW type with letter control', () => {
    // 'H' ≠ '8' (left false) → 'H' === 'H' (right true)
    expect(isValidCIF('A0000001H')).toBe(true)
  })

  // isValidCIF else-branch: both sides false
  test('isValidCIF rejects non-NPQRSW type with wrong control', () => {
    // 'I' ≠ '8' and 'I' ≠ 'H'
    expect(isValidCIF('A0000001I')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// environment-detection — importación directa desde universal/
// ─────────────────────────────────────────────────────────────────────────────

import {
  isBrowserEnv,
  isNodeEnv,
  isWorkerEnvironment,
  isWebCryptoAvailable,
  isNodeCryptoAvailable,
  getEnvironmentType,
  getCryptoCapabilities,
} from '../src/universal/environment-detection'

describe('[Universal] environment-detection — entorno Node', () => {
  test('isBrowserEnv retorna false en Node', () => {
    expect(isBrowserEnv()).toBe(false)
  })

  test('isNodeEnv retorna true en Node', () => {
    expect(isNodeEnv()).toBe(true)
  })

  test('isWorkerEnvironment retorna false fuera de un Worker', () => {
    expect(isWorkerEnvironment()).toBe(false)
  })

  test('isWebCryptoAvailable detecta Web Crypto API', () => {
    const result = isWebCryptoAvailable()
    expect(typeof result).toBe('boolean')
  })

  test('isWebCryptoAvailable retorna false cuando crypto no tiene getRandomValues', () => {
    const original = globalThis.crypto
    vi.stubGlobal('crypto', { subtle: {}, getRandomValues: undefined })
    expect(isWebCryptoAvailable()).toBe(false)
    vi.stubGlobal('crypto', original)
  })

  test('isWebCryptoAvailable retorna false cuando crypto es undefined', () => {
    const original = globalThis.crypto
    vi.stubGlobal('crypto', undefined)
    expect(isWebCryptoAvailable()).toBe(false)
    vi.stubGlobal('crypto', original)
  })

  test('isWebCryptoAvailable retorna false si el acceso a getRandomValues lanza', () => {
    const original = globalThis.crypto
    vi.stubGlobal(
      'crypto',
      new Proxy(
        {},
        {
          get(_target, prop) {
            if (String(prop) === 'getRandomValues') throw new Error('simulated no-crypto')
            return undefined
          },
        }
      )
    )
    expect(isWebCryptoAvailable()).toBe(false)
    vi.stubGlobal('crypto', original)
  })

  test('isNodeCryptoAvailable retorna true en Node', () => {
    expect(isNodeCryptoAvailable()).toBe(true)
  })

  test('isNodeCryptoAvailable retorna false cuando no es Node', () => {
    const originalProcess = global.process
    vi.stubGlobal('process', undefined)
    expect(isNodeCryptoAvailable()).toBe(false)
    vi.stubGlobal('process', originalProcess)
  })

  test('getEnvironmentType retorna "node" en Node', () => {
    expect(getEnvironmentType()).toBe('node')
  })

  test('getCryptoCapabilities retorna objeto con las keys esperadas', () => {
    const caps = getCryptoCapabilities()
    expect(caps).toHaveProperty('webCrypto')
    expect(caps).toHaveProperty('nodeCrypto')
    expect(caps).toHaveProperty('fallbackOnly')
    expect(caps).toHaveProperty('environment')
    expect(caps.nodeCrypto).toBe(true)
    expect(caps.fallbackOnly).toBe(false)
  })
})

describe('[Universal] environment-detection — entorno simulado browser', () => {
  let originalProcess: typeof process
  let originalWindow: unknown

  beforeEach(() => {
    originalProcess = global.process
    originalWindow = (global as any).window
  })

  afterEach(() => {
    vi.stubGlobal('process', originalProcess)
    if (originalWindow === undefined) {
      delete (global as any).window
    } else {
      vi.stubGlobal('window', originalWindow)
    }
    delete (global as any).document
  })

  test('getEnvironmentType retorna "browser" cuando hay window/document y no process', () => {
    vi.stubGlobal('process', undefined)
    vi.stubGlobal('window', { location: {} })
    ;(global as any).document = {}
    expect(getEnvironmentType()).toBe('browser')
  })

  test('getEnvironmentType retorna "unknown" sin process, window ni document', () => {
    vi.stubGlobal('process', undefined)
    delete (global as any).window
    delete (global as any).document
    expect(getEnvironmentType()).toBe('unknown')
  })

  test('getCryptoCapabilities con fallbackOnly true cuando no hay crypto ni Node', () => {
    const originalCrypto = globalThis.crypto
    vi.stubGlobal('process', undefined)
    vi.stubGlobal('crypto', undefined)
    const caps = getCryptoCapabilities()
    expect(caps.fallbackOnly).toBe(true)
    vi.stubGlobal('crypto', originalCrypto)
  })
})

describe('[Universal] environment-detection — isWorkerEnvironment simulado', () => {
  afterEach(() => {
    delete (global as any).importScripts
    delete (global as any).self
  })

  test('retorna true cuando importScripts y self están definidos', () => {
    const mockSelf = { importScripts: true }
    ;(global as any).importScripts = () => {}
    ;(global as any).self = mockSelf
    expect(isWorkerEnvironment()).toBe(true)
  })
})
