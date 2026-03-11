import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Loader2, Filter } from 'lucide-react'
import { questionsApi } from '../../utils/api.js'
import QuestionModal from '../../components/modals/QuestionModal.jsx'

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
  const [selectedQuestion, setSelectedQuestion] = useState(null)

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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    try {
      await questionsApi.delete(id)
      setQuestions(questions.filter(q => q.id !== id))
    } catch (err) {
      alert('Failed to delete question')
    }
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
      MULTIPLE_CHOICE: 'bg-blue-100 text-blue-800',
      SHORT_ANSWER: 'bg-green-100 text-green-800',
      CODE: 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      EASY: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HARD: 'bg-red-100 text-red-800'
    }
    return colors[difficulty] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600 mt-1">Manage your question bank</p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Question
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500">No questions found</p>
          {(search || filters.category || filters.difficulty || filters.type) && (
            <button 
              onClick={() => {
                setSearch('')
                setFilters({ category: '', difficulty: '', type: '' })
              }}
              className="mt-2 text-primary-600 hover:text-primary-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map(question => (
            <div key={question.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{question.questionText}</p>
                  
                  {question.codeSnippet && (
                    <pre className="mt-3 p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
                      {question.codeSnippet}
                    </pre>
                  )}
                  
                  {question.type === 'MULTIPLE_CHOICE' && question.choices && (
                    <div className="mt-3 space-y-1">
                      {question.choices.map(choice => (
                        <div 
                          key={choice.id} 
                          className={`flex items-center gap-2 text-sm ${
                            choice.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            choice.isCorrect ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          {choice.choiceText}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
                      {question.type.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {question.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(question)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
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
        <QuestionModal
          question={selectedQuestion}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadQuestions()
          }}
        />
      )}
    </div>
  )
}