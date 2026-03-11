import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Loader2, Shield } from 'lucide-react'
import { authApi } from '../../utils/api.js'
import { useAuthStore } from '../../hooks/useAuthStore.js'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login(credentials.username, credentials.password)
      login(response.token, { username: response.username })
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/25 mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Quiz Admin</h1>
          <p className="text-surface-500 mt-2">Sign in to manage your recruitment system</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input
                  type="password"
                  value={credentials.password}
                  onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
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

          <div className="mt-8 pt-6 border-t border-surface-100">
            <div className="flex items-center justify-center gap-2 text-sm text-surface-500">
              <span>Demo credentials:</span>
              <code className="px-2 py-1 bg-surface-100 rounded-md font-mono text-surface-700">admin / admin123</code>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-6 text-sm text-surface-400">
          Secure authentication required
        </p>
      </div>
    </div>
  )
}