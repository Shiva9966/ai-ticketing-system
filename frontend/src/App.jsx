import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import SubmitTicket from './pages/SubmitTicket'
import TicketList from './pages/TicketList'
import TicketDetail from './pages/TicketDetail'
import EmployeeDirectory from './pages/EmployeeDirectory'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route path="/tickets/new" element={<SubmitTicket />} />
        <Route path="/tickets" element={<TicketList />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/employees" element={<EmployeeDirectory />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}