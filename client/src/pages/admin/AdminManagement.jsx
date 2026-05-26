import { useEffect, useState } from 'react'
import { Shield, UserPlus, Search, Trash2, Edit3, Building2, X, Save, Loader2 } from 'lucide-react'
import { adminApi, departmentsApi } from '../../utils/api.js'
import { useAuthStore } from '../../hooks/useAuthStore.js'
import Dialog from '../../components/Dialog.jsx'

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
]

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function AdminModal({ onClose, onSuccess, admin = null, departments }) {
  const [formData, setFormData] = useState({
    username: admin?.username || '',
    password: '',
    role: admin?.role || 'ADMIN',
    departmentIds: admin?.departments?.map(d => d.departmentId) || [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!admin

  const toggleDepartment = (deptId) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter(id => id !== deptId)
        : [...prev.departmentIds, deptId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEdit) {
        const payload = { role: formData.role, departmentIds: formData.departmentIds }
        if (formData.password) payload.password = formData.password
        await adminApi.update(admin.id, payload)
      } else {
        await adminApi.create({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          departmentIds: formData.departmentIds,
        })
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to save admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-app bg-[var(--panel)] shadow-app backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-app p-6">
          <h2 className="text-xl font-semibold text-app">
            {isEdit ? 'Edit Admin' : 'Create New Admin'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-faint transition hover:bg-muted hover:text-app">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-2xl border p-3 text-sm" style={{ background: 'var(--danger-soft)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-app">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className="input"
              placeholder="e.g. jane.admin"
              required
              disabled={isEdit}
            />
            {isEdit && (
              <p className="mt-1 text-xs text-soft">Username cannot be changed after creation.</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              {isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="input"
              placeholder={isEdit ? 'Leave blank to keep current' : 'At least 6 characters'}
              required={!isEdit}
              minLength={6}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">Role *</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-app">
              Department Assignments
            </label>
            <p className="mb-3 text-xs text-soft">
              Select the departments this admin can manage.
            </p>
            {departments.length === 0 ? (
              <p className="text-sm text-faint italic">No departments available. Create departments first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {departments.map(dept => {
                  const checked = formData.departmentIds.includes(dept.id)
                  return (
                    <label
                      key={dept.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                        checked
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-app text-soft hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDepartment(dept.id)}
                        className="h-4 w-4 rounded border-app accent-[var(--primary)]"
                      />
                      <div className="flex items-center gap-2">
                        <Building2 size={14} />
                        <span>{dept.name}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
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
                <>
                  <Save size={18} />
                  {isEdit ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminManagement() {
  const currentUser = useAuthStore(state => state.user)
  const [admins, setAdmins] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [adminsData, departmentsData] = await Promise.all([
        adminApi.getAll(),
        departmentsApi.getAll(),
      ])
      setAdmins(adminsData)
      setDepartments(departmentsData)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (admin) => {
    if (admin.id === currentUser?.id) {
      setDialog({
        isOpen: true,
        title: 'Cannot Delete Yourself',
        message: 'You cannot delete your own admin account. Ask another SUPER_ADMIN to do this, or deactivate the account instead.',
        type: 'error',
        onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })),
        showCancel: false,
        confirmText: 'OK',
      })
      return
    }

    setDialog({
      isOpen: true,
      title: 'Delete Admin?',
      message: `Are you sure you want to delete "${admin.username}"? This action cannot be undone.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await adminApi.delete(admin.id)
          setAdmins(prev => prev.filter(a => a.id !== admin.id))
        } catch (err) {
          setDialog({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Failed to delete admin',
            type: 'error',
            onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })),
            showCancel: false,
          })
        }
      },
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
  }

  const handleEdit = (admin) => {
    setSelectedAdmin(admin)
    setShowModal(true)
  }

  const handleAdd = () => {
    setSelectedAdmin(null)
    setShowModal(true)
  }

  const filteredAdmins = admins.filter(a =>
    a.username.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Admin Management</h1>
          <p className="mt-1 text-sm text-soft">Manage administrator accounts and their permissions.</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <UserPlus size={20} />
          Add Admin
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or role..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full min-h-[16rem] items-center justify-center">
            <Loader2 className="animate-spin text-primary-600" size={32} />
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="card py-12 text-center">
            <Shield className="mx-auto text-faint" size={40} />
            <p className="mt-4 text-soft">
              {search ? 'No admins match your search' : 'No admin accounts yet'}
            </p>
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
              {filteredAdmins.map(admin => (
                <div key={admin.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Shield size={18} className="text-[var(--primary)]" />
                          <h3 className="text-lg font-semibold text-app">{admin.username}</h3>
                        </div>
                        <span className={`status-pill text-xs font-medium ${
                          admin.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                        </span>
                        {admin.isDefaultPassword && (
                          <span className="status-pill-warning text-xs">
                            Default Password
                          </span>
                        )}
                        {admin.id === currentUser?.id && (
                          <span className="status-pill text-xs bg-[var(--primary-soft)] text-[var(--primary)]">
                            You
                          </span>
                        )}
                      </div>

                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {admin.departments?.length > 0 ? (
                          admin.departments.map(d => (
                            <span
                              key={d.departmentId}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-soft"
                            >
                              <Building2 size={12} />
                              {d.department.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-faint italic">No departments assigned</span>
                        )}
                      </div>

                      <p className="text-xs text-faint">
                        Created {formatDate(admin.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="rounded-lg p-2 text-soft transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                        title="Edit"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(admin)}
                        className="rounded-lg p-2 text-soft transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                        title="Delete"
                        disabled={admin.id === currentUser?.id}
                        style={admin.id === currentUser?.id ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
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

      {showModal && (
        <AdminModal
          admin={selectedAdmin}
          departments={departments}
          onClose={() => {
            setShowModal(false)
            setSelectedAdmin(null)
          }}
          onSuccess={() => {
            setShowModal(false)
            setSelectedAdmin(null)
            loadData()
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
