/**
 * Test suite for environment module
 * Tests for environment detection, protocol/hostname detection, and debugging utilities
 */

/* eslint-disable max-lines-per-function */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isNodeEnvironment,
  isBrowserEnvironment,
  isNode,
  isBrowser,
  isDevelopment,
  isProduction,
  isTest,
  isNonProduction,
  detectProtocol,
  detectHostname,
  isLocalhost,
  isPrivateIP,
  getEnvironmentInfo,
  parseEnvValue,
} from '../src/environment'

describe('Environment Detection', () => {
  describe('Basic Environment Detection', () => {
    test('isNodeEnvironment should detect Node.js environment', () => {
      // In test environment, we're in Node.js
      expect(isNodeEnvironment()).toBe(true)
    })

    test('isBrowserEnvironment should detect browser environment', () => {
      // Mock browser environment
      const mockWindow = {}
      const mockDocument = {}

      vi.stubGlobal('window', mockWindow)
      vi.stubGlobal('document', mockDocument)

      expect(isBrowserEnvironment()).toBe(true)

      vi.unstubAllGlobals()
    })

    test('isNode alias should work correctly', () => {
      expect(isNode()).toBe(isNodeEnvironment())
    })

    test('isBrowser alias should work correctly', () => {
      expect(isBrowser()).toBe(isBrowserEnvironment())
    })
  })

  describe('Development Detection', () => {
    beforeEach(() => {
      vi.resetModules()
    })

    afterEach(() => {
      vi.unstubAllEnvs()
      vi.unstubAllGlobals()
    })

    test('isDevelopment should return true when NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'development')
      expect(isDevelopment()).toBe(true)
    })

    test('isDevelopment should return false when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      expect(isDevelopment()).toBe(false)
    })

    test('isDevelopment should return false when NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test')
      expect(isDevelopment()).toBe(false)
    })

    test('isDevelopment should return true when NODE_ENV is undefined', () => {
      vi.stubEnv('NODE_ENV', undefined)
      expect(isDevelopment()).toBe(true)
    })

    test('isDevelopment should detect localhost in browser', () => {
      // Mock browser environment
      const mockLocation = {
        hostname: 'localhost',
        port: '3000',
        protocol: 'http:',
      }

      vi.stubGlobal('window', {})
      vi.stubGlobal('document', {})
      vi.stubGlobal('location', mockLocation)

      expect(isDevelopment()).toBe(true)

      vi.unstubAllGlobals()
    })

    test('isDevelopment should detect development ports', () => {
      // Mock browser environment with development port
      const mockLocation = {
        hostname: 'example.com',
        port: '3000',
        protocol: 'https:',
      }

      vi.stubGlobal('window', {})
      vi.stubGlobal('document', {})
      vi.stubGlobal('location', mockLocation)

      expect(isDevelopment()).toBe(true)

      vi.unstubAllGlobals()
    })

    test('isDevelopment should detect __DEV__ global variable', () => {
      vi.stubGlobal('window', {})
      vi.stubGlobal('document', {})
      vi.stubGlobal('location', { hostname: 'production.com', port: '443', protocol: 'https:' })
      ;(globalThis as any).__DEV__ = true

      expect(isDevelopment()).toBe(true)

      delete (globalThis as any).__DEV__
      vi.unstubAllGlobals()
    })

    test('isDevelopment should detect Vue DevTools', () => {
      const mockWindow = {
        __VUE_DEVTOOLS_GLOBAL_HOOK__: {},
      }
      const mockLocation = {
        hostname: 'localhost',
        port: '8080',
        protocol: 'http:',
      }

      vi.stubGlobal('window', mockWindow)
      vi.stubGlobal('document', {})
      vi.stubGlobal('location', mockLocation)

      expect(isDevelopment()).toBe(true)

      vi.unstubAllGlobals()
    })

    test('isDevelopment should work with Express request object', () => {
      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'X-Forwarded-Proto') return 'http'
          if (header === 'Host') return 'localhost:3000'
          return undefined
        }),
        headers: {},
        protocol: 'http',
        hostname: 'localhost',
      }

      expect(isDevelopment(mockReq)).toBe(true)
    })
  })

  describe('Production Detection', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.unstubAllGlobals()
    })

    test('isProduction should return true when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      expect(isProduction()).toBe(true)
    })

    test('isProduction should return false when NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'development')
      expect(isProduction()).toBe(false)
    })

    test('isProduction should return false when NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test')
      expect(isProduction()).toBe(false)
    })

    test('isProduction should return false when NODE_ENV is undefined', () => {
      vi.stubEnv('NODE_ENV', undefined)
      expect(isProduction()).toBe(false)
    })
  })

  describe('Test Detection', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.unstubAllGlobals()
    })

    test('isTest should return true when NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test')
      expect(isTest()).toBe(true)
    })

    test('isTest should return false when NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'development')
      expect(isTest()).toBe(false)
    })

    test('isTest should return false when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      expect(isTest()).toBe(false)
    })

    test('isTest should return false when NODE_ENV is undefined', () => {
      vi.stubEnv('NODE_ENV', undefined)
      expect(isTest()).toBe(false)
    })
  })

  describe('Non-Production Detection', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.unstubAllGlobals()
    })

    test('isNonProduction should return true when NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'development')
      expect(isNonProduction()).toBe(true)
    })

    test('isNonProduction should return true when NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test')
      expect(isNonProduction()).toBe(true)
    })

    test('isNonProduction should return false when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      expect(isNonProduction()).toBe(false)
    })

    test('isNonProduction should return true when NODE_ENV is undefined', () => {
      vi.stubEnv('NODE_ENV', undefined)
      expect(isNonProduction()).toBe(true)
    })
  })

  describe('Protocol Detection', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    test('detectProtocol should detect HTTPS in browser', () => {
      const mockLocation = { protocol: 'https:' }
      vi.stubGlobal('window', {})
      vi.stubGlobal('document', {})
      vi.stubGlobal('location', mockLocation)

      expect(detectProtocol()).toBe('https')
    })

    test('detectProtocol should detect HTTP in browser', () => {
      const mockLocation = { protocol: 'http:' }
      vi.stubGlobal('window', {})
      vi.stubGlobal('document', {})
      vi.stubGlobal('location', mockLocation)

      expect(detectProtocol()).toBe('http')
    })

    test('detectProtocol should handle X-Forwarded-Proto header', () => {
      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'X-Forwarded-Proto') return 'https'
          return undefined
        }),
        headers: { 'x-forwarded-proto': 'https' },
      }

      expect(detectProtocol(mockReq)).toBe('https')
    })

    test('detectProtocol should handle CF-Visitor header', () => {
      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'CF-Visitor') return '{"scheme":"https"}'
          return undefined
        }),
        headers: { 'cf-visitor': '{"scheme":"https"}' },
      }

      expect(detectProtocol(mockReq)).toBe('https')
    })

    test('detectProtocol should handle Front-End-Https header', () => {
      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'Front-End-Https') return 'on'
          return undefined
        }),
        headers: { 'front-end-https': 'on' },
      }

      expect(detectProtocol(mockReq)).toBe('https')
    })

    test('detectProtocol should fallback to request.protocol', () => {
      const mockReq = {
        get: vi.fn(() => undefined),
        headers: {},
        protocol: 'https',
      }

      expect(detectProtocol(mockReq)).toBe('https')
    })

    test('detectProtocol should fallback to request.secure', () => {
      const mockReq = {
        get: vi.fn(() => undefined),
        headers: {},
        secure: true,
      }

      expect(detectProtocol(mockReq)).toBe('https')
    })
  })

  describe('Hostname Detection', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    test('detectHostname should detect hostname in browser', () => {
      const mockLocation = { hostname: 'example.com' }
      vi.stubGlobal('window', {})
      vi.stubGlobal('document', {})
      vi.stubGlobal('location', mockLocation)

      expect(detectHostname()).toBe('example.com')
    })

    test('detectHostname should handle X-Forwarded-Host header', () => {
      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'X-Forwarded-Host') return 'example.com:443'
          return undefined
        }),
        headers: { 'x-forwarded-host': 'example.com:443' },
      }

      expect(detectHostname(mockReq)).toBe('example.com')
    })

    test('detectHostname should handle Host header', () => {
      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'Host') return 'example.com:8080'
          return undefined
        }),
        headers: { host: 'example.com:8080' },
      }

      expect(detectHostname(mockReq)).toBe('example.com')
    })

    test('detectHostname should handle multiple hosts in X-Forwarded-Host', () => {
      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'X-Forwarded-Host') return 'example.com, proxy.com'
          return undefined
        }),
        headers: { 'x-forwarded-host': 'example.com, proxy.com' },
      }

      expect(detectHostname(mockReq)).toBe('example.com')
    })
  })

  describe('Localhost Detection', () => {
    test('isLocalhost should detect standard localhost variations', () => {
      expect(isLocalhost('localhost')).toBe(true)
      expect(isLocalhost('127.0.0.1')).toBe(true)
      expect(isLocalhost('::1')).toBe(true)
    })

    test('isLocalhost should detect .localhost domains', () => {
      expect(isLocalhost('app.localhost')).toBe(true)
      expect(isLocalhost('test.localhost')).toBe(true)
    })

    test('isLocalhost should detect .local domains', () => {
      expect(isLocalhost('macbook.local')).toBe(true)
      expect(isLocalhost('server.local')).toBe(true)
    })

    test('isLocalhost should reject production domains', () => {
      expect(isLocalhost('example.com')).toBe(false)
      expect(isLocalhost('production.org')).toBe(false)
    })
  })

  describe('Private IP Detection', () => {
    test('isPrivateIP should detect 10.x.x.x range', () => {
      expect(isPrivateIP('10.0.0.1')).toBe(true)
      expect(isPrivateIP('10.255.255.255')).toBe(true)
    })

    test('isPrivateIP should detect 192.168.x.x range', () => {
      expect(isPrivateIP('192.168.1.1')).toBe(true)
      expect(isPrivateIP('192.168.255.255')).toBe(true)
    })

    test('isPrivateIP should detect 172.16-31.x.x range', () => {
      expect(isPrivateIP('172.16.0.1')).toBe(true)
      expect(isPrivateIP('172.31.255.255')).toBe(true)
    })

    test('isPrivateIP should detect 127.x.x.x loopback range', () => {
      expect(isPrivateIP('127.0.0.1')).toBe(true)
      expect(isPrivateIP('127.255.255.255')).toBe(true)
    })

    test('isPrivateIP should detect IPv6 loopback', () => {
      expect(isPrivateIP('::1')).toBe(true)
    })

    test('isPrivateIP should detect IPv6 unique local addresses', () => {
      expect(isPrivateIP('fc00::')).toBe(true)
      expect(isPrivateIP('fd00::')).toBe(true)
    })

    test('isPrivateIP should detect IPv6 link-local addresses', () => {
      expect(isPrivateIP('fe80::')).toBe(true)
    })

    test('isPrivateIP should include localhost detection', () => {
      expect(isPrivateIP('localhost')).toBe(true)
      expect(isPrivateIP('app.localhost')).toBe(true)
    })

    test('isPrivateIP should reject public IPs', () => {
      expect(isPrivateIP('8.8.8.8')).toBe(false)
      expect(isPrivateIP('1.1.1.1')).toBe(false)
      expect(isPrivateIP('172.15.0.1')).toBe(false) // Outside 172.16-31 range
      expect(isPrivateIP('172.32.0.1')).toBe(false) // Outside 172.16-31 range
    })
  })

  describe('Environment Info', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.unstubAllGlobals()
    })

    test('getEnvironmentInfo should return complete Node.js info', () => {
      vi.stubEnv('NODE_ENV', 'development')

      const info = getEnvironmentInfo()

      expect(info.platform).toBe('node')
      expect(info.environment).toBe('development')
      expect(info.protocol).toBe('http')
      expect(info.hostname).toBe('localhost')
      expect(info.criteria?.nodeEnv).toBe('development')
    })

    test('getEnvironmentInfo should return complete browser info', () => {
      const mockWindow = {}
      const mockLocation = {
        hostname: 'localhost',
        port: '3000',
        protocol: 'http:',
      }
      const mockNavigator = {
        userAgent: 'Mozilla/5.0 Test Browser',
      }

      vi.stubGlobal('window', mockWindow)
      vi.stubGlobal('document', {})
      vi.stubGlobal('location', mockLocation)
      vi.stubGlobal('navigator', mockNavigator)

      const info = getEnvironmentInfo()

      expect(info.platform).toBe('browser')
      expect(info.environment).toBe('development')
      expect(info.protocol).toBe('http')
      expect(info.hostname).toBe('localhost')
      expect(info.userAgent).toBe('Mozilla/5.0 Test Browser')
      expect(info.criteria?.isLocalhost).toBe(true)
      expect(info.criteria?.isDevelopmentPort).toBe(true)
    })

    test('getEnvironmentInfo should handle Express request', () => {
      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'X-Forwarded-Proto') return 'https'
          if (header === 'X-Forwarded-Host') return 'api.example.com'
          return undefined
        }),
        headers: {},
        protocol: 'https',
        hostname: 'api.example.com',
      }

      vi.stubEnv('NODE_ENV', 'production')

      const info = getEnvironmentInfo(mockReq)

      expect(info.platform).toBe('node')
      expect(info.environment).toBe('production')
      expect(info.protocol).toBe('https')
      expect(info.hostname).toBe('api.example.com')
      expect(info.criteria?.isLocalhost).toBe(false)
      expect(info.criteria?.isPrivateIP).toBe(false)
    })

    test('getEnvironmentInfo should detect Vue DevTools', () => {
      const mockWindow = {
        __VUE_DEVTOOLS_GLOBAL_HOOK__: {},
      }
      const mockLocation = {
        hostname: 'localhost',
        port: '8080',
        protocol: 'http:',
      }

      vi.stubGlobal('window', mockWindow)
      vi.stubGlobal('document', {})
      vi.stubGlobal('location', mockLocation)

      const info = getEnvironmentInfo()

      expect(info.criteria?.hasDevtools).toBe(true)
    })

    test('getEnvironmentInfo should handle test environment', () => {
      vi.stubEnv('NODE_ENV', 'test')

      const info = getEnvironmentInfo()

      expect(info.platform).toBe('node')
      expect(info.environment).toBe('test')
      expect(info.criteria?.nodeEnv).toBe('test')
    })
  })

  describe('parseEnvValue', () => {
    test('should parse boolean strings correctly', () => {
      expect(parseEnvValue('true')).toBe(true)
      expect(parseEnvValue('TRUE')).toBe(true)
      expect(parseEnvValue('false')).toBe(false)
      expect(parseEnvValue('FALSE')).toBe(false)
      expect(parseEnvValue('yes')).toBe(true)
      expect(parseEnvValue('YES')).toBe(true)
      expect(parseEnvValue('no')).toBe(false)
      expect(parseEnvValue('NO')).toBe(false)
    })

    test('should parse boolean-like numbers', () => {
      expect(parseEnvValue('1')).toBe(true)
      expect(parseEnvValue('0')).toBe(false)
    })

    test('should parse numbers correctly', () => {
      expect(parseEnvValue('42')).toBe(42)
      expect(parseEnvValue('3.14')).toBe(3.14)
      expect(parseEnvValue('-100')).toBe(-100)
      expect(parseEnvValue('0.5')).toBe(0.5)
    })

    test('should keep leading zeros as strings', () => {
      expect(parseEnvValue('01234')).toBe('01234')
      expect(parseEnvValue('00123')).toBe('00123')
    })

    test('should parse JSON arrays correctly', () => {
      expect(parseEnvValue('[1,2,3]')).toEqual([1, 2, 3])
      expect(parseEnvValue('["a","b","c"]')).toEqual(['a', 'b', 'c'])
      expect(parseEnvValue('[true,false]')).toEqual([true, false])
    })

    test('should parse JSON objects correctly', () => {
      expect(parseEnvValue('{"key":"value"}')).toEqual({ key: 'value' })
      expect(parseEnvValue('{"port":3000,"host":"localhost"}')).toEqual({
        port: 3000,
        host: 'localhost',
      })
    })

    test('should parse comma-separated values as arrays', () => {
      expect(parseEnvValue('red,green,blue')).toEqual(['red', 'green', 'blue'])
      expect(parseEnvValue('item1, item2, item3')).toEqual(['item1', 'item2', 'item3'])
    })

    test('should handle null and undefined strings', () => {
      expect(parseEnvValue('null')).toBe(null)
      expect(parseEnvValue('undefined')).toBe(undefined)
      expect(parseEnvValue('')).toBe(undefined)
      expect(parseEnvValue(undefined as any)).toBe(undefined)
    })

    test('should trim whitespace', () => {
      expect(parseEnvValue('  true  ')).toBe(true)
      expect(parseEnvValue('  42  ')).toBe(42)
      expect(parseEnvValue('  hello  ')).toBe('hello')
    })

    test('should return strings when no conversion applies', () => {
      expect(parseEnvValue('hello')).toBe('hello')
      expect(parseEnvValue('world')).toBe('world')
      expect(parseEnvValue('some-value')).toBe('some-value')
    })

    test('should handle invalid JSON gracefully', () => {
      expect(parseEnvValue('[invalid')).toBe('[invalid')
      expect(parseEnvValue('{broken}')).toBe('{broken}')
    })

    test('should handle edge cases', () => {
      expect(parseEnvValue('0.0')).toBe(0)
      expect(parseEnvValue('-0')).toBe(-0) // -0 is a valid number value in JS
      expect(parseEnvValue('NaN')).toBe('NaN') // Keep as string
    })
  })
})
