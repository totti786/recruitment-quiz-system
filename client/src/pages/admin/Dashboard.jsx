import { useEffect, useState } from 'react'
import { Users, HelpCircle, BookOpen, Layers, TrendingUp, Clock, Activity, Target, ClipboardCheck } from 'lucide-react'
import { dashboardApi } from '../../utils/api.js'
import { Link } from 'react-router-dom'

const StatCard = ({ label, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-6 hover:shadow-card-hover transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-surface-500">{label}</p>
        <p className="text-3xl font-bold text-surface-900 mt-1">{value}</p>
        {trend && (
          <p className={`text-sm font-medium mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}% from last month
          </p>
        )}
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
)

const CategoryBar = ({ category, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center justify-between">
      <span className="text-surface-700 font-medium">{category}</span>
      <div className="flex items-center gap-3 flex-1 max-w-xs">
        <div className="flex-1 bg-surface-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-surface-600 w-8 text-right">{count}</span>
      </div>
    </div>
  )
}

const ActivityItem = ({ session }) => (
  <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        session.status === 'COMPLETED' ? 'bg-emerald-100' : 'bg-blue-100'
      }`}>
        <Activity className={`w-5 h-5 ${
          session.status === 'COMPLETED' ? 'text-emerald-600' : 'text-blue-600'
        }`} />
      </div>
      <div>
        <p className="font-semibold text-surface-900">{session.candidate?.name}</p>
        <p className="text-sm text-surface-500">{session.session?.name}</p>
      </div>
    </div>
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
      session.status === 'COMPLETED'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-blue-50 text-blue-700'
    }`}>
      {session.status}
    </span>
  </div>
)

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
      console.error('Dashboard load error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-100 border-t-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-surface-600 text-lg">{error}</p>
        <button onClick={loadStats} className="mt-4 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
          Try Again
        </button>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Candidates', value: stats.totalCandidates, icon: Users, color: 'from-blue-500 to-blue-600', trend: 12 },
    { label: 'Total Questions', value: stats.totalQuestions, icon: HelpCircle, color: 'from-emerald-500 to-emerald-600', trend: 8 },
    { label: 'Total Sessions', value: stats.totalSessions, icon: Layers, color: 'from-purple-500 to-purple-600', trend: null },
    { label: 'Total Quizzes', value: stats.totalQuizzes, icon: BookOpen, color: 'from-amber-500 to-amber-600', trend: null },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-500 mt-1">Overview of your recruitment quiz system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Completed Sessions</p>
              <p className="text-3xl font-bold text-surface-900">{stats.completedSessions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ClipboardCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Pending Grading</p>
              <p className="text-3xl font-bold text-surface-900">{stats.pendingGrading || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Active Sessions</p>
              <p className="text-3xl font-bold text-surface-900">{stats.activeSessions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Questions by Category */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-6">
          <h2 className="text-lg font-bold text-surface-900 mb-6">Questions by Category</h2>
          <div className="space-y-4">
            {stats.questionsByCategory.map((cat) => (
              <CategoryBar 
                key={cat.category} 
                category={cat.category} 
                count={cat.count} 
                total={stats.totalQuestions} 
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-surface-900">Recent Activity</h2>
            <Link to="/admin/results" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentSessions?.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-surface-400" />
                </div>
                <p className="text-surface-500">No recent activity</p>
              </div>
            ) : (
              stats.recentSessions?.map((session) => (
                <ActivityItem key={session.id} session={session} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}