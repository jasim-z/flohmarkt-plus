import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { marketsApiClient } from '@/app/lib/apiClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953'

const server = setupServer(
  http.get(`${API_URL}/markets`, async () => {
    return HttpResponse.json({ data: [{ _id: '1', name: 'Test Market' }], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Markets API Integration', () => {
  it('lists markets successfully', async () => {
    const res = await marketsApiClient.get('/markets')
    expect(res.data.data[0].name).toBe('Test Market')
  })

  it('maps server error properly', async () => {
    server.use(http.get(`${API_URL}/markets`, async () => HttpResponse.json({ message: 'Internal server error' }, { status: 500 })))
    await expect(marketsApiClient.get('/markets')).rejects.toBeDefined()
  })
})
