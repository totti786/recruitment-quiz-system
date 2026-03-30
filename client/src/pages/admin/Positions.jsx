import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Loader2, Users } from 'lucide-react'
import { positionsApi, departmentsApi } from '../../utils/api.js'
import PositionModal from '../../components/modals/PositionModal.jsx'
import Dialog from '../../components/Dialog.jsx'

export default function Positions() {
  const [positions, setPositions] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false
  })

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

  const handleDelete = (id) => {
    setDialog({
      isOpen: true,
      title: 'Delete Position?',
      message: 'Are you sure you want to delete this position?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await positionsApi.delete(id)
          setPositions(positions.filter(p => p.id !== id))
        } catch (err) {
          setDialog({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Failed to delete position',
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Positions</h1>
          <p className="page-subtitle">Manage job positions by department.</p>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={20} />
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
      <div className="min-h-0 flex-1">
      {loading ? (
        <div className="flex h-full min-h-[16rem] items-center justify-center">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredPositions.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-soft">No positions found</p>
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
            {filteredPositions.map(position => (
              <div key={position.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-app">{position.name}</h3>
                      <span className="status-pill-info">
                        {position.department?.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-soft">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {position._count?.candidates || 0} candidates
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(position)}
                      className="rounded-lg p-2 text-soft transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(position.id)}
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
