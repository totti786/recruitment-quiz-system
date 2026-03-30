import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { candidatesApi, departmentsApi } from '../../utils/api.js'

export default function CandidateModal({ onClose, onSuccess, candidate = null }) {
  const [formData, setFormData] = useState({
    name: candidate?.name || '',
    phoneNumber: candidate?.phoneNumber || '',
    email: candidate?.email || '',
    departmentId: candidate?.departmentId?.toString() || '',
    positionId: candidate?.positionId?.toString() || '',
    notes: candidate?.notes || ''
  })
  const [departments, setDepartments] = useState([])
  const [availablePositions, setAvailablePositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDepartments()
  }, [])

  useEffect(() => {
    if (formData.departmentId) {
      const dept = departments.find(d => d.id.toString() === formData.departmentId)
      if (dept) {
        setAvailablePositions(dept.positions || [])
        // Reset position if it's not in the new department
        const positionExists = dept.positions?.some(p => p.id.toString() === formData.positionId)
        if (!positionExists) {
          setFormData(prev => ({ ...prev, positionId: '' }))
        }
      }
    } else {
      setAvailablePositions([])
      setFormData(prev => ({ ...prev, positionId: '' }))
    }
  }, [formData.departmentId, departments])

  const loadDepartments = async () => {
    try {
      const data = await departmentsApi.getAll()
      setDepartments(data)
    } catch (err) {
      console.error('Failed to load departments:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email || null,
        departmentId: parseInt(formData.departmentId),
        positionId: parseInt(formData.positionId),
        notes: formData.notes || null
      }

      if (candidate) {
        await candidatesApi.update(candidate.id, data)
      } else {
        await candidatesApi.create(data)
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to save candidate')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-app bg-[var(--panel)] shadow-app backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-app p-6">
          <h2 className="text-xl font-semibold text-app">
            {candidate ? 'Edit Candidate' : 'Add New Candidate'}
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
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="input"
              placeholder="e.g. +1-555-0123"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="Optional"
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
              <option value="">Select department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              Position *
            </label>
            <select
              value={formData.positionId}
              onChange={e => setFormData({ ...formData, positionId: e.target.value })}
              className="input"
              disabled={!formData.departmentId}
              required
            >
              <option value="">
                {formData.departmentId ? 'Select position' : 'Select department first'}
              </option>
              {availablePositions.map(pos => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Optional notes about the candidate"
            />
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
                candidate ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
