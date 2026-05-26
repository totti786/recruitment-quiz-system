import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Loader2, Shield } from 'lucide-react'
import { authApi } from '../../utils/api.js'
import { useAuthStore } from '../../hooks/useAuthStore.js'
import ThemeToggle from '../../components/ThemeToggle.jsx'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const isDefaultPassword = useAuthStore(state => state.isDefaultPassword)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login(credentials.username, credentials.password)
      login(response.token, { 
        username: response.username,
        role: response.role,
        isDefaultPassword: response.isDefaultPassword 
      })
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto mb-8 flex max-w-6xl justify-end">
        <ThemeToggle compact />
      </div>
      <div className="flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] shadow-app mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-app">Quiz Admin</h1>
          <p className="mt-2 text-soft">Sign in to manage your recruitment system</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)] animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-soft">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                  className="input pl-11"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-soft">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
                <input
                  type="password"
                  value={credentials.password}
                  onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                  className="input pl-11"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {isDefaultPassword && (
            <div className="mt-8 border-t border-app pt-6">
              <div className="flex items-center justify-center gap-2 text-sm text-soft">
                <span>Demo credentials:</span>
                <code className="mono rounded-md bg-muted px-2 py-1 text-app">admin / admin123</code>
              </div>
            </div>
          )}
        </div>
        
        <p className="mt-6 text-center text-sm text-faint">
          Secure authentication required
        </p>
      </div>
      </div>
    </div>
  )
}
