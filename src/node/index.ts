/**
 * Node.js-specific exports - Full functionality with crypto support
 * Uses Node.js crypto module for secure operations
 */

// Import universal modules
import * as validationCore from '../universal/validation-core'
import * as stringFunctions from '../strings'
import * as objectFunctions from '../objects'
import * as dateFunctions from '../dates'
import * as mathFunctions from '../math'
import * as asyncFunctions from '../async'
import * as dataFunctions from '../data'
import * as environmentModule from '../environment'
import * as numberModule from '../number'
import * as treeModule from '../tree'

// Import Node.js-specific crypto functions
import * as validationCrypto from './validation-crypto'

// Merge core validation with crypto functions for Node.js
const validationFunctions = {
  ...validationCore,
  ...validationCrypto,
}

// Create flat API object with full Node.js functionality
const g = {
  // Full validation functions (core + crypto)
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

  // Data functions
  ...dataFunctions,

  // Number utilities
  ...numberModule,

  // Tree utilities
  ...treeModule,

  // Environment utilities
  ...environmentModule,
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
  dataFunctions as data,
  environmentModule as environment,
  numberModule as number,
  treeModule as tree,
}

// Re-export individual functions for tree-shaking
export * from '../universal/validation-core'
export * from './validation-crypto'
export * from '../strings'
export * from '../objects'
export * from '../dates'
export * from '../math'
export * from '../async'
export * from '../data'
export * from '../environment'
export * from '../number'
// Note: tree module exports conflict with data module, so importing through named export
export { renderTreeAsText, TreeExportOptions as TreeOnlyExportOptions } from '../tree'
