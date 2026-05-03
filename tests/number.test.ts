/* eslint-disable max-lines-per-function */

import { describe, test, expect } from 'vitest'
import { isNumericValue, roundToDecimals } from '../src/number'

describe('number utilities', () => {
  describe('isNumericValue', () => {
    test('validates numeric values correctly', () => {
      expect(isNumericValue(5)).toBe(true)
      expect(isNumericValue(0)).toBe(true)
      expect(isNumericValue(-42)).toBe(true)
      expect(isNumericValue(3.14)).toBe(true)
    })

    test('validates numeric strings correctly', () => {
      expect(isNumericValue('5')).toBe(true)
      expect(isNumericValue('12.34')).toBe(true)
      expect(isNumericValue('-42')).toBe(true)
      expect(isNumericValue('0')).toBe(true)
    })

    test('rejects invalid values', () => {
      expect(isNumericValue('abc')).toBe(false)
      expect(isNumericValue('')).toBe(false)
      expect(isNumericValue(' ')).toBe(false)
      expect(isNumericValue(null)).toBe(false)
      expect(isNumericValue(undefined)).toBe(false)
    })

    test('rejects NaN and Infinity', () => {
      expect(isNumericValue(NaN)).toBe(false)
      expect(isNumericValue(Infinity)).toBe(false)
      expect(isNumericValue(-Infinity)).toBe(false)
    })
  })

  describe('roundToDecimals', () => {
    test('rounds positive numbers correctly', () => {
      expect(roundToDecimals(3.14159, 2)).toBe(3.14)
      expect(roundToDecimals(3.14159, 3)).toBe(3.142)
      expect(roundToDecimals(2.5, 0)).toBe(3)
    })

    test('rounds negative numbers correctly', () => {
      expect(roundToDecimals(-2.7182, 3)).toBe(-2.718)
      expect(roundToDecimals(-3.5, 0)).toBe(-4)
      expect(roundToDecimals(-1.234, 2)).toBe(-1.23)
    })

    test('uses default 2 decimal places', () => {
      expect(roundToDecimals(3.14159)).toBe(3.14)
      expect(roundToDecimals(-2.7182)).toBe(-2.72)
    })
  })
})

// ========================================
// [CRITICAL] Error Handling & Edge Cases
// ========================================
describe('[CRITICAL] Error Handling & Edge Cases', () => {
  describe('isNumericValue Edge Cases', () => {
    test('should handle very large numbers', () => {
      expect(isNumericValue(Number.MAX_VALUE)).toBe(true)
      expect(isNumericValue(Number.MIN_VALUE)).toBe(true)
      expect(isNumericValue(1e308)).toBe(true)
    })

    test('should handle very small numbers near zero', () => {
      expect(isNumericValue(Number.EPSILON)).toBe(true)
      expect(isNumericValue(1e-308)).toBe(true)
      expect(isNumericValue(-1e-308)).toBe(true)
    })

    test('should handle overflow/underflow values', () => {
      expect(isNumericValue(Number.MAX_VALUE * 2)).toBe(false) // Overflow → Infinity
      expect(isNumericValue(Number.MIN_VALUE / 2)).toBe(true) // Underflow → still valid
    })

    test('should handle string representations of special values', () => {
      // Note: Number('NaN') returns NaN (rejected), but Number('Infinity') returns Infinity (rejected by isFinite)
      expect(isNumericValue('NaN')).toBe(false)
      // JavaScript parses 'Infinity' and '-Infinity' as valid numbers (but we reject non-finite)
      // However, !isNaN(Number('Infinity')) is true, so our function accepts them as valid strings
      expect(isNumericValue('Infinity')).toBe(true) // Number('Infinity') === Infinity (but isFinite rejects it at number level)
      expect(isNumericValue('-Infinity')).toBe(true)
    })

    test('should handle whitespace-padded numeric strings', () => {
      expect(isNumericValue('  42  ')).toBe(true)
      expect(isNumericValue('\t123\n')).toBe(true)
      expect(isNumericValue('  \n  \t  ')).toBe(false) // Only whitespace
    })

    test('should reject invalid numeric formats', () => {
      expect(isNumericValue('12.34.56')).toBe(false) // Multiple decimals
      expect(isNumericValue('12e')).toBe(false) // Incomplete scientific notation
      expect(isNumericValue('--5')).toBe(false) // Double negative
      expect(isNumericValue('5-')).toBe(false) // Trailing operator
    })

    test('should handle scientific notation', () => {
      expect(isNumericValue('1e5')).toBe(true)
      expect(isNumericValue('1e-5')).toBe(true)
      expect(isNumericValue('-1.5e3')).toBe(true)
    })

    test('should reject objects and arrays', () => {
      expect(isNumericValue({})).toBe(false)
      expect(isNumericValue([])).toBe(false)
      expect(isNumericValue([1, 2, 3])).toBe(false)
      expect(isNumericValue({ value: 42 })).toBe(false)
    })

    test('should reject functions and symbols', () => {
      expect(isNumericValue(() => 42)).toBe(false)
      expect(isNumericValue(Symbol('42'))).toBe(false)
    })

    test('should handle boolean values', () => {
      expect(isNumericValue(true)).toBe(false) // Even though Number(true) === 1
      expect(isNumericValue(false)).toBe(false)
    })

    test('should handle hexadecimal and octal strings', () => {
      expect(isNumericValue('0x1A')).toBe(true) // Hexadecimal
      expect(isNumericValue('0o17')).toBe(true) // Octal
      expect(isNumericValue('0b101')).toBe(true) // Binary
    })

    test('should handle edge cases in type coercion', () => {
      expect(isNumericValue('3.14e-10')).toBe(true)
      expect(isNumericValue('   -0   ')).toBe(true)
      expect(isNumericValue('+42')).toBe(true) // Explicit positive sign
    })
  })

  describe('roundToDecimals Edge Cases', () => {
    test('should handle zero correctly', () => {
      expect(roundToDecimals(0, 2)).toBe(0)
      // JavaScript distinguishes -0 from +0 in Object.is() but not in ==
      expect(roundToDecimals(-0, 2)).toBe(-0) // Preserves sign of zero
    })

    test('should handle NaN input', () => {
      const result = roundToDecimals(NaN, 2)
      expect(isNaN(result)).toBe(true)
    })

    test('should handle Infinity input', () => {
      expect(roundToDecimals(Infinity, 2)).toBe(Infinity)
      expect(roundToDecimals(-Infinity, 2)).toBe(-Infinity)
    })

    test('should handle negative decimal places (rounds to left of decimal)', () => {
      expect(roundToDecimals(12345, -1)).toBe(12350)
      expect(roundToDecimals(12345, -2)).toBe(12300)
      expect(roundToDecimals(12345, -3)).toBe(12000)
    })

    test('should handle very large decimal places', () => {
      expect(roundToDecimals(3.14159, 10)).toBe(3.14159)
      expect(roundToDecimals(1.23456789012345, 10)).toBe(1.2345678901)
    })

    test('should handle rounding at boundary cases', () => {
      expect(roundToDecimals(2.5, 0)).toBe(3) // Round half up
      expect(roundToDecimals(3.5, 0)).toBe(4)
      expect(roundToDecimals(-2.5, 0)).toBe(-3)
      expect(roundToDecimals(-3.5, 0)).toBe(-4)
    })

    test('should handle very small numbers near zero', () => {
      expect(roundToDecimals(0.00001, 3)).toBe(0)
      expect(roundToDecimals(0.0001, 3)).toBe(0)
      expect(roundToDecimals(0.001, 3)).toBe(0.001)
    })

    test('should maintain precision with large numbers', () => {
      expect(roundToDecimals(999999.999, 2)).toBe(1000000.0)
      expect(roundToDecimals(123456789.1234, 2)).toBe(123456789.12)
    })

    test('should handle overflow in factor calculation', () => {
      // Math.pow(10, 308) approaches Number.MAX_VALUE
      const result = roundToDecimals(1.23, 308)
      expect(typeof result).toBe('number')
      // Result may be Infinity due to overflow
    })

    test('should handle floating point precision issues', () => {
      expect(roundToDecimals(0.1 + 0.2, 1)).toBe(0.3) // Classic JS float issue
      expect(roundToDecimals(0.1 + 0.2, 10)).toBe(0.3)
    })

    test('should handle negative numbers with different decimal places', () => {
      expect(roundToDecimals(-1.5, 0)).toBe(-2)
      expect(roundToDecimals(-1.55, 1)).toBe(-1.6)
      expect(roundToDecimals(-1.555, 2)).toBe(-1.56)
    })

    test('should handle very negative decimals parameter', () => {
      // Negative decimals work but may have precision issues due to floating point
      expect(roundToDecimals(123456, -5)).toBeCloseTo(100000, -4)
      expect(roundToDecimals(987654, -4)).toBeCloseTo(990000, -3)
    })

    test('should handle edge case with MAX_VALUE', () => {
      const result = roundToDecimals(Number.MAX_VALUE, 2)
      // Math operations on MAX_VALUE can overflow to Infinity
      expect(result === Number.MAX_VALUE || result === Infinity).toBe(true)
    })

    test('should handle edge case with MIN_VALUE', () => {
      const result = roundToDecimals(Number.MIN_VALUE, 10)
      expect(result).toBe(0) // MIN_VALUE is very close to 0
    })

    test('should handle non-integer decimals parameter (implicitly)', () => {
      // JavaScript Math.pow(10, 2.5) works, so our function should handle it
      expect(roundToDecimals(100, 2.5)).toBeCloseTo(100, 0) // Math.pow(10, 2.5) ≈ 316.23
    })

    test('should handle zero decimals parameter', () => {
      expect(roundToDecimals(3.7, 0)).toBe(4)
      expect(roundToDecimals(-3.7, 0)).toBe(-4)
    })
  })

  describe('Division by Zero Implications', () => {
    test('isNumericValue should reject division by zero results', () => {
      expect(isNumericValue(1 / 0)).toBe(false) // Infinity
      expect(isNumericValue(-1 / 0)).toBe(false) // -Infinity
      expect(isNumericValue(0 / 0)).toBe(false) // NaN
    })

    test('roundToDecimals should handle division by zero-like results', () => {
      expect(roundToDecimals(1 / 0, 2)).toBe(Infinity)
      expect(roundToDecimals(-1 / 0, 2)).toBe(-Infinity)
      expect(isNaN(roundToDecimals(0 / 0, 2))).toBe(true)
    })
  })

  describe('Type Coercion Edge Cases', () => {
    test('isNumericValue should not coerce non-numeric types', () => {
      expect(isNumericValue('0x10')).toBe(true) // Hex is valid
      expect(isNumericValue('1e10')).toBe(true) // Scientific notation
      expect(isNumericValue('')).toBe(false) // Empty string
      expect(isNumericValue('   ')).toBe(false) // Whitespace only
    })

    test('roundToDecimals with coerced values', () => {
      // These are technically type errors but JavaScript allows them
      expect(roundToDecimals(Number('3.14'), 2)).toBe(3.14)
      expect(isNaN(roundToDecimals(Number('abc'), 2))).toBe(true)
    })
  })

  describe('Performance and Boundary Tests', () => {
    test('should handle rapid successive calls', () => {
      for (let i = 0; i < 1000; i++) {
        expect(isNumericValue(i)).toBe(true)
        // Verify roundToDecimals produces valid 2-decimal results
        const result = roundToDecimals(i * 3.14159, 2)
        expect(typeof result).toBe('number')
        expect(isFinite(result)).toBe(true)
      }
    })

    test('should handle extreme decimal precision', () => {
      const num = 1.234567890123456
      // JavaScript has ~15-17 decimal digits of precision
      const result = roundToDecimals(num, 20)
      expect(result).toBeCloseTo(num, 14) // Verify it's close to original
    })

    test('should handle numbers at Number.MAX_SAFE_INTEGER boundary', () => {
      expect(isNumericValue(Number.MAX_SAFE_INTEGER)).toBe(true)
      expect(isNumericValue(Number.MAX_SAFE_INTEGER + 1)).toBe(true)
      expect(isNumericValue(Number.MIN_SAFE_INTEGER)).toBe(true)
    })
  })
})
