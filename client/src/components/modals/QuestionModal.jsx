import { useState } from 'react'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import { questionsApi } from '../../utils/api.js'

const QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'CODE', label: 'Code' },
]

const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
]

export default function QuestionModal({ onClose, onSuccess, question = null }) {
  const [formData, setFormData] = useState({
    questionText: question?.questionText || '',
    type: question?.type || 'MULTIPLE_CHOICE',
    category: question?.category || '',
    difficulty: question?.difficulty || 'MEDIUM',
    codeSnippet: question?.codeSnippet || '',
    choices: question?.choices || [
      { choiceText: '', isCorrect: false },
      { choiceText: '', isCorrect: false },
      { choiceText: '', isCorrect: false },
      { choiceText: '', isCorrect: false }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate choices for multiple choice
    if (formData.type === 'MULTIPLE_CHOICE') {
      const validChoices = formData.choices.filter(c => c.choiceText.trim())
      if (validChoices.length < 2) {
        setError('Please provide at least 2 choices')
        return
      }
      if (!validChoices.some(c => c.isCorrect)) {
        setError('Please mark at least one choice as correct')
        return
      }
    }

    setLoading(true)

    try {
      const data = {
        ...formData,
        choices: formData.type === 'MULTIPLE_CHOICE' 
          ? formData.choices.filter(c => c.choiceText.trim())
          : undefined
      }

      if (question) {
        await questionsApi.update(question.id, data)
      } else {
        await questionsApi.create(data)
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to save question')
    } finally {
      setLoading(false)
    }
  }

  const handleChoiceChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      )
    }))
  }

  const addChoice = () => {
    setFormData(prev => ({
      ...prev,
      choices: [...prev.choices, { choiceText: '', isCorrect: false }]
    }))
  }

  const removeChoice = (index) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {question ? 'Edit Question' : 'Add New Question'}
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
              Question Text *
            </label>
            <textarea
              value={formData.questionText}
              onChange={e => setFormData({ ...formData, questionText: e.target.value })}
              className="input min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                {QUESTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                className="input"
              >
                {DIFFICULTIES.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
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

          {(formData.type === 'CODE' || formData.questionText.includes('code')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Snippet (optional)
              </label>
              <textarea
                value={formData.codeSnippet}
                onChange={e => setFormData({ ...formData, codeSnippet: e.target.value })}
                className="input font-mono text-sm min-h-[150px]"
                placeholder="Enter code snippet here..."
              />
            </div>
          )}

          {formData.type === 'MULTIPLE_CHOICE' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Choices *
                </label>
                <button
                  type="button"
                  onClick={addChoice}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Choice
                </button>
              </div>
              <div className="space-y-3">
                {formData.choices.map((choice, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={choice.isCorrect}
                      onChange={() => handleChoiceChange(index, 'isCorrect', true)}
                      className="w-4 h-4 text-primary-600"
                      title="Mark as correct"
                    />
                    <input
                      type="text"
                      value={choice.choiceText}
                      onChange={e => handleChoiceChange(index, 'choiceText', e.target.value)}
                      className="flex-1 input"
                      placeholder={`Choice ${index + 1}`}
                    />
                    {formData.choices.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeChoice(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Select the radio button next to the correct answer
              </p>
            </div>
          )}

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
                question ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}