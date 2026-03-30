import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock the modules before importing Login
vi.mock('../hooks/useAuthStore.js', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
  }),
}))

vi.mock('../utils/api.js', () => ({
  authApi: {
    login: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Now import Login after mocks
const { default: Login } = await import('../pages/admin/Login')

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByText('Quiz Admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows demo credentials', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByText('Demo credentials:')).toBeInTheDocument()
    expect(screen.getByText('admin / admin123')).toBeInTheDocument()
  })

  it('handles input changes', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const usernameInput = screen.getByPlaceholderText('Enter your username')
    const passwordInput = screen.getByPlaceholderText('Enter your password')

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass' } })

    expect(usernameInput).toHaveValue('testuser')
    expect(passwordInput).toHaveValue('testpass')
  })

  it('validates required fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const usernameInput = screen.getByPlaceholderText('Enter your username')
    const passwordInput = screen.getByPlaceholderText('Enter your password')

    expect(usernameInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
  })
})
