import { useState } from 'react'
import { useAuthStore } from '../../hooks/useAuthStore.js'
import { authApi } from '../../utils/api.js'
import { User, Lock, Shield, AlertTriangle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Account() {
  const user = useAuthStore(state => state.user)
  const isDefaultPassword = useAuthStore(state => state.isDefaultPassword)
  const markPasswordChanged = useAuthStore(state => state.markPasswordChanged)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setPasswordLoading(true)
    
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordSuccess('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      markPasswordChanged()
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">Manage your admin account and security settings.</p>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-app bg-muted text-app shadow-soft-app">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-app">{user?.username || 'Admin'}</h2>
            <p className="text-sm text-soft">Administrator account</p>
            <div className="flex items-center gap-2 mt-2">
              {isDefaultPassword ? (
                <span className="status-pill-danger">
                  <AlertTriangle size={12} />
                  Using Default Password
                </span>
              ) : (
                <span className="status-pill-success">
                  <Shield size={12} />
                  Password Secured
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isDefaultPassword && (
        <div className="mb-6 rounded-2xl border p-4" style={{ background: 'var(--danger-soft)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} style={{ color: 'var(--danger)' }} />
            <div>
              <h3 className="font-semibold text-app">Security Warning</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--danger)' }}>
                You are currently using the default password. For security reasons, please change your password immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-soft">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-app">Change Password</h2>
            <p className="text-sm text-soft">Update your account password.</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border p-4" style={{ background: 'var(--success-soft)', borderColor: 'color-mix(in srgb, var(--success) 28%, transparent)' }}>
            <CheckCircle size={20} style={{ color: 'var(--success)' }} />
            <p className="font-medium" style={{ color: 'var(--success)' }}>{passwordSuccess}</p>
          </div>
        )}

        {passwordError && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border p-4" style={{ background: 'var(--danger-soft)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
            <p className="font-medium" style={{ color: 'var(--danger)' }}>{passwordError}</p>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-app">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input rounded-xl pl-12 pr-12"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-faint transition hover:text-soft"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-app">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input rounded-xl pl-12 pr-4"
                placeholder="Enter new password"
                required
              />
            </div>
            <p className="mt-1 text-xs text-faint">Password must be at least 6 characters.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-app">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input rounded-xl pl-12 pr-4"
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="btn-primary btn w-full rounded-xl"
          >
            {passwordLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Changing Password...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border p-4" style={{ background: 'var(--info-soft)', borderColor: 'color-mix(in srgb, var(--info) 24%, transparent)' }}>
        <h3 className="mb-2 font-semibold text-app">Security Tips</h3>
        <ul className="list-inside list-disc space-y-1 text-sm" style={{ color: 'var(--info)' }}>
          <li>Use a strong password with at least 6 characters</li>
          <li>Include a mix of letters, numbers, and symbols</li>
          <li>Avoid using common words or personal information</li>
          <li>Change your password regularly</li>
        </ul>
      </div>
    </div>
    </div>
  )
}
