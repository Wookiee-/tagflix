import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: false,
    },
  },
  base: './',
  build: {
    target: 'es2020',
    modulePreload: { polyfill: false },
  },
})
