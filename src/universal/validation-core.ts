/**
 * Core validation utilities - Universal (Browser + Node.js compatible)
 * NO crypto dependencies - safe for all environments
 */

import validator from 'validator'

// =============================================================================
// RANDOM GENERATORS (crypto-free)
// =============================================================================

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
// GENERATORS - Random data generators (crypto-free)
// =============================================================================

/**
 * Generates a random integer between min and max (inclusive)
 * @param min - Minimum value (default: 0)
 * @param max - Maximum value (default: 100)
 * @returns Random integer between min and max
 * @example
 * ```ts
 * const dice = generateRandomInteger(1, 6) // 1, 2, 3, 4, 5, or 6
 * const percent = generateRandomInteger(0, 100) // 0 to 100
 * const id = generateRandomInteger(1000, 9999) // 4-digit ID
 * ```
 */
export const generateRandomInteger = (min = 0, max = 100): number => {
  return randomInteger(min, max)
}

/**
 * Generates a random alphabetic string (letters only)
 * @param options - Configuration object
 * @param options.length - Length of the string (default: 10)
 * @param options.casing - Case transformation: 'upper', 'lower', or undefined
 * @returns Random alphabetic string
 * @example
 * ```ts
 * const name = generateAlphaString({ length: 8 }) // "AbCdEfGh"
 * const upper = generateAlphaString({ length: 5, casing: 'upper' }) // "ABCDE"
 * const lower = generateAlphaString({ length: 3, casing: 'lower' }) // "abc"
 * ```
 */
export const generateAlphaString = (
  options: { length?: number; casing?: 'upper' | 'lower' | undefined } = {}
): string => {
  const { length = 10, casing = undefined } = options
  return randomAlphaString(length, casing)
}

/**
 * Generates a random alphanumeric string (letters and numbers)
 * @param options - Configuration object
 * @param options.length - Length of the string (default: 10)
 * @param options.casing - Case transformation: 'upper', 'lower', or undefined
 * @returns Random alphanumeric string
 * @example
 * ```ts
 * const token = generateAlphaNumericString({ length: 12 }) // "aB3cD4eF5gH6"
 * const code = generateAlphaNumericString({ length: 6, casing: 'upper' }) // "A1B2C3"
 * const key = generateAlphaNumericString({ length: 8, casing: 'lower' }) // "a1b2c3d4"
 * ```
 */
export const generateAlphaNumericString = (
  options: { length?: number; casing?: 'upper' | 'lower' | undefined } = {}
): string => {
  const { length = 10, casing = undefined } = options
  return randomAlphaNumericString(length, casing)
}

/**
 * Generates a random complex string with all characters (letters, numbers, symbols)
 * @param options - Configuration object
 * @param options.length - Length of the string (default: 10)
 * @param options.casing - Case transformation (currently not applied to symbols)
 * @returns Random complex string
 * @example
 * ```ts
 * const password = generateComplexString({ length: 16 }) // "aB3#cD4$eF5%gH6"
 * const secret = generateComplexString({ length: 32 }) // Complex 32-char string
 * const temp = generateComplexString() // 10 characters by default
 * ```
 */
export const generateComplexString = (
  options: { length?: number; casing?: 'upper' | 'lower' | undefined } = {}
): string => {
  const { length = 10, casing: _casing = undefined } = options
  return randomString(length)
}

/**
 * Generates a username from an email address
 * @param email - Email address to extract username from
 * @param randomDigits - Number of random digits to append (default: 1)
 * @returns Username derived from email with random suffix
 * @example
 * ```ts
 * const user1 = generateUsernameFromEmail('john.doe@example.com', 2) // "johndoe47"
 * const user2 = generateUsernameFromEmail('maria-garcia@test.org', 3) // "mariagarcia823"
 * const fallback = generateUsernameFromEmail('invalid-email', 2) // "user42"
 * ```
 */
export const generateUsernameFromEmail = (email: string, randomDigits = 1): string => {
  if (!email || !email.includes('@'))
    return `user${Math.floor(Math.random() * Math.pow(10, randomDigits))}`

  const localPart = email.split('@')[0]
  const username = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 12)

  const randomSuffix = Math.floor(Math.random() * Math.pow(10, randomDigits))
  return username + randomSuffix
}

/**
 * Generates a random username with adjective + noun pattern
 * @param separator - Character to separate adjective and noun (default: '')
 * @param randomDigits - Number of random digits to append (default: 1)
 * @param length - Maximum length of username (default: 8)
 * @returns Random username like "coolcat5" or "brave_wolf3"
 * @example
 * ```ts
 * const user1 = generateUsername() // "coolcat5"
 * const user2 = generateUsername('_', 2) // "brave_wolf83"
 * const user3 = generateUsername('-', 3, 15) // "smart-eagle247"
 * ```
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
// SPANISH GENERATORS
// =============================================================================

/**
 * Generates a valid Spanish NIF (Número de Identificación Fiscal)
 * @returns A valid NIF string in format '12345678Z'
 * @example
 * ```ts
 * const nif1 = generateSpanishNIF() // "87654321T"
 * const nif2 = generateSpanishNIF() // "12345678Z"
 *
 * // Verify it's valid
 * const nif = generateSpanishNIF()
 * console.log(validateNIF(nif)) // true
 * ```
 */
export const generateSpanishNIF = (): string => {
  const number = randomInteger(10000000, 99999999)
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const letter = letters[number % 23]
  return `${number}${letter}`
}

/**
 * Generates a valid Spanish NIE (Número de Identidad de Extranjero)
 * @returns A valid NIE string in format 'X1234567L'
 * @example
 * ```ts
 * const nie1 = generateSpanishNIE() // "X1234567L"
 * const nie2 = generateSpanishNIE() // "Y9876543R"
 * const nie3 = generateSpanishNIE() // "Z2468135T"
 *
 * // Verify it's valid
 * const nie = generateSpanishNIE()
 * console.log(isValidNIE(nie)) // true
 * ```
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
 * Generates a valid Spanish CIF (Código de Identificación Fiscal)
 * @returns A valid CIF string in format 'A12345674' or 'B87654321'
 * @example
 * ```ts
 * const cif1 = generateSpanishCIF() // "A12345674"
 * const cif2 = generateSpanishCIF() // "B87654321"
 * const cif3 = generateSpanishCIF() // "G28456789"
 *
 * // Verify it's valid
 * const cif = generateSpanishCIF()
 * console.log(isValidCIF(cif)) // true
 *
 * // Different organization types
 * // A,B,E,H = Sociedades Anónimas/Limitadas
 * // G,U = Fundaciones, asociaciones
 * // N,P,Q,R,S,W = Organismos públicos
 * ```
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

export const generateSpanishIBAN = (): string => {
  const bankCode = randomString(4, '0123456789')
  const branchCode = randomString(4, '0123456789')
  const controlDigits = randomString(2, '0123456789')
  const accountNumber = randomString(10, '0123456789')

  // Calculate IBAN check digits
  const accountPart = `${bankCode}${branchCode}${controlDigits}${accountNumber}`
  const rearranged = `${accountPart}142800`

  // Calculate mod 97
  const checkDigits = String(98n - (BigInt(rearranged) % 97n)).padStart(2, '0')

  return `ES${checkDigits}${bankCode}${branchCode}${controlDigits}${accountNumber}`
}

// =============================================================================
// GENERAL GENERATORS
// =============================================================================

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

  let password = requiredChars
  const remainingLength = targetLength - requiredChars.length

  for (let i = 0; i < remainingLength; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

export const generateHexColor = (shortFormat?: boolean): string => {
  const hexChars = '0123456789ABCDEF'
  const useShortFormat = shortFormat !== undefined ? shortFormat : randomBool()

  if (useShortFormat) {
    const r = pickone(hexChars.split(''))
    const g = pickone(hexChars.split(''))
    const b = pickone(hexChars.split(''))
    return `#${r}${g}${b}`
  } else {
    const color = randomString(6, hexChars)
    return `#${color}`
  }
}

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Validates a Spanish NIF (Número de Identificación Fiscal)
 * @param nif - The NIF string to validate
 * @returns true if the NIF is valid, false otherwise
 * @example
 * ```ts
 * console.log(isValidNIF('12345678Z')) // true
 * console.log(isValidNIF('87654321T')) // true
 * console.log(isValidNIF('12345678A')) // false (wrong letter)
 * console.log(isValidNIF('1234567Z'))  // false (wrong length)
 * console.log(isValidNIF(''))          // false (empty)
 *
 * // Case insensitive and handles whitespace
 * console.log(isValidNIF('  12345678z  ')) // true
 * ```
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
 * Alias for isValidNIF - validates a Spanish NIF
 * @param nif - The NIF string to validate
 * @returns true if the NIF is valid, false otherwise
 * @example
 * ```ts
 * console.log(validateNIF('12345678Z')) // true
 * // Same functionality as isValidNIF
 * ```
 */
export const validateNIF = isValidNIF

/**
 * Validates a Spanish NIE (Número de Identidad de Extranjero)
 * @param nie - The NIE string to validate
 * @returns true if the NIE is valid, false otherwise
 * @example
 * ```ts
 * console.log(isValidNIE('X1234567L')) // true
 * console.log(isValidNIE('Y9876543R')) // true
 * console.log(isValidNIE('Z2468135T')) // true
 * console.log(isValidNIE('X1234567A')) // false (wrong letter)
 * console.log(isValidNIE('W1234567L')) // false (invalid prefix)
 * console.log(isValidNIE('X123456L'))  // false (wrong length)
 *
 * // Case insensitive and handles whitespace
 * console.log(isValidNIE('  x1234567l  ')) // true
 * ```
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

export const isValidCIF = (cif: string): boolean => {
  if (!cif || typeof cif !== 'string') return false

  const cleanCif = cif.trim().toUpperCase()
  const cifRegex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/

  if (!cifRegex.test(cleanCif)) return false

  const organizationType = cleanCif.charAt(0)
  const number = cleanCif.substring(1, 8)
  const control = cleanCif.charAt(8)

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

  if (['N', 'P', 'Q', 'R', 'S', 'W'].includes(organizationType)) {
    return control === controlLetter
  } else {
    return control === controlDigit.toString() || control === controlLetter
  }
}

export const isValidSpanishPostalCode = (postalCode: string): boolean => {
  if (!postalCode || typeof postalCode !== 'string') return false

  const cleanCode = postalCode.trim()
  const postalCodeRegex = /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/

  return postalCodeRegex.test(cleanCode)
}

export const isValidSpanishPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false

  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  const phoneRegex = /^(?:\+34|0034|34)?([679][0-9]{8})$/

  return phoneRegex.test(cleanPhone)
}

export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false
  return validator.isEmail(email)
}

export const isValidURL = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false

  if (validator.isURL(url, { require_protocol: true })) {
    return true
  }

  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export const isValidJSON = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export const isValidSpanishIBAN = (iban: string): boolean => {
  if (!iban || typeof iban !== 'string') return false

  const cleanIban = iban.replace(/\s/g, '').toUpperCase()
  const ibanRegex = /^ES[0-9]{22}$/

  if (!ibanRegex.test(cleanIban)) return false

  const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4)
  const numericString = rearranged.replace(/[A-Z]/g, letter => {
    return (letter.charCodeAt(0) - 55).toString()
  })

  let remainder = 0
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i])) % 97
  }

  return remainder === 1
}
