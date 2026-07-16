import { expect, test } from '@playwright/test'

async function enterAsGuest(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByTestId('guest-entry').click()
}

async function openPractice(page, isMobile) {
  if (isMobile) await page.locator('.mobile-bottom-tabs .mobile-tab-item').nth(2).click()
  else await page.locator('a[href="#practice"]').first().click()
  await expect(page.getByTestId('practice-center')).toBeVisible()
}

async function openHome(page, isMobile) {
  if (isMobile) await page.locator('.mobile-bottom-tabs .mobile-tab-item').first().click()
  else await page.locator('a[href="#home"]').first().click()
  await expect(page.getByRole('heading', { name: 'TOEIC Sprint', exact: true })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  page.__runtimeErrors = []
  page.on('pageerror', (error) => page.__runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') page.__runtimeErrors.push(message.text())
  })
})

test.afterEach(async ({ page }) => {
  expect(page.__runtimeErrors).toEqual([])
})

test('home resumes an unfinished practice without rebuilding it', async ({ page, isMobile }) => {
  await enterAsGuest(page)
  await openPractice(page, isMobile)
  await page.getByTestId('quick-10').click()
  await page.getByRole('radio').first().click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '離開並保存' }).click()

  await openHome(page, isMobile)
  await expect(page.getByRole('heading', { name: '繼續未完成練習' })).toBeVisible()
  await expect(page.getByText('已作答 1 / 10 題')).toBeVisible()
  await page.getByRole('button', { name: /繼續 Part 5 快速練習/ }).click()

  await expect(page.getByTestId('question-practice')).toBeVisible()
  await expect(page.getByText('1 / 10')).toBeVisible()
  await expect(page.getByRole('radio').first()).toHaveAttribute('aria-checked', 'true')
})

test('result review defaults to mistakes and separates unanswered questions', async ({ page, isMobile }) => {
  await enterAsGuest(page)
  await openPractice(page, isMobile)
  await page.getByTestId('quick-10').click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('submit-practice').click()

  await expect(page.getByTestId('practice-result')).toBeVisible()
  await expect(page.getByRole('button', { name: '錯題 0' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '未作答 10' })).toBeVisible()
  await page.getByRole('button', { name: '未作答 10' }).click()
  await expect(page.getByTestId('explanation-panel').first()).toBeVisible()
  await page.getByRole('button', { name: '全部收合' }).click()
  await expect(page.getByTestId('explanation-panel')).toHaveCount(0)
  await page.getByRole('button', { name: '全部展開' }).click()
  await expect(page.getByTestId('explanation-panel').first()).toBeVisible()
})

test('Part 5 endurance practice and Mini Mock have distinct names and purposes', async ({ page, isMobile }) => {
  await enterAsGuest(page)
  await openPractice(page, isMobile)
  await expect(page.getByRole('heading', { name: 'Part 5 100 題計時練習' })).toBeVisible()
  await expect(page.getByText(/不是完整 TOEIC 模擬考/)).toBeVisible()

  if (isMobile) {
    await page.getByRole('button', { name: '開啟選單' }).click()
    await page.locator('.mobile-drawer a[href="#mocktest"]').click()
  } else {
    await page.locator('a[href="#mocktest"]').first().click()
  }
  await expect(page.getByRole('heading', { name: '文字題 Mini Mock 中心' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '20 題文字 Mini Mock' })).toBeVisible()
  await expect(page.getByText(/Part 5 共 12 題、Part 7 共 8 題/)).toBeVisible()
})

test('desktop navigation labels stay on one line', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop navigation regression')
  await enterAsGuest(page)
  const wrapped = await page.locator('.navbar .nav-link:visible').evaluateAll((links) => links
    .filter((link) => getComputedStyle(link).whiteSpace !== 'nowrap' || link.getClientRects().length > 1)
    .map((link) => link.textContent.trim()))
  expect(wrapped).toEqual([])
})

test('mobile Part 7 tables expose a scroll hint and evidence avoids inner clipping', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile Part 7 regression')
  await enterAsGuest(page)
  await openPractice(page, true)
  await page.getByTestId('start-part7').click()

  for (let index = 0; index < 30 && await page.locator('.document-table-scroll').count() === 0; index += 1) {
    const next = page.getByTestId('next-question')
    if (await next.isDisabled()) break
    await next.click()
  }
  await expect(page.getByText('左右滑動查看完整表格')).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('submit-practice').click()
  await page.getByRole('button', { name: /未作答/ }).click()
  const evidenceDocument = page.locator('.document-evidence-view').first()
  await expect(evidenceDocument).toBeVisible()
  const overflow = await evidenceDocument.locator('.document-body').evaluate((body) => ({
    maxHeight: getComputedStyle(body).maxHeight,
    overflowY: getComputedStyle(body).overflowY,
  }))
  expect(overflow.maxHeight).toBe('none')
  expect(overflow.overflowY).toBe('visible')
})
