import process from 'node:process'
import { test, expect } from '@playwright/test'

test('production app shell reopens while offline', async ({ page, context, isMobile }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'production preview-only acceptance')
  test.skip(isMobile, 'desktop validates the shared service-worker shell')

  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect(page.getByTestId('guest-entry')).toBeVisible()

  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('guest-entry')).toBeVisible()
  await context.setOffline(false)
})
