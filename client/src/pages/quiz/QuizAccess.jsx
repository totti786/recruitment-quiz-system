import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { candidatesApi } from '../../utils/api.js'

export default function QuizAccess() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  useEffect(() => {
    loadCandidates()
  }, [])

  const loadCandidates = async () => {
    try {
      const data = await candidatesApi.getAvailable()
      setCandidates(data)
    } catch (err) {
      setError('Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate)
  }

  const handleSelectSession = (session) => {
    // Store session info and navigate to quiz
    sessionStorage.setItem('candidateSession', JSON.stringify({
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.name,
      sessionId: session.sessionId,
      candidateSessionId: session.id,
      sessionName: session.session.name,
      timeLimit: session.timeRemaining
    }))
    navigate('/quiz/session')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Quiz Portal</h1>
          <p className="text-gray-600 text-lg">Select your name to begin your assessment</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-gray-400" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes Currently Assigned</h2>
            <p className="text-gray-600">Please contact your interviewer if you believe this is an error.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {!selectedCandidate ? (
              // Show candidate list
              <div className="grid gap-4">
                {candidates.map(candidate => (
                  <button
                    key={candidate.id}
                    onClick={() => handleSelectCandidate(candidate)}
                    className="card text-left hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {candidate.name}
                        </h3>
                        <p className="text-gray-600 mt-1">{candidate.position?.name || 'No position assigned'}</p>
                        {candidate.email && (
                          <p className="text-sm text-gray-500 mt-1">{candidate.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-primary-600">
                        <span className="text-sm font-medium">
                          {candidate.sessions.length} session(s) available
                        </span>
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // Show session selection for selected candidate
              <div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-primary-600 hover:text-primary-700 mb-6 flex items-center gap-2"
                >
                  ← Back to candidates
                </button>
                
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-primary-600 text-white p-6">
                    <h2 className="text-2xl font-bold">Welcome, {selectedCandidate.name}</h2>
                    <p className="text-primary-100 mt-2">Select a session to begin</p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {selectedCandidate.sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {session.session.name}
                            </h3>
                            {session.session.description && (
                              <p className="text-gray-600 text-sm mt-1">
                                {session.session.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {Math.floor(session.timeRemaining / 60)} minutes remaining
                              </span>
                              <span>
                                {session.session.quizzes.length} quizzes
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {session.session.quizzes.map(sq => (
                                <span
                                  key={sq.id}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {sq.quiz.name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="text-gray-400" size={24} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}