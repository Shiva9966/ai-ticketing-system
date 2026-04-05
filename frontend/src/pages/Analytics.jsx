import { useState, useEffect } from 'react'
import { getAnalytics } from '../api'
import { StatCard, Spinner } from '../components/ui'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#4f6ef7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const SEVERITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#22c55e' }

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics().then(r => { setData(r.data); setLoading(false) })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!data) return null

  const statusData = Object.entries(data.tickets_by_status).map(([name, value]) => ({ name, value }))
  const severityData = Object.entries(data.tickets_by_severity).map(([name, value]) => ({ name, value }))
  const deptLoadData = Object.entries(data.department_load).map(([dept, count]) => ({ dept, count }))

  return (
    <div className="px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live overview of your helpdesk</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <StatCard label="Total Tickets" value={data.total_tickets} color="blue" />
        <StatCard label="Open" value={data.open_tickets} color="orange" />
        <StatCard label="Resolved" value={data.resolved_tickets} color="green" />
        <StatCard label="Auto-resolved" value={data.auto_resolved_tickets} color="purple" />
        <StatCard label="AI Success Rate" value={`${data.auto_resolution_success_rate}%`} color="green" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tickets by Status</h2>
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-10">No data yet</p>}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tickets by Severity</h2>
          {severityData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={severityData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map(entry => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-10">No data yet</p>}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Department Load</h2>
          {deptLoadData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptLoadData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f6ef7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-10">No open tickets</p>}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Categories This Week</h2>
          {data.top_categories.length ? (
            <div className="space-y-3 mt-2">
              {data.top_categories.map(({ category, count }, i) => {
                const max = data.top_categories[0].count
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="w-4 text-xs text-gray-400">{i + 1}</span>
                    <span className="w-20 text-sm text-gray-700">{category}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-brand-600"
                        style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-4">{count}</span>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-10">No tickets this week</p>}
        </div>
      </div>
    </div>
  )
}