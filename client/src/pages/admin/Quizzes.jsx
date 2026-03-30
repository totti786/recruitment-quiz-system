import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Loader2 } from 'lucide-react'
import { quizzesApi } from '../../utils/api.js'
import QuizModal from '../../components/modals/QuizModal.jsx'
import Dialog from '../../components/Dialog.jsx'

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false
  })

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      const data = await quizzesApi.getAll()
      setQuizzes(data)
    } catch (err) {
      console.error('Failed to load quizzes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id) => {
    setDialog({
      isOpen: true,
      title: 'Delete Quiz?',
      message: 'Are you sure you want to delete this quiz?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await quizzesApi.delete(id)
          setQuizzes(quizzes.filter(q => q.id !== id))
        } catch (err) {
          setDialog({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Failed to delete quiz',
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

  const handleEdit = (quiz) => {
    setSelectedQuiz(quiz)
    setShowModal(true)
  }

  const handleAdd = () => {
    setSelectedQuiz(null)
    setShowModal(true)
  }

  const filteredQuizzes = quizzes.filter(q => 
    q.name.toLowerCase().includes(search.toLowerCase()) ||
    q.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Quizzes</h1>
          <p className="page-subtitle">Manage individual quizzes.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create Quiz
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
            placeholder="Search quizzes..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Quizzes List */}
      <div className="min-h-0 flex-1">
      {loading ? (
        <div className="flex h-full min-h-[16rem] items-center justify-center">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-soft">No quizzes found</p>
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
            {filteredQuizzes.map(quiz => (
              <div key={quiz.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-app">{quiz.name}</h3>
                    
                    {quiz.description && (
                      <p className="mb-2 text-sm text-soft">{quiz.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-soft">
                      <span className="status-pill bg-muted text-soft">
                        {quiz.category}
                      </span>
                      <span>{quiz.questionCount} questions</span>
                      {quiz.sessionQuizzes?.length > 0 && (
                        <span style={{ color: 'var(--primary)' }}>
                          Used in {quiz.sessionQuizzes.length} session(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(quiz)}
                      className="rounded-lg p-2 text-soft transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
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
        <QuizModal
          quiz={selectedQuiz}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadQuizzes()
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
