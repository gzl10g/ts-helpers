/**
 * @fileoverview Librería de utilidades TypeScript - API plana con compatibilidad universal
 * @version 4.1.0 - Multi-environment support (Browser/Node.js) + backward compatibility
 */

// Import universal modules (safe for all environments)
import * as universalIndex from './universal/index'

// Re-export everything from universal build for backward compatibility
// This ensures the main import works in all environments without crypto dependencies
export default universalIndex.default

// Named exports for specific imports (universal)
export * from './universal/index'

// Selective re-exports to maintain API structure (universal only)
export {
  validation,
  strings,
  objects,
  dates,
  math,
  async,
  environment,
  number,
} from './universal/index'
