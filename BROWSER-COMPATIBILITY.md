# 🌐 Compatibilidad Browser/Node.js - @g10/ts-helpers v4.1.0

## 🚨 Problema Resuelto

**ANTES (v4.0.5)**: Error en Vite/bundlers al importar
`import g from '@g10/ts-helpers'`

```
"createHash" is not exported by "__vite-browser-external"
```

**DESPUÉS (v4.1.0)**: Funciona perfectamente en todos los entornos 🎉

## 📦 Nuevas Opciones de Import

### 1. **Import Universal (Recomendado)**

```typescript
// ✅ Funciona en Browser y Node.js
import g from '@g10/ts-helpers'

// Funciones disponibles:
g.validateNIF('12345678Z') // ✅ Validaciones españolas
g.generateSpanishNIF() // ✅ Generadores
g.toCamelCase('hello-world') // ✅ Strings
g.calculateAverage([1, 2, 3]) // ✅ Matemáticas
g.sleep(1000) // ✅ Async

// ❌ NO disponibles en universal:
// g.hashString()               // Requiere crypto
// g.exportData()               // Requiere fs
```

### 2. **Import Específico Node.js**

```typescript
// ✅ Funcionalidad completa en Node.js
import g from '@g10/ts-helpers/node'

// Todas las funciones disponibles:
g.validateNIF('12345678Z') // ✅ Validaciones
g.hashString('password') // ✅ Crypto seguro
g.generateSecureToken(32) // ✅ Tokens
g.exportData(data, 'file.csv') // ✅ Export archivos
```

### 3. **Import Específico Browser**

```typescript
// ✅ Optimizado para browser
import g from '@g10/ts-helpers/browser'

// Funciones browser-safe:
g.validateNIF('12345678Z') // ✅ Validaciones
g.hashString('text') // ✅ Hash simple (no crypto)
g.generateSecureToken(16) // ✅ Web Crypto API
g.toCamelCase('hello-world') // ✅ Strings

// ❌ NO disponibles en browser:
// g.exportData()               // Requiere Node.js fs
```

### 4. **Imports Específicos (Tree-shaking)**

```typescript
// ✅ Bundle mínimo
import { validateNIF } from '@g10/ts-helpers/validation-core'
import { toCamelCase } from '@g10/ts-helpers/strings'
import { hashString } from '@g10/ts-helpers/validation-crypto'
```

## 🔧 Conditional Exports

El `package.json` detecta automáticamente el entorno:

```json
{
  "exports": {
    ".": {
      "node": "./dist/node-esm/index.js",
      "browser": "./dist/browser/index.js",
      "default": "./dist/esm/index.js"
    }
  }
}
```

## ⚡ Comparación de Builds

| Build         | Crypto     | File System | Tamaño | Uso                    |
| ------------- | ---------- | ----------- | ------ | ---------------------- |
| **Universal** | ❌         | ❌          | ~67KB  | Browser/Node.js seguro |
| **Node.js**   | ✅         | ✅          | ~99KB  | Backend completo       |
| **Browser**   | ⚠️ Web API | ❌          | ~68KB  | Frontend optimizado    |

## 🎯 Guía de Uso por Proyecto

### Frontend (React, Vue, Svelte, etc.)

```typescript
// Opción 1: Import automático (detecta browser)
import g from '@g10/ts-helpers'

// Opción 2: Import explícito browser
import g from '@g10/ts-helpers/browser'

// Opción 3: Imports específicos
import { validateNIF, toCamelCase } from '@g10/ts-helpers'
```

### Backend (Node.js, Express, etc.)

```typescript
// Opción 1: Import automático (detecta Node.js)
import g from '@g10/ts-helpers'

// Opción 2: Import explícito Node.js
import g from '@g10/ts-helpers/node'

// Opción 3: Imports específicos con crypto
import { hashString, exportData } from '@g10/ts-helpers'
```

### Universal/Isomórfico

```typescript
// ✅ Funciona en server y client
import g from '@g10/ts-helpers/universal'

// Solo funciones sin dependencias Node.js
```

## 🔒 Funciones Crypto por Entorno

### Node.js (Crypto Nativo)

```typescript
import g from '@g10/ts-helpers/node'

const hash = g.hashString('password', 'salt') // SHA-256
const token = g.generateSecureToken(32) // randomBytes()
const nonce = g.generateNonce(16) // CSRF tokens
```

### Browser (Web Crypto API)

```typescript
import g from '@g10/ts-helpers/browser'

const hash = g.hashString('password') // Hash simple
const token = g.generateSecureToken(16) // crypto.getRandomValues()
const nonce = g.generateNonce(16) // Nonces seguros
```

### Universal (Sin Crypto)

```typescript
import g from '@g10/ts-helpers'

// ❌ No disponibles:
// g.hashString()
// g.generateSecureToken()

// ✅ Disponibles:
g.validateNIF()
g.generateSpanishNIF()
g.toCamelCase()
```

## 🚀 Migración desde v4.0.5

### Sin Cambios (Funciona igual)

```typescript
// ✅ Sigue funcionando
import g from '@g10/ts-helpers'
g.validateNIF('12345678Z')
```

### Para Funciones Crypto

```typescript
// ❌ Antes: Fallaba en browser
import g from '@g10/ts-helpers'
g.hashString('password')

// ✅ Ahora: Especifica entorno
import g from '@g10/ts-helpers/node' // Backend
import g from '@g10/ts-helpers/browser' // Frontend
g.hashString('password')
```

## 📁 Estructura de Archivos

```
dist/
├── esm/          # Universal (Browser + Node.js safe)
├── cjs/          # Universal CommonJS
├── browser/      # Browser específico (ESM)
├── node/         # Node.js específico (CJS)
├── node-esm/     # Node.js específico (ESM)
└── types/        # TypeScript definitions
```

## ✅ Testing

### Node.js

```bash
node -e "console.log(require('./dist/node/index.js').default.hashString('test'))"
```

### Browser

Abre `test-browser.html` en el navegador para probar funcionalidad completa.

## 🎉 Resultado

- ✅ **Backend**: Funciona perfectamente con funciones crypto y filesystem
- ✅ **Frontend**: Bundle sin dependencias Node.js, compatible con Vite/Webpack
- ✅ **Compatibilidad**: API idéntica, sin breaking changes
- ✅ **Performance**: Tree-shaking optimizado, bundles específicos
