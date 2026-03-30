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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-app bg-[var(--panel)] shadow-app backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-app p-6">
          <div>
            <h2 className="text-xl font-semibold text-app">Assign Session</h2>
            <p className="mt-1 text-sm text-soft">to {candidate.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-faint transition hover:bg-muted hover:text-app">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-2xl border p-3 text-sm" style={{ background: 'var(--danger-soft)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {availableSessions.length === 0 ? (
            <div className="py-8 text-center text-soft">
              <p>No available sessions to assign.</p>
              <p className="text-sm mt-2">All sessions have already been assigned to this candidate.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-app">
                  Select Session *
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableSessions.map(session => (
                    <label
                      key={session.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        selectedSessionId === session.id.toString()
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                          : 'border-app hover:bg-muted'
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
                        <p className="font-medium text-app">{session.name}</p>
                        {session.description && (
                          <p className="mt-1 text-sm text-soft">{session.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-sm text-soft">
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
                <div className="rounded-2xl bg-muted p-4">
                  <h4 className="mb-2 font-medium text-app">Quizzes in this session:</h4>
                  <div className="space-y-1">
                    {selectedSession.quizzes?.map((sq, idx) => (
                      <div key={sq.id} className="text-sm text-soft">
                        {idx + 1}. {sq.quiz.name} ({sq.quiz.category})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 border-t border-app pt-4">
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
