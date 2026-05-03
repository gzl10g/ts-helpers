import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    isolate: true,
    // Enhanced reporting configuration
    reporters: ['default', 'verbose', 'html', 'junit'],
    outputFile: {
      html: './test-results/index.html',
      junit: './test-results/junit.xml',
    },
    // Enable test annotations and attachments
    attachments: {
      enabled: true,
      dir: './test-results/attachments',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'cobertura'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'test-results/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/types.ts',
        'src/types/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'test-results'],
  },
})
