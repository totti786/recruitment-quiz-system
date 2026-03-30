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
    <div className="min-h-[78vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success-soft)]">
            <CheckCircle className="text-[var(--success)]" size={40} />
          </div>

          <h1 className="mb-4 text-3xl font-bold text-app">Assessment submitted</h1>
          <p className="mb-8 text-lg text-soft">
            Your responses have been submitted.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-faint">
              You may now close this window.
            </p>
            
            <button
              onClick={() => navigate('/quiz')}
              className="btn-secondary btn w-full"
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
