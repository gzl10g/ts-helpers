/**
 * Universal crypto capabilities detection utilities
 * Safe for all environments with comprehensive fallbacks
 */

import { isBrowserEnvironment, isNodeEnvironment } from '../environment'

// Global type declarations for Worker environment (avoid importing lib.webworker)
declare const importScripts: any
declare const self: any

/**
 * Enhanced browser environment detection with additional checks
 * @returns true if running in a browser environment
 * @example
 * ```ts
 * if (isBrowserEnv()) {
 *   console.log('Running in browser')
 * }
 * ```
 */
export const isBrowserEnv = isBrowserEnvironment

/**
 * Enhanced Node.js environment detection with additional checks
 * @returns true if running in Node.js environment
 * @example
 * ```ts
 * if (isNodeEnv()) {
 *   console.log('Running in Node.js')
 * }
 * ```
 */
export const isNodeEnv = isNodeEnvironment

/**
 * Detects if running in Worker environment (Web Workers, Service Workers)
 * @returns true if running in a Worker context
 * @example
 * ```ts
 * if (isWorkerEnvironment()) {
 *   console.log('Running in Web Worker')
 * }
 * ```
 */
export const isWorkerEnvironment = (): boolean => {
  try {
    return (
      typeof importScripts === 'function' &&
      typeof self !== 'undefined' &&
      // Check for Worker global scope without importing types
      'importScripts' in self
    )
  } catch {
    return false
  }
}

/**
 * Detects if Web Crypto API is available in the current environment
 * @returns true if crypto.getRandomValues and crypto.subtle are available
 * @example
 * ```ts
 * if (isWebCryptoAvailable()) {
 *   const array = new Uint8Array(16)
 *   crypto.getRandomValues(array)
 * }
 * ```
 */
export const isWebCryptoAvailable = (): boolean => {
  try {
    return (
      typeof crypto !== 'undefined' &&
      typeof crypto.getRandomValues === 'function' &&
      typeof crypto.subtle === 'object'
    )
  } catch {
    return false
  }
}

/**
 * Detects if Node.js crypto module is available
 * @returns true if Node.js crypto module with hash and random functions is available
 * @example
 * ```ts
 * if (isNodeCryptoAvailable()) {
 *   const crypto = require('crypto')
 *   const hash = crypto.createHash('sha256')
 * }
 * ```
 */
export const isNodeCryptoAvailable = (): boolean => {
  try {
    if (!isNodeEnv()) return false
    const crypto = require('crypto')
    return typeof crypto.createHash === 'function' && typeof crypto.randomBytes === 'function'
  } catch {
    return false
  }
}

/**
 * Gets the current environment type with automatic detection
 * @returns The detected environment type
 * @example
 * ```ts
 * const env = getEnvironmentType()
 * switch (env) {
 *   case 'node': console.log('Server-side'); break
 *   case 'browser': console.log('Client-side'); break
 *   case 'worker': console.log('Worker thread'); break
 *   case 'unknown': console.log('Unknown environment'); break
 * }
 * ```
 */
export const getEnvironmentType = (): 'node' | 'browser' | 'worker' | 'unknown' => {
  if (isNodeEnv()) return 'node'
  if (isWorkerEnvironment()) return 'worker'
  if (isBrowserEnv()) return 'browser'
  return 'unknown'
}

/**
 * Gets available crypto capabilities for the current environment
 * @returns Object containing crypto capability information
 * @example
 * ```ts
 * const caps = getCryptoCapabilities()
 * console.log(caps)
 * // {
 * //   webCrypto: true,
 * //   nodeCrypto: false,
 * //   fallbackOnly: false,
 * //   environment: 'browser'
 * // }
 * ```
 */
export const getCryptoCapabilities = () => {
  return {
    webCrypto: isWebCryptoAvailable(),
    nodeCrypto: isNodeCryptoAvailable(),
    fallbackOnly: !isWebCryptoAvailable() && !isNodeCryptoAvailable(),
    environment: getEnvironmentType(),
  }
}
