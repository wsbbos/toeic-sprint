import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL
const baseURL = externalBaseURL || 'http://127.0.0.1:4174'

export default defineConfig({
  testDir: './tests/e2e', timeout: 30000, fullyParallel: false, retries: 1,
  use: { baseURL, trace: 'retain-on-failure', video: 'off' },

  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
})
