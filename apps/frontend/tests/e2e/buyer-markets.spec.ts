import { test, expect } from '@playwright/test'

test.describe('Buyer Markets - List & Details', () => {
  const locale = 'en'

  test('lists markets and opens first market details', async ({ page }) => {
    // Ensure unauth → user pages still load (listing page is public)
    await page.goto(`/${locale}/user-markets`)

    // Wait for any market cards to appear
    const cards = page.locator('.market-card')
    await expect(cards.first()).toBeVisible({ timeout: 15000 })

    // Click first card
    await cards.first().click()

    // Expect to be on a market details route
    await expect(page).toHaveURL(new RegExp(`/${locale}/user-markets/`))

    // Basic info renders (title or status badge)
    await expect(page.locator('.status-badge').first()).toBeVisible()
  })
})


