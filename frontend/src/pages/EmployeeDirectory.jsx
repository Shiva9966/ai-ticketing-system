import { useState, useEffect } from 'react'
import { listEmployees, createEmployee, updateEmployee, deactivateEmployee } from '../api'
import { AvailabilityBadge, Spinner, EmptyState } from '../components/ui'
import { Plus, Pencil, UserX, X } from 'lucide-react'

const DEPARTMENTS = ['Engineering', 'DevOps', 'IT', 'HR', 'Finance', 'Product', 'Marketing', 'Legal']
const AVAILABILITIES = ['Available', 'Busy', 'On Leave']
const EMPTY = { name: '', email: '', department: '', designation: '', skill_tags: [], availability_status: 'Available' }

function Modal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const addTag = () => {
    if (!tagInput.trim()) return
    setForm(f => ({ ...f, skill_tags: [...f.skill_tags, tagInput.trim()] }))
    setTagInput('')
  }

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">{initial.id ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={set('department')}>
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Designation</label>
              <input className="input" value={form.designation} onChange={set('designation')} />
            </div>
          </div>
          <div>
            <label className="label">Availability</label>
            <select className="input" value={form.availability_status} onChange={set('availability_status')}>
              {AVAILABILITIES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Skill tags</label>
            <div className="flex gap-2 mb-2">
              <input className="input flex-1" placeholder="e.g. Database"
                value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
              <button type="button" className="btn-secondary" onClick={addTag}>Add</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.skill_tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                  {tag}
                  <button onClick={() => setForm(f => ({ ...f, skill_tags: f.skill_tags.filter((_, idx) => idx !== i) }))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t sticky bottom-0 bg-white">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deptFilter, setDeptFilter] = useState('')

  const load = async () => {
    const { data } = await listEmployees()
    setEmployees(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    if (form.id) {
      await updateEmployee(form.id, {
        name: form.name, designation: form.designation,
        skill_tags: form.skill_tags, availability_status: form.availability_status
      })
    } else {
      await createEmployee(form)
    }
    setModal(null)
    load()
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this employee?')) return
    await deactivateEmployee(id)
    load()
  }

  const filtered = deptFilter ? employees.filter(e => e.department === deptFilter) : employees

  return (
    <div className="px-4 sm:px-6 py-8">
      {modal && <Modal initial={modal === 'add' ? EMPTY : modal} onSave={handleSave} onClose={() => setModal(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{employees.length} active employees</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>
          <Plus size={15} />
          <span className="hidden sm:inline">Add Employee</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Dept filter - scrollable on mobile */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {['', ...DEPARTMENTS].map(d => (
          <button key={d} onClick={() => setDeptFilter(d)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
              deptFilter === d
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {d || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="👥" title="No employees found" description="Add your first employee." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <div key={emp.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold flex-shrink-0">
                    {emp.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.designation}</p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setModal(emp)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDeactivate(emp.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <UserX size={13} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{emp.department}</span>
                  <AvailabilityBadge status={emp.availability_status} />
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Load: <span className="font-medium text-gray-700">{emp.current_load} tickets</span></span>
                  <span>Avg: <span className="font-medium text-gray-700">{emp.avg_resolution_time}h</span></span>
                </div>
                {emp.skill_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {emp.skill_tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}