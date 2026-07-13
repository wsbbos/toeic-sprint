import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e', timeout: 30000, fullyParallel: false, retries: 1,
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'retain-on-failure', video: 'off' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4174', url: 'http://127.0.0.1:4174', reuseExistingServer: true, timeout: 120000 },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } }
  ]
})
