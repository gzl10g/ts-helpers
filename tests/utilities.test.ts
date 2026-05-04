/**
 * Test suite for utility modules
 * Tests for environment detection, error handling, number utilities and validators
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest'

// Environment utilities
import { isNode, isBrowser, isNodeEnvironment, isBrowserEnvironment } from '../src/environment'

// Error utilities
import { TsHelpersError, TsHelpersErrorCode, DataError, createValidationError, createCryptoError, createMathError } from '../src/errors'

// Number utilities
import { roundToDecimals } from '../src/number'

// Mock global objects for environment testing
const originalProcess = global.process
const originalWindow = global.window
const originalDocument = global.document

describe('Environment Detection', () => {
  beforeEach(() => {
    // Reset environment
    delete (global as any).process
    delete (global as any).window
    delete (global as any).document
  })

  afterEach(() => {
    // Restore original environment
    global.process = originalProcess
    global.window = originalWindow as any
    global.document = originalDocument as any
  })

  test('isNode should detect Node.js environment', () => {
    // Mock Node.js environment
    global.process = {
      versions: { node: '18.0.0' },
    } as any

    expect(isNode()).toBe(true)
  })

  test('isNode should return false in non-Node.js environment', () => {
    // No process global
    expect(isNode()).toBe(false)

    // Process without versions
    global.process = {} as any
    expect(isNode()).toBe(false)

    // Process with versions but no node
    global.process = { versions: {} } as any
    expect(isNode()).toBe(false)
  })

  test('isBrowser should detect browser environment', () => {
    // Mock browser environment
    global.window = {} as any
    global.document = {} as any

    expect(isBrowser()).toBe(true)
  })

  test('isBrowser should return false in non-browser environment', () => {
    expect(isBrowser()).toBe(false)

    // Only window
    global.window = {} as any
    expect(isBrowser()).toBe(false)

    // Only document
    delete (global as any).window
    global.document = {} as any
    expect(isBrowser()).toBe(false)
  })

  test('isNodeEnvironment should be alias for isNode', () => {
    global.process = { versions: { node: '18.0.0' } } as any
    expect(isNodeEnvironment()).toBe(true)

    delete (global as any).process
    expect(isNodeEnvironment()).toBe(false)
  })

  test('isBrowserEnvironment should be alias for isBrowser', () => {
    global.window = {} as any
    global.document = {} as any
    expect(isBrowserEnvironment()).toBe(true)

    delete (global as any).window
    delete (global as any).document
    expect(isBrowserEnvironment()).toBe(false)
  })

  test('should handle edge cases', () => {
    // Null process (safe mock to avoid process.listeners error)
    global.process = {
      versions: undefined,
      listeners: originalProcess.listeners?.bind(originalProcess) || (() => []),
    } as any
    expect(isNode()).toBe(false)

    // Undefined window/document
    global.window = undefined as any
    global.document = undefined as any
    expect(isBrowser()).toBe(false)
  })
})

describe('Error Handling', () => {
  test('TsHelpersError should create custom error with code and data', () => {
    const error = new TsHelpersError('Test error message', {
      code: TsHelpersErrorCode.INVALID_OPERATION,
      data: { test: 'value' },
    })

    expect(error.name).toBe('TsHelpersError')
    expect(error.message).toBe('Test error message')
    expect(error.code).toBe(TsHelpersErrorCode.INVALID_OPERATION)
    expect(error.data).toEqual({ test: 'value' })
    expect(error instanceof Error).toBe(true)
  })

  test('TsHelpersError should work without options', () => {
    const error = new TsHelpersError('Simple error')

    expect(error.name).toBe('TsHelpersError')
    expect(error.message).toBe('Simple error')
    expect(error.code).toBeUndefined()
    expect(error.data).toBeUndefined()
  })

  test('TsHelpersError should work with partial options', () => {
    const errorWithCode = new TsHelpersError('Error with code', {
      code: TsHelpersErrorCode.VALIDATION_FAILED,
    })

    expect(errorWithCode.code).toBe(TsHelpersErrorCode.VALIDATION_FAILED)
    expect(errorWithCode.data).toBeUndefined()

    const errorWithData = new TsHelpersError('Error with data', {
      data: { field: 'test' },
    })

    expect(errorWithData.code).toBeUndefined()
    expect(errorWithData.data).toEqual({ field: 'test' })
  })

  test('DataError should extend TsHelpersError', () => {
    const error = new DataError(
      'Data processing error',
      TsHelpersErrorCode.DATA_PROCESSING_FAILED,
      { data: { format: 'csv' } }
    )

    expect(error.name).toBe('DataError')
    expect(error.message).toBe('Data processing error')
    expect(error.code).toBe(TsHelpersErrorCode.DATA_PROCESSING_FAILED)
    expect(error.data).toEqual({ data: { format: 'csv' } })
    expect(error instanceof TsHelpersError).toBe(true)
    expect(error instanceof Error).toBe(true)
  })

  test('DataError should work without optional parameters', () => {
    const error = new DataError('Simple data error')

    expect(error.name).toBe('DataError')
    expect(error.message).toBe('Simple data error')
    expect(error.code).toBeUndefined()
    expect(error.data).toBeUndefined()
  })

  test('createValidationError should create standardized validation errors', () => {
    const error = createValidationError('Field is required', 'username', undefined)

    expect(error instanceof TsHelpersError).toBe(true)
    expect(error.message).toBe('Validation failed: Field is required')
    expect(error.code).toBe(TsHelpersErrorCode.VALIDATION_FAILED)
    expect(error.data).toEqual({
      field: 'username',
      value: undefined,
    })
  })

  test('createValidationError should handle different value types', () => {
    const stringError = createValidationError('Invalid string', 'name', 'test')
    expect(stringError.data?.value).toBe('test')

    const numberError = createValidationError('Invalid number', 'age', 25)
    expect(numberError.data?.value).toBe(25)

    const objectError = createValidationError('Invalid object', 'data', { key: 'value' })
    expect(objectError.data?.value).toEqual({ key: 'value' })

    const nullError = createValidationError('Null value', 'field', null)
    expect(nullError.data?.value).toBeNull()
  })

  test('Error codes should be properly defined', () => {
    expect(TsHelpersErrorCode.VALIDATION_FAILED).toBeDefined()
    expect(TsHelpersErrorCode.INVALID_OPERATION).toBeDefined()
    expect(TsHelpersErrorCode.DATA_PROCESSING_FAILED).toBeDefined()
    expect(TsHelpersErrorCode.ENVIRONMENT_NOT_SUPPORTED).toBeDefined()
    expect(TsHelpersErrorCode.UNSUPPORTED_FORMAT).toBeDefined()

    // Should be strings or numbers
    expect(typeof TsHelpersErrorCode.VALIDATION_FAILED).toMatch(/string|number/)
  })
})

describe('Number Utilities', () => {
  test('roundToDecimals should round to specified decimal places', () => {
    expect(roundToDecimals(3.14159, 2)).toBe(3.14)
    expect(roundToDecimals(3.14159, 3)).toBe(3.142)
    expect(roundToDecimals(3.14159, 0)).toBe(3)
    expect(roundToDecimals(3.14159, 4)).toBe(3.1416)
  })

  test('roundToDecimals should handle integer inputs', () => {
    expect(roundToDecimals(5, 2)).toBe(5)
    expect(roundToDecimals(10, 3)).toBe(10)
    expect(roundToDecimals(0, 1)).toBe(0)
  })

  test('roundToDecimals should handle negative numbers', () => {
    expect(roundToDecimals(-3.14159, 2)).toBe(-3.14)
    expect(roundToDecimals(-10.789, 1)).toBe(-10.8)
    expect(roundToDecimals(-0.5, 0)).toBe(-1)
  })

  test('roundToDecimals should handle edge cases', () => {
    expect(roundToDecimals(0.1 + 0.2, 1)).toBe(0.3) // Floating point precision fix
    expect(roundToDecimals(999.999, 2)).toBe(1000)
    expect(roundToDecimals(0.0001, 3)).toBe(0)

    // Very large numbers
    expect(roundToDecimals(1234567.89123, 2)).toBe(1234567.89)

    // Very small numbers
    expect(roundToDecimals(0.000001, 6)).toBe(0.000001)
  })

  test('roundToDecimals should handle zero decimal places', () => {
    expect(roundToDecimals(3.7, 0)).toBe(4)
    expect(roundToDecimals(3.4, 0)).toBe(3)
    expect(roundToDecimals(3.5, 0)).toBe(4) // Standard rounding
  })

  test('roundToDecimals should handle large decimal places', () => {
    const number = 3.123456789
    expect(roundToDecimals(number, 10)).toBe(number)
    expect(roundToDecimals(number, 15)).toBe(number)
  })

  test('roundToDecimals should handle special numeric values', () => {
    expect(isNaN(roundToDecimals(NaN, 2))).toBe(true)
    expect(roundToDecimals(Infinity, 2)).toBe(Infinity)
    expect(roundToDecimals(-Infinity, 2)).toBe(-Infinity)
  })
})

describe('Integration Tests', () => {
  test('errors should work with environment detection', () => {
    global.process = { versions: { node: '18.0.0' } } as any

    try {
      if (!isNode()) {
        throw new TsHelpersError('Not in Node.js environment', {
          code: TsHelpersErrorCode.ENVIRONMENT_NOT_SUPPORTED,
          data: { currentEnv: 'unknown' },
        })
      }
    } catch (_error) {
      // Should not throw since we're mocking Node.js
      expect(true).toBe(false) // This should not execute
    }

    // Test actual error throwing
    delete (global as any).process
    global.window = {} as any
    global.document = {} as any

    expect(() => {
      if (!isNode()) {
        throw new DataError(
          'Node.js required for file operations',
          TsHelpersErrorCode.ENVIRONMENT_NOT_SUPPORTED
        )
      }
    }).toThrow('Node.js required for file operations')
  })

  test('number utilities should work with validation errors', () => {
    const validatePositiveNumber = (value: number): number => {
      if (value < 0) {
        throw createValidationError('Number must be positive', 'value', value)
      }
      return roundToDecimals(value, 2)
    }

    expect(validatePositiveNumber(3.14159)).toBe(3.14)

    expect(() => validatePositiveNumber(-5.2)).toThrow('Validation failed: Number must be positive')

    try {
      validatePositiveNumber(-10)
    } catch (error) {
      expect(error instanceof TsHelpersError).toBe(true)
      expect((error as TsHelpersError).code).toBe(TsHelpersErrorCode.VALIDATION_FAILED)
      expect((error as TsHelpersError).data?.value).toBe(-10)
    }
  })

  test('environment-dependent error handling', () => {
    const checkEnvironmentAndThrow = () => {
      if (!isNode() && !isBrowser()) {
        throw new TsHelpersError('Unknown environment', {
          code: TsHelpersErrorCode.ENVIRONMENT_NOT_SUPPORTED,
          data: {
            hasProcess: typeof global.process !== 'undefined',
            hasWindow: typeof global.window !== 'undefined',
            hasDocument: typeof global.document !== 'undefined',
          },
        })
      }
    }

    // Clear environment
    delete (global as any).process
    delete (global as any).window
    delete (global as any).document

    expect(() => checkEnvironmentAndThrow()).toThrow('Unknown environment')

    // Restore browser environment
    global.window = {} as any
    global.document = {} as any

    expect(() => checkEnvironmentAndThrow()).not.toThrow()
  })
})

describe('Edge Cases and Error Handling', () => {
  test('should handle undefined/null values gracefully', () => {
    // Environment detection with null globals (safe mock to avoid process.listeners error)
    global.process = {
      versions: undefined,
      listeners: originalProcess.listeners?.bind(originalProcess) || (() => []),
    } as any
    expect(isNode()).toBe(false)

    global.window = null as any
    global.document = null as any
    expect(isBrowser()).toBe(false)
  })

  test('should handle error serialization', () => {
    const error = new TsHelpersError('Serializable error', {
      code: TsHelpersErrorCode.VALIDATION_FAILED,
      data: { key: 'value', number: 42 },
    })

    const serialized = JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
      data: error.data,
    })

    expect(serialized).toContain('TsHelpersError')
    expect(serialized).toContain('Serializable error')
    expect(serialized).toContain('value')
  })

  test('should handle error inheritance chain', () => {
    const dataError = new DataError('Data error')

    expect(dataError instanceof DataError).toBe(true)
    expect(dataError instanceof TsHelpersError).toBe(true)
    expect(dataError instanceof Error).toBe(true)

    // Should have proper prototype chain
    expect(Object.getPrototypeOf(dataError)).toBe(DataError.prototype)
    expect(Object.getPrototypeOf(DataError.prototype)).toBe(TsHelpersError.prototype)
  })

  test('should handle number precision edge cases', () => {
    // Floating point precision issues
    const result1 = roundToDecimals(0.1 + 0.2, 10)
    expect(result1).toBe(0.3)

    // Very small differences
    const result2 = roundToDecimals(1.0000000001, 9)
    expect(result2).toBe(1.0)

    // Rounding edge case
    const result3 = roundToDecimals(2.675, 2)
    expect(result3).toBe(2.68) // or 2.67 depending on implementation
  })

  test('should validate error code consistency', () => {
    const codes = Object.values(TsHelpersErrorCode)
    const uniqueCodes = new Set(codes)

    // All codes should be unique
    expect(codes.length).toBe(uniqueCodes.size)

    // All codes should be non-empty strings or numbers
    codes.forEach(code => {
      expect(code).toBeTruthy()
      expect(typeof code).toMatch(/string|number/)
    })
  })

  test('createCryptoError crea error con código CRYPTO_ERROR', () => {
    const error = createCryptoError('Web Crypto no disponible', 'generateSecureToken', { env: 'browser' })
    expect(error).toBeInstanceOf(TsHelpersError)
    expect(error.code).toBe(TsHelpersErrorCode.CRYPTO_ERROR)
    expect(error.message).toContain('Crypto error')
    expect(error.data?.operation).toBe('generateSecureToken')
    expect(error.data?.details).toEqual({ env: 'browser' })
  })

  test('createCryptoError sin details', () => {
    const error = createCryptoError('Fallo hash', 'hashString')
    expect(error.code).toBe(TsHelpersErrorCode.CRYPTO_ERROR)
    expect(error.data?.details).toBeUndefined()
  })

  test('createMathError crea error con código MATH_ERROR', () => {
    const error = createMathError('División por cero', 'calculateMedian', [])
    expect(error).toBeInstanceOf(TsHelpersError)
    expect(error.code).toBe(TsHelpersErrorCode.MATH_ERROR)
    expect(error.message).toContain('Math error')
    expect(error.data?.operation).toBe('calculateMedian')
    expect(error.data?.input).toEqual([])
  })

  test('createMathError sin input', () => {
    const error = createMathError('NaN detectado', 'sum')
    expect(error.code).toBe(TsHelpersErrorCode.MATH_ERROR)
    expect(error.data?.input).toBeUndefined()
  })
})
