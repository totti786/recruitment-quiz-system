import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, ExternalLink, Loader2, Layers, Building2, Phone, User, Users, Pencil } from 'lucide-react'
import { candidatesApi } from '../../utils/api.js'
import { sessionsApi } from '../../utils/api.js'
import CandidateModal from '../../components/modals/CandidateModal.jsx'
import AssignSessionModal from '../../components/modals/AssignSessionModal.jsx'
import Dialog from '../../components/Dialog.jsx'

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-surface-200 rounded w-32"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-surface-200 rounded w-24"></div></td>
    <td className="px-6 py-4"><div className="h-6 bg-surface-200 rounded-full w-20"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-surface-200 rounded w-28"></div></td>
    <td className="px-6 py-4"><div className="h-6 bg-surface-200 rounded w-16"></div></td>
    <td className="px-6 py-4"><div className="h-8 bg-surface-200 rounded w-20 ml-auto"></div></td>
  </tr>
)

export default function Candidates() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false
  })

  useEffect(() => {
    loadCandidates()
    loadSessions()
  }, [])

  const loadCandidates = async () => {
    try {
      const data = await candidatesApi.getAll()
      setCandidates(data)
    } catch (err) {
      console.error('Failed to load candidates:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    try {
      const data = await sessionsApi.getAll()
      setSessions(data)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    }
  }

  const handleDelete = (id) => {
    setDialog({
      isOpen: true,
      title: 'Delete Candidate?',
      message: 'Are you sure you want to delete this candidate?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await candidatesApi.delete(id)
          setCandidates(candidates.filter(c => c.id !== id))
        } catch (err) {
          setDialog({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Failed to delete candidate',
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

  const handleEdit = (candidate) => {
    setSelectedCandidate(candidate)
    setShowEditModal(true)
  }

  const handleAssignSession = (candidate) => {
    setSelectedCandidate(candidate)
    setShowAssignModal(true)
  }

  const handleSessionAssigned = () => {
    setShowAssignModal(false)
    loadCandidates()
  }

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.position?.name.toLowerCase().includes(search.toLowerCase()) ||
    c.department?.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Candidates</h1>
          <p className="text-surface-500 mt-1">Manage interview candidates and their sessions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
        >
          <Plus size={20} />
          Add Candidate
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, department, position or email..."
            className="input pl-12"
          />
        </div>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Department</th>
                <th className="table-header">Position</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Sessions</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-card border border-surface-200/60">
          <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-surface-400" />
          </div>
          <p className="text-surface-500 text-lg">No candidates found</p>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Department</th>
                <th className="table-header">Position</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Sessions</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredCandidates.map(candidate => (
                <tr key={candidate.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="font-semibold text-surface-900">{candidate.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {candidate.department ? (
                      <span className="inline-flex items-center gap-2 text-sm text-surface-700">
                        <Building2 size={14} className="text-surface-400" />
                        {candidate.department.name}
                      </span>
                    ) : (
                      <span className="text-surface-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {candidate.position ? (
                      <span className="px-3 py-1.5 bg-surface-100 text-surface-700 text-sm font-medium rounded-lg">
                        {candidate.position.name}
                      </span>
                    ) : (
                      <span className="text-surface-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      {candidate.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-surface-600">
                          <Phone size={14} className="text-surface-400" />
                          {candidate.phoneNumber}
                        </div>
                      )}
                      {candidate.email && (
                        <div className="text-sm text-surface-500">
                          {candidate.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {candidate.sessions?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.sessions.map(session => (
                          <span 
                            key={session.id}
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              session.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {session.session?.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-surface-400 text-sm">No sessions</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(candidate)}
                        className="p-2.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="Edit Candidate"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleAssignSession(candidate)}
                        className="p-2.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="Assign Session"
                      >
                        <Layers size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/candidates/${candidate.id}`)}
                        className="p-2.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="View Details"
                      >
                        <ExternalLink size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="p-2.5 text-surface-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <CandidateModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            loadCandidates()
          }}
        />
      )}

      {showEditModal && selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCandidate(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedCandidate(null)
            loadCandidates()
          }}
        />
      )}

      {showAssignModal && selectedCandidate && (
        <AssignSessionModal
          candidate={selectedCandidate}
          sessions={sessions}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleSessionAssigned}
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