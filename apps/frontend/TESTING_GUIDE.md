# 🧪 Frontend Testing Guide

## Overview

This guide covers the comprehensive testing strategy for the Flohmarkt Plus frontend application.

## Testing Stack

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + MSW (Mock Service Worker)
- **E2E Tests**: Playwright
- **Coverage**: Jest built-in coverage

## Test Structure

```
apps/frontend/
├── src/
│   ├── components/
│   │   └── __tests__/           # Unit tests for components
│   ├── app/
│   │   └── __tests__/           # Unit tests for pages
│   └── hooks/
│       └── __tests__/           # Unit tests for hooks
├── tests/
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup file
└── playwright.config.ts         # Playwright configuration
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run only unit tests
pnpm test:unit
```

### Integration Tests
```bash
# Run integration tests
pnpm test:integration
```

### E2E Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests in headed mode
pnpm test:e2e:headed
```

### All Tests
```bash
# Run all tests (unit + E2E)
pnpm test:all
```

## Test Categories

### 1. Unit Tests (80% of tests)

**Components to Test:**
- ✅ ErrorBoundary
- ✅ LoginForm
- ✅ MarketCard
- ✅ Header
- ✅ Footer
- ✅ LoadingSpinner
- ✅ Toast
- ✅ Button
- ✅ Input
- ✅ Modal components

**Hooks to Test:**
- useSocket
- useUser (from contexts)
- Custom form hooks

**Utilities to Test:**
- API error handling
- Form validation
- Date formatting
- Text sanitization

### 2. Integration Tests (15% of tests)

**API Integration:**
- ✅ Auth API (login, signup, getCurrentUser)
- Markets API
- Messages API
- Listings API
- Users API

**Component Integration:**
- Form submission flows
- Error handling flows
- Navigation flows

### 3. E2E Tests (5% of tests)

**Critical User Flows:**
- ✅ Authentication flow (login, signup, logout)
- ✅ Marketplace browsing
- ✅ Market details
- ✅ User registration
- ✅ Error handling
- ✅ Responsive design

## Test Examples

### Unit Test Example
```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Integration Test Example
```typescript
// tests/integration/api.test.ts
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { loginUser } from '@/app/api/auth'

const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({ user: { id: '1' } }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Auth API', () => {
  it('should login user', async () => {
    const result = await loginUser({ email: 'test@example.com', password: 'password' })
    expect(result.user.id).toBe('1')
  })
})
```

### E2E Test Example
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="login-button"]')
  
  await expect(page).toHaveURL('/dashboard')
})
```

## Coverage Goals

- **Overall Coverage**: 70%
- **Component Coverage**: 80%
- **Utility Functions**: 90%
- **API Functions**: 80%

## Best Practices

### 1. Test Naming
```typescript
// Good
describe('LoginForm', () => {
  it('should show validation error for empty email', () => {})
  it('should submit form with valid credentials', () => {})
})

// Bad
describe('LoginForm', () => {
  it('test 1', () => {})
  it('works', () => {})
})
```

### 2. Test Structure
```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  })

  // Happy path tests
  it('should render correctly', () => {})
  it('should handle user interactions', () => {})

  // Edge cases
  it('should handle empty data', () => {})
  it('should handle errors', () => {})

  // Cleanup
  afterEach(() => {
    // Cleanup
  })
})
```

### 3. Mocking
```typescript
// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Mock API calls
jest.mock('@/app/api/auth', () => ({
  loginUser: jest.fn(),
}))
```

### 4. Accessibility Testing
```typescript
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should not have accessibility violations', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:coverage
      - run: pnpm test:e2e
```

## Debugging Tests

### Unit Tests
```bash
# Run specific test file
pnpm test Button.test.tsx

# Run tests matching pattern
pnpm test --testNamePattern="should login"

# Debug mode
pnpm test --detectOpenHandles --forceExit
```

### E2E Tests
```bash
# Run specific test
pnpm test:e2e auth.spec.ts

# Run with debug mode
pnpm test:e2e --debug

# Run with UI
pnpm test:e2e:ui
```

## Common Issues & Solutions

### 1. Async Testing
```typescript
// Good
it('should handle async operations', async () => {
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})

// Bad
it('should handle async operations', () => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### 2. Mock Cleanup
```typescript
// Always clean up mocks
afterEach(() => {
  jest.clearAllMocks()
})
```

### 3. Test Isolation
```typescript
// Each test should be independent
describe('Component', () => {
  it('test 1', () => {
    // Test 1
  })

  it('test 2', () => {
    // Test 2 (should not depend on test 1)
  })
})
```

## Next Steps

1. **Phase 1**: Complete unit tests for all components
2. **Phase 2**: Add integration tests for API interactions
3. **Phase 3**: Implement E2E tests for critical flows
4. **Phase 4**: Set up CI/CD with automated testing
5. **Phase 5**: Add accessibility testing
6. **Phase 6**: Performance testing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
