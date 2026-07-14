import { expect, test } from '@playwright/test'

function expectNoHorizontalOverflow(pageWidth: number, scrollWidth: number) {
  expect(scrollWidth).toBeLessThanOrEqual(pageWidth + 1)
}

test.describe('public and protected navigation', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('landing opens the GitHub-only login page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Join the v3 preview →' }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible()
    await expect(page.locator('input')).toHaveCount(0)
  })

  test('anonymous workspace and settings requests redirect to login', async ({ page }) => {
    await page.goto('/workspace')
    await expect(page).toHaveURL(/\/login$/)

    await page.goto('/settings/kubeconfig')
    await expect(page).toHaveURL(/\/login$/)
  })
})

test('authenticated user reaches workspace without a kubeconfig', async ({ page }) => {
  await page.goto('/workspace')

  await expect(page.getByRole('heading', { name: 'Welcome, Fulling Test User' })).toBeVisible()
  await expect(page.getByText('Not configured')).toBeVisible()
})

test('kubeconfig settings save, replace, and delete without reading content', async ({ page }) => {
  let configured = false
  let updatedAt: string | null = null
  let savedContent: string | null = null

  await page.route('**/api/kubeconfig', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({ json: { configured, updatedAt } })
      return
    }
    if (method === 'PUT') {
      savedContent = (route.request().postDataJSON() as { content: string }).content
      configured = true
      updatedAt = '2026-07-13T12:00:00.000Z'
      await route.fulfill({ json: { configured, updatedAt } })
      return
    }

    configured = false
    updatedAt = null
    savedContent = null
    await route.fulfill({ json: { configured, updatedAt } })
  })

  await page.goto('/settings/kubeconfig')
  const editor = page.getByLabel('Kubeconfig content')
  await expect(editor).toHaveValue('')

  await editor.fill('first credential')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Kubeconfig saved. The stored content remains hidden.')).toBeVisible()
  await expect(editor).toHaveValue('')
  expect(savedContent).toBe('first credential')

  await editor.fill('replacement credential')
  await page.getByRole('button', { name: 'Replace' }).click()
  await expect(editor).toHaveValue('')
  expect(savedContent).toBe('replacement credential')

  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Delete kubeconfig' }).click()
  await expect(page.getByText('Kubeconfig deleted.')).toBeVisible()
  expect(savedContent).toBeNull()
})

test('authenticated pages do not overflow the viewport', async ({ page }) => {
  await page.goto('/workspace')
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expectNoHorizontalOverflow(dimensions.clientWidth, dimensions.scrollWidth)
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
})

test('sign-out returns the user to login', async ({ page }) => {
  await page.route('**/api/auth/sign-out', async (route) => {
    await route.fulfill({ status: 200, json: { success: true } })
  })
  await page.goto('/workspace')

  await page.getByRole('button', { name: 'Sign out' }).click()

  await expect(page).toHaveURL(/\/login$/)
})
