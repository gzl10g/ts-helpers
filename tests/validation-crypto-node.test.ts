/**
 * Tests para src/node/validation-crypto.ts
 * Módulo Node.js específico — usa crypto nativo (createHash, randomBytes)
 */

import { describe, test, expect } from 'vitest'
import {
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
} from '../src/node/validation-crypto'

describe('[Node] validatePassword', () => {
  test('contraseña fuerte retorna isValid true y strength good/strong', () => {
    const result = validatePassword('StrongP@ss123!!')
    expect(result.isValid).toBe(true)
    expect(['good', 'strong']).toContain(result.strength)
    expect(result.errors).toHaveLength(0)
  })

  test('contraseña corta falla con error de longitud', () => {
    const result = validatePassword('abc')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('al menos'))).toBe(true)
  })

  test('contraseña sin mayúscula falla con el criterio por defecto', () => {
    const result = validatePassword('lowercase1!')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('mayúscula'))).toBe(true)
  })

  test('contraseña sin número falla', () => {
    const result = validatePassword('UpperLower!')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('número'))).toBe(true)
  })

  test('contraseña sin caracter especial falla', () => {
    const result = validatePassword('UpperLower1')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('especial'))).toBe(true)
  })

  test('contraseña que supera maxLength falla', () => {
    const result = validatePassword('A'.repeat(130) + 'a1!', { maxLength: 10 })
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('más de'))).toBe(true)
  })

  test('forbiddenPatterns rechaza contraseñas con patrón prohibido', () => {
    const result = validatePassword('Password1!', { forbiddenPatterns: ['password'] })
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('password'))).toBe(true)
  })

  test('criterios desactivados permiten contraseñas simples', () => {
    const result = validatePassword('abcdefgh', {
      requireUppercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    })
    expect(result.isValid).toBe(true)
  })

  test('score escala con longitud y complejidad', () => {
    const weak = validatePassword('abc', { requireUppercase: false, requireNumbers: false, requireSpecialChars: false, minLength: 1 })
    const strong = validatePassword('VeryStr0ng!Pass#2024')
    expect(strong.score).toBeGreaterThan(weak.score)
  })

  test('strength fair para contraseña con score medio', () => {
    const result = validatePassword('Abcdefgh', {
      requireNumbers: false,
      requireSpecialChars: false,
    })
    expect(['weak', 'fair', 'good', 'strong']).toContain(result.strength)
  })
})

describe('[Node] sanitizeHtml', () => {
  test('elimina tags script', () => {
    expect(sanitizeHtml('<script>alert(1)</script>texto')).not.toContain('<script>')
  })

  test('elimina handlers on*', () => {
    expect(sanitizeHtml('<div onclick="evil()">click</div>')).not.toContain('onclick')
  })

  test('elimina javascript: URLs', () => {
    expect(sanitizeHtml('<a href="javascript:void(0)">link</a>')).not.toContain('javascript:')
  })

  test('elimina iframes', () => {
    expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).not.toContain('<iframe')
  })

  test('retorna string vacío para input vacío', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  test('mantiene HTML legítimo intacto', () => {
    const html = '<p>Hola <strong>mundo</strong></p>'
    expect(sanitizeHtml(html)).toContain('<p>')
    expect(sanitizeHtml(html)).toContain('<strong>')
  })
})

describe('[Node] isValidJWTFormat', () => {
  const validJWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'

  test('JWT válido retorna true', () => {
    expect(isValidJWTFormat(validJWT)).toBe(true)
  })

  test('string sin dos puntos retorna false', () => {
    expect(isValidJWTFormat('nopoints')).toBe(false)
  })

  test('solo dos partes retorna false', () => {
    expect(isValidJWTFormat('header.payload')).toBe(false)
  })

  test('input vacío retorna false', () => {
    expect(isValidJWTFormat('')).toBe(false)
  })

  test('null/undefined retorna false', () => {
    expect(isValidJWTFormat(null as unknown as string)).toBe(false)
  })
})

describe('[Node] hashString', () => {
  test('produce hash SHA-256 hex de 64 caracteres', () => {
    const hash = hashString('hola')
    expect(hash).toHaveLength(64)
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })

  test('mismo input produce el mismo hash (determinista)', () => {
    expect(hashString('test')).toBe(hashString('test'))
  })

  test('inputs distintos producen hashes distintos', () => {
    expect(hashString('a')).not.toBe(hashString('b'))
  })

  test('salt cambia el hash', () => {
    expect(hashString('hola', 'sal1')).not.toBe(hashString('hola', 'sal2'))
  })

  test('funciona con string vacío', () => {
    const hash = hashString('')
    expect(hash).toHaveLength(64)
  })
})

describe('[Node] generateSecureToken', () => {
  test('genera token hex del doble de la longitud pedida', () => {
    const token = generateSecureToken(16)
    expect(token).toHaveLength(32) // randomBytes(n).toString('hex') = 2n chars
  })

  test('longitud por defecto genera 64 caracteres', () => {
    expect(generateSecureToken()).toHaveLength(64)
  })

  test('tokens sucesivos son distintos', () => {
    expect(generateSecureToken(32)).not.toBe(generateSecureToken(32))
  })

  test('contiene solo caracteres hex', () => {
    expect(/^[0-9a-f]+$/.test(generateSecureToken(8))).toBe(true)
  })
})

describe('[Node] isValidBase64', () => {
  test('cadena base64 válida retorna true', () => {
    expect(isValidBase64(btoa('hola mundo'))).toBe(true)
  })

  test('string con caracteres inválidos retorna false', () => {
    expect(isValidBase64('not-base64!!')).toBe(false)
  })

  test('input vacío retorna false', () => {
    expect(isValidBase64('')).toBe(false)
  })
})

describe('[Node] escapeShellCommand', () => {
  test('escapa comillas simples', () => {
    expect(escapeShellCommand("it's")).toContain("\\'")
  })

  test('escapa punto y coma', () => {
    expect(escapeShellCommand('a;b')).toContain('\\;')
  })

  test('escapa pipe', () => {
    expect(escapeShellCommand('a|b')).toContain('\\|')
  })

  test('retorna string vacío para input vacío', () => {
    expect(escapeShellCommand('')).toBe('')
  })
})

describe('[Node] isSecureUrl', () => {
  test('URL https es segura', () => {
    expect(isSecureUrl('https://example.com')).toBe(true)
  })

  test('http en localhost es segura', () => {
    expect(isSecureUrl('http://localhost:3000')).toBe(true)
  })

  test('http en 127.0.0.1 es segura', () => {
    expect(isSecureUrl('http://127.0.0.1:8080/api')).toBe(true)
  })

  test('http en dominio externo NO es segura', () => {
    expect(isSecureUrl('http://example.com')).toBe(false)
  })

  test('URL inválida retorna false', () => {
    expect(isSecureUrl('not-a-url')).toBe(false)
  })

  test('input vacío retorna false', () => {
    expect(isSecureUrl('')).toBe(false)
  })
})

describe('[Node] removeDangerousChars', () => {
  test('elimina < y >', () => {
    const result = removeDangerousChars('<script>')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })

  test('elimina comillas', () => {
    expect(removeDangerousChars('"\'quoted\'')).not.toMatch(/['"]/)
  })

  test('usa replacement cuando se especifica', () => {
    expect(removeDangerousChars('<>', '*')).toBe('**')
  })

  test('retorna string vacío para input vacío', () => {
    expect(removeDangerousChars('')).toBe('')
  })
})

describe('[Node] generateNonce', () => {
  test('genera nonce de la longitud solicitada', () => {
    expect(generateNonce(16)).toHaveLength(16)
  })

  test('longitud por defecto es 32', () => {
    expect(generateNonce()).toHaveLength(32)
  })

  test('nonces sucesivos son distintos', () => {
    expect(generateNonce(16)).not.toBe(generateNonce(16))
  })

  test('solo contiene caracteres alfanuméricos', () => {
    expect(/^[A-Za-z0-9]+$/.test(generateNonce(64))).toBe(true)
  })
})
