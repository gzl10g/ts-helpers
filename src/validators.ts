/**
 * File and security validators
 *
 * This module provides validation functions for file operations and content security.
 * Functions implement basic security checks to prevent common attack vectors:
 * - Path traversal attacks (../, ..\)
 * - XSS injection (script tags, javascript: URLs)
 * - File size limits
 *
 * ⚠️ WARNING: These are basic validations. For production systems, consider:
 * - Additional OS-specific path validation
 * - Symbolic link resolution checking
 * - Comprehensive XSS prevention libraries (e.g., DOMPurify)
 * - Content-Type validation
 * - Virus scanning for uploaded files
 */

/**
 * Validates file path for security vulnerabilities
 *
 * Protects against common path traversal attacks by checking for:
 * - Parent directory references (../, ..\)
 * - Mixed path separators (//\, \\)
 * - Excessive path length (>1000 chars)
 * - Empty or null paths
 *
 * ⚠️ SECURITY NOTE: This is basic validation. For production use, consider:
 * - Validating against an allowed directory whitelist
 * - Resolving symbolic links
 * - OS-specific path rules (Windows vs Unix)
 * - Canonicalization before validation
 *
 * @param filePath - File path string to validate
 * @returns True if path appears safe, false if potentially dangerous
 *
 * @example
 * ```typescript
 * // Safe paths - Allowed
 * isValidFilePath('./data/users.json')        // true
 * isValidFilePath('data/users.json')          // true
 * isValidFilePath('/absolute/path/file.txt')  // true
 * isValidFilePath('C:\\Users\\data\\file.txt') // true
 *
 * // Dangerous paths - Path traversal attacks
 * isValidFilePath('../../../etc/passwd')      // false
 * isValidFilePath('data/../../../etc/passwd') // false
 * isValidFilePath('..\\..\\..\\windows\\system32\\config') // false
 * isValidFilePath('data//\\..//config')       // false
 *
 * // Invalid paths - Malformed
 * isValidFilePath('')                         // false
 * isValidFilePath(null as any)                // false
 * isValidFilePath(undefined as any)           // false
 * isValidFilePath('x'.repeat(1001))          // false (too long)
 *
 * // Real-world usage in file operations
 * async function readUserFile(userPath: string) {
 *   if (!isValidFilePath(userPath)) {
 *     throw new Error('Invalid or unsafe file path detected')
 *   }
 *
 *   // Additional check: ensure path is within allowed directory
 *   const allowedDir = '/var/app/uploads'
 *   const fullPath = path.join(allowedDir, userPath)
 *
 *   return fs.readFile(fullPath, 'utf-8')
 * }
 * ```
 *
 * @see {@link isValidTextContent} for content security validation
 * @see {@link isValidFileSize} for file size validation
 */
export function isValidFilePath(filePath: string): boolean {
  // ✅ Type and null checks
  if (!filePath || typeof filePath !== 'string') return false

  // ✅ Handle type coercion attempts
  if (typeof filePath === 'object') return false

  // ✅ Length limits (DoS prevention)
  if (filePath.length === 0 || filePath.length > 1000) return false

  // ✅ Path traversal patterns (Unix and Windows)
  // Reject parent directory traversal (..)
  if (filePath.includes('../') || filePath.includes('..\\')) return false

  // Reject mixed/double slashes (but allow ./ and .\ at start for relative paths)
  const suspiciousPatterns = ['//', '\\\\', '//\\', '\\//', '/./', '\\.\\']
  if (suspiciousPatterns.some(pattern => filePath.includes(pattern))) return false

  // ✅ URL-encoded path traversal
  const encodedPatterns = [
    '%2e%2e%2f', // ../
    '%2e%2e/', // ../
    '%2e%2e%5c', // ..\
    '%252e', // double-encoded
  ]
  if (encodedPatterns.some(pattern => filePath.toLowerCase().includes(pattern))) return false

  // ✅ Null byte injection
  if (filePath.includes('\x00')) return false

  // ✅ Command injection characters
  const commandChars = [';', '&', '|', '`', '$', '(', ')', '{', '}']
  if (commandChars.some(char => filePath.includes(char))) return false

  // ✅ SQL injection attempts
  const sqlPatterns = ["'", '"', '--', '/*', '*/', 'DROP', 'DELETE', 'UNION', 'SELECT']
  const lowerPath = filePath.toLowerCase()
  if (
    sqlPatterns.some(
      pattern =>
        lowerPath.includes(pattern.toLowerCase()) &&
        (pattern === "'" || pattern === '"' || lowerPath.includes(` ${pattern.toLowerCase()}`))
    )
  )
    return false

  // ✅ Unicode attacks (RTL override, zero-width)
  const dangerousUnicode = [
    '\u202E', // Right-to-left override
    '\u200B', // Zero-width space
    '\u200C', // Zero-width non-joiner
    '\u200D', // Zero-width joiner
    '\uFEFF', // Zero-width no-break space
  ]
  if (dangerousUnicode.some(char => filePath.includes(char))) return false

  // ✅ Absolute Windows paths trying to escape
  if (/^[A-Za-z]:\\.*\\\.\./.test(filePath)) return false

  return true
}

/**
 * Validates file size against a maximum limit
 *
 * Checks if a file size is valid (non-negative) and within acceptable limits.
 * Used to prevent:
 * - Denial of Service (DoS) attacks via large file uploads
 * - Disk space exhaustion
 * - Memory overflow during file processing
 *
 * @param size - File size in bytes to validate
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if size is valid and within limit, false otherwise
 *
 * @example
 * ```typescript
 * // Common size limits
 * const KB = 1024
 * const MB = 1024 * KB
 * const GB = 1024 * MB
 *
 * // Image upload validation (5 MB limit)
 * const imageSize = 4 * MB
 * isValidFileSize(imageSize, 5 * MB)  // true
 *
 * // Document upload validation (10 MB limit)
 * const docSize = 12 * MB
 * isValidFileSize(docSize, 10 * MB)  // false (exceeds limit)
 *
 * // Video upload validation (1 GB limit)
 * const videoSize = 500 * MB
 * isValidFileSize(videoSize, 1 * GB)  // true
 *
 * // Invalid sizes
 * isValidFileSize(-100, 1 * MB)      // false (negative size)
 * isValidFileSize(NaN, 1 * MB)       // false (invalid number)
 * isValidFileSize('1000' as any, 1 * MB) // false (not a number)
 *
 * // Real-world usage in file upload handler
 * app.post('/upload', (req, res) => {
 *   const file = req.files.document
 *   const maxSize = 10 * 1024 * 1024 // 10 MB
 *
 *   if (!isValidFileSize(file.size, maxSize)) {
 *     return res.status(413).json({
 *       error: 'File too large',
 *       maxSize: '10 MB',
 *       received: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
 *     })
 *   }
 *
 *   // Process file...
 * })
 * ```
 *
 * @see {@link isValidFilePath} for path security validation
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
  return typeof size === 'number' && size >= 0 && size <= maxSize
}

/**
 * Validates text content for security vulnerabilities and size limits
 *
 * Performs basic security checks on text content to detect common XSS attack vectors:
 * - Script tags (<script>)
 * - JavaScript URLs (javascript:)
 * - Data URLs with HTML (data:text/html)
 * - VBScript URLs (vbscript:)
 *
 * Also enforces maximum content length to prevent DoS attacks.
 *
 * ⚠️ WARNING: This is basic XSS detection. For production systems:
 * - Use dedicated sanitization libraries (DOMPurify, sanitize-html)
 * - Implement Content Security Policy (CSP)
 * - Apply output encoding based on context (HTML, JS, URL)
 * - Validate against allowlists, not just blocklists
 *
 * @param content - Text content to validate
 * @param options - Validation options
 * @param options.maxLength - Maximum content length in characters (default: 1,000,000)
 * @returns True if content appears safe, false if dangerous patterns detected
 *
 * @example
 * ```typescript
 * // Safe content - Allowed
 * isValidTextContent('Hello, world!')           // true
 * isValidTextContent('User input: <b>bold</b>') // true
 * isValidTextContent('Email: user@example.com') // true
 *
 * // Dangerous content - XSS vectors detected
 * isValidTextContent('<script>alert("XSS")</script>')     // false
 * isValidTextContent('<img src=x onerror="alert(1)">')    // false (contains 'script' in onerror)
 * isValidTextContent('<a href="javascript:void(0)">')     // false
 * isValidTextContent('<iframe src="data:text/html,..."') // false
 * isValidTextContent('vbscript:msgbox("XSS")')           // false
 *
 * // Size limit validation
 * isValidTextContent('x'.repeat(999_999))              // true (under default 1M limit)
 * isValidTextContent('x'.repeat(1_000_001))            // false (exceeds default limit)
 * isValidTextContent('x'.repeat(5000), { maxLength: 1000 }) // false (custom limit)
 *
 * // Edge cases
 * isValidTextContent('')                     // true (empty is valid)
 * isValidTextContent(null as any)            // false (not a string)
 * isValidTextContent(undefined as any)       // false (not a string)
 * isValidTextContent(123 as any)             // false (not a string)
 *
 * // Real-world usage in comment system
 * app.post('/api/comments', (req, res) => {
 *   const { content } = req.body
 *
 *   if (!isValidTextContent(content, { maxLength: 5000 })) {
 *     return res.status(400).json({
 *       error: 'Invalid comment content',
 *       details: 'Content contains dangerous patterns or exceeds 5000 characters'
 *     })
 *   }
 *
 *   // Additional sanitization recommended
 *   const sanitized = DOMPurify.sanitize(content)
 *
 *   // Save to database...
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Form validation with custom limits
 * function validateUserBio(bio: string): { valid: boolean; error?: string } {
 *   if (!isValidTextContent(bio, { maxLength: 500 })) {
 *     return {
 *       valid: false,
 *       error: 'Bio must be less than 500 characters and cannot contain scripts'
 *     }
 *   }
 *   return { valid: true }
 * }
 * ```
 *
 * @see {@link isValidFilePath} for file path validation
 * @see sanitizeHtml from validation module for HTML sanitization
 */
export function isValidTextContent(content: string, options: { maxLength?: number } = {}): boolean {
  const { maxLength = 1_000_000 } = options

  // ✅ Type validation
  if (typeof content !== 'string') return false

  // ✅ Length validation (DoS prevention)
  if (content.length > maxLength) return false

  const lowerContent = content.toLowerCase()

  // ✅ Script tag detection (case-insensitive, with variants)
  const scriptPatterns = ['<script', '</script', '<scr<script>ipt', '<scr\x00ipt']
  if (scriptPatterns.some(pattern => lowerContent.includes(pattern))) return false

  // ✅ Event handler attributes (XSS vectors)
  const eventHandlers = [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
    'oninput',
  ]
  if (eventHandlers.some(handler => lowerContent.includes(handler))) return false

  // ✅ Protocol handlers (javascript:, data:, vbscript:, file:)
  const protocolPatterns = [
    'javascript:',
    'data:text/html',
    'data:text/javascript',
    'data:application',
    'vbscript:',
    'file:///',
    'steam://',
    'slack://',
  ]
  if (protocolPatterns.some(pattern => lowerContent.includes(pattern))) return false

  // ✅ Encoded script attempts
  const encodedPatterns = [
    '&#60;script', // &#60; = <
    '%3cscript', // %3c = <
    '\\x3cscript', // \x3c = <
    '\\u003cscript', // \u003c = <
  ]
  if (encodedPatterns.some(pattern => lowerContent.includes(pattern))) return false

  // ✅ SVG-based XSS
  if (lowerContent.includes('<svg') && lowerContent.includes('onload')) return false

  // ✅ iframe injection
  if (lowerContent.includes('<iframe')) return false

  return true
}
