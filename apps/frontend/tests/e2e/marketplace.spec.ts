import { test, expect } from '@playwright/test'

test.describe('Marketplace Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.route('**/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          email: 'test@example.com',
          role: 'buyer',
          displayName: 'Test User',
        }),
      })
    })

    // Mock markets API
    await page.route('**/markets', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              _id: '1',
              name: 'Electronics Market',
              description: 'A market for electronics',
              location: 'Tech City',
              date: '2025-12-25T10:00:00Z',
              startTime: '10:00',
              endTime: '18:00',
              bannerImage: 'https://example.com/image.jpg',
              categories: ['Electronics', 'Gadgets'],
              status: 'upcoming',
              vendorLimit: 50,
              registeredVendors: [],
              price: 25,
            },
            {
              _id: '2',
              name: 'Fashion Market',
              description: 'A market for fashion items',
              location: 'Style City',
              date: '2025-12-26T10:00:00Z',
              startTime: '10:00',
              endTime: '18:00',
              bannerImage: 'https://example.com/image2.jpg',
              categories: ['Fashion', 'Clothing'],
              status: 'live',
              vendorLimit: 30,
              registeredVendors: ['user1', 'user2'],
              price: 20,
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        }),
      })
    })

    await page.goto('/en/user-markets')
  })

  test('should display multiple markets', async ({ page }) => {
    await expect(page.getByText('Electronics Market')).toBeVisible()
    await expect(page.getByText('Fashion Market')).toBeVisible()
  })

  test('should filter markets by category', async ({ page }) => {
    await page.getByText('Electronics').click()
    
    // Should show only electronics market
    await expect(page.getByText('Electronics Market')).toBeVisible()
    await expect(page.getByText('Fashion Market')).not.toBeVisible()
  })

  test('should filter markets by status', async ({ page }) => {
    await page.getByText('Live Now').click()
    
    // Should show only live market
    await expect(page.getByText('Fashion Market')).toBeVisible()
    await expect(page.getByText('Electronics Market')).not.toBeVisible()
  })

  test('should search markets by name', async ({ page }) => {
    await page.getByPlaceholder(/search markets/i).fill('Electronics')
    
    await expect(page.getByText('Electronics Market')).toBeVisible()
    await expect(page.getByText('Fashion Market')).not.toBeVisible()
  })

  test('should search markets by location', async ({ page }) => {
    await page.getByPlaceholder(/search markets/i).fill('Tech City')
    
    await expect(page.getByText('Electronics Market')).toBeVisible()
    await expect(page.getByText('Fashion Market')).not.toBeVisible()
  })

  test('should sort markets by date', async ({ page }) => {
    await page.getByText('Date').click()
    
    // Markets should be sorted by date
    const marketCards = page.locator('[data-testid="market-card"]')
    await expect(marketCards.first()).toContainText('Electronics Market')
  })

  test('should sort markets by name', async ({ page }) => {
    await page.getByText('Name').click()
    
    // Markets should be sorted alphabetically
    const marketCards = page.locator('[data-testid="market-card"]')
    await expect(marketCards.first()).toContainText('Electronics Market')
  })

  test('should show market details on click', async ({ page }) => {
    // Mock market details API
    await page.route('**/markets/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          name: 'Electronics Market',
          description: 'A market for electronics',
          location: 'Tech City',
          date: '2025-12-25T10:00:00Z',
          startTime: '10:00',
          endTime: '18:00',
          bannerImage: 'https://example.com/image.jpg',
          categories: ['Electronics', 'Gadgets'],
          status: 'upcoming',
          vendorLimit: 50,
          registeredVendors: [],
          price: 25,
        }),
      })
    })

    await page.getByText('Electronics Market').click()
    
    await expect(page).toHaveURL('/en/user-markets/1')
    await expect(page.getByText('Electronics Market')).toBeVisible()
    await expect(page.getByText('A market for electronics')).toBeVisible()
  })

  test('should handle empty search results', async ({ page }) => {
    await page.getByPlaceholder(/search markets/i).fill('Non-existent Market')
    
    await expect(page.getByText(/no markets found/i)).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/markets', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Internal server error',
        }),
      })
    })

    await page.reload()
    
    await expect(page.getByText(/error loading markets/i)).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/markets', async route => {
      await route.abort('failed')
    })

    await page.reload()
    
    await expect(page.getByText(/connection failed/i)).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.getByText('Electronics Market')).toBeVisible()
    await expect(page.getByText('Fashion Market')).toBeVisible()
  })
})
