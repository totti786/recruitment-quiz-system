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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Account Settings</h1>
        <p className="text-surface-500 mt-1">Manage your admin account and security settings</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900">{user?.username || 'Admin'}</h2>
            <p className="text-sm text-surface-500">Administrator Account</p>
            <div className="flex items-center gap-2 mt-2">
              {isDefaultPassword ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                  <AlertTriangle size={12} />
                  Using Default Password
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <Shield size={12} />
                  Password Secured
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Status */}
      {isDefaultPassword && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Security Warning</h3>
              <p className="text-sm text-red-700 mt-1">
                You are currently using the default password. For security reasons, please change your password immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center">
            <Lock className="text-surface-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900">Change Password</h2>
            <p className="text-sm text-surface-500">Update your account password</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-600" size={20} />
            <p className="text-green-700 font-medium">{passwordSuccess}</p>
          </div>
        )}

        {passwordError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={20} />
            <p className="text-red-700 font-medium">{passwordError}</p>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full pl-12 pr-12 py-3 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="Enter new password"
                required
              />
            </div>
            <p className="text-xs text-surface-400 mt-1">Password must be at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
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

      {/* Security Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Security Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Use a strong password with at least 6 characters</li>
          <li>Include a mix of letters, numbers, and symbols</li>
          <li>Avoid using common words or personal information</li>
          <li>Change your password regularly</li>
        </ul>
      </div>
    </div>
  )
}
