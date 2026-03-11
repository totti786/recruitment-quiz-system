import { useState } from 'react'
import { X, Plus, Trash2, Loader2, GripVertical } from 'lucide-react'
import { sessionsApi } from '../../utils/api.js'

export default function SessionModal({ onClose, onSuccess, session = null, quizzes = [] }) {
  const [formData, setFormData] = useState({
    name: session?.name || '',
    description: session?.description || '',
    timeLimit: session?.timeLimit || 60,
    selectedQuizzes: session?.quizzes?.map(q => q.quizId) || []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.selectedQuizzes.length === 0) {
      setError('Please select at least one quiz')
      return
    }

    setLoading(true)

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        timeLimit: parseInt(formData.timeLimit),
        quizIds: formData.selectedQuizzes
      }

      if (session) {
        await sessionsApi.update(session.id, data)
      } else {
        await sessionsApi.create(data)
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to save session')
    } finally {
      setLoading(false)
    }
  }

  const toggleQuiz = (quizId) => {
    setFormData(prev => ({
      ...prev,
      selectedQuizzes: prev.selectedQuizzes.includes(quizId)
        ? prev.selectedQuizzes.filter(id => id !== quizId)
        : [...prev.selectedQuizzes, quizId]
    }))
  }

  const moveQuiz = (index, direction) => {
    const newQuizzes = [...formData.selectedQuizzes]
    const newIndex = index + direction
    
    if (newIndex >= 0 && newIndex < newQuizzes.length) {
      const temp = newQuizzes[index]
      newQuizzes[index] = newQuizzes[newIndex]
      newQuizzes[newIndex] = temp
      
      setFormData(prev => ({
        ...prev,
        selectedQuizzes: newQuizzes
      }))
    }
  }

  const removeQuiz = (quizId) => {
    setFormData(prev => ({
      ...prev,
      selectedQuizzes: prev.selectedQuizzes.filter(id => id !== quizId)
    }))
  }

  const getQuizById = (id) => quizzes.find(q => q.id === id)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {session ? 'Edit Session' : 'Create New Session'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g. Technical Interview"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Optional description of this session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes) *
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={formData.timeLimit}
              onChange={e => setFormData({ ...formData, timeLimit: e.target.value })}
              className="input"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This timer applies to the entire session (all quizzes combined)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Quizzes *
            </label>
            
            {/* Selected Quizzes (with ordering) */}
            {formData.selectedQuizzes.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Quizzes (in order):</p>
                <div className="space-y-2">
                  {formData.selectedQuizzes.map((quizId, index) => {
                    const quiz = getQuizById(quizId)
                    return (
                      <div key={quizId} className="flex items-center gap-2 bg-white p-2 rounded border">
                        <GripVertical size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                        <span className="flex-1 text-sm">{quiz?.name}</span>
                        <span className="text-xs text-gray-500">{quiz?.category}</span>
                        <button
                          type="button"
                          onClick={() => moveQuiz(index, -1)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuiz(index, 1)}
                          disabled={index === formData.selectedQuizzes.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuiz(quizId)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available Quizzes */}
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
              {quizzes.filter(q => !formData.selectedQuizzes.includes(q.id)).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {quizzes.length === 0 ? 'No quizzes available' : 'All quizzes selected'}
                </p>
              ) : (
                quizzes
                  .filter(q => !formData.selectedQuizzes.includes(q.id))
                  .map(quiz => (
                    <button
                      key={quiz.id}
                      type="button"
                      onClick={() => toggleQuiz(quiz.id)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{quiz.name}</p>
                          <p className="text-sm text-gray-600">{quiz.category} • {quiz.questionCount} questions</p>
                        </div>
                        <Plus size={20} className="text-primary-600" />
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                session ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}