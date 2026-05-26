import { useAuthStore } from '../hooks/useAuthStore.js'
import { Navigate } from 'react-router-dom'

export default function RoleGate({ roles, children, fallback = null }) {
  const user = useAuthStore(state => state.user)

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (!roles.includes(user.role)) {
    if (fallback) return fallback
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-app">Access Denied</h2>
          <p className="mt-2 text-soft">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return children
}
