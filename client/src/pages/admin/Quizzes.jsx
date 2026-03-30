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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-600 mt-1">Manage individual quizzes</p>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500">No quizzes found</p>
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
          {filteredQuizzes.map(quiz => (
            <div key={quiz.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{quiz.name}</h3>
                  
                  {quiz.description && (
                    <p className="text-gray-600 text-sm mb-2">{quiz.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="px-2.5 py-1 bg-gray-100 rounded-full">
                      {quiz.category}
                    </span>
                    <span>{quiz.questionCount} questions</span>
                    {quiz.sessionQuizzes?.length > 0 && (
                      <span className="text-primary-600">
                        Used in {quiz.sessionQuizzes.length} session(s)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(quiz)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
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