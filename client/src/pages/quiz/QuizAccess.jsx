import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Clock3, ChevronRight, Loader2, AlertCircle, Layers3 } from 'lucide-react'
import { candidatesApi, quizSessionsApi } from '../../utils/api.js'

export default function QuizAccess() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [startingSessionId, setStartingSessionId] = useState(null)
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

  const handleSelectSession = async (session) => {
    setError('')
    setStartingSessionId(session.id)

    try {
      const startedSession = await quizSessionsApi.startSession(selectedCandidate.id, session.sessionId)

      sessionStorage.setItem('quizAccessToken', startedSession.accessToken)
      sessionStorage.setItem('candidateSession', JSON.stringify({
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        sessionId: startedSession.sessionId,
        candidateSessionId: startedSession.id,
        sessionName: startedSession.session.name,
        timeRemaining: startedSession.timeRemaining,
        deadlineAt: Date.now() + (startedSession.timeRemaining * 1000),
        currentQuizIndex: startedSession.currentQuizIndex,
        totalQuizzes: startedSession.session.quizzes.length
      }))

      navigate('/quiz/session')
    } catch (err) {
      setError(err.message || 'Failed to start session')
    } finally {
      setStartingSessionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={34} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl pt-6 sm:pt-8">
      <section className="card mb-6 px-6 py-6 sm:px-7 sm:py-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
              Candidate assessment portal
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-app sm:text-[1.95rem]">
              Complete your assigned evaluation.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-soft">
              Select your name, choose a session, and begin when ready.
            </p>
          </div>

          <div className="inline-flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 text-sm lg:min-w-[220px]">
            <span className="text-soft">Available candidates</span>
            <span className="font-semibold text-app">
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-[24px] border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-5 py-4 text-[var(--danger)]">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-faint">
            <Users size={28} />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-app">No quizzes are currently assigned</h2>
          <p className="mt-2 text-soft">If you expected to see a session here, contact your interviewer.</p>
        </div>
      ) : !selectedCandidate ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">Select your profile</h2>
              <p className="mt-1 text-sm text-soft">Only assigned candidates appear in this list.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {candidates.map(candidate => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setSelectedCandidate(candidate)}
                className="card interactive-surface text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Users size={20} />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-app">{candidate.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-soft">{candidate.position?.name || 'No position assigned'}</p>
                    <p className="mt-1 text-sm text-faint">{candidate.department?.name || 'Department pending'}</p>
                  </div>
                  <ChevronRight size={20} className="text-faint" />
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                  <span className="text-sm font-semibold text-soft">Assigned sessions</span>
                  <span className="text-lg font-bold text-app">{candidate.sessions.length}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="card h-fit">
            <button type="button" onClick={() => setSelectedCandidate(null)} className="btn-ghost !px-0 !py-0 text-[var(--primary)]">
              ← Back to candidates
            </button>
            <div className="mt-6 rounded-[26px] bg-muted p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">Selected candidate</p>
              <h2 className="mt-3 text-2xl font-bold text-app">{selectedCandidate.name}</h2>
              <p className="mt-1 text-soft">{selectedCandidate.position?.name || 'No position assigned'}</p>
              <p className="mt-1 text-sm text-faint">{selectedCandidate.department?.name || 'Department pending'}</p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="metric-card">
                <div className="flex items-center gap-3">
                  <Clock3 className="text-[var(--primary)]" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-app">Timed assessment</p>
                    <p className="text-sm text-soft">The remaining time stays visible during the session.</p>
                  </div>
                </div>
              </div>
              <div className="metric-card">
                <div className="flex items-center gap-3">
                  <Layers3 className="text-[var(--primary)]" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-app">Section-based flow</p>
                    <p className="text-sm text-soft">Questions are grouped by quiz to keep the experience structured.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="section-title">Choose a session to begin</h2>
              <p className="mt-1 text-sm text-soft">Start only when you are ready to complete the assessment.</p>
            </div>

            {selectedCandidate.sessions.map(session => (
              <button
                key={session.id}
                type="button"
                onClick={() => handleSelectSession(session)}
                disabled={startingSessionId === session.id}
                className="card interactive-surface w-full text-left disabled:opacity-70"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-app">{session.session.name}</h3>
                      <span className="status-pill-info">Ready to start</span>
                    </div>
                    {session.session.description && (
                      <p className="mt-2 max-w-2xl text-sm text-soft">{session.session.description}</p>
                    )}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {session.session.quizzes.map(sq => (
                        <span key={sq.id} className="status-pill bg-muted text-soft">
                          {sq.quiz.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[240px]">
                    <div className="rounded-2xl bg-muted px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Time remaining</p>
                      <p className="mt-2 text-lg font-bold text-app">{Math.floor(session.timeRemaining / 60)} min</p>
                    </div>
                    <div className="rounded-2xl bg-muted px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Quiz sections</p>
                      <p className="mt-2 text-lg font-bold text-app">{session.session.quizzes.length}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end border-t border-app pt-5 text-[var(--primary)]">
                  {startingSessionId === session.id ? (
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <Loader2 className="animate-spin" size={18} />
                      Starting session
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 font-semibold">
                      Start session
                      <ChevronRight size={18} />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
