import { Fragment, useEffect, useState, useCallback } from 'react'
import { ScrollText, ChevronDown, ChevronRight, Filter, Loader2, AlertTriangle } from 'lucide-react'
import { auditApi } from '../../utils/api.js'

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE']

function formatTimestamp(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getActionPillClass(action) {
  switch (action) {
    case 'CREATE': return 'status-pill-success'
    case 'UPDATE': return 'status-pill-info'
    case 'DELETE': return 'status-pill-danger'
    default: return 'status-pill bg-muted text-soft'
  }
}

function generateSummary(entry) {
  const { action, entityType, entityId, newValue, oldValue } = entry
  switch (action) {
    case 'CREATE':
      return `Created ${entityType.toLowerCase()} #${entityId}`
    case 'DELETE':
      return `Deleted ${entityType.toLowerCase()} #${entityId}`
    case 'UPDATE':
      return `Updated ${entityType.toLowerCase()} #${entityId}`
    default:
      return `${action} ${entityType.toLowerCase()} #${entityId}`
  }
}

function renderDiff(entry) {
  const { action, oldValue, newValue } = entry

  if (action === 'CREATE') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[var(--success)]">New Value</p>
        <pre className="mono overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-relaxed text-soft">
          {JSON.stringify(newValue, null, 2)}
        </pre>
      </div>
    )
  }

  if (action === 'DELETE') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[var(--danger)]">Deleted Value</p>
        <pre className="mono overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-relaxed text-soft">
          {JSON.stringify(oldValue, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[var(--danger)]">Old Value</p>
        <pre className="mono overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-relaxed text-soft">
          {JSON.stringify(oldValue, null, 2)}
        </pre>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[var(--success)]">New Value</p>
        <pre className="mono overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-relaxed text-soft">
          {JSON.stringify(newValue, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4"><div className="h-4 w-4 rounded bg-surface-200"></div></td>
      <td className="px-6 py-4"><div className="h-4 w-36 rounded bg-surface-200"></div></td>
      <td className="px-6 py-4"><div className="h-4 w-28 rounded bg-surface-200"></div></td>
      <td className="px-6 py-4"><div className="h-6 w-20 rounded-full bg-surface-200"></div></td>
      <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-surface-200"></div></td>
      <td className="px-6 py-4"><div className="h-4 w-12 rounded bg-surface-200"></div></td>
      <td className="px-6 py-4"><div className="h-4 w-48 rounded bg-surface-200"></div></td>
    </tr>
  )
}

export default function AuditLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [expandedId, setExpandedId] = useState(null)
  const [filters, setFilters] = useState({ action: '', entityType: '' })
  const [entityTypes, setEntityTypes] = useState([])

  const loadLog = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: 50 }
      if (filters.action) params.action = filters.action
      if (filters.entityType) params.entityType = filters.entityType
      const data = await auditApi.getLog(params)
      setEntries(data.entries)
      setPagination(data.pagination)

      const types = [...new Set(data.entries.map(e => e.entityType))]
      setEntityTypes(prev => {
        const merged = new Set([...prev, ...types])
        return [...merged].sort()
      })
    } catch (err) {
      setError(err.message || 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadLog(1)
  }, [loadLog])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    if (key === 'entityType' && value === '') setEntityTypes([])
  }

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return
    setExpandedId(null)
    loadLog(page)
  }

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  function PaginationControls() {
    const { page, totalPages, total } = pagination
    if (totalPages <= 1) return null

    const pages = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between border-t border-[var(--panel-border)] px-6 py-4">
        <p className="text-sm text-soft">
          {total} entr{total !== 1 ? 'ies' : 'y'} &middot; Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="btn-ghost rounded-lg px-3 py-1.5 text-sm"
          >
            Previous
          </button>
          {start > 1 && (
            <>
              <button onClick={() => goToPage(1)} className="btn-ghost rounded-lg px-3 py-1.5 text-sm">1</button>
              {start > 2 && <span className="px-1 text-faint">...</span>}
            </>
          )}
          {pages.map(p => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                p === page
                  ? 'bg-[var(--primary)] text-white shadow-soft-app'
                  : 'btn-ghost'
              }`}
            >
              {p}
            </button>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-1 text-faint">...</span>}
              <button onClick={() => goToPage(totalPages)} className="btn-ghost rounded-lg px-3 py-1.5 text-sm">{totalPages}</button>
            </>
          )}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="btn-ghost rounded-lg px-3 py-1.5 text-sm"
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6">
        <h1 className="section-title">Audit Log</h1>
        <p className="mt-1 text-sm text-soft">
          Track all administrative actions across the system.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-soft">
          <Filter size={16} />
          <span>Filters</span>
        </div>
        <select
          value={filters.action}
          onChange={(e) => handleFilterChange('action', e.target.value)}
          className="input w-auto min-w-[140px]"
        >
          <option value="">All Actions</option>
          {ACTIONS.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={filters.entityType}
          onChange={(e) => handleFilterChange('entityType', e.target.value)}
          className="input w-auto min-w-[160px]"
        >
          <option value="">All Entity Types</option>
          {entityTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {(filters.action || filters.entityType) && (
          <button
            onClick={() => {
              setFilters({ action: '', entityType: '' })
              setEntityTypes([])
            }}
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {error ? (
          <div className="card py-12 text-center">
            <AlertTriangle className="mx-auto mb-3 text-[var(--danger)]" size={28} />
            <p className="text-soft">{error}</p>
          </div>
        ) : loading && entries.length === 0 ? (
          <div className="flex h-full min-h-[16rem] items-center justify-center">
            <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} size={32} />
          </div>
        ) : entries.length === 0 ? (
          <div className="card py-12 text-center">
            <ScrollText className="mx-auto mb-3 text-faint" size={28} />
            <p className="text-soft">No audit entries found</p>
          </div>
        ) : (
          <div className="table-shell">
            <table className="w-full">
              <thead className="border-b border-[var(--panel-border)] bg-muted">
                <tr>
                  <th className="table-header w-8"></th>
                  <th className="table-header">Timestamp</th>
                  <th className="table-header">Actor</th>
                  <th className="table-header">Action</th>
                  <th className="table-header">Entity Type</th>
                  <th className="table-header">Entity ID</th>
                  <th className="table-header">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)]">
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  entries.map((entry) => (
                    <Fragment key={entry.id}>
                      <tr
                        onClick={() => toggleExpand(entry.id)}
                        className="cursor-pointer transition-colors hover:bg-muted/80"
                      >
                        <td className="px-4 py-4">
                          <button className="flex items-center justify-center">
                            {expandedId === entry.id ? (
                              <ChevronDown size={16} className="text-faint" />
                            ) : (
                              <ChevronRight size={16} className="text-faint" />
                            )}
                          </button>
                        </td>
                        <td className="table-cell mono whitespace-nowrap text-xs">
                          {formatTimestamp(entry.createdAt)}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-app">{entry.actor?.username}</span>
                            <span className="text-xs text-faint">
                              {entry.actor?.role?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={getActionPillClass(entry.action)}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="table-cell">{entry.entityType}</td>
                        <td className="table-cell">
                          <span className="mono text-xs text-app">{entry.entityId}</span>
                        </td>
                        <td className="table-cell">{generateSummary(entry)}</td>
                      </tr>
                      {expandedId === entry.id && (
                        <tr className="animate-slide-down">
                          <td
                            colSpan={7}
                            className="border-t border-[var(--panel-border)] bg-muted/50 px-6 py-5"
                          >
                            {renderDiff(entry)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
            <PaginationControls />
          </div>
        )}
      </div>
    </div>
  )
}
