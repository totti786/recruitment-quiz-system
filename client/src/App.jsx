import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './hooks/useAuthStore.js'
import { useThemeStore } from './hooks/useThemeStore.js'

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

// Quiz Pages
import QuizAccess from './pages/quiz/QuizAccess.jsx'
import QuizInterface from './pages/quiz/QuizInterface.jsx'
import QuizComplete from './pages/quiz/QuizComplete.jsx'

// Protected Route
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ToastContainer from './components/Toast.jsx'

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth)
  const initializeTheme = useThemeStore(state => state.initializeTheme)
  
  useEffect(() => {
    checkAuth()
    initializeTheme()
  }, [checkAuth, initializeTheme])

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
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetail />} />
          <Route path="departments" element={<Departments />} />
          <Route path="positions" element={<Positions />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="quizzes" element={<Quizzes />} />
          <Route path="questions" element={<Questions />} />
          <Route path="results" element={<Results />} />
          <Route path="results/:sessionId" element={<ResultDetail />} />
          <Route path="account" element={<Account />} />
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
