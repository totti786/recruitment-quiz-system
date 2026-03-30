import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Briefcase, Calendar, ClipboardList, CheckCircle, Clock3, Phone, Building2, Pencil } from 'lucide-react'
import { candidatesApi } from '../../utils/api.js'
import CandidateModal from '../../components/modals/CandidateModal.jsx'

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadCandidate()
  }, [id])

  const loadCandidate = async () => {
    try {
      const data = await candidatesApi.getById(id)
      setCandidate(data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary-soft)] border-t-[var(--primary)]" />
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="card py-16 text-center">
        <p className="text-lg font-semibold text-app">Candidate not found</p>
        <button onClick={() => navigate('/admin/candidates')} className="btn-primary btn mt-5">
          Back to candidates
        </button>
      </div>
    )
  }

  const latestSession = candidate.sessions?.[0]

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="space-y-6">
      <button onClick={() => navigate('/admin/candidates')} className="btn-ghost !px-0 !py-0 text-[var(--primary)]">
        <ArrowLeft size={18} />
        Back to candidates
      </button>

      <section className="card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">Candidate profile</p>
            <h1 className="mt-3 text-3xl font-extrabold text-app">{candidate.name}</h1>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-soft">
              {candidate.department && (
                <span className="status-pill bg-muted text-soft">
                  <Building2 size={14} />
                  {candidate.department.name}
                </span>
              )}
              <span className="status-pill bg-muted text-soft">
                <Briefcase size={14} />
                {candidate.position?.name || 'Position pending'}
              </span>
              {candidate.phoneNumber && (
                <span className="status-pill bg-muted text-soft">
                  <Phone size={14} />
                  {candidate.phoneNumber}
                </span>
              )}
              {candidate.email && (
                <span className="status-pill bg-muted text-soft">
                  <Mail size={14} />
                  {candidate.email}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button onClick={() => setShowEditModal(true)} className="btn-secondary btn">
              <Pencil size={18} />
              Edit profile
            </button>
            <div className="metric-card min-w-[180px]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Latest outcome</p>
              {latestSession?.status === 'COMPLETED' && latestSession.score !== null ? (
                <>
                  <p className="mt-3 text-3xl font-extrabold text-app">{latestSession.score.toFixed(1)}%</p>
                  <p className="mt-2 text-sm text-soft">Most recent completed session score.</p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-lg font-bold text-app">{latestSession?.status || 'No session yet'}</p>
                  <p className="mt-2 text-sm text-soft">No completed assessment available.</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-app pt-6 md:grid-cols-3">
          <div className="rounded-2xl bg-muted px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Added</p>
            <p className="mt-2 text-sm font-semibold text-app">{new Date(candidate.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="rounded-2xl bg-muted px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Assigned sessions</p>
            <p className="mt-2 text-sm font-semibold text-app">{candidate.sessions?.length || 0}</p>
          </div>
          <div className="rounded-2xl bg-muted px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Completed sessions</p>
            <p className="mt-2 text-sm font-semibold text-app">{candidate.sessions?.filter(session => session.status === 'COMPLETED').length || 0}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Assigned sessions</h2>
          <p className="mt-1 text-sm text-soft">Review status, timing, and completed outcomes by assessment session.</p>
        </div>

        {!candidate.sessions?.length ? (
          <div className="card py-16 text-center">
            <ClipboardList className="mx-auto text-faint" size={28} />
            <h3 className="mt-4 text-xl font-bold text-app">No sessions assigned</h3>
            <p className="mt-2 text-soft">Assign a session from the candidate list when ready.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidate.sessions.map(session => (
              <div key={session.id} className="card">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-app">{session.session?.name}</h3>
                      <span className={session.status === 'COMPLETED' ? 'status-pill-success' : 'status-pill-info'}>
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-soft">
                      <span className="status-pill bg-muted text-soft">
                        <Calendar size={14} />
                        Started {new Date(session.startedAt).toLocaleString()}
                      </span>
                      {session.completedAt && (
                        <span className="status-pill bg-muted text-soft">
                          <CheckCircle size={14} />
                          Completed {new Date(session.completedAt).toLocaleString()}
                        </span>
                      )}
                      {session.status === 'ACTIVE' ? (
                        <span className="status-pill bg-muted text-soft">
                          <Clock3 size={14} />
                          {Math.floor(session.timeRemaining / 60)} minutes remaining
                        </span>
                      ) : session.timeTaken !== null ? (
                        <span className="status-pill bg-muted text-soft">
                          <Clock3 size={14} />
                          {session.timeTaken} minutes used
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Score</p>
                    <p className="mt-2 text-3xl font-extrabold text-app">
                      {session.score !== null && session.score !== undefined ? `${session.score.toFixed(1)}%` : '--'}
                    </p>
                    <p className="mt-1 text-sm text-soft">{session.session?.quizzes?.length || 0} quizzes included</p>
                  </div>
                </div>

                {session.status === 'COMPLETED' && (
                  <div className="mt-5 border-t border-app pt-5">
                    <button onClick={() => navigate(`/admin/results/${session.id}`)} className="btn-primary btn">
                      Open detailed results
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {showEditModal && (
        <CandidateModal
          candidate={candidate}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            loadCandidate()
          }}
        />
      )}
    </div>
    </div>
  )
}
