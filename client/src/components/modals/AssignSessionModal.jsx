import { useState } from 'react'
import { X, Loader2, Clock, BookOpen } from 'lucide-react'
import { candidatesApi } from '../../utils/api.js'

export default function AssignSessionModal({ candidate, sessions, onClose, onSuccess }) {
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!selectedSessionId) {
      setError('Please select a session')
      return
    }

    setLoading(true)

    try {
      await candidatesApi.assignSession(candidate.id, parseInt(selectedSessionId))
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to assign session')
    } finally {
      setLoading(false)
    }
  }

  // Filter out sessions already assigned to this candidate
  const availableSessions = sessions.filter(session => 
    !candidate.sessions?.some(cs => cs.sessionId === session.id)
  )

  const selectedSession = sessions.find(s => s.id === parseInt(selectedSessionId))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Session</h2>
            <p className="text-sm text-gray-600 mt-1">to {candidate.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {availableSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No available sessions to assign.</p>
              <p className="text-sm mt-2">All sessions have already been assigned to this candidate.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Session *
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableSessions.map(session => (
                    <label
                      key={session.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSessionId === session.id.toString()
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="session"
                        value={session.id}
                        checked={selectedSessionId === session.id.toString()}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{session.name}</p>
                        {session.description && (
                          <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {session.timeLimit} minutes
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {session.quizzes?.length || 0} quizzes
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedSession && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Quizzes in this session:</h4>
                  <div className="space-y-1">
                    {selectedSession.quizzes?.map((sq, idx) => (
                      <div key={sq.id} className="text-sm text-gray-600">
                        {idx + 1}. {sq.quiz.name} ({sq.quiz.category})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            {availableSessions.length > 0 && (
              <button
                type="submit"
                disabled={loading || !selectedSessionId}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Assigning...
                  </>
                ) : (
                  'Assign Session'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}