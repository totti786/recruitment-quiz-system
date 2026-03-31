import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Loader2, Users } from 'lucide-react'
import { departmentsApi } from '../../utils/api.js'
import DepartmentModal from '../../components/modals/DepartmentModal.jsx'
import Dialog from '../../components/Dialog.jsx'

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false
  })

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

  const handleDelete = (id) => {
    setDialog({
      isOpen: true,
      title: 'Delete Department?',
      message: 'Are you sure you want to delete this department? All associated positions and candidates will be affected.',
      type: 'warning',
      onConfirm: async () => {
        try {
          await departmentsApi.delete(id)
          setDepartments(departments.filter(d => d.id !== id))
        } catch (err) {
          setDialog({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Failed to delete department',
            type: 'error',
            onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })),
            showCancel: false
          })
        }
      },
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Departments</h1>
          <p className="mt-1 text-sm text-soft">Keep the review structure aligned with the organization.</p>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={20} />
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
      <div className="min-h-0 flex-1">
      {loading ? (
        <div className="flex h-full min-h-[16rem] items-center justify-center">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-soft">No departments found</p>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="mt-2 transition-colors hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="h-full overflow-y-auto pr-1">
          <div className="space-y-4">
            {filteredDepartments.map(department => (
              <div key={department.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-app">{department.name}</h3>
                    </div>
                    
                    <div className="mb-3 flex items-center gap-6 text-sm text-soft">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {department._count?.candidates || 0} candidates
                      </span>
                      <span>
                        {department.positions?.length || 0} positions
                      </span>
                    </div>

                    {department.positions?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {department.positions.map(pos => (
                          <span
                            key={pos.id}
                            className="status-pill bg-muted text-soft"
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
                      className="rounded-lg p-2 text-soft transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(department.id)}
                      className="rounded-lg p-2 text-soft transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

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

      {/* Custom Dialog */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        showCancel={dialog.showCancel}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
      />
    </div>
  )
}
