import { defineConfig } from 'tsup'

export default defineConfig([
  // Universal Build (Browser + Node.js safe) - CJS
  {
    entry: {
      index: 'src/universal/index.ts',
      validation: 'src/universal/validation-core.ts',
      'environment-detection': 'src/universal/environment-detection.ts',
      strings: 'src/strings.ts',
      objects: 'src/objects.ts',
      dates: 'src/dates.ts',
      math: 'src/math.ts',
      async: 'src/async.ts',
      environment: 'src/environment.ts',
      errors: 'src/errors.ts',
      number: 'src/number.ts',
    },
    format: ['cjs'],
    outDir: 'dist/cjs',
    sourcemap: true,
    external: ['crypto', 'fs/promises', 'path', 'fs', 'os'], // Exclude all Node.js modules
    platform: 'neutral', // Ensure neutral platform for universal compatibility
  },

  // Universal Build (Browser + Node.js safe) - ESM
  {
    entry: {
      index: 'src/universal/index.ts',
      validation: 'src/universal/validation-core.ts',
      'environment-detection': 'src/universal/environment-detection.ts',
      strings: 'src/strings.ts',
      objects: 'src/objects.ts',
      dates: 'src/dates.ts',
      math: 'src/math.ts',
      async: 'src/async.ts',
      environment: 'src/environment.ts',
      errors: 'src/errors.ts',
      number: 'src/number.ts',
    },
    format: ['esm'],
    outDir: 'dist/esm',
    sourcemap: true,
    external: ['crypto', 'fs/promises', 'path', 'fs', 'os'], // Exclude all Node.js modules
    platform: 'neutral', // Ensure neutral platform for universal compatibility
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.js' : '.js',
    }),
  },

  // Node.js Specific Build - CJS
  {
    entry: {
      index: 'src/node/index.ts',
      validation: 'src/validation.ts', // Legacy validation (full)
      'validation-crypto': 'src/node/validation-crypto.ts',
      'validation-core': 'src/universal/validation-core.ts',
      strings: 'src/strings.ts',
      objects: 'src/objects.ts',
      dates: 'src/dates.ts',
      math: 'src/math.ts',
      async: 'src/async.ts',
      data: 'src/data.ts',
      environment: 'src/environment.ts',
      errors: 'src/errors.ts',
      csv: 'src/csv.ts',
      json: 'src/json.ts',
      tree: 'src/tree.ts',
      validators: 'src/validators.ts',
      number: 'src/number.ts',
    },
    format: ['cjs'],
    outDir: 'dist/node',
    sourcemap: true,
    platform: 'node',
  },

  // Node.js Specific Build - ESM
  {
    entry: {
      index: 'src/node/index.ts',
      validation: 'src/validation.ts', // Legacy validation (full)
      'validation-crypto': 'src/node/validation-crypto.ts',
      'validation-core': 'src/universal/validation-core.ts',
      strings: 'src/strings.ts',
      objects: 'src/objects.ts',
      dates: 'src/dates.ts',
      math: 'src/math.ts',
      async: 'src/async.ts',
      data: 'src/data.ts',
      environment: 'src/environment.ts',
      errors: 'src/errors.ts',
      csv: 'src/csv.ts',
      json: 'src/json.ts',
      tree: 'src/tree.ts',
      validators: 'src/validators.ts',
      number: 'src/number.ts',
    },
    format: ['esm'],
    outDir: 'dist/node-esm',
    sourcemap: true,
    platform: 'node',
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.js' : '.js',
    }),
  },

  // Browser Specific Build - ESM only
  {
    entry: {
      index: 'src/browser/index.ts',
      'validation-crypto': 'src/browser/validation-crypto.ts',
      'validation-core': 'src/universal/validation-core.ts',
      'environment-detection': 'src/universal/environment-detection.ts',
      strings: 'src/strings.ts',
      objects: 'src/objects.ts',
      dates: 'src/dates.ts',
      math: 'src/math.ts',
      async: 'src/async.ts',
      environment: 'src/environment.ts',
      errors: 'src/errors.ts',
      validators: 'src/validators.ts',
      number: 'src/number.ts',
    },
    format: ['esm'],
    outDir: 'dist/browser',
    sourcemap: true,
    platform: 'browser',
    external: ['crypto', 'fs/promises', 'path', 'fs', 'os'], // Exclude all Node.js modules
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.js' : '.js',
    }),
  },

  // Types Build (Universal)
  {
    entry: {
      index: 'src/universal/index.ts',
      validation: 'src/universal/validation-core.ts',
      'environment-detection': 'src/universal/environment-detection.ts',
      'validation-crypto-node': 'src/node/validation-crypto.ts',
      'validation-crypto-browser': 'src/browser/validation-crypto.ts',
      strings: 'src/strings.ts',
      objects: 'src/objects.ts',
      dates: 'src/dates.ts',
      math: 'src/math.ts',
      async: 'src/async.ts',
      data: 'src/data.ts',
      environment: 'src/environment.ts',
      errors: 'src/errors.ts',
      csv: 'src/csv.ts',
      json: 'src/json.ts',
      tree: 'src/tree.ts',
      validators: 'src/validators.ts',
      number: 'src/number.ts',
    },
    outDir: 'dist/types',
    platform: 'node', // Use node platform for types to resolve Node.js modules
    dts: {
      only: true,
      resolve: true,
    },
    outExtension: ({ format: _format }) => ({
      dts: '.d.ts',
    }),
  },
])
