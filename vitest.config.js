import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.js'], include: ['tests/component/**/*.{test,spec}.{js,jsx}'], restoreMocks: true }
})
