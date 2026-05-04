/**
 * Browser-specific validation utilities with Web Crypto API support
 * Safe for browser environments - uses crypto.getRandomValues() and SubtleCrypto
 */

/* eslint-disable no-console, complexity */

// =============================================================================
// PASSWORD VALIDATION (Browser-safe)
// =============================================================================

export interface PasswordCriteria {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
  maxLength?: number
  forbiddenPatterns?: string[]
}

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'fair' | 'good' | 'strong'
  score: number // 0-100
}

export const validatePassword = (
  password: string,
  criteria: PasswordCriteria = {}
): PasswordValidationResult => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    maxLength = 128,
    forbiddenPatterns = [],
  } = criteria

  const errors: string[] = []
  let score = 0

  if (password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres`)
  } else {
    score += 20
  }

  if (password.length > maxLength) {
    errors.push(`La contraseña no puede tener más de ${maxLength} caracteres`)
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula')
  } else if (/[A-Z]/.test(password)) {
    score += 15
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula')
  } else if (/[a-z]/.test(password)) {
    score += 15
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  } else if (/\d/.test(password)) {
    score += 15
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un caracter especial')
  } else if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 15
  }

  for (const pattern of forbiddenPatterns) {
    if (password.toLowerCase().includes(pattern.toLowerCase())) {
      errors.push(`La contraseña no puede contener: ${pattern}`)
    }
  }

  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10

  if (/(.)\\1{2,}/.test(password)) score -= 10
  if (/123|abc|qwe/i.test(password)) score -= 15

  score = Math.max(0, Math.min(100, score))

  let strength: 'weak' | 'fair' | 'good' | 'strong'
  if (score < 30) strength = 'weak'
  else if (score < 60) strength = 'fair'
  else if (score < 80) strength = 'good'
  else strength = 'strong'

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  }
}

// =============================================================================
// SECURITY FUNCTIONS (Browser-safe)
// =============================================================================

export const sanitizeHtml = (html: string): string => {
  if (!html) return ''

  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  sanitized = sanitized.replace(/ on\w+="[^"]*"/gi, '')
  sanitized = sanitized.replace(/ on\w+='[^']*'/gi, '')
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '')

  return sanitized.trim()
}

export const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    for (const part of parts) {
      if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) return false
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    }
    return true
  } catch {
    return false
  }
}

/**
 * Browser-safe hash function with environment detection
 * Attempts Web Crypto API first, falls back to simple hash
 */
export const hashString = async (input: string, salt = ''): Promise<string> => {
  const combined = input + salt

  // Try Web Crypto API (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const msgBuffer = new TextEncoder().encode(combined)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      console.warn('Web Crypto API failed, falling back to simple hash:', error)
    }
  }

  // Fallback: Simple hash for compatibility
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Synchronous version of hashString for backward compatibility
 */
export const hashStringSync = (input: string, salt = ''): string => {
  // Simple hash for browser compatibility
  let hash = 0
  const combined = input + salt
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Browser-safe secure token generation with comprehensive environment checks
 * Uses Web Crypto API when available, falls back to Node.js crypto, then Math.random
 * @param length - Length of the token in characters (default: 32)
 * @returns A secure hexadecimal token string
 * @example
 * ```ts
 * const token = generateSecureToken(16)
 * console.log(token) // "a1b2c3d4e5f67890"
 *
 * const shortToken = generateSecureToken(8)
 * console.log(shortToken) // "a1b2c3d4"
 * ```
 */
export const generateSecureToken = (length = 32): string => {
  // Check for Web Crypto API (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    try {
      const array = new Uint8Array(length)
      crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      console.warn('crypto.getRandomValues failed, falling back to Math.random:', error)
    }
  }

  // Check for Node.js crypto (if somehow running in Node context)
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // Dynamic import to avoid bundling issues
      const crypto = require('crypto')
      return crypto.randomBytes(length).toString('hex')
    } catch (error) {
      console.warn('Node.js crypto failed, falling back to Math.random:', error)
    }
  }

  // Final fallback: Math.random (less secure but universal)
  console.warn('Using Math.random fallback - not cryptographically secure')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length * 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const isValidBase64 = (input: string): boolean => {
  if (!input || typeof input !== 'string') return false

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input)) return false

  try {
    const decoded = atob(input)
    const reencoded = btoa(decoded)
    return reencoded === input
  } catch {
    return false
  }
}

export const escapeShellCommand = (input: string): string => {
  if (!input) return ''

  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/;/g, '\\;')
    .replace(/&/g, '\\&')
    .replace(/\|/g, '\\|')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/</g, '\\\\<')
    .replace(/>/g, '\\\\>')
}

export const isSecureUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false

  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'))
    )
  } catch {
    return false
  }
}

export const removeDangerousChars = (input: string, replacement = ''): string => {
  if (!input) return ''

  return input
    .replace(/[<>]/g, replacement)
    .replace(/['"]/g, replacement)
    .replace(/[&]/g, replacement)
    .replace(/[\\x00-\\x1f\\x7f]/g, replacement)
}

/**
 * Browser-safe nonce generation with comprehensive environment detection
 */
export const generateNonce = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  // Try Web Crypto API first (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    try {
      const array = new Uint8Array(length)
      crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length]
      }
      return result
    } catch (error) {
      console.warn('crypto.getRandomValues failed for nonce, falling back to Math.random:', error)
    }
  }

  // Check for Node.js environment (edge case)
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const crypto = require('crypto')
      const bytes = crypto.randomBytes(length)
      for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length]
      }
      return result
    } catch (error) {
      console.warn('Node.js crypto failed for nonce, falling back to Math.random:', error)
    }
  }

  // Final fallback: Math.random (less secure but universal)
  console.warn('Using Math.random fallback for nonce - not cryptographically secure')
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}
