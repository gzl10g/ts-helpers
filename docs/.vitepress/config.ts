import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@gzl10/ts-helpers',
  description: 'Universal TypeScript utility library — 160+ functions',
  base: '/ts-helpers/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Playground', link: '/playground' },
      { text: 'GitLab', link: 'https://gitlab.gzl10.com/oss/ts-helpers' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/gzl10g/ts-helpers' },
    ],
  },
  vite: {
    optimizeDeps: {
      include: ['monaco-editor/esm/vs/editor/editor.api'],
    },
    ssr: {
      noExternal: ['monaco-editor'],
    },
    worker: {
      format: 'es',
    },
  },
})
