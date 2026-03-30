import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { departmentsApi } from '../../utils/api.js'

export default function DepartmentModal({ onClose, onSuccess, department = null }) {
  const [formData, setFormData] = useState({
    name: department?.name || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (department) {
        await departmentsApi.update(department.id, formData)
      } else {
        await departmentsApi.create(formData)
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to save department')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-app bg-[var(--panel)] shadow-app backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-app p-6">
          <h2 className="text-xl font-semibold text-app">
            {department ? 'Edit Department' : 'Add New Department'}
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
              Department Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ name: e.target.value })}
              className="input"
              placeholder="e.g. Engineering"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
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
                department ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
