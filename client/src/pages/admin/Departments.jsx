import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Loader2, Users } from 'lucide-react'
import { departmentsApi } from '../../utils/api.js'
import DepartmentModal from '../../components/modals/DepartmentModal.jsx'

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      const data = await departmentsApi.getAll()
      setDepartments(data)
    } catch (err) {
      console.error('Failed to load departments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department? All associated positions and candidates will be affected.')) return
    
    try {
      await departmentsApi.delete(id)
      setDepartments(departments.filter(d => d.id !== id))
    } catch (err) {
      alert('Failed to delete department')
    }
  }

  const handleEdit = (department) => {
    setSelectedDepartment(department)
    setShowModal(true)
  }

  const handleAdd = () => {
    setSelectedDepartment(null)
    setShowModal(true)
  }

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage departments and organizational structure</p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Department
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
            placeholder="Search departments..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Departments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500">No departments found</p>
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
          {filteredDepartments.map(department => (
            <div key={department.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {department._count?.candidates || 0} candidates
                    </span>
                    <span>
                      {department.positions?.length || 0} positions
                    </span>
                  </div>

                  {/* Positions */}
                  {department.positions?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {department.positions.map(pos => (
                        <span
                          key={pos.id}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {pos.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(department)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
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
        <DepartmentModal
          department={selectedDepartment}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadDepartments()
          }}
        />
      )}
    </div>
  )
}