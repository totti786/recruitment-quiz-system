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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Session library</h1>
          <p className="mt-1 text-sm text-soft">Search, edit, and arrange reusable assessment sessions.</p>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={20} />
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
      <div className="min-h-0 flex-1">
      {loading ? (
        <div className="flex h-full min-h-[16rem] items-center justify-center">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-soft">No sessions found</p>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="mt-2 transition-colors hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="h-full overflow-y-auto pr-1">
          <div className="space-y-4">
            {filteredSessions.map(session => (
              <div key={session.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-app">{session.name}</h3>
                      <span className="status-pill-info">
                        {session._count?.candidateSessions || 0} candidates
                      </span>
                    </div>
                    
                    {session.description && (
                      <p className="mb-3 text-sm text-soft">{session.description}</p>
                    )}
                    
                    <div className="mb-4 flex items-center gap-4 text-sm text-soft">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {session.timeLimit} minutes
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={14} />
                        {session.quizzes?.length || 0} quizzes
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {session.quizzes?.map((sq, idx) => (
                        <span
                          key={sq.id}
                          className="status-pill bg-muted text-soft"
                        >
                          {idx + 1}. {sq.quiz.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(session)}
                      className="rounded-lg p-2 text-soft transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="rounded-lg p-2 text-soft transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

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
