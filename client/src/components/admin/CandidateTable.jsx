import { Building2, ExternalLink, Layers, Pencil, Phone, Trash2, User } from 'lucide-react'

export default function CandidateTable({ candidates, onEdit, onAssignSession, onOpen, onDelete }) {
  return (
    <div className="table-shell hidden overflow-x-auto lg:block">
      <table className="w-full">
        <thead className="bg-muted/70">
          <tr>
            <th className="table-header">Candidate</th>
            <th className="table-header">Role</th>
            <th className="table-header">Contact</th>
            <th className="table-header">Session status</th>
            <th className="table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map(candidate => (
            <tr key={candidate.id} className="border-t border-app">
              <td className="table-cell">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-app">{candidate.name}</p>
                    <p className="text-xs text-faint">{candidate.email || 'No email provided'}</p>
                  </div>
                </div>
              </td>
              <td className="table-cell">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-app">
                    <Building2 size={14} className="text-faint" />
                    {candidate.department?.name || 'No department'}
                  </p>
                  <p className="text-xs text-faint">{candidate.position?.name || 'No position assigned'}</p>
                </div>
              </td>
              <td className="table-cell">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-2 text-sm text-soft">
                    <Phone size={14} className="text-faint" />
                    {candidate.phoneNumber || 'No phone number'}
                  </p>
                  <p className="text-xs text-faint">{candidate.sessions?.length || 0} assigned sessions</p>
                </div>
              </td>
              <td className="table-cell">
                <div className="flex flex-wrap gap-2">
                  {candidate.sessions?.length ? candidate.sessions.map(session => (
                    <span
                      key={session.id}
                      className={session.status === 'COMPLETED' ? 'status-pill-success' : 'status-pill-info'}
                    >
                      {session.session?.name}
                    </span>
                  )) : <span className="text-faint">No sessions yet</span>}
                </div>
              </td>
              <td className="table-cell">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => onEdit(candidate)} className="btn-ghost !px-3 !py-2" aria-label={`Edit ${candidate.name}`}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => onAssignSession(candidate)} className="btn-ghost !px-3 !py-2" aria-label={`Assign session to ${candidate.name}`}>
                    <Layers size={16} />
                  </button>
                  <button type="button" onClick={() => onOpen(candidate)} className="btn-ghost !px-3 !py-2" aria-label={`Open ${candidate.name}`}>
                    <ExternalLink size={16} />
                  </button>
                  <button type="button" onClick={() => onDelete(candidate)} className="btn-ghost !px-3 !py-2 text-[var(--danger)]" aria-label={`Delete ${candidate.name}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
