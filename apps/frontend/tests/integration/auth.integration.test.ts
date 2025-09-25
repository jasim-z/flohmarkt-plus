import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { loginUser, getCurrentUser } from '@/app/api/auth'

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3950'

const server = setupServer(
  // Login success
  http.post(`${AUTH_URL}/auth/login`, async () => {
    return HttpResponse.json({ access_token: 'mock-jwt', user: { id: '1', email: 'test@example.com', role: 'buyer' } })
  }),

  // ME 200
  http.get(`${AUTH_URL}/auth/me`, async ({ request }) => {
    const auth = request.headers.get('authorization') || ''
    if (auth.includes('mock-jwt')) {
      return HttpResponse.json({ id: '1', email: 'test@example.com', role: 'buyer' })
    }
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Auth API Integration', () => {
  beforeEach(() => {
    // JSDOM localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        store: {} as Record<string, string>,
        getItem(key: string) { return this.store[key] || null },
        setItem(key: string, value: string) { this.store[key] = value },
        removeItem(key: string) { delete this.store[key] },
        clear() { this.store = {} },
      },
      writable: true,
    })
  })

  it('logs in successfully and stores token', async () => {
    const res = await loginUser('test@example.com', 'password123')
    expect(res.data.access_token).toBe('mock-jwt')
  })

  it('getCurrentUser returns user when token present', async () => {
    window.localStorage.setItem('auth_token', 'mock-jwt')
    const me = await getCurrentUser()
    expect(me).toMatchObject({ email: 'test@example.com', role: 'buyer' })
  })

  it('getCurrentUser returns null and clears token on 401', async () => {
    window.localStorage.setItem('auth_token', 'invalid')
    const me = await getCurrentUser()
    expect(me).toBeNull()
    expect(window.localStorage.getItem('auth_token')).toBeNull()
  })

  it('login failure surfaces error message', async () => {
    server.use(
      http.post(`${AUTH_URL}/auth/login`, async () => HttpResponse.json({ message: 'Invalid credentials' }, { status: 400 }))
    )
    await expect(loginUser('x@y.z', 'nope')).rejects.toMatchObject({ message: expect.any(String) })
  })
})
