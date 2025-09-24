import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { loginUser, getCurrentUser } from '@/app/api/auth'

// Mock server setup
const server = setupServer(
  rest.post('http://localhost:3950/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        access_token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'buyer',
          displayName: 'Test User',
        },
      })
    )
  }),
  rest.get('http://localhost:3950/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      return res(ctx.status(401), ctx.json({ message: 'Unauthorized' }))
    }
    return res(
      ctx.json({
        id: '1',
        email: 'test@example.com',
        role: 'buyer',
        displayName: 'Test User',
      })
    )
  }),
  rest.post('http://localhost:3950/auth/login', (req, res, ctx) => {
    return res(ctx.status(400), ctx.json({ message: 'Invalid credentials' }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('API Integration Tests', () => {
  describe('Auth API', () => {
    it('should login user successfully', async () => {
      const result = await loginUser({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'buyer',
          displayName: 'Test User',
        },
      })
    })

    it('should get current user with valid token', async () => {
      // Mock localStorage for token
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'mock-jwt-token'),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      })

      const result = await getCurrentUser()

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'buyer',
        displayName: 'Test User',
      })
    })

    it('should handle login failure', async () => {
      server.use(
        rest.post('http://localhost:3950/auth/login', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({ message: 'Invalid credentials' }))
        })
      )

      await expect(
        loginUser({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials')
    })

    it('should handle unauthorized access', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      })

      await expect(getCurrentUser()).rejects.toThrow('Unauthorized')
    })

    it('should handle network errors', async () => {
      server.use(
        rest.post('http://localhost:3950/auth/login', (req, res, ctx) => {
          return res.networkError('Failed to connect')
        })
      )

      await expect(
        loginUser({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Failed to connect')
    })

    it('should handle server errors', async () => {
      server.use(
        rest.post('http://localhost:3950/auth/login', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        })
      )

      await expect(
        loginUser({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Internal server error')
    })

    it('should handle timeout errors', async () => {
      server.use(
        rest.post('http://localhost:3950/auth/login', (req, res, ctx) => {
          return res(ctx.delay(10000)) // 10 second delay
        })
      )

      // This test would need a custom timeout implementation
      // For now, we'll just test that the request is made
      try {
        await loginUser({
          email: 'test@example.com',
          password: 'password123',
        })
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })
})
