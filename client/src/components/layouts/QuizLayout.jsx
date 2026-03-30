import { Outlet } from 'react-router-dom'

export default function QuizLayout() {
  return (
    <div className="min-h-screen px-4 py-4 sm:px-6">
      <Outlet />
    </div>
  )
}
