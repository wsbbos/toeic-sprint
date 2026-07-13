import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const cacheGroup = (id) => {
  if (id.includes('/src/data/part5') || id.includes('\\src\\data\\part5')) return 'question-bank'
  if (id.includes('@supabase')) return 'supabase'
  if (id.includes('react') || id.includes('scheduler')) return 'react-vendor'
  return undefined
}

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'oxc',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: cacheGroup,
      },
    },
  },
})
