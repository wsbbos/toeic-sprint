import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  page.__runtimeErrors = []
  page.on('pageerror', (error) => page.__runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') page.__runtimeErrors.push(message.text())
  })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test.afterEach(async ({ page }) => {
  expect(page.__runtimeErrors).toEqual([])
})

test('guest can answer and submit a Part 5 practice', async ({ page, isMobile }) => {
  await page.getByTestId('guest-entry').click()
  if (isMobile) await page.locator('.mobile-bottom-tabs .mobile-tab-item').nth(2).click()
  else await page.locator('a[href="#practice"]').first().click()
  await expect(page.getByTestId('practice-center')).toBeVisible()
  await page.getByTestId('quick-10').click()
  await expect(page.getByTestId('question-practice')).toBeVisible()
  await page.getByRole('radio').first().click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('submit-practice').click()
  await expect(page.getByTestId('practice-result')).toBeVisible()
})

test('mobile viewport has no page-level horizontal overflow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only acceptance')
  await page.getByTestId('guest-entry').click()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
})

test('Part 7 remains available as a separate reading flow', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop covers the shared Part 7 data flow')
  await page.getByTestId('guest-entry').click()
  await page.locator('a[href="#practice"]').first().click()
  await page.getByTestId('start-part7').click()
  await expect(page.getByTestId('question-practice')).toBeVisible()
  await expect(page.locator('.question-passage')).toBeVisible()
})

test('wrong answers can start a retake session', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop coverage is sufficient for retake workflow')
  await page.getByTestId('guest-entry').click()
  await page.locator('a[href="#practice"]').first().click()
  await page.evaluate(() => { Math.random = () => 0 })
  await page.getByTestId('quick-10').click()
  await page.getByRole('radio').first().click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('submit-practice').click()
  await expect(page.getByTestId('practice-result')).toBeVisible()
  await page.locator('a[href="#wrongbook"]').first().click()
  await expect(page.getByTestId('wrong-book')).toBeVisible()
  await page.getByTestId('retake-all').click()
  await expect(page.getByTestId('retake-practice')).toBeVisible()
})
