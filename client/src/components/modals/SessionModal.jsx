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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 p-4">
      <div className="my-8 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[28px] border border-app bg-[var(--panel)] shadow-app backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-app p-6">
          <h2 className="text-xl font-semibold text-app">
            {session ? 'Edit Session' : 'Create New Session'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-faint transition hover:bg-muted hover:text-app">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-2xl border p-3 text-sm" style={{ background: 'var(--danger-soft)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
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
            <label className="mb-2 block text-sm font-medium text-app">
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
            <label className="mb-2 block text-sm font-medium text-app">
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
            <p className="mt-1 text-xs text-soft">
              This timer applies to the entire session (all quizzes combined)
            </p>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-app">
              Select Quizzes *
            </label>
            
            {formData.selectedQuizzes.length > 0 && (
              <div className="mb-4 rounded-2xl bg-muted p-4">
                <p className="mb-2 text-sm font-medium text-app">Selected Quizzes (in order):</p>
                <div className="space-y-2">
                  {formData.selectedQuizzes.map((quizId, index) => {
                    const quiz = getQuizById(quizId)
                    return (
                      <div key={quizId} className="flex items-center gap-2 rounded-xl border border-app bg-[var(--bg-elevated)] p-2">
                        <GripVertical size={16} className="text-faint" />
                        <span className="w-6 text-sm font-medium text-faint">{index + 1}.</span>
                        <span className="flex-1 text-sm text-app">{quiz?.name}</span>
                        <span className="text-xs text-soft">{quiz?.category}</span>
                        <button
                          type="button"
                          onClick={() => moveQuiz(index, -1)}
                          disabled={index === 0}
                          className="rounded p-1 text-faint transition hover:bg-muted hover:text-app disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuiz(index, 1)}
                          disabled={index === formData.selectedQuizzes.length - 1}
                          className="rounded p-1 text-faint transition hover:bg-muted hover:text-app disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuiz(quizId)}
                          className="rounded p-1 transition hover:bg-[var(--danger-soft)]"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-app bg-[var(--bg-elevated)] p-3">
              {quizzes.filter(q => !formData.selectedQuizzes.includes(q.id)).length === 0 ? (
                <p className="py-4 text-center text-sm text-soft">
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
                      className="w-full rounded-xl border border-app p-3 text-left transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-app">{quiz.name}</p>
                          <p className="text-sm text-soft">{quiz.category} • {quiz.questionCount} questions</p>
                        </div>
                        <Plus size={20} style={{ color: 'var(--primary)' }} />
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>

          <div className="flex gap-3 border-t border-app pt-4">
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
