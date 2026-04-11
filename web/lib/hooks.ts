import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  dashboardApi, rfqsApi, clientQuotesApi, supplierQuotesApi,
  approvalsApi, invoicesApi, deliveriesApi, clientsApi, suppliersApi,
  reportsApi, masterDataApi, purchaseOrdersApi, projectAdminApi,
} from './api'

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const useDashboardSummary = () =>
  useQuery({ queryKey: ['dashboard', 'summary'], queryFn: () => dashboardApi.summary().then(r => r.data) })

export const useDashboardAlerts = () =>
  useQuery({ queryKey: ['dashboard', 'alerts'], queryFn: () => dashboardApi.alerts().then(r => r.data) })

// ─── RFQs ─────────────────────────────────────────────────────────────────────
export const useRfqs = (params?: any) =>
  useQuery({ queryKey: ['rfqs', params], queryFn: () => rfqsApi.list(params).then(r => r.data) })

export const useRfq = (id: string) =>
  useQuery({ queryKey: ['rfq', id], queryFn: () => rfqsApi.get(id).then(r => r.data), enabled: !!id })

export const useUpdateRfqStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => rfqsApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rfq', id] })
      qc.invalidateQueries({ queryKey: ['rfqs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ─── Client Quotes ────────────────────────────────────────────────────────────
export const useAllClientQuotes = (params?: any) =>
  useQuery({ queryKey: ['client-quotes', 'all', params], queryFn: () => clientQuotesApi.listAll(params).then(r => r.data) })

export const useAllPurchaseOrders = (params?: any) =>
  useQuery({ queryKey: ['purchase-orders', 'all', params], queryFn: () => purchaseOrdersApi.listAll(params).then(r => r.data) })

export const useClientQuotes = (rfqId: string) =>
  useQuery({ queryKey: ['client-quotes', rfqId], queryFn: () => clientQuotesApi.list(rfqId).then(r => r.data), enabled: !!rfqId })

export const useClientQuote = (id: string) =>
  useQuery({ queryKey: ['client-quote', id], queryFn: () => clientQuotesApi.get(id).then(r => r.data), enabled: !!id })

export const useSubmitQuoteForApproval = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientQuotesApi.submitForApproval(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-quotes'] }),
  })
}

// ─── Supplier Quotes ──────────────────────────────────────────────────────────
export const useSupplierQuotes = (rfqId: string) =>
  useQuery({ queryKey: ['supplier-quotes', rfqId], queryFn: () => supplierQuotesApi.list(rfqId).then(r => r.data), enabled: !!rfqId })

export const useSupplierComparison = (rfqId: string) =>
  useQuery({ queryKey: ['supplier-compare', rfqId], queryFn: () => supplierQuotesApi.compare(rfqId).then(r => r.data), enabled: !!rfqId })

// ─── Approvals ────────────────────────────────────────────────────────────────
export const usePendingApprovals = () =>
  useQuery({ queryKey: ['approvals', 'pending'], queryFn: () => approvalsApi.pending().then(r => r.data) })

export const useApprove = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => approvalsApi.approve(id, comments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useReject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) => approvalsApi.reject(id, comments),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  })
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const useInvoices = (params?: any) =>
  useQuery({ queryKey: ['invoices', params], queryFn: () => invoicesApi.list(params).then(r => r.data) })

// ─── Deliveries ───────────────────────────────────────────────────────────────
export const useDeliveries = (rfqId: string) =>
  useQuery({ queryKey: ['deliveries', rfqId], queryFn: () => deliveriesApi.list(rfqId).then(r => r.data), enabled: !!rfqId })

// ─── Clients ──────────────────────────────────────────────────────────────────
export const useClients = (params?: any) =>
  useQuery({ queryKey: ['clients', params], queryFn: () => clientsApi.list(params).then(r => r.data) })

export const useClient = (id: string) =>
  useQuery({ queryKey: ['client', id], queryFn: () => clientsApi.get(id).then(r => r.data), enabled: !!id })

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const useSuppliers = (params?: any) =>
  useQuery({ queryKey: ['suppliers', params], queryFn: () => suppliersApi.list(params).then(r => r.data) })

// ─── Reports ──────────────────────────────────────────────────────────────────
export const useMarginReport = (params?: any) =>
  useQuery({ queryKey: ['reports', 'margins', params], queryFn: () => reportsApi.margins(params).then(r => r.data) })

export const useWinLossReport = (params?: any) =>
  useQuery({ queryKey: ['reports', 'win-loss', params], queryFn: () => reportsApi.winLoss(params).then(r => r.data) })

export const useReceivablesReport = () =>
  useQuery({ queryKey: ['reports', 'receivables'], queryFn: () => reportsApi.receivables().then(r => r.data) })

// ─── Master Data ──────────────────────────────────────────────────────────────
export const useMasterData = (entity: string, params?: any) =>
  useQuery({ queryKey: ['master-data', entity, params], queryFn: () => masterDataApi.list(entity, params).then(r => r.data) })

export const useMasterDataItem = (entity: string, id: string) =>
  useQuery({ queryKey: ['master-data', entity, id], queryFn: () => masterDataApi.get(entity, id).then(r => r.data), enabled: !!id })

export const useCreateMasterData = (entity: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => masterDataApi.create(entity, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data', entity] }),
  })
}

export const useUpdateMasterData = (entity: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => masterDataApi.update(entity, id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data', entity] }),
  })
}

export const useSetMasterDataStatus = (entity: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => masterDataApi.setStatus(entity, id, status).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data', entity] }),
  })
}

export const useImportMasterData = (entity: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => masterDataApi.import(entity, file).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data', entity] }),
  })
}

// ─── Project Admin ────────────────────────────────────────────────────────────
export const useActiveProjects = (params?: any) =>
  useQuery({ queryKey: ['project-admin', 'active', params], queryFn: () => projectAdminApi.activeProjects(params).then(r => r.data) })

export const useAllSupplierAwards = (params?: any) =>
  useQuery({ queryKey: ['project-admin', 'awards', params], queryFn: () => projectAdminApi.supplierAwards(params).then(r => r.data) })

export const useAllProFormas = (params?: any) =>
  useQuery({ queryKey: ['project-admin', 'pro-formas', params], queryFn: () => projectAdminApi.proFormas(params).then(r => r.data) })

export const useAllRequisitions = (params?: any) =>
  useQuery({ queryKey: ['project-admin', 'requisitions', params], queryFn: () => projectAdminApi.requisitions(params).then(r => r.data) })

export const useAllPayments = (params?: any) =>
  useQuery({ queryKey: ['project-admin', 'payments', params], queryFn: () => projectAdminApi.payments(params).then(r => r.data) })

export const useMarkProFormaReceived = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => projectAdminApi.markProFormaReceived(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-admin', 'pro-formas'] })
      qc.invalidateQueries({ queryKey: ['project-admin', 'active'] })
    },
  })
}

export const useSubmitRequisition = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectAdminApi.submitRequisition(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-admin', 'requisitions'] })
      qc.invalidateQueries({ queryKey: ['project-admin', 'active'] })
    },
  })
}

export const useRecordPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reqId, data }: { reqId: string; data: any }) => projectAdminApi.recordPayment(reqId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-admin', 'payments'] })
      qc.invalidateQueries({ queryKey: ['project-admin', 'active'] })
    },
  })
}
