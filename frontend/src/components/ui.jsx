import { clsx } from 'clsx'

const SEVERITY_STYLES = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
}

const STATUS_STYLES = {
  New: 'bg-blue-100 text-blue-800',
  Assigned: 'bg-purple-100 text-purple-800',
  'In Progress': 'bg-indigo-100 text-indigo-800',
  'Pending Info': 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-600',
}

const CATEGORY_STYLES = {
  Bug: 'bg-red-50 text-red-700',
  Billing: 'bg-green-50 text-green-700',
  Access: 'bg-orange-50 text-orange-700',
  HR: 'bg-pink-50 text-pink-700',
  Server: 'bg-red-50 text-red-700',
  DB: 'bg-purple-50 text-purple-700',
  Feature: 'bg-blue-50 text-blue-700',
  Other: 'bg-gray-50 text-gray-600',
}

export function SeverityBadge({ severity }) {
  return (
    <span className={clsx('badge', SEVERITY_STYLES[severity] || 'bg-gray-100 text-gray-700')}>
      {severity}
    </span>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={clsx('badge', STATUS_STYLES[status] || 'bg-gray-100 text-gray-700')}>
      {status}
    </span>
  )
}

export function CategoryBadge({ category }) {
  return (
    <span className={clsx('badge', CATEGORY_STYLES[category] || 'bg-gray-50 text-gray-600')}>
      {category}
    </span>
  )
}

export function AvailabilityBadge({ status }) {
  const styles = {
    Available: 'bg-green-100 text-green-800',
    Busy: 'bg-yellow-100 text-yellow-800',
    'On Leave': 'bg-gray-100 text-gray-600',
  }
  const dotColors = {
    Available: 'bg-green-500',
    Busy: 'bg-yellow-500',
    'On Leave': 'bg-gray-400',
  }
  return (
    <span className={clsx('badge', styles[status] || 'bg-gray-100 text-gray-600')}>
      <span className={clsx('w-1.5 h-1.5 rounded-full mr-1 inline-block', dotColors[status])} />
      {status}
    </span>
  )
}

export function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6'
  return (
    <div className={clsx('animate-spin rounded-full border-2 border-gray-200 border-t-brand-600', sz)} />
  )
}

export function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  }
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={clsx('text-3xl font-bold', colors[color])}>{value}</p>
    </div>
  )
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  )
}

export function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100)
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={clsx('h-1.5 rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  )
}