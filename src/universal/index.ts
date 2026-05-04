/**
 * Universal exports - Safe for all environments
 * No crypto dependencies - browser and Node.js compatible
 */

// Import universal modules (safe for all environments)
import * as validationCore from './validation-core'
import * as environmentDetection from './environment-detection'
import * as stringFunctions from '../strings'
import * as objectFunctions from '../objects'
import * as dateFunctions from '../dates'
import * as mathFunctions from '../math'
import * as asyncFunctions from '../async'
import * as environmentModule from '../environment'
import * as numberModule from '../number'

// NOTE: data, csv, json, tree modules are NOT included in universal build
// because they have Node.js dependencies (fs/promises, path)
// These are available in Node.js specific builds

// Create flat API object - universal functions only (safe for browser)
const g = {
  // Core validation functions (no crypto)
  ...validationCore,

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
  validationCore as validation,
  stringFunctions as strings,
  objectFunctions as objects,
  dateFunctions as dates,
  mathFunctions as math,
  asyncFunctions as async,
  environmentModule as environment,
  numberModule as number,
}

// Re-export individual functions for tree-shaking
export * from './validation-core'
export * from './environment-detection'
export * from '../strings'
export * from '../objects'
export * from '../dates'
export * from '../math'
export * from '../async'
export * from '../environment'
export * from '../number'
