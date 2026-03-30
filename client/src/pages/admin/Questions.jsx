import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Loader2, Filter, Upload } from 'lucide-react'
import { questionsApi } from '../../utils/api.js'
import QuestionModal from '../../components/modals/QuestionModal.jsx'
import ImportQuestionsModal from '../../components/modals/ImportQuestionsModal.jsx'
import Dialog from '../../components/Dialog.jsx'

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    type: ''
  })
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false
  })

  useEffect(() => {
    loadQuestions()
    loadCategories()
  }, [filters])

  const loadQuestions = async () => {
    try {
      const data = await questionsApi.getAll(filters)
      setQuestions(data)
    } catch (err) {
      console.error('Failed to load questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await questionsApi.getCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const handleDelete = (id) => {
    setDialog({
      isOpen: true,
      title: 'Delete Question?',
      message: 'Are you sure you want to delete this question?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await questionsApi.delete(id)
          setQuestions(questions.filter(q => q.id !== id))
        } catch (err) {
          setDialog({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Failed to delete question',
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

  const handleEdit = (question) => {
    setSelectedQuestion(question)
    setShowModal(true)
  }

  const handleAdd = () => {
    setSelectedQuestion(null)
    setShowModal(true)
  }

  const filteredQuestions = questions.filter(q => 
    q.questionText.toLowerCase().includes(search.toLowerCase()) ||
    q.category.toLowerCase().includes(search.toLowerCase())
  )

  const getTypeColor = (type) => {
    const colors = {
      MULTIPLE_CHOICE: 'status-pill-info',
      SHORT_ANSWER: 'status-pill-success',
      CODE: 'status-pill bg-muted text-app'
    }
    return colors[type] || 'status-pill bg-muted text-soft'
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      EASY: 'status-pill-success',
      MEDIUM: 'status-pill-warning',
      HARD: 'status-pill-danger'
    }
    return colors[difficulty] || 'status-pill bg-muted text-soft'
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Questions</h1>
          <p className="page-subtitle">Manage your question bank.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            Import CSV
          </button>
          <button 
            onClick={handleAdd}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Question
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="input pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}
            className="input w-auto"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filters.difficulty}
            onChange={e => setFilters({ ...filters, difficulty: e.target.value })}
            className="input w-auto"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}
            className="input w-auto"
          >
            <option value="">All Types</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="CODE">Code</option>
          </select>

          {(filters.category || filters.difficulty || filters.type) && (
            <button
              onClick={() => setFilters({ category: '', difficulty: '', type: '' })}
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="min-h-0 flex-1">
      {loading ? (
        <div className="flex h-full min-h-[16rem] items-center justify-center">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-soft">No questions found</p>
          {(search || filters.category || filters.difficulty || filters.type) && (
            <button 
              onClick={() => {
                setSearch('')
                setFilters({ category: '', difficulty: '', type: '' })
              }}
              className="mt-2 transition-colors hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="h-full overflow-y-auto pr-1">
          <div className="space-y-4">
            {filteredQuestions.map(question => (
              <div key={question.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-app">{question.questionText}</p>
                    
                    {question.codeSnippet && (
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-sm font-mono text-gray-100">
                        {question.codeSnippet}
                      </pre>
                    )}
                    
                    {question.type === 'MULTIPLE_CHOICE' && question.choices && (
                      <div className="mt-3 space-y-1">
                        {question.choices.map(choice => (
                          <div 
                            key={choice.id} 
                            className={`flex items-center gap-2 text-sm ${
                              choice.isCorrect ? 'font-medium text-[var(--success)]' : 'text-soft'
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${
                              choice.isCorrect ? 'bg-[var(--success)]' : 'bg-[var(--bg-strong)]'
                            }`} />
                            {choice.choiceText}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <span className={getTypeColor(question.type)}>
                        {question.type.replace('_', ' ')}
                      </span>
                      <span className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </span>
                      <span className="status-pill bg-muted text-soft">
                        {question.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(question)}
                      className="rounded-lg p-2 text-soft transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
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
        <QuestionModal
          question={selectedQuestion}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadQuestions()
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportQuestionsModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            loadQuestions()
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
