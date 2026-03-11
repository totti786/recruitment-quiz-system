import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { candidatesApi, questionsApi } from '../../utils/api.js'

export default function GenerateQuizModal({ candidate, onClose, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [config, setConfig] = useState({
    questionCount: 10,
    categories: [],
    timeLimit: 60
  })
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await questionsApi.getCategories()
      setCategories(data)
      setConfig(prev => ({ ...prev, categories: data }))
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await candidatesApi.generateQuiz(candidate.id, config)
      onSuccess(result)
    } catch (err) {
      setError(err.message || 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Generate Quiz</h2>
            <p className="text-sm text-gray-600 mt-1">for {candidate.name}</p>
          </div>
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
              Number of Questions
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={config.questionCount}
              onChange={e => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={config.timeLimit}
              onChange={e => setConfig({ ...config, timeLimit: parseInt(e.target.value) })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Categories to Include
            </label>
            {loadingCategories ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      config.categories.includes(category)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
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
              disabled={loading || config.categories.length === 0}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                'Generate Quiz'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}