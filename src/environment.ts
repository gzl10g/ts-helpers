/**
 * Environment detection utilities for universal browser/Node.js compatibility
 */

/**
 * HTTP request object interface (Express-like)
 * Used for server-side environment detection with request headers
 * Supports both request.get() method and headers Record
 */
export interface HttpRequest {
  get?: (header: string) => string | undefined
  headers?: Record<string, unknown>
  protocol?: string
  secure?: boolean
  hostname?: string
}

/**
 * Development port range for environment detection (3000-9999)
 */
const DEV_PORT_RANGE = { min: 3000, max: 9999 }

/**
 * Detailed criteria used for environment debugging and analysis
 */
export interface EnvironmentCriteria {
  /** True if hostname is localhost, 127.0.0.1, ::1, or .localhost/.local domain */
  isLocalhost: boolean
  /** True if hostname is within private IP ranges (10.x, 192.168.x, 172.16-31.x) */
  isPrivateIP: boolean
  /** True if port is in development range (3000-9999) */
  isDevelopmentPort: boolean
  /** True if development tools are detected (Vue DevTools, __DEV__ global) */
  hasDevtools: boolean
  /** Current NODE_ENV value (Node.js only) */
  nodeEnv?: string
}

/**
 * Complete environment information with platform detection and debugging criteria
 */
export interface EnvironmentInfo {
  /** Runtime platform: 'browser', 'node', or 'unknown' */
  platform: 'browser' | 'node' | 'unknown'
  /** Detected environment: 'development', 'production', or 'test' */
  environment: 'development' | 'production' | 'test'
  /** Protocol used (http/https) - from location or request headers */
  protocol?: string
  /** Hostname - from location or request headers */
  hostname?: string
  /** Browser user agent string (browser only) */
  userAgent?: string
  /** Detailed debugging criteria */
  criteria?: EnvironmentCriteria
}

/**
 * Detects if the current runtime is Node.js environment
 *
 * Checks for the presence of Node.js-specific globals (process, process.versions.node)
 * and absence of browser globals (window).
 *
 * @returns True if running in Node.js, false otherwise
 *
 * @example
 * ```typescript
 * if (isNodeEnvironment()) {
 *   // Node.js specific code
 *   const fs = require('fs')
 * }
 * ```
 */
export function isNodeEnvironment(): boolean {
  return typeof window === 'undefined' && typeof process !== 'undefined' && !!process.versions?.node
}

/**
 * Detects if the current runtime is a browser environment
 *
 * Checks for the presence of browser-specific globals (window, document).
 * Also handles testing environments that may mock these globals.
 *
 * @returns True if running in browser, false otherwise
 *
 * @example
 * ```typescript
 * if (isBrowserEnvironment()) {
 *   // Browser specific code
 *   const url = window.location.href
 * }
 * ```
 */
export function isBrowserEnvironment(): boolean {
  // Check both global.window (for tests) and window (for actual browser)
  const win =
    typeof window !== 'undefined' ? window : (globalThis as Record<string, unknown>).window
  const doc =
    typeof document !== 'undefined' ? document : (globalThis as Record<string, unknown>).document
  return typeof win !== 'undefined' && win !== null && typeof doc !== 'undefined' && doc !== null
}

/**
 * Detects if the application is running in development mode
 *
 * Uses sophisticated detection logic based on multiple criteria:
 * - Node.js: NODE_ENV variable, request headers (for Express), hostname/protocol analysis
 * - Browser: __DEV__ global, development ports (3000-9999), localhost/private IPs, dev tools
 *
 * Handles reverse proxies correctly by checking forwarded headers.
 *
 * @param req - Optional Express request object for server-side detection
 * @returns True if in development mode, false if production
 *
 * @example
 * ```typescript
 * // Node.js - simple check
 * if (isDevelopment()) {
 *   console.log('Development mode')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Express - with request context
 * app.get('/api/status', (req, res) => {
 *   const isDev = isDevelopment(req)
 *   res.json({ environment: isDev ? 'dev' : 'prod' })
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Browser - automatic detection
 * if (isDevelopment()) {
 *   // Enable debug logging, dev tools, etc.
 *   enableDebugMode()
 * }
 * ```
 */
export function isDevelopment(req?: HttpRequest): boolean {
  if (isNodeEnvironment()) {
    // En Node.js, verificar NODE_ENV primero
    if (process.env.NODE_ENV === 'production') {
      return false
    }
    if (process.env.NODE_ENV === 'development') {
      return true
    }

    // Si hay request object (Express), usar lógica de servidor
    if (req) {
      const protocol = detectProtocol(req)
      const hostname = detectHostname(req)

      return protocol === 'http' || isLocalhost(hostname) || isPrivateIP(hostname)
    }

    // Fallback para Node.js sin request
    // NODE_ENV undefined se asume como development
    return !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
  }

  if (isBrowserEnvironment()) {
    // Verificar variable global de desarrollo (webpack/vite)
    if (
      typeof (globalThis as any).__DEV__ !== 'undefined' &&
      (globalThis as any).__DEV__ === true
    ) {
      return true
    }

    // Verificar si hay herramientas de desarrollo activas
    if (
      typeof window !== 'undefined' &&
      (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__ &&
      typeof location !== 'undefined' &&
      isLocalhost(location.hostname)
    ) {
      return true
    }

    // Si location no está disponible, considerar como producción
    if (typeof location === 'undefined') {
      return false
    }

    const hostname = location.hostname || ''
    const port = parseInt(location.port || '80')

    // Criterios basados en hostname y puerto
    const isDevelopmentPort = port >= DEV_PORT_RANGE.min && port <= DEV_PORT_RANGE.max

    // Solo considerar HTTP como desarrollo si el hostname también lo indica
    const isHttpDevelopment =
      location.protocol === 'http:' && (isLocalhost(hostname) || isPrivateIP(hostname))

    return isLocalhost(hostname) || isPrivateIP(hostname) || isDevelopmentPort || isHttpDevelopment
  }

  return false
}

/**
 * Detects if the application is running in production mode
 *
 * Simple inverse of isDevelopment() with additional NODE_ENV validation for Node.js.
 *
 * @returns True if in production mode, false if development
 *
 * @example
 * ```typescript
 * if (isProduction()) {
 *   // Enable performance optimizations
 *   enableProductionMode()
 * }
 * ```
 */
export function isProduction(): boolean {
  if (isNodeEnvironment()) {
    return process.env.NODE_ENV === 'production'
  }

  // Browser: inverso de isDevelopment (que ya excluye test)
  return !isDevelopment()
}

/**
 * Detects if the application is running in test mode
 *
 * Checks explicitly for NODE_ENV === 'test' in Node.js environments.
 * Vitest and Jest automatically set this value when running tests.
 *
 * @returns True if NODE_ENV is 'test', false otherwise
 *
 * @example
 * ```typescript
 * if (isTest()) {
 *   // Test-specific behavior (mocks, fixtures, etc.)
 *   enableTestMode()
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Conditional imports for testing
 * if (isTest()) {
 *   const { mockAPI } = await import('./test/mocks')
 *   mockAPI.setup()
 * }
 * ```
 */
export function isTest(): boolean {
  if (isNodeEnvironment()) {
    return process.env.NODE_ENV === 'test'
  }

  return false
}

/**
 * Detects if the application is NOT running in production mode
 *
 * Returns true for development, test, undefined, or any non-production environment.
 * Useful for enabling debugging, logging, or development-only features
 * across all non-production environments.
 *
 * @returns True if not in production (development, test, or undefined)
 *
 * @example
 * ```typescript
 * if (isNonProduction()) {
 *   // Enable debug logging for dev and test
 *   console.log('Debug mode enabled')
 *   enableVerboseLogging()
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Security: Disable strict checks in non-production
 * if (isNonProduction()) {
 *   allowSelfSignedCertificates()
 *   disableCSRFProtection()
 * }
 * ```
 */
export function isNonProduction(): boolean {
  if (isNodeEnvironment()) {
    return process.env.NODE_ENV !== 'production'
  }

  return !isProduction()
}

/**
 * Detects the protocol (HTTP/HTTPS) from browser location or request headers
 *
 * Handles reverse proxies correctly by checking forwarded headers in priority order:
 * 1. X-Forwarded-Proto (most common)
 * 2. X-Forwarded-Protocol
 * 3. X-Url-Scheme
 * 4. Front-End-Https
 * 5. CF-Visitor (Cloudflare specific)
 *
 * @param req - Optional Express request object with headers
 * @returns Protocol as 'http' or 'https'
 *
 * @example
 * ```typescript
 * // Browser usage
 * const protocol = detectProtocol() // 'https' from window.location
 * ```
 *
 * @example
 * ```typescript
 * // Express server with proxy
 * app.get('/api', (req, res) => {
 *   const protocol = detectProtocol(req) // Detects from X-Forwarded-Proto
 *   const fullUrl = `${protocol}://${req.get('host')}${req.path}`
 * })
 * ```
 */
export function detectProtocol(req?: HttpRequest): 'http' | 'https' {
  if (isBrowserEnvironment()) {
    if (typeof location !== 'undefined') {
      return location.protocol === 'https:' ? 'https' : 'http'
    }
    return 'https' // Default seguro para browser
  }

  if (req) {
    // Headers comunes de proxies reversos en orden de prioridad
    const forwardedProto =
      req.get?.('X-Forwarded-Proto') ||
      (typeof req.headers?.['x-forwarded-proto'] === 'string'
        ? req.headers['x-forwarded-proto']
        : undefined)
    const forwardedProtocol =
      req.get?.('X-Forwarded-Protocol') ||
      (typeof req.headers?.['x-forwarded-protocol'] === 'string'
        ? req.headers['x-forwarded-protocol']
        : undefined)
    const urlScheme =
      req.get?.('X-Url-Scheme') ||
      (typeof req.headers?.['x-url-scheme'] === 'string' ? req.headers['x-url-scheme'] : undefined)
    const frontEndHttps =
      req.get?.('Front-End-Https') ||
      (typeof req.headers?.['front-end-https'] === 'string'
        ? req.headers['front-end-https']
        : undefined)
    const cloudflareVisitor =
      req.get?.('CF-Visitor') ||
      (typeof req.headers?.['cf-visitor'] === 'string' ? req.headers['cf-visitor'] : undefined)

    // Verificar headers de proxy
    if (forwardedProto) {
      return forwardedProto.split(',')[0].trim().toLowerCase() as 'http' | 'https'
    }
    if (forwardedProtocol) {
      return forwardedProtocol.toLowerCase() as 'http' | 'https'
    }
    if (urlScheme) {
      return urlScheme.toLowerCase() as 'http' | 'https'
    }
    if (frontEndHttps === 'on') {
      return 'https'
    }
    if (cloudflareVisitor) {
      try {
        const visitor = JSON.parse(cloudflareVisitor)
        if (visitor.scheme) {
          return visitor.scheme.toLowerCase() as 'http' | 'https'
        }
      } catch (_e) {
        // Ignorar errores de parsing JSON
      }
    }

    // Fallback al protocolo directo
    if (req.protocol === 'http' || req.protocol === 'https') return req.protocol
    if (req.secure) return 'https'
  }

  // Default para Node.js sin request context
  return 'http'
}

/**
 * Extracts hostname from browser location or request headers
 *
 * Handles reverse proxies by checking forwarded headers in priority order:
 * 1. X-Forwarded-Host (most common, supports multiple hosts)
 * 2. X-Original-Host
 * 3. Host header
 *
 * Automatically strips port numbers and handles multiple comma-separated hosts.
 *
 * @param req - Optional Express request object with headers
 * @returns Hostname without port number
 *
 * @example
 * ```typescript
 * // Browser usage
 * const hostname = detectHostname() // 'example.com' from window.location
 * ```
 *
 * @example
 * ```typescript
 * // Express server behind proxy
 * app.get('/api', (req, res) => {
 *   const hostname = detectHostname(req) // 'api.example.com' from X-Forwarded-Host
 *   const isLocal = isLocalhost(hostname)
 * })
 * ```
 */
export function detectHostname(req?: HttpRequest): string {
  if (isBrowserEnvironment()) {
    if (typeof location !== 'undefined') {
      return location.hostname
    }
    return 'localhost'
  }

  if (req) {
    // Headers comunes de proxies reversos en orden de prioridad
    const forwardedHost =
      req.get?.('X-Forwarded-Host') ||
      (typeof req.headers?.['x-forwarded-host'] === 'string'
        ? req.headers['x-forwarded-host']
        : undefined)
    const originalHost =
      req.get?.('X-Original-Host') ||
      (typeof req.headers?.['x-original-host'] === 'string'
        ? req.headers['x-original-host']
        : undefined)
    const host =
      req.get?.('Host') ||
      (typeof req.headers?.['host'] === 'string' ? req.headers['host'] : undefined)

    // Verificar headers de proxy
    if (forwardedHost) {
      return forwardedHost.split(',')[0].trim().split(':')[0]
    }
    if (originalHost) {
      return originalHost.split(':')[0]
    }
    if (host) {
      return host.split(':')[0]
    }

    // Fallback al hostname directo
    if (req.hostname) return req.hostname
  }

  // Default para Node.js sin request context
  return 'localhost'
}

/**
 * Checks if a hostname represents localhost or local development
 *
 * Recognizes various localhost representations:
 * - 'localhost' (standard)
 * - '127.0.0.1' (IPv4 loopback)
 * - '::1' (IPv6 loopback)
 * - '*.localhost' (local development domains)
 * - '*.local' (mDNS local domains)
 *
 * @param hostname - Hostname to check
 * @returns True if hostname represents localhost
 *
 * @example
 * ```typescript
 * isLocalhost('localhost')        // true
 * isLocalhost('127.0.0.1')        // true
 * isLocalhost('app.localhost')    // true
 * isLocalhost('macbook.local')    // true
 * isLocalhost('example.com')      // false
 * ```
 */
export function isLocalhost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  )
}

/**
 * Checks if a hostname is within private IP address ranges
 *
 * Recognizes private/internal IP ranges according to RFC 1918:
 * - IPv4: 10.x.x.x, 192.168.x.x, 172.16-31.x.x, 127.x.x.x (loopback)
 * - IPv6: ::1 (loopback), fc00::/7 (unique local), fe80::/10 (link-local)
 * - Also includes localhost detection
 *
 * @param hostname - Hostname or IP address to check
 * @returns True if hostname is private/local, false if public
 *
 * @example
 * ```typescript
 * isPrivateIP('192.168.1.1')      // true
 * isPrivateIP('10.0.0.1')         // true
 * isPrivateIP('172.16.0.1')       // true
 * isPrivateIP('localhost')        // true
 * isPrivateIP('8.8.8.8')          // false
 * isPrivateIP('example.com')      // false
 * ```
 */
export function isPrivateIP(hostname: string): boolean {
  // IPv4 private ranges
  const ipv4Patterns = [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^127\./, // 127.0.0.0/8 (loopback)
  ]

  // IPv6 private/local ranges
  const ipv6Patterns = [
    /^::1$/, // IPv6 loopback
    /^fc[0-9a-f]{2}:/i, // Unique local addresses
    /^fd[0-9a-f]{2}:/i, // Unique local addresses
    /^fe80:/i, // Link-local addresses
  ]

  return (
    ipv4Patterns.some(pattern => pattern.test(hostname)) ||
    ipv6Patterns.some(pattern => pattern.test(hostname)) ||
    isLocalhost(hostname)
  )
}

/**
 * Gathers complete environment information for debugging and analysis
 *
 * Returns comprehensive environment data including platform detection,
 * development/production status, protocol/hostname information, and
 * detailed debugging criteria.
 *
 * @param req - Optional Express request object for server-side context
 * @returns Complete environment information object
 *
 * @example
 * ```typescript
 * // Basic usage
 * const env = getEnvironmentInfo()
 * console.log(env.platform)     // 'node' | 'browser' | 'unknown'
 * console.log(env.environment)  // 'development' | 'production' | 'test'
 * ```
 *
 * @example
 * ```typescript
 * // Express server usage
 * app.get('/api/debug', (req, res) => {
 *   const envInfo = getEnvironmentInfo(req)
 *   res.json({
 *     platform: envInfo.platform,
 *     isDev: envInfo.environment === 'development',
 *     protocol: envInfo.protocol,
 *     host: envInfo.hostname,
 *     criteria: envInfo.criteria
 *   })
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Conditional features based on environment
 * const env = getEnvironmentInfo()
 * if (env.criteria?.hasDevtools) {
 *   enableVueDevtools()
 * }
 * if (env.criteria?.isDevelopmentPort) {
 *   enableHotReload()
 * }
 * ```
 */
export function getEnvironmentInfo(req?: HttpRequest): EnvironmentInfo {
  const platform = isNodeEnvironment() ? 'node' : isBrowserEnvironment() ? 'browser' : 'unknown'

  let environment: EnvironmentInfo['environment'] = 'production'
  if (isNodeEnvironment()) {
    const nodeEnv = process.env.NODE_ENV
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      environment = nodeEnv
    }
  } else if (isDevelopment()) {
    environment = 'development'
  }

  const protocol = detectProtocol(req)
  const hostname = detectHostname(req)

  const info: EnvironmentInfo = {
    platform,
    environment,
    protocol,
    hostname,
  }

  if (isBrowserEnvironment() && typeof navigator !== 'undefined') {
    info.userAgent = navigator.userAgent
  }

  // Criterios detallados para debugging
  const criteria: EnvironmentCriteria = {
    isLocalhost: isLocalhost(hostname),
    isPrivateIP: isPrivateIP(hostname),
    isDevelopmentPort: false,
    hasDevtools: false,
  }

  if (isBrowserEnvironment() && typeof location !== 'undefined') {
    const port = parseInt(location.port || '80')
    criteria.isDevelopmentPort = port >= DEV_PORT_RANGE.min && port <= DEV_PORT_RANGE.max
    criteria.hasDevtools = !!(
      typeof window !== 'undefined' && (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__
    )
  }

  if (isNodeEnvironment()) {
    criteria.nodeEnv = process.env.NODE_ENV || 'undefined'
  }

  info.criteria = criteria

  return info
}

/**
 * Alias for isNodeEnvironment() - detects Node.js runtime
 * @see {@link isNodeEnvironment}
 */
export const isNode = isNodeEnvironment

/**
 * Alias for isBrowserEnvironment() - detects browser runtime
 * @see {@link isBrowserEnvironment}
 */
export const isBrowser = isBrowserEnvironment

/**
 * Type for parsed environment variable values
 */
type ParsedEnvValue = string | number | boolean | null | undefined | unknown[]

/**
 * Parses environment variable string values to their native JavaScript types
 *
 * Automatically detects and converts:
 * - Booleans: 'true', 'false', 'yes', 'no', '1', '0'
 * - Numbers: '42', '3.14', '-100'
 * - JSON arrays: '[1,2,3]', '["a","b"]'
 * - JSON objects: '{"key":"value"}'
 * - Comma-separated arrays: 'item1,item2,item3' (when not valid JSON)
 * - null/undefined: 'null', 'undefined', empty string
 *
 * Falls back to original string if no conversion applies.
 *
 * @param value - Environment variable string value to parse
 * @returns Parsed value with appropriate native type
 *
 * @example
 * ```typescript
 * // Boolean conversion
 * parseEnvValue('true')      // true
 * parseEnvValue('false')     // false
 * parseEnvValue('yes')       // true
 * parseEnvValue('1')         // true (as boolean)
 *
 * // Number conversion
 * parseEnvValue('42')        // 42
 * parseEnvValue('3.14')      // 3.14
 * parseEnvValue('-100')      // -100
 *
 * // JSON arrays
 * parseEnvValue('[1,2,3]')   // [1, 2, 3]
 * parseEnvValue('["a","b"]') // ['a', 'b']
 *
 * // JSON objects
 * parseEnvValue('{"port":3000,"host":"localhost"}')
 * // { port: 3000, host: 'localhost' }
 *
 * // Comma-separated arrays (fallback when not JSON)
 * parseEnvValue('red,green,blue')  // ['red', 'green', 'blue']
 *
 * // Null/undefined
 * parseEnvValue('null')      // null
 * parseEnvValue('undefined') // undefined
 * parseEnvValue('')          // undefined
 *
 * // Strings (no conversion)
 * parseEnvValue('hello')     // 'hello'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world usage with process.env
 * const config = {
 *   debug: parseEnvValue(process.env.DEBUG),           // 'true' → true
 *   port: parseEnvValue(process.env.PORT),             // '3000' → 3000
 *   features: parseEnvValue(process.env.FEATURES),     // 'auth,api' → ['auth', 'api']
 *   database: parseEnvValue(process.env.DB_CONFIG),    // '{"host":"localhost"}' → object
 * }
 * ```
 */
export function parseEnvValue(value: string | undefined): ParsedEnvValue {
  // Handle null/undefined/empty
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const trimmed = value.trim()

  // Handle explicit null/undefined strings
  if (trimmed === 'null') return null
  if (trimmed === 'undefined') return undefined

  // Handle booleans
  const lowerValue = trimmed.toLowerCase()
  if (lowerValue === 'true' || lowerValue === 'yes') return true
  if (lowerValue === 'false' || lowerValue === 'no') return false

  // Handle boolean-like numbers
  if (trimmed === '1') return true
  if (trimmed === '0') return false

  // Try parsing as number (but not if it starts with 0 and has more digits - could be octal/string)
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    // Avoid treating leading-zero strings as numbers (e.g., postal codes '01234')
    if (trimmed.length > 1 && trimmed[0] === '0' && trimmed[1] !== '.') {
      return trimmed // Keep as string (e.g., '01234')
    }
    const num = Number(trimmed)
    if (!isNaN(num)) return num
  }

  // Try parsing as JSON (arrays, objects)
  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // Not valid JSON, continue to next check
    }
  }

  // Try parsing comma-separated values as array
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(s => s.trim())
    // Only convert to array if all parts are non-empty
    if (parts.every(p => p.length > 0)) {
      return parts
    }
  }

  // Return as-is string
  return trimmed
}
