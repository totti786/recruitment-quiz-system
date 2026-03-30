import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { positionsApi } from '../../utils/api.js'

export default function PositionModal({ onClose, onSuccess, position = null, departments = [] }) {
  const [formData, setFormData] = useState({
    name: position?.name || '',
    departmentId: position?.departmentId?.toString() || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.departmentId) {
      setError('Please select a department')
      return
    }

    setLoading(true)

    try {
      const data = {
        name: formData.name,
        departmentId: parseInt(formData.departmentId)
      }

      if (position) {
        await positionsApi.update(position.id, data)
      } else {
        await positionsApi.create(data)
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to save position')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-app bg-[var(--panel)] shadow-app backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-app p-6">
          <h2 className="text-xl font-semibold text-app">
            {position ? 'Edit Position' : 'Add New Position'}
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
              Position Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g. Senior Developer"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              Department *
            </label>
            <select
              value={formData.departmentId}
              onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
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
                position ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
