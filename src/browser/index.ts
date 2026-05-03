/**
 * Browser-specific exports - Safe for browser environments
 * Uses Web Crypto API for secure operations when available
 */

// Import universal modules
import * as validationCore from '../universal/validation-core'
import * as stringFunctions from '../strings'
import * as objectFunctions from '../objects'
import * as dateFunctions from '../dates'
import * as mathFunctions from '../math'
import * as asyncFunctions from '../async'
import * as environmentModule from '../environment'
import * as numberModule from '../number'

// Import browser-specific crypto functions
import * as validationCrypto from './validation-crypto'
import * as environmentDetection from '../universal/environment-detection'

// NOTE: data, csv, json, tree modules excluded from browser build
// because they have Node.js dependencies (fs/promises, path)
// Browser users should use web APIs for file operations

// Merge core validation with browser-safe crypto functions
// Note: hashString in browser build is async, provide both versions
const validationFunctions = {
  ...validationCore,
  ...validationCrypto,
  // Provide sync version as default for backward compatibility
  hashString: validationCrypto.hashStringSync,
  hashStringAsync: validationCrypto.hashString,
}

// Create flat API object with browser-safe functionality
const g = {
  // Full validation functions (core + browser crypto)
  ...validationFunctions,

  // String functions
  ...stringFunctions,

  // Object/Array functions
  ...objectFunctions,

  // Date functions
  ...dateFunctions,

  // Math functions
  ...mathFunctions,

  // Async functions
  ...asyncFunctions,

  // Number utilities
  ...numberModule,

  // Environment utilities (original)
  ...environmentModule,

  // Enhanced environment detection
  ...environmentDetection,
}

// Export both default and named exports
export default g

// Named exports for specific imports
export {
  validationFunctions as validation,
  stringFunctions as strings,
  objectFunctions as objects,
  dateFunctions as dates,
  mathFunctions as math,
  asyncFunctions as async,
  environmentModule as environment,
  numberModule as number,
}

// Re-export individual functions for tree-shaking
export * from '../universal/validation-core'
export * from './validation-crypto'
export * from '../strings'
export * from '../objects'
export * from '../dates'
export * from '../math'
export * from '../async'
export * from '../environment'
export * from '../number'
export * from '../universal/environment-detection'
