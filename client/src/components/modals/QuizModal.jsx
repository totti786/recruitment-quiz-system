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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {quiz ? 'Edit Quiz' : 'Create New Quiz'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <p className="text-xs text-gray-500 mt-1">
              Questions will be randomly selected from the question pool
            </p>
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
                quiz ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}