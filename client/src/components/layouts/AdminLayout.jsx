import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  BarChart3,
  LogOut,
  Menu,
  X,
  BookOpen,
  Layers,
  Building2,
  Briefcase,
  Shield,
  ScrollText,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  User,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../hooks/useAuthStore.js'
import { authApi } from '../../utils/api.js'
import ThemeToggle from '../ThemeToggle.jsx'

const allNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/admin/candidates', label: 'Candidates', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/admin/sessions', label: 'Sessions', icon: Layers, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/admin/quizzes', label: 'Quizzes', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/admin/questions', label: 'Questions', icon: HelpCircle, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/admin/departments', label: 'Departments', icon: Building2, roles: ['SUPER_ADMIN'] },
  { path: '/admin/positions', label: 'Positions', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/admin/results', label: 'Results', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/admin/admins', label: 'Admins', icon: Shield, roles: ['SUPER_ADMIN'] },
  { path: '/admin/audit', label: 'Audit Log', icon: ScrollText, roles: ['SUPER_ADMIN'] },
  { path: '/admin/account', label: 'Account', icon: User, roles: ['SUPER_ADMIN', 'ADMIN'] },
]

function AdminPasswordModal({
  isOpen,
  onClose,
  onSubmit,
  passwordForm,
  setPasswordForm,
  passwordError,
  passwordLoading,
  passwordSuccess,
  showPassword,
  setShowPassword,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="card max-w-md w-full">
        <div className="flex items-start gap-4 border-b border-app pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)]">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app">Change default password</h2>
            <p className="mt-1 text-sm text-soft">Protect reviewer access before you continue.</p>
          </div>
        </div>

        <div className="pt-6">
          {passwordSuccess ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                <Shield size={30} />
              </div>
              <h3 className="text-lg font-semibold text-app">Password updated</h3>
              <p className="mt-2 text-soft">Your admin account is now secured.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {passwordError && (
                <div className="rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-soft">Current password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input pl-11 pr-11"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-faint"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-soft">New password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-soft">Confirm password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary btn">
                  Later
                </button>
                <button type="submit" disabled={passwordLoading} className="btn-primary btn">
                  {passwordLoading ? 'Saving...' : 'Update password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  const isDefaultPassword = useAuthStore(state => state.isDefaultPassword)
  const user = useAuthStore(state => state.user)
  const markPasswordChanged = useAuthStore(state => state.markPasswordChanged)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const navItems = allNavItems.filter(item => item.roles.includes(user?.role || 'ADMIN'))

  useEffect(() => {
    if (isDefaultPassword) {
      setShowPasswordModal(true)
    }
  }, [isDefaultPassword])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')

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
      setPasswordSuccess(true)
      markPasswordChanged()
      setTimeout(() => {
        setShowPasswordModal(false)
      }, 1600)
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden lg:p-6">
      <div className="lg:flex lg:h-full lg:gap-6">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-app bg-[var(--panel)] p-5 shadow-app backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-full lg:translate-x-0 lg:overflow-hidden lg:rounded-[32px] lg:border ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-app pb-5">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-white shadow-app">
                <Shield size={22} />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-app">Recruitment Console</h1>
                <p className="text-xs uppercase tracking-[0.16em] text-faint">Assessment ops</p>
              </div>
            </Link>
            <button className="lg:hidden btn-ghost !px-2 !py-2" onClick={() => setMobileMenuOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <nav className="mt-5 flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`interactive-surface flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                    isActive
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'text-soft hover:bg-muted'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="space-y-3 border-t border-app pt-5">
            {isDefaultPassword && <span className="status-pill-warning">Security action required</span>}
            <ThemeToggle />
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Signed in</p>
              <p className="mt-2 font-semibold text-app">{user?.username || 'Administrator'}</p>
              <p className="mt-1 text-sm text-soft">Review candidate performance and grading progress.</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary btn w-full justify-center">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="flex flex-1 min-h-0 flex-col p-4 lg:h-full lg:pt-4 lg:pr-1">
        <div className="mb-4 lg:hidden">
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="btn-secondary btn">
            <Menu size={18} />
            Menu
          </button>
        </div>

        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      </div>

      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        passwordError={passwordError}
        passwordLoading={passwordLoading}
        passwordSuccess={passwordSuccess}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />
    </div>
  )
}
