/**
 * Node.js-specific validation utilities with crypto support
 * Uses Node.js crypto module for secure operations
 */

/* eslint-disable complexity */

import { createHash, randomBytes } from 'crypto'

// =============================================================================
// PASSWORD VALIDATION (Node.js with crypto)
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
// SECURITY FUNCTIONS (Node.js crypto)
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

export const hashString = (input: string, salt = ''): string => {
  return createHash('sha256')
    .update(input + salt)
    .digest('hex')
}

export const generateSecureToken = (length = 32): string => {
  return randomBytes(length).toString('hex')
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

export const generateNonce = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }

  return result
}
