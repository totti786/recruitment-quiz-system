import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Clock, BookOpen, Loader2 } from 'lucide-react'
import { sessionsApi, quizzesApi } from '../../utils/api.js'
import SessionModal from '../../components/modals/SessionModal.jsx'
import Dialog from '../../components/Dialog.jsx'

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false
  })

  useEffect(() => {
    loadSessions()
    loadQuizzes()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await sessionsApi.getAll()
      setSessions(data)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadQuizzes = async () => {
    try {
      const data = await quizzesApi.getAll()
      setQuizzes(data)
    } catch (err) {
      console.error('Failed to load quizzes:', err)
    }
  }

  const handleDelete = (id) => {
    setDialog({
      isOpen: true,
      title: 'Delete Session?',
      message: 'Are you sure you want to delete this session?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await sessionsApi.delete(id)
          setSessions(sessions.filter(s => s.id !== id))
        } catch (err) {
          setDialog({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Failed to delete session',
            type: 'error',
            onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })),
            showCancel: false
          })
        }
      },
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
  }

  const handleEdit = (session) => {
    setSelectedSession(session)
    setShowModal(true)
  }

  const handleAdd = () => {
    setSelectedSession(null)
    setShowModal(true)
  }

  const filteredSessions = sessions.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Sessions</h1>
          <p className="text-gray-600 mt-1">Create and manage quiz sessions</p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create Session
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500">No sessions found</p>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="mt-2 text-primary-600 hover:text-primary-700"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map(session => (
            <div key={session.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                    <span className="px-2.5 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                      {session._count?.candidateSessions || 0} candidates
                    </span>
                  </div>
                  
                  {session.description && (
                    <p className="text-gray-600 text-sm mb-3">{session.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {session.timeLimit} minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {session.quizzes?.length || 0} quizzes
                    </span>
                  </div>

                  {/* Quizzes in this session */}
                  <div className="flex flex-wrap gap-2">
                    {session.quizzes?.map((sq, idx) => (
                      <span
                        key={sq.id}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {idx + 1}. {sq.quiz.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(session)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <SessionModal
          session={selectedSession}
          quizzes={quizzes}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadSessions()
          }}
        />
      )}

      {/* Custom Dialog */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        showCancel={dialog.showCancel}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
      />
    </div>
  )
}