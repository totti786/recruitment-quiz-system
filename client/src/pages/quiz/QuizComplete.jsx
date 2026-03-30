import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Home } from 'lucide-react'

export default function QuizComplete() {
  const navigate = useNavigate()

  useEffect(() => {
    // Clear session data
    sessionStorage.removeItem('candidateSession')
    sessionStorage.removeItem('quizAccessToken')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your responses have been submitted.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              You may now close this window.
            </p>
            
            <button
              onClick={() => navigate('/quiz')}
              className="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <Home size={18} />
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
