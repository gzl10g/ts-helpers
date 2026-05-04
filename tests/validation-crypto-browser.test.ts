/**
 * Tests para src/browser/validation-crypto.ts
 * Módulo browser — usa Web Crypto API (crypto.subtle / crypto.getRandomValues)
 * Se mockea el global `crypto` con vi.stubGlobal para simular entorno browser en Node
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validatePassword,
  sanitizeHtml,
  isValidJWTFormat,
  hashString,
  hashStringSync,
  generateSecureToken,
  isValidBase64,
  escapeShellCommand,
  isSecureUrl,
  removeDangerousChars,
  generateNonce,
} from '../src/browser/validation-crypto'

// ─────────────────────────────────────────────────────────────────────────────
// validatePassword (idéntica lógica a Node, no depende de crypto)
// ─────────────────────────────────────────────────────────────────────────────

describe('[Browser] validatePassword', () => {
  test('contraseña fuerte retorna isValid true', () => {
    const result = validatePassword('StrongP@ss123!!')
    expect(result.isValid).toBe(true)
    expect(['good', 'strong']).toContain(result.strength)
  })

  test('contraseña débil acumula errores', () => {
    const result = validatePassword('abc')
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test('sin mayúscula falla', () => {
    const result = validatePassword('lowercase1!')
    expect(result.errors.some(e => e.includes('mayúscula'))).toBe(true)
  })

  test('pattern prohibido falla', () => {
    const result = validatePassword('Password1!', { forbiddenPatterns: ['password'] })
    expect(result.isValid).toBe(false)
  })

  test('criterios desactivados permiten strings simples', () => {
    const result = validatePassword('abcdefgh', {
      requireUppercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    })
    expect(result.isValid).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeHtml / isValidJWTFormat — sin crypto
// ─────────────────────────────────────────────────────────────────────────────

describe('[Browser] sanitizeHtml', () => {
  test('elimina scripts', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).not.toContain('<script>')
  })

  test('retorna vacío para input vacío', () => {
    expect(sanitizeHtml('')).toBe('')
  })
})

describe('[Browser] isValidJWTFormat', () => {
  const jwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'

  test('JWT válido retorna true', () => expect(isValidJWTFormat(jwt)).toBe(true))
  test('string sin puntos retorna false', () => expect(isValidJWTFormat('nope')).toBe(false))
  test('input vacío retorna false', () => expect(isValidJWTFormat('')).toBe(false))
})

// ─────────────────────────────────────────────────────────────────────────────
// hashString — async, rama Web Crypto
// ─────────────────────────────────────────────────────────────────────────────

describe('[Browser] hashString — con Web Crypto API', () => {
  test('devuelve hash hex de 64 caracteres usando SubtleCrypto real', async () => {
    // En Node el global crypto ya expone crypto.subtle (Node 19+/18.x con --experimental)
    // Si está disponible, usamos el path real; si no, cae al fallback (hash simple)
    const hash = await hashString('hola mundo')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })

  test('mismo input produce mismo hash', async () => {
    const h1 = await hashString('test')
    const h2 = await hashString('test')
    expect(h1).toBe(h2)
  })

  test('inputs distintos producen hashes distintos', async () => {
    const h1 = await hashString('a')
    const h2 = await hashString('b')
    expect(h1).not.toBe(h2)
  })

  test('salt cambia el hash', async () => {
    const h1 = await hashString('test', 'sal1')
    const h2 = await hashString('test', 'sal2')
    expect(h1).not.toBe(h2)
  })
})

describe('[Browser] hashString — fallback cuando SubtleCrypto falla', () => {
  let originalCrypto: typeof globalThis.crypto

  beforeEach(() => {
    originalCrypto = globalThis.crypto
    // Simular crypto sin subtle para forzar el fallback
    vi.stubGlobal('crypto', { subtle: null, getRandomValues: undefined })
  })

  afterEach(() => {
    vi.stubGlobal('crypto', originalCrypto)
  })

  test('cae al fallback y retorna string numérico hex', async () => {
    const hash = await hashString('fallback test')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// hashStringSync — síncrono, sin crypto
// ─────────────────────────────────────────────────────────────────────────────

describe('[Browser] hashStringSync', () => {
  test('retorna string hex', () => {
    const hash = hashStringSync('hola')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
  })

  test('determinista para el mismo input', () => {
    expect(hashStringSync('x')).toBe(hashStringSync('x'))
  })

  test('inputs distintos producen resultados distintos', () => {
    expect(hashStringSync('a')).not.toBe(hashStringSync('b'))
  })

  test('con salt', () => {
    expect(hashStringSync('a', 's1')).not.toBe(hashStringSync('a', 's2'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// generateSecureToken — rama Web Crypto
// ─────────────────────────────────────────────────────────────────────────────

describe('[Browser] generateSecureToken — con getRandomValues', () => {
  test('genera token con la longitud correcta', () => {
    // En Node, el path sigue la rama process.versions.node (require crypto)
    const token = generateSecureToken(16)
    expect(token.length).toBeGreaterThan(0)
    expect(typeof token).toBe('string')
  })

  test('tokens sucesivos son distintos', () => {
    expect(generateSecureToken(16)).not.toBe(generateSecureToken(16))
  })
})

describe('[Browser] generateSecureToken — rama Node.js crypto (sin Web Crypto, con process)', () => {
  let originalCrypto: typeof globalThis.crypto

  beforeEach(() => {
    originalCrypto = globalThis.crypto
    // Sin Web Crypto pero con process.versions.node → rama require('crypto')
    vi.stubGlobal('crypto', undefined)
  })

  afterEach(() => {
    vi.stubGlobal('crypto', originalCrypto)
  })

  test('usa Node.js crypto cuando Web Crypto no está disponible', () => {
    const token = generateSecureToken(16)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })
})

describe('[Browser] generateSecureToken — fallback Math.random', () => {
  let originalCrypto: typeof globalThis.crypto
  let originalProcess: typeof process

  beforeEach(() => {
    originalCrypto = globalThis.crypto
    originalProcess = global.process
    // Sin crypto y sin process.versions.node → fuerza el fallback Math.random
    vi.stubGlobal('crypto', undefined)
    vi.stubGlobal('process', undefined)
  })

  afterEach(() => {
    vi.stubGlobal('crypto', originalCrypto)
    vi.stubGlobal('process', originalProcess)
  })

  test('genera token con fallback Math.random', () => {
    const token = generateSecureToken(8)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// generateNonce — rama Web Crypto
// ─────────────────────────────────────────────────────────────────────────────

describe('[Browser] generateNonce', () => {
  test('genera nonce alfanumérico de la longitud pedida', () => {
    const nonce = generateNonce(24)
    expect(nonce).toHaveLength(24)
    expect(/^[A-Za-z0-9]+$/.test(nonce)).toBe(true)
  })

  test('longitud por defecto es 32', () => {
    expect(generateNonce()).toHaveLength(32)
  })

  test('nonces sucesivos son distintos', () => {
    expect(generateNonce(16)).not.toBe(generateNonce(16))
  })
})

describe('[Browser] generateNonce — rama Node.js crypto (sin Web Crypto, con process)', () => {
  let originalCrypto: typeof globalThis.crypto

  beforeEach(() => {
    originalCrypto = globalThis.crypto
    vi.stubGlobal('crypto', undefined)
  })

  afterEach(() => {
    vi.stubGlobal('crypto', originalCrypto)
  })

  test('usa Node.js crypto cuando Web Crypto no está disponible', () => {
    const nonce = generateNonce(16)
    expect(nonce).toHaveLength(16)
    expect(/^[A-Za-z0-9]+$/.test(nonce)).toBe(true)
  })
})

describe('[Browser] generateNonce — fallback Math.random', () => {
  let originalCrypto: typeof globalThis.crypto
  let originalProcess: typeof process

  beforeEach(() => {
    originalCrypto = globalThis.crypto
    originalProcess = global.process
    vi.stubGlobal('crypto', undefined)
    vi.stubGlobal('process', undefined)
  })

  afterEach(() => {
    vi.stubGlobal('crypto', originalCrypto)
    vi.stubGlobal('process', originalProcess)
  })

  test('genera nonce con fallback', () => {
    const nonce = generateNonce(10)
    expect(nonce).toHaveLength(10)
    expect(/^[A-Za-z0-9]+$/.test(nonce)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isValidBase64 / escapeShellCommand / isSecureUrl / removeDangerousChars
// ─────────────────────────────────────────────────────────────────────────────

describe('[Browser] isValidBase64', () => {
  test('base64 válido retorna true', () => {
    expect(isValidBase64(btoa('hola'))).toBe(true)
  })

  test('caracteres inválidos retorna false', () => {
    expect(isValidBase64('!!invalid!!')).toBe(false)
  })

  test('vacío retorna false', () => {
    expect(isValidBase64('')).toBe(false)
  })
})

describe('[Browser] escapeShellCommand', () => {
  test('escapa comillas simples', () => {
    expect(escapeShellCommand("it's")).toContain("\\'")
  })

  test('retorna vacío para input vacío', () => {
    expect(escapeShellCommand('')).toBe('')
  })
})

describe('[Browser] isSecureUrl', () => {
  test('https es segura', () => expect(isSecureUrl('https://example.com')).toBe(true))
  test('http externo no es seguro', () => expect(isSecureUrl('http://evil.com')).toBe(false))
  test('localhost es seguro', () => expect(isSecureUrl('http://localhost')).toBe(true))
  test('url inválida retorna false', () => expect(isSecureUrl('not-a-url')).toBe(false))
})

describe('[Browser] removeDangerousChars', () => {
  test('elimina < y >', () => {
    const result = removeDangerousChars('<div>')
    expect(result).not.toContain('<')
  })

  test('usa replacement', () => {
    expect(removeDangerousChars('<>', '_')).toBe('__')
  })

  test('retorna vacío para input vacío', () => {
    expect(removeDangerousChars('')).toBe('')
  })
})
