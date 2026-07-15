import { test, expect } from '@playwright/test'

async function enterAsGuest(page) {
  await page.getByTestId('guest-entry').click()
}

async function openPractice(page, isMobile) {
  if (isMobile) await page.locator('.mobile-bottom-tabs .mobile-tab-item').nth(2).click()
  else await page.locator('a[href="#practice"]').first().click()
  await expect(page.getByTestId('practice-center')).toBeVisible()
}

async function openMockTest(page, isMobile) {
  if (isMobile) {
    await page.getByRole('button', { name: '開啟選單' }).click()
    await page.locator('.mobile-drawer a[href="#mocktest"]').click()
  } else {
    await page.locator('a[href="#mocktest"]').first().click()
  }
}

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

test('practice draft, favorite and every answered item survive reload', async ({ page, isMobile }) => {
  await enterAsGuest(page)
  await openPractice(page, isMobile)
  await page.evaluate(() => { Math.random = () => 0 })
  await page.getByTestId('quick-10').click()

  await page.getByRole('radio').first().click()
  await page.getByRole('button', { name: '收藏' }).click()
  await page.getByTestId('next-question').click()
  await page.getByRole('radio').first().click()
  await page.reload()

  await openPractice(page, isMobile)
  await page.getByTestId('quick-10').click()
  await expect(page.getByText('2 / 10')).toBeVisible()
  await page.getByRole('button', { name: '上一題' }).click()
  await expect(page.getByRole('button', { name: '已收藏' })).toBeVisible()
  await expect(page.getByRole('radio').first()).toHaveAttribute('aria-checked', 'true')
  await page.getByTestId('next-question').click()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('submit-practice').click()
  await expect(page.getByTestId('practice-result')).toBeVisible()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('toeic_sprint_cloud_user')))
  expect(saved.progress.totalQuestionsAnswered).toBe(2)
  expect(saved.practiceHistory).toHaveLength(2)
  expect(saved.favorites).toHaveLength(1)
})

test('Mini Mock submits once and labels score as an unofficial range', async ({ page, isMobile }) => {
  await enterAsGuest(page)
  await openMockTest(page, isMobile)
  await page.getByRole('button', { name: /開始測驗/ }).click()
  await expect(page.getByTestId('active-mock-test')).toBeVisible()
  await page.getByRole('radio').first().click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: /立即交卷/ }).click()
  await expect(page.getByText('非官方區間估計')).toBeVisible()
  await expect(page.getByText(/不代表正式 TOEIC 成績/)).toBeVisible()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
})

test('Part 7 business document remains readable on mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-specific Part 7 acceptance')
  await enterAsGuest(page)
  await openPractice(page, true)
  await page.getByTestId('start-part7').click()
  await expect(page.getByTestId('business-document')).toBeVisible()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
})
