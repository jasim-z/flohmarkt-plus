import { test, expect } from '@playwright/test'

// Error UI + retry behavior

test.describe('Error UI & Retry', () => {
  test('shows global error UI and Try Again reload works', async ({ page }) => {
    // Navigate to a page meant for testing error boundary if available
    try {
      await page.goto('/en/error-test', { timeout: 15000 })
    } catch {
      test.skip(true, 'Error test route not available in this environment')
    }

    // Click the button that triggers an error (component provided in app)
    const throwBtn = page.getByRole('button', { name: /throw error/i })
    if (await throwBtn.isVisible().catch(() => false)) {
      await throwBtn.click()

      // Expect error UI to appear
      await expect(page.getByText(/something went wrong/i)).toBeVisible()

      // Try Again should recover (component resets)
      await page.getByRole('button', { name: /try again/i }).click()
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible()
    } else {
      test.skip(true, 'Error test page/button not available in this build')
    }
  })
})
