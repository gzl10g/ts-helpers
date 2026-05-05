/**
 * String manipulation utilities
 * Consolidated from primitives/string module
 */

/**
 * Sanitizes a string by removing special characters and converting to lowercase with dashes
 *
 * Produces clean, URL-friendly strings by removing special characters and normalizing whitespace.
 * Useful for slugs, IDs, CSS class names, and filename generation.
 *
 * Transformation rules:
 * 1. Remove all non-alphanumeric characters except spaces
 * 2. Remove additional punctuation (`~!@#$%^&*()_|+-=?;:'",.<>{}[]\\/`)
 * 3. Replace spaces with dashes
 * 4. Convert to lowercase
 *
 * @param instr - Input string to sanitize (null returns empty string)
 * @returns Sanitized string in lowercase with dashes replacing spaces
 *
 * @example
 * ```typescript
 * // Basic sanitization
 * sanitizeString('Hello World!')        // 'hello-world'
 * sanitizeString('user@example.com')    // 'userexamplecom'
 * sanitizeString('Price: $19.99')       // 'price-1999'
 *
 * // Remove accents and special chars
 * sanitizeString('Café Münchën')        // 'caf-mnchen'
 * sanitizeString('北京 2024')            // '2024'
 *
 * // Multiple spaces/dashes
 * sanitizeString('hello   world')       // 'hello---world'
 * sanitizeString('foo-bar_baz')         // 'foo-barbaz'
 *
 * // Edge cases
 * sanitizeString(null)                  // ''
 * sanitizeString('')                    // ''
 * sanitizeString('   ')                 // '---'
 * sanitizeString('123')                 // '123'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Generate CSS class names from user input
 * function generateClassName(userInput: string): string {
 *   return `custom-${sanitizeString(userInput)}`
 * }
 *
 * generateClassName('My Component!')     // 'custom-my-component'
 * generateClassName('Button (Primary)')  // 'custom-button-primary'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Clean product names for file export
 * const products = [
 *   { name: 'T-Shirt (Blue)', sku: 'TS-001' },
 *   { name: 'Shoes & Accessories', sku: 'SH-042' }
 * ]
 *
 * products.forEach(p => {
 *   const filename = `${sanitizeString(p.name)}-${p.sku}.json`
 *   console.log(filename)
 *   // 't-shirt-blue-TS-001.json'
 *   // 'shoes-accessories-SH-042.json'
 * })
 * ```
 *
 * @see {@link toUrlSlug} for more sophisticated URL slug generation with accent removal
 * @see {@link toKebabCase} for case conversion to kebab-case
 */
export const sanitizeString = (instr: string | null): string => {
  if (!instr) return ''
  return addDash(instr.replace(/[^a-zA-Z0-9 ]/g, '')).toLowerCase()
}

function addDash(str: string): string {
  const str2 = str.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/gi, '')
  return str2.replace(/ /g, '-')
}

/**
 * Removes JSON-like characters and HTML entities from a string
 * @param texto Input string to clean
 * @returns String with JSON characters and HTML entities removed
 */
export const cleanJsonChars = (texto: string | null): string => {
  if (!texto) return ''
  return texto.replace(/({|}|&amp;|amp;|gt;)/g, '')
}

/**
 * Truncates a string to a specified maximum length with optional suffix
 *
 * Shortens long strings for display in UI components, tables, previews, and tooltips.
 * Preserves readability while fitting space constraints.
 *
 * Behavior:
 * - If string length ≤ maxlength: returns original string unchanged
 * - If string length > maxlength: returns `str.substring(0, maxlength) + suffix`
 * - Suffix is included in addition to maxlength (not counted within limit)
 * - Null/empty strings return empty string
 *
 * @param str - String to truncate (null/empty returns '')
 * @param maxlength - Maximum length before truncation (default: 80 characters)
 * @param suffix - Suffix to append when truncated (default: '...')
 * @returns Truncated string with suffix if needed, original string if shorter
 *
 * @example
 * ```typescript
 * // Basic truncation (default 80 chars)
 * truncateString('Short text')  // 'Short text' (no truncation)
 *
 * const long = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
 * truncateString(long, 20)  // 'Lorem ipsum dolor si...' (20 + 3 = 23 chars total)
 *
 * // Custom max length
 * truncateString('Hello World', 5)        // 'Hello...'
 * truncateString('Hello World', 11)       // 'Hello World' (no truncation)
 *
 * // Custom suffix
 * truncateString('Long text here', 8, '…')       // 'Long tex…'
 * truncateString('Long text here', 8, ' [more]') // 'Long tex [more]'
 * truncateString('Long text here', 8, '')        // 'Long tex' (no suffix)
 *
 * // Edge cases
 * truncateString('', 10)          // ''
 * truncateString(null as any, 10) // '' (graceful handling)
 * truncateString('Hi', 0)         // '...' (edge case: 0 maxlength)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Truncate product descriptions in table
 * const products = [
 *   { name: 'Laptop', description: 'High-performance laptop with 16GB RAM and 512GB SSD' },
 *   { name: 'Mouse', description: 'Wireless ergonomic mouse' }
 * ]
 *
 * products.forEach(p => {
 *   console.log(`${p.name}: ${truncateString(p.description, 30)}`)
 * })
 * // Output:
 * // Laptop: High-performance laptop with 1...
 * // Mouse: Wireless ergonomic mouse
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Truncate user comments for preview
 * function renderCommentPreview(comment: string): string {
 *   return `<div class="preview">${truncateString(comment, 100)}</div>`
 * }
 *
 * renderCommentPreview('This is a very long comment that needs to be shortened for display...')
 * // '<div class="preview">This is a very long comment that needs to be shortened for display in the UI without taking too m...</div>'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Email subject line truncation
 * function formatEmailSubject(subject: string): string {
 *   // Gmail displays ~60 chars on desktop
 *   return truncateString(subject, 60, '…')
 * }
 *
 * formatEmailSubject('Re: Important meeting about Q4 planning and budget review')
 * // 'Re: Important meeting about Q4 planning and budget review' (fits)
 *
 * formatEmailSubject('Re: [URGENT] Critical system outage affecting all production servers and databases')
 * // 'Re: [URGENT] Critical system outage affecting all production…'
 * ```
 *
 * @see {@link isEmpty} for checking empty strings
 */
export const truncateString = (str: string, maxlength = 80, suffix = '...'): string => {
  if (!str) return ''
  return str.length > maxlength ? str.substring(0, maxlength) + suffix : str
}

/**
 * Converts Unicode escape sequences to their actual characters
 * @param input String containing Unicode escape sequences
 * @returns String with escape sequences converted to actual characters
 */
export const unescapeUnicode = (input: string): string => {
  return JSON.stringify(JSON.parse(`"${input}"`)).replace(/^"(.*)"$/, '$1')
}

/**
 * Ensures a string ends with a specific suffix, adding it if not present
 * @param str Input string to check
 * @param trailing Suffix string to ensure is present at the end
 * @returns String guaranteed to end with the trailing string
 */
export const ensureEndsWith = (str: string, trailing: string): string => {
  return str.endsWith(trailing) ? str : `${str}${trailing}`
}

/**
 * Removes a specific suffix from the end of a string if present
 * @param str Input string to process
 * @param trailing Suffix string to remove from the end
 * @returns String with trailing suffix removed, original if suffix not found
 */
export const stripFromEnd = (str: string, trailing: string): string => {
  return str.endsWith(trailing) ? str.slice(0, -1 * trailing.length) : str
}

/**
 * Ensures a string starts with a specific prefix, adding it if not present
 * @param str Input string to check
 * @param leading Prefix string to ensure is present at the start
 * @returns String guaranteed to start with the leading string
 */
export const ensureStartsWith = (str: string, leading: string): string => {
  return str.startsWith(leading) ? str : `${leading}${str}`
}

/**
 * Removes a specific prefix from the start of a string if present
 * @param str Input string to process
 * @param leading Prefix string to remove from the start
 * @returns String with leading prefix removed, original if prefix not found
 */
export const stripFromStart = (str: string, leading: string): string => {
  return str.startsWith(leading) ? str.slice(leading.length) : str
}

/**
 * Converts all characters in a string to lowercase
 * @param str Input string to convert
 * @returns String with all characters in lowercase
 */
export const toLowerCase = (str: string): string => {
  return str.toLowerCase()
}

/**
 * Converts all characters in a string to uppercase
 * @param str Input string to convert
 * @returns String with all characters in uppercase
 */
export const toUpperCase = (str: string): string => {
  return str.toUpperCase()
}

/**
 * Capitalizes the first letter of a string and lowercases the rest
 * @param str Input string to capitalize
 * @returns String with first letter capitalized and rest in lowercase
 */
export const capitalizeFirst = (str: string): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Capitalizes the first letter of each word in a string
 * @param str Input string with words separated by spaces
 * @returns String with each word's first letter capitalized
 */
export const capitalizeEachWord = (str: string): string => {
  if (!str) return ''
  return str
    .split(' ')
    .map(word => capitalizeFirst(word))
    .join(' ')
}

/**
 * Converts a string to camelCase format
 *
 * Transforms strings from any case convention (kebab-case, snake_case, PascalCase, spaces)
 * to camelCase following JavaScript/TypeScript naming conventions.
 *
 * Algorithm:
 * 1. Detect word boundaries (spaces, hyphens, underscores, case transitions)
 * 2. Split into words and normalize to lowercase
 * 3. First word: keep lowercase
 * 4. Remaining words: capitalize first letter
 * 5. Join without separators
 *
 * Format: `firstWordSecondWordThirdWord`
 *
 * @param str - Input string in any case format (empty returns '')
 * @returns String in camelCase format
 *
 * @example
 * ```typescript
 * // From kebab-case
 * toCamelCase('hello-world')           // 'helloWorld'
 * toCamelCase('user-profile-page')     // 'userProfilePage'
 *
 * // From snake_case
 * toCamelCase('hello_world')           // 'helloWorld'
 * toCamelCase('user_first_name')       // 'userFirstName'
 *
 * // From PascalCase
 * toCamelCase('HelloWorld')            // 'helloWorld'
 * toCamelCase('UserProfile')           // 'userProfile'
 *
 * // From space-separated
 * toCamelCase('hello world')           // 'helloWorld'
 * toCamelCase('First Name')            // 'firstName'
 *
 * // Mixed formats
 * toCamelCase('hello-World_test')      // 'helloWorldTest'
 * toCamelCase('API_Response-data')     // 'apiResponseData'
 *
 * // Edge cases
 * toCamelCase('')                      // ''
 * toCamelCase('a')                     // 'a'
 * toCamelCase('UPPERCASE')             // 'uppercase'
 * toCamelCase('123-test')              // '123Test'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Convert database column names to JS properties
 * const dbColumns = ['user_id', 'first_name', 'last_name', 'created_at']
 *
 * const jsProperties = dbColumns.map(toCamelCase)
 * console.log(jsProperties)
 * // ['userId', 'firstName', 'lastName', 'createdAt']
 *
 * // Transform database row to JS object
 * function transformRow(row: Record<string, any>): Record<string, any> {
 *   return Object.fromEntries(
 *     Object.entries(row).map(([key, value]) => [toCamelCase(key), value])
 *   )
 * }
 *
 * transformRow({ user_id: 123, first_name: 'Alice' })
 * // { userId: 123, firstName: 'Alice' }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Convert CSS property names to JS style properties
 * const cssProperties = [
 *   'background-color',
 *   'font-size',
 *   'margin-top',
 *   'border-bottom-width'
 * ]
 *
 * cssProperties.forEach(prop => {
 *   const jsProp = toCamelCase(prop)
 *   console.log(`${prop} → ${jsProp}`)
 * })
 * // background-color → backgroundColor
 * // font-size → fontSize
 * // margin-top → marginTop
 * // border-bottom-width → borderBottomWidth
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: API response transformation
 * interface ApiUser {
 *   user_id: number
 *   first_name: string
 *   last_name: string
 *   created_at: string
 * }
 *
 * function transformApiResponse(apiData: ApiUser) {
 *   return {
 *     userId: apiData.user_id,
 *     firstName: apiData.first_name,
 *     lastName: apiData.last_name,
 *     createdAt: new Date(apiData.created_at)
 *   }
 * }
 *
 * // Or generically:
 * function autoTransformKeys<T extends Record<string, any>>(obj: T) {
 *   return Object.fromEntries(
 *     Object.entries(obj).map(([k, v]) => [toCamelCase(k), v])
 *   )
 * }
 * ```
 *
 * @see {@link toPascalCase} for PascalCase conversion (first letter uppercase)
 * @see {@link toSnakeCase} for snake_case conversion
 * @see {@link toKebabCase} for kebab-case conversion
 */
export const toCamelCase = (str: string): string => {
  if (!str) return ''

  // Split by word boundaries (spaces, hyphens, underscores, camelCase boundaries)
  const words = str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
    .split(/[-_\s]+/) // Split by separators
    .filter(word => word.length > 0)
    .map(word => word.toLowerCase())

  if (words.length === 0) return ''

  // First word lowercase, rest capitalize first letter
  return (
    words[0] +
    words
      .slice(1)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  )
}

/**
 * Converts a string to snake_case format
 *
 * Transforms strings from any case convention to snake_case, commonly used in
 * Python, Ruby, database column names, and environment variables.
 *
 * Algorithm:
 * 1. Replace non-word characters with spaces
 * 2. Split on spaces and camelCase boundaries
 * 3. Convert all words to lowercase
 * 4. Join with underscores
 *
 * Format: `first_word_second_word_third_word`
 *
 * @param str - Input string in any case format (empty returns '')
 * @returns String in snake_case format
 *
 * @example
 * ```typescript
 * // From camelCase
 * toSnakeCase('helloWorld')            // 'hello_world'
 * toSnakeCase('userFirstName')         // 'user_first_name'
 *
 * // From PascalCase
 * toSnakeCase('HelloWorld')            // 'hello_world'
 * toSnakeCase('UserProfile')           // 'user_profile'
 *
 * // From kebab-case
 * toSnakeCase('hello-world')           // 'hello_world'
 * toSnakeCase('user-profile-page')     // 'user_profile_page'
 *
 * // From space-separated
 * toSnakeCase('hello world')           // 'hello_world'
 * toSnakeCase('First Name')            // 'first_name'
 *
 * // Mixed formats
 * toSnakeCase('helloWorld-test')       // 'hello_world_test'
 * toSnakeCase('APIResponse')           // 'a_p_i_response'
 *
 * // Edge cases
 * toSnakeCase('')                      // ''
 * toSnakeCase('a')                     // 'a'
 * toSnakeCase('UPPERCASE')             // 'u_p_p_e_r_c_a_s_e'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Convert JS properties to database column names
 * const jsObject = {
 *   userId: 123,
 *   firstName: 'Alice',
 *   lastName: 'Smith',
 *   createdAt: new Date()
 * }
 *
 * const dbColumns = Object.keys(jsObject).map(toSnakeCase)
 * console.log(dbColumns)
 * // ['user_id', 'first_name', 'last_name', 'created_at']
 *
 * // Generate SQL INSERT statement
 * const columns = Object.keys(jsObject).map(toSnakeCase).join(', ')
 * const sql = `INSERT INTO users (${columns}) VALUES (?)`
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Environment variable generation
 * const configKeys = ['databaseHost', 'databasePort', 'apiBaseUrl']
 *
 * configKeys.forEach(key => {
 *   const envVar = toSnakeCase(key).toUpperCase()
 *   console.log(`${envVar}=value`)
 * })
 * // DATABASE_HOST=value
 * // DATABASE_PORT=value
 * // API_BASE_URL=value
 * ```
 *
 * @see {@link toCamelCase} for camelCase conversion
 * @see {@link toKebabCase} for kebab-case conversion
 * @see {@link toPascalCase} for PascalCase conversion
 */
export const toSnakeCase = (str: string): string => {
  if (!str) return ''
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_')
}

/**
 * Converts a string to kebab-case format
 *
 * Transforms strings from any case convention to kebab-case (also called dash-case or hyphen-case).
 * Widely used in URLs, HTML attributes, CSS classes, and file names.
 *
 * Algorithm:
 * 1. Replace underscores and spaces with hyphens
 * 2. Insert hyphens before uppercase letters (handle camelCase)
 * 3. Convert all to lowercase
 * 4. Remove non-alphanumeric characters (except hyphens)
 * 5. Collapse multiple consecutive hyphens
 * 6. Remove leading/trailing hyphens
 *
 * Format: `first-word-second-word-third-word`
 *
 * @param str - Input string in any case format (empty returns '')
 * @returns String in kebab-case format
 *
 * @example
 * ```typescript
 * // From camelCase
 * toKebabCase('helloWorld')            // 'hello-world'
 * toKebabCase('userFirstName')         // 'user-first-name'
 *
 * // From PascalCase
 * toKebabCase('HelloWorld')            // 'hello-world'
 * toKebabCase('UserProfile')           // 'user-profile'
 *
 * // From snake_case
 * toKebabCase('hello_world')           // 'hello-world'
 * toKebabCase('user_first_name')       // 'user-first-name'
 *
 * // From space-separated
 * toKebabCase('hello world')           // 'hello-world'
 * toKebabCase('First Name')            // 'first-name'
 *
 * // Mixed formats
 * toKebabCase('helloWorld_test')       // 'hello-world-test'
 * toKebabCase('API-Response')          // 'api-response'
 *
 * // Edge cases
 * toKebabCase('')                      // ''
 * toKebabCase('a')                     // 'a'
 * toKebabCase('UPPERCASE')             // 'uppercase'
 * toKebabCase('123Test')               // '123-test'
 * toKebabCase('--multiple--dashes--')  // 'multiple-dashes'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Generate URL slugs from page titles
 * const pageTitle = 'My Awesome Blog Post'
 * const urlSlug = toKebabCase(pageTitle)
 * const url = `https://example.com/blog/${urlSlug}`
 * // https://example.com/blog/my-awesome-blog-post
 *
 * // Multiple pages
 * const pages = [
 *   { title: 'Getting Started', component: 'GettingStarted' },
 *   { title: 'API Reference', component: 'ApiReference' },
 *   { title: 'Best Practices', component: 'BestPractices' }
 * ]
 *
 * const routes = pages.map(p => ({
 *   path: `/${toKebabCase(p.title)}`,
 *   component: p.component
 * }))
 * // [
 * //   { path: '/getting-started', component: 'GettingStarted' },
 * //   { path: '/api-reference', component: 'ApiReference' },
 * //   { path: '/best-practices', component: 'BestPractices' }
 * // ]
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: CSS class name generation
 * function generateClassName(componentName: string, modifier?: string): string {
 *   const base = `component-${toKebabCase(componentName)}`
 *   return modifier ? `${base}--${toKebabCase(modifier)}` : base
 * }
 *
 * generateClassName('UserProfile')                    // 'component-user-profile'
 * generateClassName('UserProfile', 'isActive')        // 'component-user-profile--is-active'
 * generateClassName('ButtonPrimary', 'largeSize')     // 'component-button-primary--large-size'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: HTML attribute generation
 * function generateDataAttribute(key: string, value: string): string {
 *   return `data-${toKebabCase(key)}="${value}"`
 * }
 *
 * generateDataAttribute('userId', '123')              // 'data-user-id="123"'
 * generateDataAttribute('testEnvironment', 'staging') // 'data-test-environment="staging"'
 * ```
 *
 * @see {@link toCamelCase} for camelCase conversion
 * @see {@link toSnakeCase} for snake_case conversion
 * @see {@link toPascalCase} for PascalCase conversion
 * @see {@link toUrlSlug} for URL-safe slug generation with accent removal
 */
export const toKebabCase = (str: string): string => {
  if (!str) return ''
  return str
    .replace(/[_\s]+/g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Handle numbers before capitals too
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Converts a string to PascalCase format
 *
 * Transforms strings from any case convention to PascalCase (also called UpperCamelCase).
 * Commonly used for class names, component names, type names, and constructor functions
 * in JavaScript/TypeScript.
 *
 * Algorithm:
 * 1. Split on word boundaries (hyphens, underscores, spaces)
 * 2. Capitalize first letter of each word
 * 3. Join without separators
 * 4. Ensure first character is uppercase
 *
 * Format: `FirstWordSecondWordThirdWord`
 *
 * @param str - Input string in any case format (empty returns '')
 * @returns String in PascalCase format
 *
 * @example
 * ```typescript
 * // From camelCase
 * toPascalCase('helloWorld')           // 'HelloWorld'
 * toPascalCase('userFirstName')        // 'UserFirstName'
 *
 * // From kebab-case
 * toPascalCase('hello-world')          // 'HelloWorld'
 * toPascalCase('user-profile-page')    // 'UserProfilePage'
 *
 * // From snake_case
 * toPascalCase('hello_world')          // 'HelloWorld'
 * toPascalCase('user_first_name')      // 'UserFirstName'
 *
 * // From space-separated
 * toPascalCase('hello world')          // 'HelloWorld'
 * toPascalCase('first name')           // 'FirstName'
 *
 * // Mixed formats
 * toPascalCase('hello-World_test')     // 'HelloWorldTest'
 * toPascalCase('api_response-data')    // 'ApiResponseData'
 *
 * // Edge cases
 * toPascalCase('')                     // ''
 * toPascalCase('a')                    // 'A'
 * toPascalCase('UPPERCASE')            // 'UPPERCASE'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Generate React component names
 * const componentNames = ['user-profile', 'navigation-bar', 'footer-links']
 *
 * componentNames.forEach(name => {
 *   const pascalName = toPascalCase(name)
 *   console.log(`export function ${pascalName}() { ... }`)
 * })
 * // export function UserProfile() { ... }
 * // export function NavigationBar() { ... }
 * // export function FooterLinks() { ... }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: TypeScript type name generation
 * interface GenerateTypeOptions {
 *   name: string
 *   fields: Array<{ name: string; type: string }>
 * }
 *
 * function generateTypeDefinition(options: GenerateTypeOptions): string {
 *   const typeName = toPascalCase(options.name)
 *   const fields = options.fields
 *     .map(f => `  ${f.name}: ${f.type}`)
 *     .join('\n')
 *
 *   return `interface ${typeName} {\n${fields}\n}`
 * }
 *
 * generateTypeDefinition({
 *   name: 'user-profile',
 *   fields: [
 *     { name: 'userId', type: 'number' },
 *     { name: 'name', type: 'string' }
 *   ]
 * })
 * // interface UserProfile {
 * //   userId: number
 * //   name: string
 * // }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Class name generation for dynamic imports
 * async function loadService(serviceName: string) {
 *   const className = toPascalCase(serviceName)
 *   const module = await import(`./services/${serviceName}`)
 *   return new module[className]()
 * }
 *
 * await loadService('user-service')     // new UserService()
 * await loadService('payment-gateway')  // new PaymentGateway()
 * ```
 *
 * @see {@link toCamelCase} for camelCase conversion (first letter lowercase)
 * @see {@link toSnakeCase} for snake_case conversion
 * @see {@link toKebabCase} for kebab-case conversion
 */
export const toPascalCase = (str: string): string => {
  if (!str) return ''
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^./, char => char.toUpperCase())
}

/**
 * Checks if a string contains another string with optional case sensitivity
 * @param str String to search within
 * @param searchStr Substring to search for
 * @param caseSensitive Whether to perform case-sensitive search (default: false)
 * @returns True if the string contains the search string, false otherwise
 */
export const contains = (str: string, searchStr: string, caseSensitive = false): boolean => {
  if (caseSensitive) {
    return str.includes(searchStr)
  }
  return str.toLowerCase().includes(searchStr.toLowerCase())
}

/**
 * Checks if a string starts with another string with optional case sensitivity
 * @param str String to check
 * @param searchStr Prefix to search for
 * @param caseSensitive Whether to perform case-sensitive search (default: false)
 * @returns True if the string starts with the search string, false otherwise
 */
export const startsWith = (str: string, searchStr: string, caseSensitive = false): boolean => {
  if (caseSensitive) {
    return str.startsWith(searchStr)
  }
  return str.toLowerCase().startsWith(searchStr.toLowerCase())
}

/**
 * Checks if a string ends with another string with optional case sensitivity
 * @param str String to check
 * @param searchStr Suffix to search for
 * @param caseSensitive Whether to perform case-sensitive search (default: false)
 * @returns True if the string ends with the search string, false otherwise
 */
export const endsWith = (str: string, searchStr: string, caseSensitive = false): boolean => {
  if (caseSensitive) {
    return str.endsWith(searchStr)
  }
  return str.toLowerCase().endsWith(searchStr.toLowerCase())
}

/**
 * Pads a string at the start (left) with a specific character to reach target length
 * @param str String to pad
 * @param length Target length for the resulting string
 * @param padChar Character to use for padding (default: space)
 * @returns String padded to target length, original if already longer
 */
export const padStart = (str: string, length: number, padChar = ' '): string => {
  return str.padStart(length, padChar)
}

/**
 * Pads a string at the end (right) with a specific character to reach target length
 * @param str String to pad
 * @param length Target length for the resulting string
 * @param padChar Character to use for padding (default: space)
 * @returns String padded to target length, original if already longer
 */
export const padEnd = (str: string, length: number, padChar = ' '): string => {
  if (str.length >= length) return str
  return str + padChar.repeat(length - str.length)
}

/**
 * Removes leading and trailing whitespace from a string
 * @param str String to trim
 * @returns String with leading and trailing whitespace removed
 */
export const trim = (str: string): string => {
  return str.trim()
}

/**
 * Removes leading (start) whitespace from a string
 * @param str String to trim
 * @returns String with leading whitespace removed
 */
export const trimStart = (str: string): string => {
  return str.trimStart()
}

/**
 * Removes trailing (end) whitespace from a string
 * @param str String to trim
 * @returns String with trailing whitespace removed
 */
export const trimEnd = (str: string): string => {
  return str.trimEnd()
}

/**
 * Reverses the character order in a string
 * @param str String to reverse
 * @returns String with characters in reverse order
 */
export const reverseString = (str: string): string => {
  return str.split('').reverse().join('')
}

/**
 * Repeats a string a specified number of times
 * @param str String to repeat
 * @param times Number of times to repeat the string
 * @returns String repeated the specified number of times
 */
export const repeatString = (str: string, times: number): string => {
  return str.repeat(times)
}

/**
 * Replaces all occurrences of a substring with a replacement string
 * @param str String to search in
 * @param searchStr Substring to find and replace
 * @param replaceStr String to replace each occurrence with
 * @returns String with all occurrences replaced
 */
export const replaceAllOccurrences = (
  str: string,
  searchStr: string,
  replaceStr: string
): string => {
  return str.split(searchStr).join(replaceStr)
}

/**
 * Counts the number of occurrences of a substring within a string
 * @param str String to search within
 * @param searchStr Substring to count occurrences of
 * @returns Number of times the substring appears in the string
 */
export const countOccurrences = (str: string, searchStr: string): number => {
  if (!searchStr) return 0
  let count = 0
  let position = 0

  while ((position = str.indexOf(searchStr, position)) !== -1) {
    count++
    position += 1 // Move only 1 position to allow overlapping matches
  }

  return count
}

/**
 * Checks if a string is empty, null, undefined, or contains only whitespace
 * @param str String to check (can be null or undefined)
 * @returns True if string is empty/null/undefined or only whitespace, false otherwise
 */
export const isEmpty = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0
}

/**
 * Validates if a string is a properly formatted email address
 * @param str String to validate as email
 * @returns True if string matches email format, false otherwise
 */
export const isEmail = (str: string): boolean => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(str.toLowerCase())
}

/**
 * Generates a URL-friendly slug from a string
 *
 * Creates clean, SEO-friendly URL slugs by normalizing strings for use in web addresses.
 * Removes special characters, normalizes whitespace, and converts to lowercase with hyphens.
 * Accented characters are transliterated to their ASCII base (e.g., `é` → `e`, `ñ` → `n`).
 *
 * Algorithm:
 * 1. Convert to lowercase
 * 2. Trim leading/trailing whitespace
 * 3. Normalize to NFD and strip combining diacritical marks (accent removal)
 * 4. Remove non-word characters (except spaces and hyphens)
 * 5. Replace spaces/underscores/multiple-hyphens with single hyphen
 * 6. Remove leading/trailing hyphens
 *
 * Format: `url-friendly-slug-text`
 *
 * @param str - String to convert to URL slug
 * @returns URL-friendly slug string in lowercase with hyphens
 *
 * @example
 * ```typescript
 * // Basic slug generation
 * toUrlSlug('Hello World')              // 'hello-world'
 * toUrlSlug('My Blog Post Title')       // 'my-blog-post-title'
 *
 * // Accented characters are transliterated
 * toUrlSlug('café')                     // 'cafe'
 * toUrlSlug('ñoño')                     // 'nono'
 * toUrlSlug('¡Café con Ñ!')             // 'cafe-con-n'
 * toUrlSlug('Café Münchën 2024')        // 'cafe-munchen-2024'
 *
 * // Remove special characters
 * toUrlSlug('User: John Doe!')          // 'user-john-doe'
 * toUrlSlug('Price: $19.99')            // 'price-1999'
 * toUrlSlug('Hello @ World #2024')      // 'hello-world-2024'
 *
 * // Normalize whitespace and separators
 * toUrlSlug('hello   world')            // 'hello-world'
 * toUrlSlug('hello_world_test')         // 'hello-world-test'
 * toUrlSlug('---multiple---dashes---')  // 'multiple-dashes'
 *
 * // Preserve numbers and hyphens
 * toUrlSlug('Article 123')              // 'article-123'
 * toUrlSlug('ES6-Features')             // 'es6-features'
 *
 * // Edge cases
 * toUrlSlug('')                         // ''
 * toUrlSlug('   ')                      // ''
 * toUrlSlug('123')                      // '123'
 * toUrlSlug('a-b-c')                    // 'a-b-c'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Generate blog post URL from title
 * function createBlogPostUrl(title: string, id: number): string {
 *   const slug = toUrlSlug(title)
 *   return `/blog/${id}/${slug}`
 * }
 *
 * createBlogPostUrl('10 Tips for TypeScript', 42)
 * // '/blog/42/10-tips-for-typescript'
 *
 * createBlogPostUrl('Café con Leche: A Guide', 7)
 * // '/blog/7/cafe-con-leche-a-guide'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Generate unique slugs for duplicate titles
 * const existingSlugs = new Set(['hello-world', 'hello-world-1'])
 *
 * function generateUniqueSlug(title: string): string {
 *   let slug = toUrlSlug(title)
 *   let counter = 1
 *
 *   while (existingSlugs.has(slug)) {
 *     slug = `${toUrlSlug(title)}-${counter}`
 *     counter++
 *   }
 *
 *   existingSlugs.add(slug)
 *   return slug
 * }
 *
 * generateUniqueSlug('Hello World')  // 'hello-world-2' (avoiding existing)
 * generateUniqueSlug('New Article')  // 'new-article'
 * ```
 *
 * @see {@link toKebabCase} for case conversion to kebab-case
 * @see {@link sanitizeString} for basic string sanitization
 */
export const toUrlSlug = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Removes accents and diacritical marks from characters in a string
 *
 * Uses Unicode normalization (NFD) to decompose accented characters, then removes
 * combining diacritical marks. Essential for search, sorting, URL slugs, and ASCII compatibility.
 *
 * Algorithm:
 * 1. Normalize string to NFD (Normalization Form Decomposed)
 * 2. Remove Unicode combining diacritical marks (U+0300–U+036F)
 * 3. Return ASCII-compatible base characters
 *
 * Supported diacritics: acute (´), grave (`), circumflex (^), tilde (~), umlaut (¨),
 * cedilla (¸), and many more.
 *
 * @param str - String containing accented characters (e.g., 'café', 'Münchën')
 * @returns String with accents removed to base ASCII characters (e.g., 'cafe', 'Munchen')
 *
 * @example
 * ```typescript
 * // Basic accent removal - Romance languages
 * removeAccents('café')              // 'cafe'
 * removeAccents('naïve')             // 'naive'
 * removeAccents('résumé')            // 'resume'
 * removeAccents('à côté')            // 'a cote'
 *
 * // Spanish accents
 * removeAccents('Español')           // 'Espanol'
 * removeAccents('niño')              // 'nino'
 * removeAccents('José María')        // 'Jose Maria'
 *
 * // German umlauts
 * removeAccents('Münchën')           // 'Munchen'
 * removeAccents('Köln')              // 'Koln'
 * removeAccents('Zürich')            // 'Zurich'
 *
 * // Portuguese
 * removeAccents('São Paulo')         // 'Sao Paulo'
 * removeAccents('Brasília')          // 'Brasilia'
 *
 * // French
 * removeAccents('Côte d'Ivoire')     // 'Cote d'Ivoire'
 * removeAccents('Françoise')         // 'Francoise'
 *
 * // Mixed
 * removeAccents('Crème brûlée')      // 'Creme brulee'
 * removeAccents('Åre, Malmö')        // 'Are, Malmo'
 *
 * // Edge cases
 * removeAccents('')                  // ''
 * removeAccents('ASCII text')        // 'ASCII text' (unchanged)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Search normalization (case + accent insensitive)
 * function normalizeForSearch(text: string): string {
 *   return removeAccents(text.toLowerCase().trim())
 * }
 *
 * const searchQuery = normalizeForSearch('Café')           // 'cafe'
 * const productName = normalizeForSearch('CAFÉ PREMIUM')   // 'cafe premium'
 *
 * if (productName.includes(searchQuery)) {
 *   console.log('Match found!')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Generate SEO-friendly URLs
 * function createSeoUrl(title: string): string {
 *   return toUrlSlug(removeAccents(title))
 * }
 *
 * createSeoUrl('Guía de Español')
 * // 'guia-de-espanol'
 *
 * createSeoUrl('Café Münchën 2024')
 * // 'cafe-munchen-2024'
 *
 * createSeoUrl('São Paulo: Best Restaurants')
 * // 'sao-paulo-best-restaurants'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Sort names alphabetically (accent-insensitive)
 * const names = ['Álvarez', 'Andersen', 'Ängel', 'Adams']
 *
 * const sorted = names.sort((a, b) =>
 *   removeAccents(a).localeCompare(removeAccents(b))
 * )
 * // ['Adams', 'Álvarez', 'Andersen', 'Ängel']
 * // (sorted by: Adams, Alvarez, Andersen, Angel)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Filename sanitization
 * function sanitizeFilename(filename: string): string {
 *   // Remove accents, then sanitize
 *   const withoutAccents = removeAccents(filename)
 *   return sanitizeString(withoutAccents)
 * }
 *
 * sanitizeFilename('Presentación_2024.pdf')
 * // 'presentacion-2024pdf'
 *
 * sanitizeFilename('Föräldrar & Barn.docx')
 * // 'foraldrar-barn-docx'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Email address generation
 * function generateEmail(firstName: string, lastName: string): string {
 *   const first = removeAccents(firstName.toLowerCase())
 *   const last = removeAccents(lastName.toLowerCase())
 *   return `${first}.${last}@company.com`
 * }
 *
 * generateEmail('José', 'García')
 * // 'jose.garcia@company.com'
 *
 * generateEmail('François', 'Müller')
 * // 'francois.muller@company.com'
 * ```
 *
 * @see {@link toUrlSlug} for URL slug generation (combine with removeAccents for best results)
 * @see {@link sanitizeString} for string sanitization
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize String.normalize() Documentation}
 */
export const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Escapes HTML special characters to prevent XSS and display issues
 *
 * Converts dangerous HTML characters to their HTML entity equivalents, preventing
 * script injection (XSS) and ensuring proper text display in HTML contexts.
 *
 * Escaped characters:
 * - `&` → `&amp;` (must be first to avoid double-escaping)
 * - `<` → `&lt;` (prevents opening tags)
 * - `>` → `&gt;` (prevents closing tags)
 * - `"` → `&quot;` (prevents attribute injection)
 * - `'` → `&#39;` (prevents attribute injection)
 *
 * ⚠️ SECURITY WARNING: This provides basic XSS protection but is NOT a complete solution.
 * For production HTML sanitization, use DOMPurify or similar dedicated libraries.
 * This function is safe for:
 * - Displaying user input as plain text in HTML
 * - Escaping attribute values in HTML
 * - Simple content rendering
 *
 * NOT sufficient for:
 * - Rich HTML content (use DOMPurify)
 * - JavaScript context (use different escaping)
 * - URL context (use encodeURIComponent)
 * - CSS context (use CSS-specific escaping)
 *
 * @param str - String containing HTML characters to escape
 * @returns String with HTML characters safely escaped as HTML entities
 *
 * @example
 * ```typescript
 * // Basic escaping
 * escapeHtmlChars('<script>alert("XSS")</script>')
 * // '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * escapeHtmlChars('5 < 10 & 10 > 5')
 * // '5 &lt; 10 &amp; 10 &gt; 5'
 *
 * escapeHtmlChars('Say "Hello" & \'Goodbye\'')
 * // 'Say &quot;Hello&quot; &amp; &#39;Goodbye&#39;'
 *
 * // Edge cases
 * escapeHtmlChars('')                  // ''
 * escapeHtmlChars('No special chars')  // 'No special chars'
 * escapeHtmlChars('&lt;')              // '&amp;lt;' (escapes already-escaped)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Safely display user comments in HTML
 * interface Comment {
 *   author: string
 *   content: string
 * }
 *
 * function renderComment(comment: Comment): string {
 *   const safeAuthor = escapeHtmlChars(comment.author)
 *   const safeContent = escapeHtmlChars(comment.content)
 *
 *   return `
 *     <div class="comment">
 *       <strong>${safeAuthor}</strong>
 *       <p>${safeContent}</p>
 *     </div>
 *   `
 * }
 *
 * renderComment({
 *   author: '<script>alert("XSS")</script>',
 *   content: 'Great post! <3'
 * })
 * // Safe HTML output with escaped tags
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Generate safe HTML attributes
 * function generateDataAttribute(key: string, value: string): string {
 *   const safeKey = toKebabCase(key)
 *   const safeValue = escapeHtmlChars(value)
 *   return `data-${safeKey}="${safeValue}"`
 * }
 *
 * generateDataAttribute('userInput', '<script>alert(1)</script>')
 * // 'data-user-input="&lt;script&gt;alert(1)&lt;/script&gt;"'
 *
 * generateDataAttribute('description', 'Product "Premium" & more')
 * // 'data-description="Product &quot;Premium&quot; &amp; more"'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Escape user search query for display
 * function displaySearchResults(query: string, results: any[]): string {
 *   const safeQuery = escapeHtmlChars(query)
 *
 *   return `
 *     <div class="search-results">
 *       <h2>Results for: ${safeQuery}</h2>
 *       <p>${results.length} results found</p>
 *     </div>
 *   `
 * }
 *
 * displaySearchResults('<img src=x onerror=alert(1)>', [])
 * // Safe display: "Results for: &lt;img src=x onerror=alert(1)&gt;"
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: CSV to HTML table with safe content
 * function csvRowToHtmlRow(cells: string[]): string {
 *   const safeCells = cells.map(cell => escapeHtmlChars(cell))
 *   const tdElements = safeCells.map(cell => `<td>${cell}</td>`).join('')
 *   return `<tr>${tdElements}</tr>`
 * }
 *
 * csvRowToHtmlRow(['Alice', '<script>evil</script>', '25'])
 * // '<tr><td>Alice</td><td>&lt;script&gt;evil&lt;/script&gt;</td><td>25</td></tr>'
 * ```
 *
 * @example
 * ```typescript
 * // Edge case: Preventing double-escaping
 * const userInput = 'Hello & Goodbye'
 * const escaped = escapeHtmlChars(userInput)
 * // 'Hello &amp; Goodbye'
 *
 * const doubleEscaped = escapeHtmlChars(escaped)
 * // 'Hello &amp;amp; Goodbye' ⚠️ Over-escaped!
 *
 * // Solution: Only escape once, track escaped state
 * interface SafeString {
 *   value: string
 *   isEscaped: boolean
 * }
 *
 * function safeEscape(str: string | SafeString): SafeString {
 *   if (typeof str === 'object' && str.isEscaped) {
 *     return str
 *   }
 *   const value = typeof str === 'string' ? str : str.value
 *   return { value: escapeHtmlChars(value), isEscaped: true }
 * }
 * ```
 *
 * @see {@link unescapeHtmlChars} for reversing HTML entity escaping
 * @see {@link sanitizeString} for basic string sanitization
 * @see {@link https://owasp.org/www-community/attacks/xss/ OWASP XSS Prevention Cheat Sheet}
 * @see {@link https://github.com/cure53/DOMPurify DOMPurify for production HTML sanitization}
 */
export const escapeHtmlChars = (str: string): string => {
  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, match => htmlEscapes[match])
}

/**
 * Converts HTML entities back to their original characters
 * @param str String containing HTML entities to unescape
 * @returns String with HTML entities converted back to original characters
 */
export const unescapeHtmlChars = (str: string): string => {
  const htmlUnescapes: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  }
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, match => htmlUnescapes[match])
}

/**
 * Checks if a path matches a wildcard pattern using dot notation
 *
 * Supports wildcards (*) to match any segment at that position.
 * Useful for configuration paths, routing, permissions, and feature flags.
 *
 * @param path - Dot-notation path to test (e.g., 'features.auth.enabled')
 * @param pattern - Pattern with optional wildcards (e.g., 'features.*', 'features.*.enabled')
 * @returns True if path matches pattern, false otherwise
 *
 * @example
 * ```typescript
 * // Exact match
 * matchPathPattern('features.auth', 'features.auth')  // true
 *
 * // Wildcard at end
 * matchPathPattern('features.auth', 'features.*')     // true
 * matchPathPattern('features.payments', 'features.*') // true
 * matchPathPattern('other.value', 'features.*')       // false
 *
 * // Wildcard in middle
 * matchPathPattern('features.auth.enabled', 'features.*.enabled')     // true
 * matchPathPattern('features.payments.enabled', 'features.*.enabled') // true
 * matchPathPattern('features.auth.disabled', 'features.*.enabled')    // false
 *
 * // Multiple wildcards
 * matchPathPattern('app.features.auth.oauth', 'app.*.*.oauth')        // true
 * matchPathPattern('app.features.auth.saml', 'app.*.*.oauth')         // false
 *
 * // No wildcard
 * matchPathPattern('exact.path.match', 'exact.path.match')            // true
 * matchPathPattern('exact.path.nomatch', 'exact.path.match')          // false
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Feature flag matching
 * const enabledFeatures = [
 *   'features.auth.oauth',
 *   'features.auth.saml',
 *   'features.payments.stripe',
 * ]
 *
 * const hasAuth = enabledFeatures.some(f =>
 *   matchPathPattern(f, 'features.auth.*')
 * ) // true
 *
 * const hasPayments = enabledFeatures.some(f =>
 *   matchPathPattern(f, 'features.payments.*')
 * ) // true
 *
 * // Permission matching
 * const userPermissions = ['admin.users.read', 'admin.users.write']
 * const canManageUsers = userPermissions.some(p =>
 *   matchPathPattern(p, 'admin.users.*')
 * ) // true
 * ```
 */
export function matchPathPattern(path: string, pattern: string): boolean {
  if (!path || typeof path !== 'string' || !pattern || typeof pattern !== 'string') {
    return false
  }

  // Exact match
  if (path === pattern) {
    return true
  }

  // No wildcard in pattern
  if (!pattern.includes('*')) {
    return path === pattern
  }

  // Convert pattern to regex
  // Escape special regex characters except *
  const regexPattern = pattern
    .split('.')
    .map(segment => {
      if (segment === '*') {
        return '[^.]+'
      }
      // Escape special regex chars
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('\\.')

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}

/**
 * Converts an environment variable key to dot-notation path
 *
 * Transforms uppercase underscore-separated env var names to lowercase
 * dot-notation paths. Optionally removes a prefix.
 *
 * Common convention: ENV_VAR_NAME → env.var.name
 *
 * @param envKey - Environment variable key (e.g., 'NX_FEATURES_AUTH', 'APP_DATABASE_HOST')
 * @param prefix - Optional prefix to remove (e.g., 'NX', 'APP'). Default: 'NX'
 * @returns Dot-notation path in lowercase
 *
 * @example
 * ```typescript
 * // Default prefix (NX)
 * envKeyToPath('NX_FEATURES_AUTH')           // 'features.auth'
 * envKeyToPath('NX_FEATURES_PAYMENTS')       // 'features.payments'
 * envKeyToPath('NX_DATABASE_HOST')           // 'database.host'
 *
 * // Custom prefix
 * envKeyToPath('APP_DATABASE_HOST', 'APP')   // 'database.host'
 * envKeyToPath('MY_CONFIG_VALUE', 'MY')      // 'config.value'
 *
 * // No prefix
 * envKeyToPath('DATABASE_HOST', '')          // 'database.host'
 * envKeyToPath('FEATURES_AUTH', '')          // 'features.auth'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Parse environment variables to config object
 * const envVars = {
 *   'APP_DATABASE_HOST': 'localhost',
 *   'APP_DATABASE_PORT': '5432',
 *   'APP_CACHE_TTL': '3600',
 * }
 *
 * const config = {}
 * Object.entries(envVars).forEach(([key, value]) => {
 *   const path = envKeyToPath(key, 'APP')
 *   // Use with setDeepValue: setDeepValue(config, path, value)
 * })
 * // Paths: 'database.host', 'database.port', 'cache.ttl'
 * ```
 */
export function envKeyToPath(envKey: string, prefix: string = 'NX'): string {
  if (!envKey || typeof envKey !== 'string') {
    return ''
  }

  let key = envKey.trim()

  // Remove prefix if provided and matches
  if (prefix && key.startsWith(`${prefix}_`)) {
    key = key.substring(prefix.length + 1)
  }

  // Convert to lowercase and replace underscores with dots
  return key.toLowerCase().replace(/_/g, '.')
}

/**
 * Converts a dot-notation path to environment variable key format
 *
 * Transforms lowercase dot-notation paths to uppercase underscore-separated
 * env var names. Optionally adds a prefix.
 *
 * Common convention: env.var.name → ENV_VAR_NAME
 *
 * @param path - Dot-notation path (e.g., 'features.auth', 'database.host')
 * @param prefix - Optional prefix to add (e.g., 'NX', 'APP'). Default: 'NX'
 * @returns Environment variable key in uppercase
 *
 * @example
 * ```typescript
 * // Default prefix (NX)
 * pathToEnvKey('features.auth')              // 'NX_FEATURES_AUTH'
 * pathToEnvKey('features.payments')          // 'NX_FEATURES_PAYMENTS'
 * pathToEnvKey('database.host')              // 'NX_DATABASE_HOST'
 *
 * // Custom prefix
 * pathToEnvKey('database.host', 'APP')       // 'APP_DATABASE_HOST'
 * pathToEnvKey('config.value', 'MY')         // 'MY_CONFIG_VALUE'
 *
 * // No prefix
 * pathToEnvKey('database.host', '')          // 'DATABASE_HOST'
 * pathToEnvKey('features.auth', '')          // 'FEATURES_AUTH'
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Generate .env file from config object
 * const config = {
 *   database: { host: 'localhost', port: 5432 },
 *   cache: { ttl: 3600 }
 * }
 *
 * const envVars = [
 *   `${pathToEnvKey('database.host', 'APP')}=localhost`,
 *   `${pathToEnvKey('database.port', 'APP')}=5432`,
 *   `${pathToEnvKey('cache.ttl', 'APP')}=3600`,
 * ]
 * // Output:
 * // APP_DATABASE_HOST=localhost
 * // APP_DATABASE_PORT=5432
 * // APP_CACHE_TTL=3600
 * ```
 */
export function pathToEnvKey(path: string, prefix: string = 'NX'): string {
  if (!path || typeof path !== 'string') {
    return ''
  }

  // Convert dots to underscores and uppercase
  const key = path.trim().toUpperCase().replace(/\./g, '_')

  // Return empty if path was just whitespace
  if (key.length === 0) {
    return ''
  }

  // Add prefix if provided
  if (prefix && prefix.length > 0) {
    return `${prefix.toUpperCase()}_${key}`
  }

  return key
}
