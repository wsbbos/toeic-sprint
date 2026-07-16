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
  await expect(page.getByRole('img', { name: 'TOEIC Sprint 學習進度' })).toBeVisible()
  if (isMobile) await page.locator('.mobile-bottom-tabs .mobile-tab-item').nth(2).click()
  else await page.locator('a[href="#practice"]').first().click()
  await expect(page.getByTestId('practice-center')).toBeVisible()
  await expect(page.locator('[data-visual="practice"]').first()).toBeVisible()
  await page.getByTestId('quick-10').click()
  await expect(page.getByTestId('question-practice')).toBeVisible()
  await page.getByRole('radio').first().click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('submit-practice').click()
  await expect(page.getByTestId('practice-result')).toBeVisible()
  await expect(page.locator('[data-visual="result"]')).toBeVisible()
  await page.getByRole('button', { name: '全部 10' }).click()
  await expect(page.getByTestId('explanation-panel').first()).toBeVisible()
  await expect(page.getByRole('list', { name: '選項比較' }).first()).toBeVisible()
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
  const document = page.getByTestId('business-document')
  await expect(document).toBeVisible()
  await expect(document).toHaveAttribute('data-document-type', /email|memo|notice|advertisement|schedule|form|table_chart/)
  await page.getByRole('radio').first().click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('submit-practice').click()
  await expect(page.getByTestId('practice-result')).toBeVisible()
  await page.getByRole('button', { name: /未作答/ }).click()
  await expect(page.locator('.evidence-card').first()).toContainText('答案依據')
  await expect(page.locator('mark.document-clue').first()).toBeVisible()
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


test('empty wrong book uses the shared review illustration', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop navigation covers the shared empty state')
  await page.getByTestId('guest-entry').click()
  await page.locator('a[href="#wrongbook"]').first().click()
  await expect(page.getByTestId('learning-empty-state')).toBeVisible()
  await expect(page.locator('[data-visual="review"]').last()).toBeVisible()
})
test('guest study groups degrade safely without cloud access', async ({ page, isMobile }) => {
  await page.getByTestId('guest-entry').click()
  if (isMobile) {
    await page.getByRole('button', { name: '開啟選單' }).click()
    await page.locator('.mobile-drawer a[href="#friends"]').click()
  } else {
    await page.locator('a[href="#friends"]').first().click()
  }
  await expect(page.getByRole('heading', { name: '登入後使用讀書小隊' })).toBeVisible()
  await expect(page.getByText(/訪客模式的核心練習仍可完整使用/)).toBeVisible()
})

test('answer choices support standard keyboard radio navigation', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop keyboard acceptance')
  await page.getByTestId('guest-entry').click()
  await page.locator('a[href="#practice"]').first().click()
  await page.getByTestId('quick-10').click()

  const choices = page.getByRole('radio')
  await choices.first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(choices.nth(1)).toBeFocused()
  await expect(choices.nth(1)).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('End')
  await expect(choices.nth(3)).toBeFocused()
  await expect(choices.nth(3)).toHaveAttribute('aria-checked', 'true')
})
