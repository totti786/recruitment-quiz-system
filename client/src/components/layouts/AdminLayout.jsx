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
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  User,
  ClipboardCheck
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../hooks/useAuthStore.js'
import { authApi } from '../../utils/api.js'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/candidates', label: 'Candidates', icon: Users },
  { path: '/admin/sessions', label: 'Sessions', icon: Layers },
  { path: '/admin/quizzes', label: 'Quizzes', icon: BookOpen },
  { path: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { path: '/admin/departments', label: 'Departments', icon: Building2 },
  { path: '/admin/positions', label: 'Positions', icon: Briefcase },
  { path: '/admin/results', label: 'Results', icon: BarChart3 },
  { path: '/admin/account', label: 'Account', icon: User },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  const isDefaultPassword = useAuthStore(state => state.isDefaultPassword)
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
      }, 2000)
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-surface-200/60 shadow-soft transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:shadow-none
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-surface-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-surface-900">Quiz Admin</h1>
                <p className="text-xs text-surface-500">Recruitment System</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin' && location.pathname.startsWith(item.path))
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700 font-semibold' 
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                    }
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} className={isActive ? 'text-primary-600' : 'text-surface-400'} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-surface-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-surface-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-card border border-surface-200/60 hover:shadow-soft transition-shadow"
      >
        {mobileMenuOpen ? <X size={20} className="text-surface-600" /> : <Menu size={20} className="text-surface-600" />}
      </button>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="text-amber-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-surface-900">Change Default Password</h2>
                  <p className="text-sm text-surface-500">For security reasons, please change your password</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {passwordSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-surface-900">Password Changed!</h3>
                  <p className="text-surface-500 mt-2">Your password has been updated successfully.</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full pl-10 pr-10 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
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
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}