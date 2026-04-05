import { NavLink, Outlet } from 'react-router-dom'
import { Zap, PlusCircle, Ticket, Users, BarChart2 } from 'lucide-react'
import { clsx } from 'clsx'

const NAV = [
  { to: '/tickets/new', label: 'Submit Ticket', icon: PlusCircle },
  { to: '/tickets', label: 'All Tickets', icon: Ticket },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">AI Tickets</p>
              <p className="text-xs text-gray-400">Smart helpdesk</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/tickets'}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">Powered by Groq + Ollama</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}