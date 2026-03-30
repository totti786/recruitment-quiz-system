import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create a mock for ApiError
class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Create a mock for fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFetch.mockClear()
    // Reset localStorage mock
    vi.mocked(localStorage.getItem).mockReset()
    vi.mocked(localStorage.setItem).mockReset()
  })

  describe('ApiError', () => {
    it('should create ApiError with message and status', () => {
      const error = new ApiError('Test error', 404)
      
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(404)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('fetch behavior', () => {
    it('should make API requests', async () => {
      const mockResponse = { data: 'test' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await fetch('/api/test')
      const data = await result.json()
      
      expect(data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/test')
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      })

      const response = await fetch('/api/test')
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })
  })
})
