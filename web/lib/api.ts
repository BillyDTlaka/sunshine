import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sunshine_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sunshine_token')
      localStorage.removeItem('sunshine_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// ─── API domain functions ────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

export const clientsApi = {
  list: (params?: any) => api.get('/clients', { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
  contacts: (id: string) => api.get(`/clients/${id}/contacts`),
  createContact: (id: string, data: any) => api.post(`/clients/${id}/contacts`, data),
}

export const suppliersApi = {
  list: (params?: any) => api.get('/suppliers', { params }),
  get: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.patch(`/suppliers/${id}`, data),
}

export const rfqsApi = {
  list: (params?: any) => api.get('/rfqs', { params }),
  get: (id: string) => api.get(`/rfqs/${id}`),
  create: (data: any) => api.post('/rfqs', data),
  updateStatus: (id: string, status: string) => api.patch(`/rfqs/${id}/status`, { status }),
  addLineItem: (id: string, data: any) => api.post(`/rfqs/${id}/line-items`, data),
  deleteLineItem: (id: string, lineId: string) => api.delete(`/rfqs/${id}/line-items/${lineId}`),
}

export const supplierQuotesApi = {
  list: (rfqId: string) => api.get(`/rfqs/${rfqId}/supplier-quotes`),
  compare: (rfqId: string) => api.get(`/rfqs/${rfqId}/supplier-quotes/compare`),
  create: (rfqId: string, data: any) => api.post(`/rfqs/${rfqId}/supplier-quotes`, data),
  update: (id: string, data: any) => api.patch(`/supplier-quotes/${id}`, data),
}

export const clientQuotesApi = {
  listAll: (params?: any) => api.get('/sales/client-quotes', { params }),
  list: (rfqId: string) => api.get(`/rfqs/${rfqId}/client-quotes`),
  get: (id: string) => api.get(`/rfqs/client-quotes/${id}`),
  create: (rfqId: string, data: any) => api.post(`/rfqs/${rfqId}/client-quotes`, data),
  submitForApproval: (id: string) => api.post(`/rfqs/client-quotes/${id}/submit-for-approval`),
  markSent: (id: string, sentTo?: string) => api.post(`/rfqs/client-quotes/${id}/mark-sent`, { sentTo }),
  updateLine: (id: string, lineId: string, data: any) => api.patch(`/rfqs/client-quotes/${id}/quote-lines/${lineId}`, data),
}

export const approvalsApi = {
  pending: () => api.get('/approvals/pending'),
  approve: (id: string, comments?: string) => api.post(`/approvals/${id}/approve`, { comments }),
  reject: (id: string, comments: string) => api.post(`/approvals/${id}/reject`, { comments }),
}

export const purchaseOrdersApi = {
  listAll: (params?: any) => api.get('/sales/purchase-orders', { params }),
  create: (rfqId: string, data: any) => api.post(`/rfqs/${rfqId}/purchase-orders`, data),
  get: (id: string) => api.get(`/rfqs/purchase-orders/${id}`),
}

export const supplierAwardsApi = {
  create: (rfqId: string, data: any) => api.post(`/rfqs/${rfqId}/supplier-awards`, data),
  list: (rfqId: string) => api.get(`/rfqs/${rfqId}/supplier-awards`),
}

export const proFormasApi = {
  create: (rfqId: string, data: any) => api.post(`/rfqs/${rfqId}/pro-formas`, data),
  markReceived: (id: string, amount: number) => api.patch(`/pro-formas/${id}/mark-received`, { amount }),
  get: (id: string) => api.get(`/pro-formas/${id}`),
}

export const requisitionsApi = {
  create: (rfqId: string, data: any) => api.post(`/rfqs/${rfqId}/requisitions`, data),
  submit: (id: string) => api.post(`/requisitions/${id}/submit`),
  get: (id: string) => api.get(`/requisitions/${id}`),
}

export const paymentsApi = {
  create: (reqId: string, data: any) => api.post(`/requisitions/${reqId}/payments`, data),
  list: (reqId: string) => api.get(`/requisitions/${reqId}/payments`),
}

export const deliveriesApi = {
  list: (rfqId: string) => api.get(`/rfqs/${rfqId}/deliveries`),
  create: (rfqId: string, data: any) => api.post(`/rfqs/${rfqId}/deliveries`, data),
  updateStatus: (rfqId: string, id: string, status: string) => api.patch(`/rfqs/${rfqId}/deliveries/${id}/status`, { status }),
  createNote: (rfqId: string, id: string, data: any) => api.post(`/rfqs/${rfqId}/deliveries/${id}/delivery-note`, data),
}

export const invoicesApi = {
  list: (params?: any) => api.get('/client-invoices', { params }),
  create: (rfqId: string, data: any) => api.post(`/rfqs/${rfqId}/client-invoices`, data),
  markIssued: (rfqId: string, id: string) => api.patch(`/rfqs/${rfqId}/client-invoices/${id}/mark-issued`),
  markPaid: (rfqId: string, id: string, paidAmount: number) => api.patch(`/rfqs/${rfqId}/client-invoices/${id}/mark-paid`, { paidAmount }),
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  pipeline: () => api.get('/dashboard/pipeline'),
  alerts: () => api.get('/dashboard/alerts'),
}

export const reportsApi = {
  pipeline: (params?: any) => api.get('/reports/pipeline', { params }),
  margins: (params?: any) => api.get('/reports/margins', { params }),
  winLoss: (params?: any) => api.get('/reports/win-loss', { params }),
  supplierPayments: (params?: any) => api.get('/reports/supplier-payments', { params }),
  deliveryCycle: () => api.get('/reports/delivery-cycle'),
  receivables: () => api.get('/reports/receivables'),
}

const md = (entity: string) => `/master-data/${entity}`

export const masterDataApi = {
  list:      (entity: string, params?: any)        => api.get(md(entity), { params }),
  get:       (entity: string, id: string)          => api.get(`${md(entity)}/${id}`),
  create:    (entity: string, data: any)            => api.post(md(entity), data),
  update:    (entity: string, id: string, data: any) => api.patch(`${md(entity)}/${id}`, data),
  setStatus: (entity: string, id: string, status: string) => api.patch(`${md(entity)}/${id}/status`, { status }),
  import:    (entity: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`${md(entity)}/import`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export default api
