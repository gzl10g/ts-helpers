/**
 * Tests for Tree utilities
 */

/* eslint-disable max-lines-per-function */

import { describe, expect, test } from 'vitest'
import type { TreeExportOptions } from '../src/tree'
import { renderTreeAsText } from '../src/tree'

describe('Tree Utilities', () => {
  describe('renderTreeAsText', () => {
    test('should render simple tree structure', () => {
      const data = [
        {
          name: 'Root',
          children: [{ name: 'Child 1' }, { name: 'Child 2' }],
        },
      ]

      const result = renderTreeAsText(data)

      expect(result).toBe('└── Root\n    ├── Child 1\n    └── Child 2')
    })

    test('should render multiple root nodes', () => {
      const data = [
        { name: 'Root 1', children: [{ name: 'Child 1' }] },
        { name: 'Root 2', children: [{ name: 'Child 2' }] },
      ]

      const result = renderTreeAsText(data)

      expect(result).toBe('├── Root 1\n│   └── Child 1\n└── Root 2\n    └── Child 2')
    })

    test('should render nested tree structure', () => {
      const data = [
        {
          name: 'Root',
          children: [
            {
              name: 'Parent 1',
              children: [{ name: 'Child 1.1' }, { name: 'Child 1.2' }],
            },
            {
              name: 'Parent 2',
              children: [{ name: 'Child 2.1' }],
            },
          ],
        },
      ]

      const result = renderTreeAsText(data)

      expect(result).toContain('└── Root')
      expect(result).toContain('├── Parent 1')
      expect(result).toContain('├── Child 1.1')
      expect(result).toContain('└── Child 1.2')
      expect(result).toContain('└── Parent 2')
      expect(result).toContain('└── Child 2.1')
    })

    test('should handle nodes without children', () => {
      const data = [{ name: 'Root', children: [] }, { name: 'Leaf' }]

      const result = renderTreeAsText(data)

      expect(result).toBe('├── Root\n└── Leaf')
    })

    test('should use custom label field', () => {
      const data = [
        {
          title: 'Main',
          children: [{ title: 'Sub 1' }, { title: 'Sub 2' }],
        },
      ]

      const options: TreeExportOptions = { labelField: 'title' }
      const result = renderTreeAsText(data, options)

      expect(result).toBe('└── Main\n    ├── Sub 1\n    └── Sub 2')
    })

    test('should use custom tree characters', () => {
      const data = [
        {
          name: 'Root',
          children: [{ name: 'Child 1' }, { name: 'Child 2' }],
        },
      ]

      const options: TreeExportOptions = {
        verticalLine: '┃   ',
        middleBranch: '┣━━ ',
        lastBranch: '┗━━ ',
        emptySpace: '    ',
      }

      const result = renderTreeAsText(data, options)

      expect(result).toBe('┗━━ Root\n    ┣━━ Child 1\n    ┗━━ Child 2')
    })

    test('should use custom label function', () => {
      const data = [
        {
          id: 1,
          title: 'First',
          children: [
            { id: 2, title: 'Second' },
            { id: 3, title: 'Third' },
          ],
        },
      ]

      const options: TreeExportOptions = {
        labelFunction: node => `[${node.id}] ${node.title}`,
      }

      const result = renderTreeAsText(data, options)

      expect(result).toBe('└── [1] First\n    ├── [2] Second\n    └── [3] Third')
    })

    test('should handle string nodes when labelField is not found', () => {
      const data = [
        {
          name: 'Root',
          children: [{ name: 'Child 1' }, 'Plain String'],
        },
      ]

      const result = renderTreeAsText(data)

      expect(result).toContain('Root')
      expect(result).toContain('Child 1')
      expect(result).toContain('Plain String')
    })

    test('should handle empty data array', () => {
      const data: any[] = []

      const result = renderTreeAsText(data)

      expect(result).toBe('')
    })

    test('should handle single node without children', () => {
      const data = [{ name: 'Single Node' }]

      const result = renderTreeAsText(data)

      expect(result).toBe('└── Single Node')
    })

    test('should handle deep nesting', () => {
      const data = [
        {
          name: 'Level 0',
          children: [
            {
              name: 'Level 1',
              children: [
                {
                  name: 'Level 2',
                  children: [{ name: 'Level 3' }],
                },
              ],
            },
          ],
        },
      ]

      const result = renderTreeAsText(data)

      expect(result).toContain('└── Level 0')
      expect(result).toContain('└── Level 1')
      expect(result).toContain('└── Level 2')
      expect(result).toContain('└── Level 3')
    })

    test('should handle nodes with mixed content types', () => {
      const data = [
        {
          name: 'Root',
          children: [
            { name: 'String Node' },
            { name: 123 }, // Number as name
            { name: null }, // Null as name
            { name: undefined }, // Undefined as name
          ],
        },
      ]

      const result = renderTreeAsText(data)

      expect(result).toContain('String Node')
      expect(result).toContain('123')
      expect(result).toContain('[object Object]') // null/undefined become objects
      expect(result).toContain('[object Object]')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    describe('Invalid Input Handling', () => {
      test('should handle null input gracefully', () => {
        const result = renderTreeAsText(null as any)
        expect(result).toBe('')
      })

      test('should handle undefined input gracefully', () => {
        const result = renderTreeAsText(undefined as any)
        expect(result).toBe('')
      })

      test('should handle non-array input', () => {
        const result = renderTreeAsText({ name: 'Not Array' } as any)
        expect(result).toBe('')
      })

      test('should handle array with null elements', () => {
        const data = [{ name: 'Valid' }, null, { name: 'Also Valid' }]
        const result = renderTreeAsText(data as any)

        expect(result).toContain('Valid')
        expect(result).toContain('Also Valid')
      })

      test('should handle array with undefined elements', () => {
        const data = [{ name: 'First' }, undefined, { name: 'Last' }]
        const result = renderTreeAsText(data as any)

        expect(result).toContain('First')
        expect(result).toContain('Last')
      })

      test('should handle nodes without label field', () => {
        const data = [{ id: 1, value: 'test' }] // No 'name' field
        const result = renderTreeAsText(data)

        expect(typeof result).toBe('string')
      })

      test('should handle nodes with non-string label field', () => {
        const data = [
          { name: 123 },
          { name: true },
          { name: { nested: 'object' } },
          { name: ['array'] },
        ]

        const result = renderTreeAsText(data as any)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Circular Reference Handling', () => {
      test('should handle circular references without infinite loop', () => {
        const node1: any = { name: 'Node 1' }
        const node2: any = { name: 'Node 2' }

        node1.children = [node2]
        node2.children = [node1] // Circular reference

        const data = [node1]
        const result = renderTreeAsText(data)

        expect(result).toContain('Node 1')
        expect(result).toContain('Node 2')
        expect(result).toContain('[circular reference]')
      })

      test('should handle self-referencing node', () => {
        const selfRef: any = { name: 'Self' }
        selfRef.children = [selfRef]

        const data = [selfRef]
        const result = renderTreeAsText(data)

        expect(result).toContain('Self')
        expect(result).toContain('[circular reference]')
      })
    })

    describe('Custom Options Edge Cases', () => {
      test('should handle empty labelField', () => {
        const data = [{ name: 'Test', '': 'Empty Field' }]
        const options: TreeExportOptions = { labelField: '' }

        const result = renderTreeAsText(data, options)
        expect(typeof result).toBe('string')
      })

      test('should handle non-existent labelField', () => {
        const data = [{ name: 'Test' }]
        const options: TreeExportOptions = { labelField: 'nonExistent' as any }

        const result = renderTreeAsText(data, options)
        expect(typeof result).toBe('string')
      })

      test('should handle labelFunction that throws error', () => {
        const data = [{ name: 'Test' }]
        const options: TreeExportOptions = {
          labelFunction: () => {
            throw new Error('Label function error')
          },
        }

        const result = renderTreeAsText(data, options)
        expect(result).toContain('[error]')
      })

      test('should handle labelFunction returning non-string', () => {
        const data = [{ name: 'Test' }]
        const options: TreeExportOptions = {
          labelFunction: () => 123 as any,
        }

        const result = renderTreeAsText(data, options)
        expect(typeof result).toBe('string')
      })

      test('should handle labelFunction returning null', () => {
        const data = [{ name: 'Test' }]
        const options: TreeExportOptions = {
          labelFunction: () => null as any,
        }

        const result = renderTreeAsText(data, options)
        expect(typeof result).toBe('string')
      })

      test('should handle custom tree characters with special chars', () => {
        const data = [{ name: 'Root', children: [{ name: 'Child' }] }]
        const options: TreeExportOptions = {
          verticalLine: '⋮⋮⋮ ',
          middleBranch: '├─→ ',
          lastBranch: '└─→ ',
          emptySpace: '····',
        }

        const result = renderTreeAsText(data, options)
        expect(result).toContain('└─→ Root')
        expect(result).toContain('└─→ Child')
      })

      test('should handle tree characters with unicode', () => {
        const data = [{ name: 'Root', children: [{ name: 'Child' }] }]
        const options: TreeExportOptions = {
          verticalLine: '║   ',
          middleBranch: '╠═══',
          lastBranch: '╚═══',
          emptySpace: '    ',
        }

        const result = renderTreeAsText(data, options)
        expect(typeof result).toBe('string')
        // Comportamiento actual: no incluye espacio entre caracteres y label
        expect(result).toContain('╚═══Root')
      })
    })

    describe('Extreme Nesting', () => {
      test('should handle very deep nesting (10 levels)', () => {
        let current: any = { name: 'Level 10' }

        for (let i = 9; i >= 0; i--) {
          current = { name: `Level ${i}`, children: [current] }
        }

        const result = renderTreeAsText([current])

        expect(result).toContain('Level 0')
        expect(result).toContain('Level 10')
      })

      test('should handle wide tree (many siblings)', () => {
        const children = Array.from({ length: 100 }, (_, i) => ({
          name: `Child ${i + 1}`,
        }))

        const data = [{ name: 'Root', children }]
        const result = renderTreeAsText(data)

        expect(result).toContain('Root')
        expect(result).toContain('Child 1')
        expect(result).toContain('Child 100')
      })

      test('should handle combination of wide and deep tree', () => {
        const deepLevel = {
          name: 'Deep Level',
          children: Array.from({ length: 5 }, (_, i) => ({
            name: `Deep Child ${i + 1}`,
          })),
        }

        const data = [
          {
            name: 'Root',
            children: [
              deepLevel,
              ...Array.from({ length: 10 }, (_, i) => ({
                name: `Sibling ${i + 1}`,
              })),
            ],
          },
        ]

        const result = renderTreeAsText(data)
        expect(result).toContain('Root')
        expect(result).toContain('Deep Level')
        expect(result).toContain('Deep Child 5')
        expect(result).toContain('Sibling 10')
      })
    })

    describe('Children Property Edge Cases', () => {
      test('should handle children as non-array', () => {
        const data = [{ name: 'Root', children: 'not an array' as any }]
        const result = renderTreeAsText(data)

        expect(result).toContain('Root')
      })

      test('should handle children as null', () => {
        const data = [{ name: 'Root', children: null as any }]
        const result = renderTreeAsText(data)

        expect(result).toContain('Root')
      })

      test('should handle children as object', () => {
        const data = [{ name: 'Root', children: { nested: 'object' } as any }]
        const result = renderTreeAsText(data)

        expect(result).toContain('Root')
      })

      test('should handle missing children property', () => {
        const data = [{ name: 'Root' }]
        const result = renderTreeAsText(data)

        expect(result).toBe('└── Root')
      })

      test('should handle children with mixed valid and invalid nodes', () => {
        const data = [
          {
            name: 'Root',
            children: [
              { name: 'Valid 1' },
              null,
              undefined,
              'string',
              123,
              { name: 'Valid 2' },
            ] as any,
          },
        ]

        const result = renderTreeAsText(data)
        expect(result).toContain('Root')
        expect(result).toContain('Valid 1')
        expect(result).toContain('Valid 2')
      })

      test('should return empty string when all root nodes are null or undefined', () => {
        const result = renderTreeAsText([null, undefined] as any[])
        expect(result).toBe('')
      })

      test('should truncate at max depth and emit [max depth exceeded]', () => {
        // Build a chain of 105 nested nodes to exceed the depth=100 guard
        let node: any = { name: 'leaf' }
        for (let i = 0; i < 105; i++) {
          node = { name: `level-${i}`, children: [node] }
        }
        const result = renderTreeAsText([node])
        expect(result).toContain('[max depth exceeded]')
      })
    })
  })
})
