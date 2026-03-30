import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Layers, Clock3, Filter } from 'lucide-react'
import { candidatesApi, sessionsApi } from '../../utils/api.js'
import CandidateModal from '../../components/modals/CandidateModal.jsx'
import AssignSessionModal from '../../components/modals/AssignSessionModal.jsx'
import Dialog from '../../components/Dialog.jsx'
import CandidateTable from '../../components/admin/CandidateTable.jsx'

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
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    try {
      const data = await sessionsApi.getAll()
      setSessions(data)
    } catch {}
  }

  const handleDelete = (candidate) => {
    setDialog({
      isOpen: true,
      title: 'Delete candidate?',
      message: `Delete ${candidate.name} and all associated session links?`,
      type: 'warning',
      onConfirm: async () => {
        await candidatesApi.delete(candidate.id)
        setCandidates(current => current.filter(item => item.id !== candidate.id))
      },
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
  }

  const filteredCandidates = useMemo(
    () => candidates.filter(candidate =>
      candidate.name.toLowerCase().includes(search.toLowerCase()) ||
      candidate.position?.name?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(search.toLowerCase())
    ),
    [candidates, search]
  )

  const activeAssignments = candidates.reduce((count, candidate) => count + (candidate.sessions?.filter(session => session.status === 'ACTIVE').length || 0), 0)
  const completedAssignments = candidates.reduce((count, candidate) => count + (candidate.sessions?.filter(session => session.status === 'COMPLETED').length || 0), 0)

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-6">
      <section className="card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="page-title">Candidate workspace</h1>
            <p className="page-subtitle">Search profiles, assign sessions, and move quickly into detailed review.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn">
            <Plus size={18} />
            Add candidate
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <Users className="text-[var(--primary)]" size={18} />
            <p className="mt-4 text-3xl font-extrabold text-app">{candidates.length}</p>
            <p className="mt-2 text-sm text-soft">Total candidates in the system.</p>
          </div>
          <div className="metric-card">
            <Layers className="text-[var(--primary)]" size={18} />
            <p className="mt-4 text-3xl font-extrabold text-app">{activeAssignments}</p>
            <p className="mt-2 text-sm text-soft">Active session assignments currently in progress.</p>
          </div>
          <div className="metric-card">
            <Clock3 className="text-[var(--primary)]" size={18} />
            <p className="mt-4 text-3xl font-extrabold text-app">{completedAssignments}</p>
            <p className="mt-2 text-sm text-soft">Completed sessions available for review.</p>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="section-title">Search and review</h2>
            <p className="mt-1 text-sm text-soft">Filter by name, department, position, or email.</p>
          </div>
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="input pl-11"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-soft">
          <Filter size={16} />
          <span>{filteredCandidates.length} result{filteredCandidates.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="metric-card h-32 animate-pulse bg-muted" />
              ))}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="rounded-[26px] bg-muted px-6 py-16 text-center">
              <Users className="mx-auto text-faint" size={28} />
              <h3 className="mt-4 text-xl font-bold text-app">No candidates found</h3>
              <p className="mt-2 text-soft">Try a broader search or add a new candidate profile.</p>
            </div>
          ) : (
            <>
              <CandidateTable
                candidates={filteredCandidates}
                onEdit={(candidate) => {
                  setSelectedCandidate(candidate)
                  setShowEditModal(true)
                }}
                onAssignSession={(candidate) => {
                  setSelectedCandidate(candidate)
                  setShowAssignModal(true)
                }}
                onOpen={(candidate) => navigate(`/admin/candidates/${candidate.id}`)}
                onDelete={handleDelete}
              />

              <div className="space-y-4 lg:hidden">
                {filteredCandidates.map(candidate => (
                  <div key={candidate.id} className="card">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-app">{candidate.name}</h3>
                        <p className="mt-1 text-sm text-soft">{candidate.position?.name || 'No position assigned'}</p>
                        <p className="mt-1 text-sm text-faint">{candidate.department?.name || 'No department'}</p>
                      </div>
                      <span className="status-pill-info">{candidate.sessions?.length || 0} sessions</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button onClick={() => navigate(`/admin/candidates/${candidate.id}`)} className="btn-secondary btn">Open</button>
                      <button onClick={() => { setSelectedCandidate(candidate); setShowEditModal(true) }} className="btn-secondary btn">Edit</button>
                      <button onClick={() => { setSelectedCandidate(candidate); setShowAssignModal(true) }} className="btn-primary btn">Assign</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

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
          onSuccess={() => {
            setShowAssignModal(false)
            loadCandidates()
          }}
        />
      )}

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
