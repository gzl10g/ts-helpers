/**
 * Number utilities
 */

/**
 * Verifica si un valor es numéricamente válido o convertible a número.
 * Acepta números y cadenas que representan números válidos.
 * @param value - El valor a verificar.
 * @returns true si el valor es numéricamente válido, false en caso contrario.
 * @example
 * ```ts
 * isNumericValue(5) // true
 * isNumericValue("5") // true
 * isNumericValue("12.34") // true
 * isNumericValue("-42") // true
 * isNumericValue("abc") // false
 * isNumericValue("") // false
 * isNumericValue(" ") // false
 * isNumericValue(null) // false
 * isNumericValue(undefined) // false
 * isNumericValue(NaN) // false
 * isNumericValue(Infinity) // false
 * ```
 */
export function isNumericValue(value: unknown): value is number {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return !isNaN(value) && isFinite(value)
  if (typeof value === 'string') return value.trim() !== '' && !isNaN(Number(value))
  return false
}

/**
 * Rounds a number to a specified number of decimal places
 * @param num - The number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns The rounded number
 * @example
 * ```ts
 * roundToDecimals(3.14159, 2) // 3.14
 * roundToDecimals(-2.7182, 3) // -2.718
 * ```
 */
export function roundToDecimals(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  // Use sign-aware rounding to handle negative numbers correctly
  return num >= 0 ? Math.round(num * factor) / factor : -Math.round(Math.abs(num) * factor) / factor
}
