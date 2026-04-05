import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTicket, updateTicketStatus, listEmployees, assignTicket, submitFeedback, getTicketLogs } from '../api'
import { SeverityBadge, StatusBadge, CategoryBadge, AvailabilityBadge, Spinner } from '../components/ui'
import { ArrowLeft, ThumbsUp, ThumbsDown, Send, AlertTriangle } from 'lucide-react'

const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending Info', 'Resolved', 'Closed']

function formatDate(d) {
  return d ? new Date(d + 'Z').toLocaleString('en-IN', { 
    dateStyle: 'medium', timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  }) : '—'
}

const ACTION_ICONS = {
  ai_analyzed: '🤖',
  auto_resolved: '✅',
  assigned: '👤',
  status_change: '🔄',
  escalated: '🚨',
  routing_failed: '⚠️',
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [logs, setLogs] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [noteText, setNoteText] = useState('')
  const [assignEmpId, setAssignEmpId] = useState('')
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    const [{ data: t }, { data: l }] = await Promise.all([getTicket(id), getTicketLogs(id)])
    setTicket(t)
    setLogs(l)
    setNewStatus(t.status)
    setLoading(false)
  }

  useEffect(() => {
    load()
    listEmployees().then(r => setEmployees(r.data))
  }, [id])

  const handleStatusUpdate = async () => {
    setUpdating(true)
    try {
      await updateTicketStatus(id, { status: newStatus, internal_notes: noteText, actor: 'Agent' })
      setNoteText('')
      await load()
    } finally { setUpdating(false) }
  }

  const handleAssign = async () => {
    if (!assignEmpId) return
    await assignTicket(id, assignEmpId)
    setAssignEmpId('')
    await load()
  }

  const handleFeedback = async (helpful) => {
    await submitFeedback(id, helpful)
    await load()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!ticket) return <div className="p-8 text-gray-500">Ticket not found</div>

  const deptEmployees = employees.filter(e => e.department === ticket.assigned_department)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate('/tickets')} className="btn-secondary px-2 py-1.5 mt-1">
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            {ticket.is_escalated && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                <AlertTriangle size={11} /> Escalated
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
            <StatusBadge status={ticket.status} />
            <SeverityBadge severity={ticket.severity} />
            <CategoryBadge category={ticket.category} />
            <span className="text-xs text-gray-400">by {ticket.submitter_name} · {formatDate(ticket.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{ticket.description}</p>
          </div>

          {/* AI Analysis */}
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">🤖 AI Analysis</p>
            <p className="text-sm text-gray-700 mb-3">{ticket.ai_summary}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>Confidence: <span className="font-medium text-gray-700">{Math.round((ticket.confidence_score || 0) * 100)}%</span></div>
              <div>Est. time: <span className="font-medium text-gray-700">{ticket.estimated_hours}h</span></div>
              <div>Sentiment: <span className="font-medium text-gray-700">{ticket.sentiment}</span></div>
              <div>Path: <span className="font-medium text-gray-700">{ticket.resolution_path}</span></div>
            </div>
            {ticket.auto_response && (
              <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-xs font-medium text-green-700 mb-1">Auto-response:</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{ticket.auto_response}</p>
              </div>
            )}
          </div>

          {/* Feedback */}
          {ticket.resolution_path === 'auto_resolve' && (
            <div className="card p-5">
              <p className="font-medium text-gray-800 mb-3">Was this auto-response helpful?</p>
              {ticket.feedback ? (
                <p className="text-sm text-gray-500">
                  Feedback: <span className="font-medium">{ticket.feedback.helpful ? '👍 Helpful' : '👎 Not helpful'}</span>
                </p>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => handleFeedback(true)}
                    className="btn bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
                    <ThumbsUp size={14} /> Yes
                  </button>
                  <button onClick={() => handleFeedback(false)}
                    className="btn bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                    <ThumbsDown size={14} /> No
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status update */}
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Update Status</p>
            <div className="flex gap-3 mb-3">
              <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="btn-primary" onClick={handleStatusUpdate} disabled={updating}>
                {updating ? <Spinner size="sm" /> : <Send size={14} />} Update
              </button>
            </div>
            <textarea className="input resize-none" rows={3}
              placeholder="Add an internal note (optional)..."
              value={noteText} onChange={e => setNoteText(e.target.value)} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Submitter */}
          <div className="card p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Submitter</p>
            <p className="text-sm font-medium text-gray-900">{ticket.submitter_name}</p>
            <p className="text-xs text-gray-500">{ticket.submitter_email}</p>
          </div>

          {/* Assignee */}
          <div className="card p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Assignee</p>
            {ticket.assignee ? (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-900">{ticket.assignee.name}</p>
                <p className="text-xs text-gray-500 mb-1">{ticket.assignee.designation}</p>
                <AvailabilityBadge status={ticket.assignee.availability_status} />
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3">Unassigned</p>
            )}
            {deptEmployees.length > 0 && (
              <div className="flex gap-2">
                <select className="input flex-1 text-xs" value={assignEmpId}
                  onChange={e => setAssignEmpId(e.target.value)}>
                  <option value="">Reassign to...</option>
                  {deptEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.current_load} open)</option>
                  ))}
                </select>
                <button className="btn-secondary px-2" onClick={handleAssign} disabled={!assignEmpId}>
                  <Send size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="card p-4 text-xs space-y-2">
            <p className="font-medium text-gray-500 uppercase tracking-wide">Details</p>
            {[
              ['Department', ticket.assigned_department || '—'],
              ['Created', formatDate(ticket.created_at)],
              ['Updated', formatDate(ticket.updated_at)],
              ['Resolved', formatDate(ticket.resolved_at)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="card p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Activity</p>
            <div className="space-y-3">
              {[...logs].reverse().map(log => (
                <div key={log.id} className="flex gap-2 text-xs">
                  <span>{ACTION_ICONS[log.action] || '📝'}</span>
                  <div>
                    <p className="text-gray-700">{log.note}</p>
                    <p className="text-gray-400">{log.actor} · {formatDate(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}