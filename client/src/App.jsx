import { Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './hooks/useAuthStore.js'
import { useThemeStore } from './hooks/useThemeStore.js'
import { setAuthErrorHandler } from './utils/api.js'

// Layouts
import AdminLayout from './components/layouts/AdminLayout.jsx'
import QuizLayout from './components/layouts/QuizLayout.jsx'

// Admin Pages
import Dashboard from './pages/admin/Dashboard.jsx'
import Candidates from './pages/admin/Candidates.jsx'
import CandidateDetail from './pages/admin/CandidateDetail.jsx'
import Departments from './pages/admin/Departments.jsx'
import Positions from './pages/admin/Positions.jsx'
import Sessions from './pages/admin/Sessions.jsx'
import Quizzes from './pages/admin/Quizzes.jsx'
import Questions from './pages/admin/Questions.jsx'
import Results from './pages/admin/Results.jsx'
import ResultDetail from './pages/admin/ResultDetail.jsx'
import Login from './pages/admin/Login.jsx'
import Account from './pages/admin/Account.jsx'
import AdminManagement from './pages/admin/AdminManagement.jsx'
import AuditLog from './pages/admin/AuditLog.jsx'

// Quiz Pages
import QuizAccess from './pages/quiz/QuizAccess.jsx'
import QuizInterface from './pages/quiz/QuizInterface.jsx'
import QuizComplete from './pages/quiz/QuizComplete.jsx'

// Protected Route
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RoleGate from './components/RoleGate.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ToastContainer from './components/Toast.jsx'

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth)
  const logout = useAuthStore(state => state.logout)
  const initializeTheme = useThemeStore(state => state.initializeTheme)
  const navigate = useNavigate()
  
  useEffect(() => {
    checkAuth()
    initializeTheme()
  }, [checkAuth, initializeTheme])

  useEffect(() => {
    setAuthErrorHandler((status, payload) => {
      if (status === 401 || status === 403) {
        logout()
        navigate('/admin/login', { replace: true })
      }
    })
  }, [logout, navigate])

  return (
    <ErrorBoundary>
      <ToastContainer />
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="candidates" element={<RoleGate roles={['SUPER_ADMIN', 'ADMIN']}><Candidates /></RoleGate>} />
          <Route path="candidates/:id" element={<RoleGate roles={['SUPER_ADMIN', 'ADMIN']}><CandidateDetail /></RoleGate>} />
          <Route path="departments" element={<RoleGate roles={['SUPER_ADMIN']}><Departments /></RoleGate>} />
          <Route path="positions" element={<RoleGate roles={['SUPER_ADMIN', 'ADMIN']}><Positions /></RoleGate>} />
          <Route path="sessions" element={<RoleGate roles={['SUPER_ADMIN', 'ADMIN']}><Sessions /></RoleGate>} />
          <Route path="quizzes" element={<RoleGate roles={['SUPER_ADMIN', 'ADMIN']}><Quizzes /></RoleGate>} />
          <Route path="questions" element={<RoleGate roles={['SUPER_ADMIN', 'ADMIN']}><Questions /></RoleGate>} />
          <Route path="results" element={<RoleGate roles={['SUPER_ADMIN', 'ADMIN']}><Results /></RoleGate>} />
          <Route path="results/:sessionId" element={<RoleGate roles={['SUPER_ADMIN', 'ADMIN']}><ResultDetail /></RoleGate>} />
          <Route path="admins" element={<RoleGate roles={['SUPER_ADMIN']}><AdminManagement /></RoleGate>} />
          <Route path="audit" element={<RoleGate roles={['SUPER_ADMIN']}><AuditLog /></RoleGate>} />
          <Route path="account" element={<RoleGate roles={['SUPER_ADMIN', 'ADMIN']}><Account /></RoleGate>} />
        </Route>

        {/* Quiz Routes */}
        <Route path="/quiz" element={<QuizLayout />}>
          <Route index element={<QuizAccess />} />
          <Route path="session" element={<QuizInterface />} />
          <Route path="complete" element={<QuizComplete />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<QuizAccess />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
