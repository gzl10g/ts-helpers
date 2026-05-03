/**
 * Tree Structure Rendering Utilities
 *
 * Provides ASCII/Unicode tree visualization for hierarchical data structures.
 * Features:
 * - Customizable box-drawing characters (Unicode or ASCII)
 * - Flexible label extraction (field name or custom function)
 * - Recursive rendering with proper indentation
 * - Multiple root support
 * - Zero dependencies
 *
 * @module tree
 */

/**
 * Configuration options for tree rendering
 *
 * Controls the visual appearance and label extraction strategy for ASCII/Unicode tree output.
 * All options have sensible defaults for immediate use with Unicode box-drawing characters.
 *
 * @property labelField - Object property name to use as node label (default: 'name')
 * @property verticalLine - Character sequence for vertical continuation (default: '│   ')
 * @property middleBranch - Character sequence for non-last child branch (default: '├── ')
 * @property lastBranch - Character sequence for last child branch (default: '└── ')
 * @property emptySpace - Character sequence for empty space after last branch (default: '    ')
 * @property labelFunction - Custom function to extract/format node labels (overrides labelField)
 *
 * @example
 * ```typescript
 * // Unicode box-drawing (default)
 * const unicodeOptions: TreeExportOptions = {
 *   labelField: 'name',
 *   verticalLine: '│   ',
 *   middleBranch: '├── ',
 *   lastBranch: '└── ',
 *   emptySpace: '    '
 * }
 *
 * // ASCII alternative (better compatibility)
 * const asciiOptions: TreeExportOptions = {
 *   verticalLine: '|   ',
 *   middleBranch: '+-- ',
 *   lastBranch: '`-- ',
 *   emptySpace: '    '
 * }
 *
 * // Custom label function
 * const customOptions: TreeExportOptions = {
 *   labelFunction: (node) => `${node.type}: ${node.name} (${node.size})`
 * }
 * ```
 */
export interface TreeExportOptions {
  labelField?: string
  verticalLine?: string
  middleBranch?: string
  lastBranch?: string
  emptySpace?: string
  labelFunction?: (node: any) => string
}

/**
 * Renders hierarchical data as ASCII/Unicode tree visualization
 *
 * Converts nested object structures (with `children` arrays) into human-readable tree diagrams.
 * Supports multiple root nodes and customizable rendering styles.
 *
 * Features:
 * - **Recursive rendering**: Handles arbitrary depth
 * - **Unicode box-drawing**: Beautiful output by default (│ ├ └)
 * - **ASCII fallback**: Use simpler characters for compatibility
 * - **Flexible labels**: Extract from field name or custom function
 * - **Multiple roots**: Render forests (arrays of trees)
 *
 * Node Structure Requirements:
 * - Each node must have a label (via `labelField` property or `labelFunction`)
 * - Child nodes stored in `children` array property
 * - No `children` property = leaf node
 *
 * @param data - Array of root nodes (each with optional `children` property)
 * @param options - Rendering options (characters, label extraction)
 * @returns String containing the complete tree visualization with newlines
 *
 * @example
 * ```typescript
 * // Basic usage - Simple file tree
 * const fileTree = [
 *   {
 *     name: 'src',
 *     children: [
 *       { name: 'index.ts' },
 *       { name: 'utils.ts' },
 *       {
 *         name: 'components',
 *         children: [
 *           { name: 'Button.tsx' },
 *           { name: 'Input.tsx' }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 *
 * console.log(renderTreeAsText(fileTree))
 * // Output:
 * // └── src
 * //     ├── index.ts
 * //     ├── utils.ts
 * //     └── components
 * //         ├── Button.tsx
 * //         └── Input.tsx
 * ```
 *
 * @example
 * ```typescript
 * // Multiple roots - Project structure
 * const projectTree = [
 *   {
 *     name: 'packages',
 *     children: [
 *       { name: 'core' },
 *       { name: 'ui' }
 *     ]
 *   },
 *   {
 *     name: 'apps',
 *     children: [
 *       { name: 'web' },
 *       { name: 'mobile' }
 *     ]
 *   }
 * ]
 *
 * console.log(renderTreeAsText(projectTree))
 * // Output:
 * // ├── packages
 * // │   ├── core
 * // │   └── ui
 * // └── apps
 * //     ├── web
 * //     └── mobile
 * ```
 *
 * @example
 * ```typescript
 * // Custom label field - Organization chart
 * const orgChart = [
 *   {
 *     title: 'CEO',
 *     children: [
 *       {
 *         title: 'CTO',
 *         children: [
 *           { title: 'Dev Lead' },
 *           { title: 'QA Lead' }
 *         ]
 *       },
 *       { title: 'CFO' }
 *     ]
 *   }
 * ]
 *
 * console.log(renderTreeAsText(orgChart, { labelField: 'title' }))
 * // Output:
 * // └── CEO
 * //     ├── CTO
 * //     │   ├── Dev Lead
 * //     │   └── QA Lead
 * //     └── CFO
 * ```
 *
 * @example
 * ```typescript
 * // Custom label function - Rich formatting
 * const tasks = [
 *   {
 *     name: 'Backend',
 *     status: 'in-progress',
 *     assignee: 'Alice',
 *     children: [
 *       { name: 'API', status: 'done', assignee: 'Bob' },
 *       { name: 'Database', status: 'pending', assignee: 'Charlie' }
 *     ]
 *   }
 * ]
 *
 * const rendered = renderTreeAsText(tasks, {
 *   labelFunction: (node) => `[${node.status}] ${node.name} (@${node.assignee})`
 * })
 *
 * console.log(rendered)
 * // Output:
 * // └── [in-progress] Backend (@Alice)
 * //     ├── [done] API (@Bob)
 * //     └── [pending] Database (@Charlie)
 * ```
 *
 * @example
 * ```typescript
 * // ASCII characters - Better terminal compatibility
 * const tree = [
 *   {
 *     name: 'root',
 *     children: [
 *       { name: 'child1' },
 *       { name: 'child2' }
 *     ]
 *   }
 * ]
 *
 * console.log(renderTreeAsText(tree, {
 *   verticalLine: '|   ',
 *   middleBranch: '+-- ',
 *   lastBranch: '`-- ',
 *   emptySpace: '    '
 * }))
 * // Output:
 * // `-- root
 * //     +-- child1
 * //     `-- child2
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: File system visualization
 * async function visualizeDirectory(dirPath: string) {
 *   const tree = await buildDirectoryTree(dirPath)
 *
 *   console.log(`Directory structure of ${dirPath}:`)
 *   console.log(renderTreeAsText(tree, {
 *     labelFunction: (node) => {
 *       const icon = node.type === 'dir' ? '📁' : '📄'
 *       return `${icon} ${node.name}`
 *     }
 *   }))
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Dependency tree analysis
 * function visualizeDependencies(packageName: string) {
 *   const deps = analyzeDependencies(packageName)
 *
 *   console.log(`Dependencies of ${packageName}:`)
 *   console.log(renderTreeAsText(deps, {
 *     labelFunction: (node) => `${node.name}@${node.version} (${node.size})`
 *   }))
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Edge case: Empty tree
 * console.log(renderTreeAsText([]))  // Returns empty string
 *
 * // Edge case: Leaf nodes only
 * const leaves = [{ name: 'item1' }, { name: 'item2' }]
 * console.log(renderTreeAsText(leaves))
 * // Output:
 * // ├── item1
 * // └── item2
 *
 * // Edge case: Deep nesting
 * const deep = [
 *   {
 *     name: 'level1',
 *     children: [
 *       {
 *         name: 'level2',
 *         children: [
 *           { name: 'level3' }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 * console.log(renderTreeAsText(deep))
 * // Handles arbitrary depth correctly
 * ```
 *
 * @see {@link TreeExportOptions} for configuration details
 */
export function renderTreeAsText(data: any[], options?: TreeExportOptions): string {
  // ✅ Input validation
  if (!data || !Array.isArray(data)) {
    return ''
  }

  if (data.length === 0) {
    return ''
  }

  const {
    labelField = 'name',
    verticalLine = '│   ',
    middleBranch = '├── ',
    lastBranch = '└── ',
    emptySpace = '    ',
    labelFunction,
  } = options || {}

  // ✅ Circular reference detection
  const visited = new WeakSet<any>()

  const getLabel = (node: any): string => {
    try {
      if (labelFunction) return String(labelFunction(node))
      if (node == null) return '[null]'
      if (typeof node !== 'object') return String(node)
      return node[labelField] != null ? String(node[labelField]) : String(node)
    } catch (_error) {
      // ✅ Error handling for labelFunction
      return '[error]'
    }
  }

  const renderNode = (
    node: any,
    prefix: string = '',
    isLast: boolean = true,
    depth: number = 0
  ): string => {
    // ✅ Null/undefined node handling
    if (node == null) {
      return ''
    }

    // ✅ Circular reference detection
    if (typeof node === 'object' && visited.has(node)) {
      return `${prefix + (isLast ? lastBranch : middleBranch)}[circular reference]`
    }

    // ✅ Max depth protection (prevent stack overflow)
    if (depth > 100) {
      return `${prefix + (isLast ? lastBranch : middleBranch)}[max depth exceeded]`
    }

    if (typeof node === 'object') {
      visited.add(node)
    }

    const lines: string[] = []
    const currentPrefix = isLast ? lastBranch : middleBranch
    lines.push(prefix + currentPrefix + getLabel(node))

    // ✅ Children validation
    const children = Array.isArray(node.children)
      ? node.children.filter((child: any) => child != null) // Filter null/undefined
      : []

    const nextPrefix = prefix + (isLast ? emptySpace : verticalLine)

    children.forEach((child: any, index: number) => {
      const isLastChild = index === children.length - 1
      const childOutput = renderNode(child, nextPrefix, isLastChild, depth + 1)
      if (childOutput) {
        lines.push(childOutput)
      }
    })

    return lines.join('\n')
  }

  // ✅ Filter null/undefined roots
  const validRoots = data.filter(root => root != null)

  if (validRoots.length === 0) {
    return ''
  }

  return validRoots
    .map((root, index) => renderNode(root, '', index === validRoots.length - 1))
    .join('\n')
}
