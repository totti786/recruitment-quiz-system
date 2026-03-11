import { useState, useEffect } from 'react'
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {candidate ? 'Edit Candidate' : 'Add New Candidate'}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Optional notes about the candidate"
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
                candidate ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}