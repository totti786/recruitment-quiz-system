import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Loader2, Users } from 'lucide-react'
import { positionsApi, departmentsApi } from '../../utils/api.js'
import PositionModal from '../../components/modals/PositionModal.jsx'

export default function Positions() {
  const [positions, setPositions] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(null)

  useEffect(() => {
    loadPositions()
    loadDepartments()
  }, [])

  const loadPositions = async () => {
    try {
      const data = await positionsApi.getAll()
      setPositions(data)
    } catch (err) {
      console.error('Failed to load positions:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const data = await departmentsApi.getAll()
      setDepartments(data)
    } catch (err) {
      console.error('Failed to load departments:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this position?')) return
    
    try {
      await positionsApi.delete(id)
      setPositions(positions.filter(p => p.id !== id))
    } catch (err) {
      alert('Failed to delete position')
    }
  }

  const handleEdit = (position) => {
    setSelectedPosition(position)
    setShowModal(true)
  }

  const handleAdd = () => {
    setSelectedPosition(null)
    setShowModal(true)
  }

  const filteredPositions = positions.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Positions</h1>
          <p className="text-gray-600 mt-1">Manage job positions by department</p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Position
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search positions..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Positions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredPositions.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500">No positions found</p>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="mt-2 text-primary-600 hover:text-primary-700"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPositions.map(position => (
            <div key={position.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{position.name}</h3>
                    <span className="px-2.5 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                      {position.department?.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {position._count?.candidates || 0} candidates
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(position)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(position.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PositionModal
          position={selectedPosition}
          departments={departments}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadPositions()
          }}
        />
      )}
    </div>
  )
}