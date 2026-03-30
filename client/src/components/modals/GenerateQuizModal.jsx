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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-[28px] border border-app bg-[var(--panel)] shadow-app backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-app p-6">
          <div>
            <h2 className="text-xl font-semibold text-app">Generate Quiz</h2>
            <p className="mt-1 text-sm text-soft">for {candidate.name}</p>
          </div>
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
            <label className="mb-2 block text-sm font-medium text-app">
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
            <label className="mb-3 block text-sm font-medium text-app">
              Categories to Include
            </label>
            {loadingCategories ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin text-faint" size={24} />
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
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-muted text-soft hover:bg-[var(--bg-strong)]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
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
