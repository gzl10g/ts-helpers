/**
 * Property-based tests for Spanish validators using fast-check.
 * Covers NIF, NIE, CIF, and IBAN with algorithmic invariants.
 */

import { describe, test } from 'vitest'
import * as fc from 'fast-check'
import {
  generateSpanishNIF,
  generateSpanishNIE,
  generateSpanishCIF,
  generateSpanishIBAN,
  isValidNIF,
  isValidNIE,
  isValidCIF,
  isValidSpanishIBAN,
} from '../src/universal/validation-core'

const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

// ─────────────────────────────────────────────────────────────────────────────
// NIF
// ─────────────────────────────────────────────────────────────────────────────

describe('[Property] NIF', () => {
  test('generate → isValid holds for any run', () => {
    fc.assert(
      fc.property(fc.nat(), () => isValidNIF(generateSpanishNIF())),
      { numRuns: 500 }
    )
  })

  test('constructing NIF with correct mod-23 letter always passes', () => {
    fc.assert(
      fc.property(
        // 1..99_999_998 avoids leading-zero oddities and NIF reserved ranges
        fc.integer({ min: 1, max: 99_999_998 }),
        num => {
          const digits = String(num).padStart(8, '0')
          const letter = NIF_LETTERS[num % 23]
          return isValidNIF(`${digits}${letter}`)
        }
      ),
      { numRuns: 500 }
    )
  })

  test('substituting any wrong letter makes NIF invalid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99_999_998 }),
        fc.integer({ min: 1, max: 22 }), // 1..22 guarantees offset ≠ 0 (mod 23)
        (num, offset) => {
          const digits = String(num).padStart(8, '0')
          const wrongIdx = (num + offset) % 23
          const wrongLetter = NIF_LETTERS[wrongIdx]
          return !isValidNIF(`${digits}${wrongLetter}`)
        }
      ),
      { numRuns: 400 }
    )
  })

  test('random strings without correct structure never validate', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 15 })
          .filter(s => !/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(s)),
        s => !isValidNIF(s)
      ),
      { numRuns: 400 }
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NIE
// ─────────────────────────────────────────────────────────────────────────────

describe('[Property] NIE', () => {
  test('generate → isValid holds for any run', () => {
    fc.assert(
      fc.property(fc.nat(), () => isValidNIE(generateSpanishNIE())),
      { numRuns: 500 }
    )
  })

  test('constructing NIE with correct mod-23 letter always passes (all prefixes)', () => {
    const prefixValues: Record<string, number> = { X: 0, Y: 1, Z: 2 }

    fc.assert(
      fc.property(
        fc.constantFrom('X', 'Y', 'Z') as fc.Arbitrary<'X' | 'Y' | 'Z'>,
        fc.integer({ min: 0, max: 9_999_999 }),
        (prefix, num) => {
          const digits = String(num).padStart(7, '0')
          const calcNum = prefixValues[prefix] * 10_000_000 + num
          const letter = NIF_LETTERS[calcNum % 23]
          return isValidNIE(`${prefix}${digits}${letter}`)
        }
      ),
      { numRuns: 500 }
    )
  })

  test('wrong letter in NIE always fails', () => {
    const prefixValues: Record<string, number> = { X: 0, Y: 1, Z: 2 }

    fc.assert(
      fc.property(
        fc.constantFrom('X', 'Y', 'Z') as fc.Arbitrary<'X' | 'Y' | 'Z'>,
        fc.integer({ min: 0, max: 9_999_999 }),
        fc.integer({ min: 1, max: 22 }),
        (prefix, num, offset) => {
          const digits = String(num).padStart(7, '0')
          const calcNum = prefixValues[prefix] * 10_000_000 + num
          const wrongIdx = (calcNum + offset) % 23
          const wrongLetter = NIF_LETTERS[wrongIdx]
          return !isValidNIE(`${prefix}${digits}${wrongLetter}`)
        }
      ),
      { numRuns: 400 }
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CIF
// ─────────────────────────────────────────────────────────────────────────────

describe('[Property] CIF', () => {
  test('generate → isValid holds for any run', () => {
    fc.assert(
      fc.property(fc.nat(), () => isValidCIF(generateSpanishCIF())),
      { numRuns: 500 }
    )
  })

  test('CIF with wrong control character fails for NPQRSW types', () => {
    // For org types that must use a letter, a digit control fails
    fc.assert(
      fc.property(
        fc.constantFrom('N', 'P', 'Q', 'R', 'S', 'W'),
        fc.integer({ min: 1_000_000, max: 9_999_999 }),
        (orgType, num) => {
          const digits = String(num)
          // Calculate correct control letter
          let sum = 0
          for (let i = 0; i < 7; i++) {
            let d = parseInt(digits[i])
            if (i % 2 === 0) {
              d *= 2
              if (d > 9) d = Math.floor(d / 10) + (d % 10)
            }
            sum += d
          }
          const controlDigit = (10 - (sum % 10)) % 10
          // Force a digit control instead of the required letter
          const cifWithDigit = `${orgType}${digits}${controlDigit}`
          // For NPQRSW, digit control is always invalid
          return !isValidCIF(cifWithDigit)
        }
      ),
      { numRuns: 300 }
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// IBAN
// ─────────────────────────────────────────────────────────────────────────────

describe('[Property] IBAN', () => {
  test('generate → isValid holds for any run', () => {
    fc.assert(
      fc.property(fc.nat(), () => isValidSpanishIBAN(generateSpanishIBAN())),
      { numRuns: 500 }
    )
  })

  test('generated IBAN satisfies mod-97 = 1 (ISO 13616)', () => {
    // Rearrange: move 'ES' + check digits to end, then mod 97 must equal 1
    // E=14, S=28 → 'ES' becomes '1428'
    fc.assert(
      fc.property(fc.nat(), () => {
        const iban = generateSpanishIBAN()
        const checkDigits = iban.substring(2, 4)
        const bban = iban.substring(4)
        const rearranged = `${bban}1428${checkDigits}`
        return BigInt(rearranged) % 97n === 1n
      }),
      { numRuns: 300 }
    )
  })

  test('arbitrary strings starting with ES but wrong check digits fail', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[0-9]{20}$/), // 20 random BBAN digits
        fc.integer({ min: 0, max: 96 }), // arbitrary check digits
        (bban, check) => {
          const checkStr = String(check).padStart(2, '0')
          const rearranged = `${bban}1428${checkStr}`
          const mod = Number(BigInt(rearranged) % 97n)
          const iban = `ES${checkStr}${bban}`
          // Only passes if mod happens to be 1 — extremely rare (≈1/97)
          if (mod === 1) return isValidSpanishIBAN(iban) // should be true
          return !isValidSpanishIBAN(iban) // should be false
        }
      ),
      { numRuns: 400 }
    )
  })
})
