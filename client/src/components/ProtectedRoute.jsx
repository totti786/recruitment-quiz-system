import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore.js'

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  
  return children
}