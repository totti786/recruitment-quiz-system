import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from '../hooks/useAuthStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    })
    // Reset localStorage mock
    vi.mocked(localStorage.getItem).mockReset()
    vi.mocked(localStorage.setItem).mockReset()
    vi.mocked(localStorage.removeItem).mockReset()
    vi.mocked(localStorage.clear).mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should have initial state', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should login successfully', () => {
    const { login } = useAuthStore.getState()
    const mockToken = 'test-token'
    const mockUser = { username: 'admin', id: 1 }

    login(mockToken, mockUser)

    const state = useAuthStore.getState()
    expect(state.token).toBe(mockToken)
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    // Verify localStorage was called
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken)
  })

  it('should logout successfully', () => {
    const { login, logout } = useAuthStore.getState()
    
    // First login
    login('test-token', { username: 'admin' })
    
    // Then logout
    logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    // Verify localStorage was called
    expect(localStorage.removeItem).toHaveBeenCalledWith('token')
  })

  it('should check auth from localStorage', () => {
    const mockToken = 'stored-token'
    vi.mocked(localStorage.getItem).mockReturnValue(mockToken)

    const { checkAuth } = useAuthStore.getState()
    checkAuth()

    const state = useAuthStore.getState()
    expect(state.token).toBe(mockToken)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should handle checkAuth with no token', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)

    const { checkAuth } = useAuthStore.getState()
    checkAuth()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
