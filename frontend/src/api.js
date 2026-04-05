import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const createTicket = (data) => api.post('/tickets/', data)
export const listTickets = (params) => api.get('/tickets/', { params })
export const getTicket = (id) => api.get(`/tickets/${id}`)
export const updateTicketStatus = (id, data) => api.patch(`/tickets/${id}/status`, data)
export const assignTicket = (ticketId, empId) => api.patch(`/tickets/${ticketId}/assign/${empId}`)
export const submitFeedback = (ticketId, helpful) => api.post(`/tickets/${ticketId}/feedback`, { helpful })
export const getTicketLogs = (id) => api.get(`/tickets/${id}/logs`)
export const listEmployees = (params) => api.get('/employees/', { params })
export const createEmployee = (data) => api.post('/employees/', data)
export const updateEmployee = (id, data) => api.patch(`/employees/${id}`, data)
export const deactivateEmployee = (id) => api.delete(`/employees/${id}`)
export const getAnalytics = () => api.get('/analytics/')