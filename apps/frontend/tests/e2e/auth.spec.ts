import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/en/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid-email')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Mock successful login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-token',
          user: {
            id: '1',
            email: 'test@example.com',
            role: 'buyer',
            displayName: 'Test User',
          },
        }),
      })
    })

    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to user markets page
    await expect(page).toHaveURL('/en/user-markets')
  })

  test('should show error message for invalid credentials', async ({ page }) => {
    // Mock failed login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid credentials',
        }),
      })
    })

    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/login', async route => {
      await route.abort('failed')
    })

    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/connection failed/i)).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.getByText(/sign up/i).click()
    await expect(page).toHaveURL('/en/signup')
  })

  test('should show loading state during login', async ({ page }) => {
    // Mock slow response
    await page.route('**/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-token',
          user: {
            id: '1',
            email: 'test@example.com',
            role: 'buyer',
            displayName: 'Test User',
          },
        }),
      })
    })

    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show loading state
    await expect(page.getByText(/signing in/i)).toBeVisible()
  })
})

test.describe('User Markets Page', () => {
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
              name: 'Test Market',
              description: 'A test market',
              location: 'Test City',
              date: '2025-12-25T10:00:00Z',
              startTime: '10:00',
              endTime: '18:00',
              bannerImage: 'https://example.com/image.jpg',
              categories: ['Electronics'],
              status: 'upcoming',
              vendorLimit: 50,
              registeredVendors: [],
              price: 25,
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        }),
      })
    })

    await page.goto('/en/user-markets')
  })

  test('should display markets list', async ({ page }) => {
    await expect(page.getByText('Test Market')).toBeVisible()
    await expect(page.getByText('Test City')).toBeVisible()
  })

  test('should filter markets by search', async ({ page }) => {
    await page.getByPlaceholder(/search markets/i).fill('Test Market')
    await expect(page.getByText('Test Market')).toBeVisible()
  })

  test('should navigate to market details', async ({ page }) => {
    await page.getByText('Test Market').click()
    await expect(page).toHaveURL(/\/markets\/1/)
  })
})
