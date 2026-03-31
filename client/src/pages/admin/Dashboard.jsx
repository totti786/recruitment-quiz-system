import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, BookOpen, ClipboardCheck, HelpCircle, Layers, Target, Users } from 'lucide-react'
import { dashboardApi } from '../../utils/api.js'

function StatCard({ title, value, detail, tone }) {
  const tones = {
    blue: 'bg-[var(--primary-soft)] text-[var(--primary)]',
    green: 'bg-[var(--success-soft)] text-[var(--success)]',
    amber: 'bg-[var(--warning-soft)] text-[var(--warning)]',
    info: 'bg-[var(--info-soft)] text-[var(--info)]',
  }

  return (
    <div className="metric-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">{title}</p>
      <div className={`mt-4 inline-flex rounded-2xl px-3 py-2 text-3xl font-extrabold ${tones[tone] || tones.blue}`}>
        {value}
      </div>
      <p className="mt-3 text-sm text-soft">{detail}</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const totalCategoryQuestions = useMemo(
    () => stats?.questionsByCategory?.reduce((sum, item) => sum + item.count, 0) || 0,
    [stats]
  )

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary-soft)] border-t-[var(--primary)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card py-16 text-center">
        <p className="text-lg font-semibold text-app">{error}</p>
        <button onClick={loadStats} className="btn-primary btn mt-5">Try again</button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-6">
      <section className="card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="status-pill-info">Overview</span>
            <h1 className="mt-5 page-title">Track candidate flow, reviewer workload, and assessment coverage.</h1>
            <p className="page-subtitle max-w-2xl">
              The dashboard is organized to help reviewers spot backlog, monitor active sessions, and jump into grading without scanning raw tables first.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard title="Completed sessions" value={stats.completedSessions} detail="Assessments already submitted for review." tone="green" />
            <StatCard title="Pending grading" value={stats.pendingGrading || 0} detail="Written and code answers still waiting for review." tone="amber" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Candidates" value={stats.totalCandidates} detail="Profiles currently tracked in the system." tone="blue" />
        <StatCard title="Questions" value={stats.totalQuestions} detail="Questions available across the bank." tone="info" />
        <StatCard title="Sessions" value={stats.totalSessions} detail="Reusable assessment sessions configured." tone="blue" />
        <StatCard title="Quizzes" value={stats.totalQuizzes} detail="Quiz sections available for assignment." tone="green" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.86fr]">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">Question coverage</h2>
              <p className="mt-1 text-sm text-soft">Distribution by category helps reveal bank imbalance.</p>
            </div>
            <span className="status-pill-info">{totalCategoryQuestions} total</span>
          </div>

          <div className="mt-6 max-h-64 overflow-y-auto space-y-4 pr-2">
            {stats.questionsByCategory.map(category => {
              const percentage = totalCategoryQuestions ? (category.count / totalCategoryQuestions) * 100 : 0
              return (
                <div key={category.category}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-app">{category.category}</span>
                    <span className="text-soft">{category.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-strong))]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">Recent activity</h2>
                <p className="mt-1 text-sm text-soft">Most recent candidate sessions in progress or completed.</p>
              </div>
              <Link to="/admin/results" className="btn-ghost !px-0 !py-0 text-[var(--primary)]">
                View results
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {stats.recentSessions?.length ? stats.recentSessions.map(session => (
                <div key={session.id} className="rounded-[22px] bg-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-app">{session.candidate?.name}</p>
                        <p className="text-sm text-soft">{session.session?.name}</p>
                      </div>
                    </div>
                    <span className={session.status === 'COMPLETED' ? 'status-pill-success' : 'status-pill-info'}>
                      {session.status}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-soft">No recent sessions recorded.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/admin/candidates" className="metric-card interactive-surface block">
              <Users className="text-[var(--primary)]" size={20} />
              <h3 className="mt-4 font-bold text-app">Review candidates</h3>
              <p className="mt-2 text-sm text-soft">Search, filter, and jump straight into candidate details.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                Open candidates
                <ArrowRight size={16} />
              </span>
            </Link>
            <Link to="/admin/results" className="metric-card interactive-surface block">
              <ClipboardCheck className="text-[var(--primary)]" size={20} />
              <h3 className="mt-4 font-bold text-app">Grade results</h3>
              <p className="mt-2 text-sm text-soft">Prioritize sessions with pending manual review.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                Open results
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <Users className="text-[var(--primary)]" size={18} />
          <p className="mt-4 font-bold text-app">Candidate throughput</p>
          <p className="mt-2 text-sm text-soft">{stats.completedSessions} completed vs {stats.activeSessions} active.</p>
        </div>
        <div className="metric-card">
          <HelpCircle className="text-[var(--primary)]" size={18} />
          <p className="mt-4 font-bold text-app">Question bank health</p>
          <p className="mt-2 text-sm text-soft">{stats.totalQuestions} total questions across multiple categories.</p>
        </div>
        <div className="metric-card">
          <BookOpen className="text-[var(--primary)]" size={18} />
          <p className="mt-4 font-bold text-app">Quiz structure</p>
          <p className="mt-2 text-sm text-soft">{stats.totalQuizzes} reusable quiz sections configured.</p>
        </div>
        <div className="metric-card">
          <Layers className="text-[var(--primary)]" size={18} />
          <p className="mt-4 font-bold text-app">Operational focus</p>
          <p className="mt-2 text-sm text-soft">{stats.pendingGrading || 0} sessions still need manual grading attention.</p>
        </div>
      </section>
    </div>
  )
}
