import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ExternalLink, Download, Loader2, CheckCircle, XCircle, Clock, User, FileText, Building2, Briefcase } from 'lucide-react'
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
      const response = await fetch('/api/dashboard/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'quiz-results.csv'
      a.click()
    } catch (err) {
      alert('Failed to export results')
    }
  }

  const filteredResults = results.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.position?.toLowerCase().includes(search.toLowerCase()) ||
    r.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Results</h1>
          <p className="text-surface-500 mt-1">View and analyze quiz results</p>
        </div>
        <button 
          onClick={handleExport}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Export CSV
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
            placeholder="Search by name, department or position..."
            className="input pl-12"
          />
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
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
            <tbody className="divide-y divide-surface-100">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-card border border-surface-200/60">
          <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-surface-400" />
          </div>
          <p className="text-surface-500 text-lg">No results found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
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
            <tbody className="divide-y divide-surface-100">
              {filteredResults.map(result => (
                <tr key={result.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-surface-900">{result.name}</div>
                        <div className="text-sm text-surface-500">{result.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 text-sm text-surface-600">
                      <Building2 size={14} className="text-surface-400" />
                      {result.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 text-sm text-surface-600">
                      <Briefcase size={14} className="text-surface-400" />
                      {result.position}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {result.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <CheckCircle size={14} />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700">
                        <Clock size={14} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {result.score !== null && result.score !== undefined ? (
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
                  <td className="px-6 py-4 text-surface-600">
                    {result.timeTaken ? `${result.timeTaken} min` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/results/${result.id}`)}
                        disabled={result.status !== 'COMPLETED'}
                        className="p-2.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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