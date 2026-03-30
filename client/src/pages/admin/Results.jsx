import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ExternalLink, Download, CheckCircle, Clock, FileText, Building2, Briefcase, Info, ClipboardCheck } from 'lucide-react'
import { dashboardApi } from '../../utils/api.js'

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-12 bg-surface-200 rounded w-48"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-surface-200 rounded w-24"></div></td>
    <td className="px-6 py-4"><div className="h-6 bg-surface-200 rounded-full w-24"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-surface-200 rounded w-16"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-surface-200 rounded w-16"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-surface-200 rounded w-24"></div></td>
    <td className="px-6 py-4"><div className="h-8 bg-surface-200 rounded w-12 ml-auto"></div></td>
  </tr>
)

export default function Results() {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      const data = await dashboardApi.getResults()
      setResults(data)
    } catch (err) {
      console.error('Failed to load results:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await dashboardApi.exportResults()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'quiz-results.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export results')
    }
  }

  const filteredResults = results.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.position?.toLowerCase().includes(search.toLowerCase()) ||
    r.department?.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'NA'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto pr-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Results</h1>
          <p className="page-subtitle">View and analyze quiz results.</p>
        </div>
        <button 
          onClick={handleExport}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Grading Information */}
      <div className="mb-6 rounded-2xl border p-4" style={{ background: 'var(--info-soft)', borderColor: 'color-mix(in srgb, var(--info) 24%, transparent)' }}>
        <div className="flex items-start gap-3">
          <Info size={20} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--info)' }} />
          <div className="text-sm" style={{ color: 'var(--info)' }}>
            <p className="font-medium mb-1">Understanding the Scoring System</p>
            <p className="mb-2">
              Scores shown below are calculated from <strong>multiple choice questions only</strong>. 
              Written answers and code submissions are not automatically graded and require manual review.
            </p>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li><strong>Multiple Choice:</strong> Automatically graded - shown in score column</li>
              <li><strong>Written Answers:</strong> Saved for manual review - click "View Details" to see responses</li>
              <li><strong>Code Questions:</strong> Saved for manual review - shown in detailed results</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, department or position..."
            className="input pl-12"
          />
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="table-shell">
          <table className="w-full">
            <thead className="border-b border-app bg-muted">
              <tr>
                <th className="table-header">Candidate</th>
                <th className="table-header">Department</th>
                <th className="table-header">Position</th>
                <th className="table-header">Status</th>
                <th className="table-header">Score</th>
                <th className="table-header">Time Taken</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-app">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-8 w-8 text-faint" />
          </div>
          <p className="text-lg text-soft">No results found</p>
        </div>
      ) : (
        <div className="table-shell">
          <table className="w-full">
            <thead className="border-b border-app bg-muted">
              <tr>
                <th className="table-header">Candidate</th>
                <th className="table-header">Department</th>
                <th className="table-header">Position</th>
                <th className="table-header">Status</th>
                <th className="table-header">Score</th>
                <th className="table-header">Time Taken</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-app">
              {filteredResults.map(result => (
                <tr key={result.id} className="transition-colors hover:bg-muted/80">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-app bg-muted text-sm font-bold text-app">
                        {getInitials(result.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-app">{result.name}</div>
                        <div className="text-sm text-soft">{result.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 text-sm text-soft">
                      <Building2 size={14} className="text-faint" />
                      {result.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 text-sm text-soft">
                      <Briefcase size={14} className="text-faint" />
                      {result.position}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {result.status === 'COMPLETED' ? (
                      <span className="status-pill-success rounded-lg">
                        <CheckCircle size={14} />
                        Completed
                      </span>
                    ) : (
                      <span className="status-pill-warning rounded-lg">
                        <Clock size={14} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {result.scoreStatus === 'pending' ? (
                      <div>
                        <span className="status-pill-warning mb-1 rounded-lg">
                          <Clock size={12} />
                          Pending Grading
                        </span>
                        <p className="text-xs text-faint">
                          {result.writtenPending} of {result.totalWritten} written
                        </p>
                      </div>
                    ) : result.score !== null && result.score !== undefined ? (
                      <span className={`font-bold text-lg ${
                        result.score >= 70 ? 'text-emerald-600' : 
                        result.score >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {result.score.toFixed(1)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-soft">
                    {result.timeTaken ? `${result.timeTaken} min` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {result.scoreStatus === 'pending' && (
                        <button
                          onClick={() => navigate(`/admin/results/${result.id}`)}
                          className="rounded-xl p-2.5 text-soft transition-all hover:bg-[var(--warning-soft)] hover:text-[var(--warning)]"
                          title="Grade Answers"
                        >
                          <ClipboardCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/admin/results/${result.id}`)}
                        disabled={result.status !== 'COMPLETED'}
                        className="rounded-xl p-2.5 text-soft transition-all hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
                        title="View Details"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
