import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, authApi, dashboardApi, quizSessionsApi } from '../utils/api.js'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('api utilities', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.mocked(localStorage.getItem).mockReset()
    vi.mocked(sessionStorage.getItem).mockReset()
  })

  it('throws ApiError with the server error message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    })

    await expect(authApi.login('admin', 'bad-password')).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: 'Invalid credentials',
        status: 401,
      })
    )
  })

  it('sends the quiz session token on protected quiz requests', async () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue('quiz-token')
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ questions: [] }),
    })

    await quizSessionsApi.getQuizQuestions(12, 0)

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.get('Authorization')).toBe('Bearer quiz-token')
  })

  it('returns a blob for export requests and uses the admin token', async () => {
    const blob = new Blob(['csv'])
    vi.mocked(localStorage.getItem).mockReturnValue('admin-token')
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/csv' }),
      blob: () => Promise.resolve(blob),
    })

    const result = await dashboardApi.exportResults()

    expect(result).toBe(blob)
    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.get('Authorization')).toBe('Bearer admin-token')
  })

  it('creates ApiError instances', () => {
    const error = new ApiError('Request failed', 500)

    expect(error).toBeInstanceOf(Error)
    expect(error.status).toBe(500)
  })
})
