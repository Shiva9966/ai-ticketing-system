import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listTickets } from '../api'
import { SeverityBadge, StatusBadge, CategoryBadge, Spinner, EmptyState } from '../components/ui'
import { Search, AlertTriangle } from 'lucide-react'

const STATUSES = ['', 'New', 'Assigned', 'In Progress', 'Pending Info', 'Resolved', 'Closed']
const SEVERITIES = ['', 'Critical', 'High', 'Medium', 'Low']
const CATEGORIES = ['', 'Billing', 'Bug', 'Access', 'HR', 'Server', 'DB', 'Feature', 'Other']

function formatDate(d) {
  return new Date(d + 'Z').toLocaleString('en-IN', { 
    month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  })
}

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', severity: '', category: '' })
  const navigate = useNavigate()

  useEffect(() => {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.severity) params.severity = filters.severity
    if (filters.category) params.category = filters.category
    if (search) params.search = search

    listTickets(params)
      .then(r => setTickets(r.data))
      .finally(() => setLoading(false))
  }, [filters, search])

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tickets.length} tickets</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/tickets/new')}>
          + New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8" placeholder="Search tickets..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[['status', STATUSES, 'Status'], ['severity', SEVERITIES, 'Severity'], ['category', CATEGORIES, 'Category']].map(
          ([key, opts, label]) => (
            <select key={key} className="input w-36"
              value={filters[key]}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}>
              <option value="">{label}: All</option>
              {opts.filter(Boolean).map(o => <option key={o}>{o}</option>)}
            </select>
          )
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : tickets.length === 0 ? (
        <EmptyState icon="🎫" title="No tickets found" description="Try adjusting filters or submit a new ticket." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Title', 'Submitter', 'Category', 'Severity', 'Status', 'Department', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map(t => (
                <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{t.id}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-2">
                      {t.is_escalated && <AlertTriangle size={13} className="text-red-500" />}
                      <span className="font-medium text-gray-900 truncate">{t.title}</span>
                    </div>
                    {t.ai_summary && <p className="text-xs text-gray-400 truncate mt-0.5">{t.ai_summary}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.submitter_name}</td>
                  <td className="px-4 py-3"><CategoryBadge category={t.category} /></td>
                  <td className="px-4 py-3"><SeverityBadge severity={t.severity} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.assigned_department || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}