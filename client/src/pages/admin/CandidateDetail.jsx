import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Briefcase, Calendar, ClipboardList, CheckCircle, Clock, Phone, Building2 } from 'lucide-react'
import { candidatesApi } from '../../utils/api.js'

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCandidate()
  }, [id])

  const loadCandidate = async () => {
    try {
      const data = await candidatesApi.getById(id)
      setCandidate(data)
    } catch (err) {
      console.error('Failed to load candidate:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Candidate not found</p>
        <button onClick={() => navigate('/admin/candidates')} className="mt-4 btn-primary">
          Back to Candidates
        </button>
      </div>
    )
  }

  const latestSession = candidate.sessions?.[0]

  return (
    <div>
      <button 
        onClick={() => navigate('/admin/candidates')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Candidates
      </button>

      {/* Candidate Info */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600">
              {candidate.department && (
                <span className="flex items-center gap-1">
                  <Building2 size={16} />
                  {candidate.department.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Briefcase size={16} />
                {candidate.position?.name || '-'}
              </span>
              {candidate.phoneNumber && (
                <span className="flex items-center gap-1">
                  <Phone size={16} />
                  {candidate.phoneNumber}
                </span>
              )}
              {candidate.email && (
                <span className="flex items-center gap-1">
                  <Mail size={16} />
                  {candidate.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                Added {new Date(candidate.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {latestSession && latestSession.status === 'COMPLETED' ? (
            <div>
              {latestSession.score !== null && latestSession.score !== undefined ? (
                <span className={`text-3xl font-bold ${
                  latestSession.score >= 70 ? 'text-green-600' : 
                  latestSession.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {latestSession.score?.toFixed(1)}%
                </span>
              ) : (
                <span className="text-2xl font-bold text-gray-400">-</span>
              )}
              <p className="text-sm text-gray-600">Latest Score</p>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <Clock size={16} />
              {latestSession?.status || 'No Session'}
            </span>
          )}
        </div>
      </div>

      {/* Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Sessions</h2>
        
        {candidate.sessions?.length === 0 ? (
          <div className="card text-center py-8">
            <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No sessions assigned yet</p>
            <button 
              onClick={() => navigate('/admin/candidates')}
              className="mt-4 btn-primary"
            >
              Assign Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {candidate.sessions?.map(session => (
              <div key={session.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{session.session?.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'PAUSED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Started: {new Date(session.startedAt).toLocaleString()}
                      </span>
                      {session.completedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle size={14} />
                          Completed: {new Date(session.completedAt).toLocaleString()}
                        </span>
                      )}
                      {session.status === 'COMPLETED' && session.timeTaken !== null ? (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {session.timeTaken} mins taken
                        </span>
                      ) : session.status === 'ACTIVE' ? (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {Math.floor(session.timeRemaining / 60)} mins remaining
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {session.session?.quizzes?.length || 0} quizzes
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {session.score !== null && session.score !== undefined ? (
                      <span className={`text-2xl font-bold ${
                        session.score >= 70 ? 'text-green-600' : 
                        session.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {session.score.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>

                {session.status === 'COMPLETED' && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => navigate(`/admin/results/${session.id}`)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Detailed Results →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}