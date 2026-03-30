import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { quizzesApi } from '../../utils/api.js'

export default function QuizModal({ onClose, onSuccess, quiz = null }) {
  const [formData, setFormData] = useState({
    name: quiz?.name || '',
    description: quiz?.description || '',
    category: quiz?.category || '',
    questionCount: quiz?.questionCount || 10
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        questionCount: parseInt(formData.questionCount)
      }

      if (quiz) {
        await quizzesApi.update(quiz.id, data)
      } else {
        await quizzesApi.create(data)
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to save quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-app bg-[var(--panel)] shadow-app backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-app p-6">
          <h2 className="text-xl font-semibold text-app">
            {quiz ? 'Edit Quiz' : 'Create New Quiz'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-faint transition hover:bg-muted hover:text-app">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-2xl border p-3 text-sm" style={{ background: 'var(--danger-soft)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              Quiz Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g. Linux Basics"
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
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="input"
              placeholder="e.g. Linux, DevOps, Programming"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              Number of Questions *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.questionCount}
              onChange={e => setFormData({ ...formData, questionCount: e.target.value })}
              className="input"
              required
            />
            <p className="mt-1 text-xs text-soft">
              Questions will be randomly selected from the question pool
            </p>
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
                quiz ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
