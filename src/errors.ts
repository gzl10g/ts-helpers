/**
 * Error handling utilities with specific error types and codes
 * Provides structured error handling for validation, data processing, and environment issues
 */

/**
 * Error codes for different failure scenarios
 * @example
 * ```ts
 * // Using error codes for type-safe error handling
 * try {
 *   validateNIF('invalid')
 * } catch (error) {
 *   if (error.code === TsHelpersErrorCode.VALIDATION_FAILED) {
 *     console.log('Validation error:', error.data)
 *   }
 * }
 * ```
 */
export const TsHelpersErrorCode = {
  /** Validation of input data failed (NIF, email, etc.) */
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  /** Error processing data (CSV, JSON, aggregations, etc.) */
  DATA_PROCESSING_FAILED: 'DATA_PROCESSING_FAILED',
  /** Current environment doesn't support the operation */
  ENVIRONMENT_NOT_SUPPORTED: 'ENVIRONMENT_NOT_SUPPORTED',
  /** File format not supported for import/export */
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  /** File system operation failed */
  FILE_ERROR: 'FILE_ERROR',
  /** Network or fetch operation failed */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** Invalid operation or function call */
  INVALID_OPERATION: 'INVALID_OPERATION',
  /** Crypto operation failed (hash, token generation) */
  CRYPTO_ERROR: 'CRYPTO_ERROR',
  /** Math calculation failed (invalid input, division by zero) */
  MATH_ERROR: 'MATH_ERROR',
  /** Generic unknown error */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type TsHelpersErrorCode = (typeof TsHelpersErrorCode)[keyof typeof TsHelpersErrorCode]

/**
 * Options for creating TsHelpersError instances
 */
export interface TsHelpersErrorOptions {
  /** Specific error code for categorization */
  code?: TsHelpersErrorCode
  /** Additional data about the error context */
  data?: unknown
  /** Original error that caused this error */
  cause?: unknown
}

/**
 * Main error class for @g10/ts-helpers with structured error information
 * @example
 * ```ts
 * // Creating structured errors
 * throw new TsHelpersError('Invalid NIF format', {
 *   code: TsHelpersErrorCode.VALIDATION_FAILED,
 *   data: { input: '12345', expected: '8 digits + letter' }
 * })
 *
 * // Error handling with type checking
 * try {
 *   someOperation()
 * } catch (error) {
 *   if (error instanceof TsHelpersError) {
 *     console.log('Error code:', error.code)
 *     console.log('Error data:', error.data)
 *   }
 * }
 * ```
 */
export class TsHelpersError extends Error {
  public readonly code?: TsHelpersErrorCode
  public readonly data?: unknown
  public readonly cause?: unknown

  constructor(message: string, options: TsHelpersErrorOptions = {}) {
    super(message)
    this.name = 'TsHelpersError'
    this.code = options.code
    this.data = options.data
    this.cause = options.cause

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TsHelpersError)
    }
  }
}

/**
 * Specialized error class for data processing operations
 * @example
 * ```ts
 * // Data processing errors
 * throw new DataError(
 *   'Failed to parse CSV',
 *   TsHelpersErrorCode.DATA_PROCESSING_FAILED,
 *   { line: 5, column: 'amount' }
 * )
 * ```
 */
export class DataError extends TsHelpersError {
  constructor(message: string, code?: TsHelpersErrorCode, data?: unknown) {
    super(message, { code, data })
    this.name = 'DataError'
  }
}

/**
 * Creates a validation error with structured information
 * @param message - Descriptive error message
 * @param field - Field name that failed validation
 * @param value - Value that failed validation
 * @returns TsHelpersError with validation context
 * @example
 * ```ts
 * // Using in validation functions
 * if (!isValidEmail(email)) {
 *   throw createValidationError('Invalid email format', 'email', email)
 * }
 *
 * // Error contains structured data
 * // error.code === TsHelpersErrorCode.VALIDATION_FAILED
 * // error.data === { field: 'email', value: 'invalid-email' }
 * ```
 */
export function createValidationError(
  message: string,
  field: string,
  value: unknown
): TsHelpersError {
  return new TsHelpersError(`Validation failed: ${message}`, {
    code: TsHelpersErrorCode.VALIDATION_FAILED,
    data: { field, value },
  })
}

/**
 * Creates a crypto operation error
 * @param message - Descriptive error message
 * @param operation - Crypto operation that failed
 * @param details - Additional error details
 * @returns TsHelpersError with crypto context
 * @example
 * ```ts
 * // Using in crypto functions
 * if (!crypto.getRandomValues) {
 *   throw createCryptoError('Web Crypto API not available', 'generateSecureToken', {
 *     environment: 'browser',
 *     fallback: 'Math.random'
 *   })
 * }
 * ```
 */
export function createCryptoError(
  message: string,
  operation: string,
  details?: unknown
): TsHelpersError {
  return new TsHelpersError(`Crypto error: ${message}`, {
    code: TsHelpersErrorCode.CRYPTO_ERROR,
    data: { operation, details },
  })
}

/**
 * Creates a math calculation error
 * @param message - Descriptive error message
 * @param operation - Math operation that failed
 * @param input - Input data that caused the error
 * @returns TsHelpersError with math context
 * @example
 * ```ts
 * // Using in math functions
 * if (values.length === 0) {
 *   throw createMathError('Cannot calculate median of empty array', 'calculateMedian', values)
 * }
 * ```
 */
export function createMathError(
  message: string,
  operation: string,
  input?: unknown
): TsHelpersError {
  return new TsHelpersError(`Math error: ${message}`, {
    code: TsHelpersErrorCode.MATH_ERROR,
    data: { operation, input },
  })
}
