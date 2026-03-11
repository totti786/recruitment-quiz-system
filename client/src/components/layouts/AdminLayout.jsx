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
  Shield
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../hooks/useAuthStore.js'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/candidates', label: 'Candidates', icon: Users },
  { path: '/admin/sessions', label: 'Sessions', icon: Layers },
  { path: '/admin/quizzes', label: 'Quizzes', icon: BookOpen },
  { path: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { path: '/admin/departments', label: 'Departments', icon: Building2 },
  { path: '/admin/positions', label: 'Positions', icon: Briefcase },
  { path: '/admin/results', label: 'Results', icon: BarChart3 },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
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
    </div>
  )
}