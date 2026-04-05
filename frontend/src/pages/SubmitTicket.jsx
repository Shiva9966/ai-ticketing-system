import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTicket } from '../api'
import { Spinner, SeverityBadge, CategoryBadge } from '../components/ui'
import { Brain, Send, CheckCircle2 } from 'lucide-react'

const INITIAL = { title: '', description: '', submitter_name: '', submitter_email: '' }

export default function SubmitTicket() {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await createTicket(form)
      setResult(data)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 border border-green-100 rounded-xl">
          <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-green-800">Ticket #{result.id} submitted!</p>
            <p className="text-sm text-green-600">AI has analyzed and processed your ticket</p>
          </div>
        </div>

        <div className="card p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-purple-600" />
            <p className="font-semibold text-gray-900">AI Analysis</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <CategoryBadge category={result.category} />
            <SeverityBadge severity={result.severity} />
            <span className="badge bg-gray-100 text-gray-600">{result.sentiment}</span>
          </div>

          <p className="text-sm text-gray-700 mb-3">{result.ai_summary}</p>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
            <div>Confidence: <span className="font-medium text-gray-700">{Math.round((result.confidence_score || 0) * 100)}%</span></div>
            <div>Est. time: <span className="font-medium text-gray-700">{result.estimated_hours}h</span></div>
            <div>Department: <span className="font-medium text-gray-700">{result.assigned_department || '—'}</span></div>
            <div>Status: <span className="font-medium text-gray-700">{result.status}</span></div>
          </div>

          {result.auto_response && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
              <p className="text-xs font-medium text-green-700 mb-1">Auto-response sent:</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{result.auto_response}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => navigate(`/tickets/${result.id}`)}>
            View Ticket
          </button>
          <button className="btn-secondary" onClick={() => { setResult(null); setForm(INITIAL) }}>
            Submit Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit a Ticket</h1>
        <p className="text-sm text-gray-500 mt-1">AI will analyze and route your ticket automatically.</p>
      </div>

      <div className="flex items-center gap-2 mb-5 p-3 bg-purple-50 border border-purple-100 rounded-lg">
        <Brain size={15} className="text-purple-600 flex-shrink-0" />
        <p className="text-sm text-purple-700">AI will classify severity, sentiment, and route to the right team.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Your name</label>
            <input className="input" placeholder="Ravi Kumar" required
              value={form.submitter_name} onChange={set('submitter_name')} />
          </div>
          <div>
            <label className="label">Your email</label>
            <input className="input" type="email" placeholder="ravi@company.com" required
              value={form.submitter_email} onChange={set('submitter_email')} />
          </div>
        </div>

        <div>
          <label className="label">Issue title</label>
          <input className="input" placeholder="Brief summary of your issue" required
            value={form.title} onChange={set('title')} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-32 resize-none"
            placeholder="Describe your issue in detail..."
            required value={form.description} onChange={set('description')} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
          {loading ? <><Spinner size="sm" /><span>AI is analyzing...</span></> : <><Send size={14} />Submit Ticket</>}
        </button>
      </form>
    </div>
  )
}