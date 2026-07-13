import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
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

test('wrong answers can start a retake session', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop coverage is sufficient for retake workflow')
  await page.getByTestId('guest-entry').click()
  await page.locator('a[href="#practice"]').first().click()
  await page.getByTestId('quick-10').click()
  for (let index = 0; index < 10; index += 1) {
    await page.getByRole('radio').first().click()
    if (index < 9) await page.getByTestId('next-question').click()
  }
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('submit-practice').click()
  await page.locator('a[href="#wrongbook"]').first().click()
  await expect(page.getByTestId('wrong-book')).toBeVisible()
  await page.getByTestId('retake-all').click()
  await expect(page.getByTestId('retake-practice')).toBeVisible()
})
