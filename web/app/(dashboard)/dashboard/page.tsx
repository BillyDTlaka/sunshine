'use client'

import { KpiCard } from '@/components/KpiCard'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useDashboardSummary, useDashboardAlerts } from '@/lib/hooks'
import { COLORS } from '@/lib/theme'

export default function DashboardPage() {
  const { data: summary, isLoading } = useDashboardSummary()
  const { data: alerts } = useDashboardAlerts()

  if (isLoading) return <div className="animate-pulse text-gray-400">Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <h1 className="page-title">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Open RFQs" value={summary?.openRfqs ?? 0} icon="📋" color={COLORS.brand} />
        <KpiCard label="Pending Approvals" value={summary?.pendingApprovals ?? 0} icon="✅" color={COLORS.warning} />
        <KpiCard label="POs Received" value={summary?.posReceived ?? 0} icon="📦" color={COLORS.info} />
        <KpiCard label="Deliveries Confirmed" value={summary?.deliveriesConfirmed ?? 0} icon="🚚" color={COLORS.success} />
        <KpiCard label="Outstanding Invoices" value={summary?.invoicesOutstanding ?? 0} icon="💰" color={COLORS.danger} />
        <KpiCard
          label="Pipeline Value"
          value={`R ${Number(summary?.totalPipelineValue ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`}
          icon="📈"
          color={COLORS.purple}
        />
      </div>

      {/* Alerts */}
      {alerts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h2 className="section-title mb-3">Overdue Supplier Quotes</h2>
            {alerts.overdueSupplierQuotes?.length === 0
              ? <p className="text-sm text-gray-400">All clear</p>
              : alerts.overdueSupplierQuotes?.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{q.rfq?.referenceNumber}</p>
                    <p className="text-xs text-gray-500">{q.supplier?.name}</p>
                  </div>
                  <Badge status="SUPPLIER_QUOTES_REQUESTED" label="Overdue" />
                </div>
              ))
            }
          </Card>

          <Card>
            <h2 className="section-title mb-3">Pending Approvals</h2>
            {alerts.pendingApprovals?.length === 0
              ? <p className="text-sm text-gray-400">No pending approvals</p>
              : alerts.pendingApprovals?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-900">{a.entityType}</p>
                  <Badge status="PENDING" />
                </div>
              ))
            }
          </Card>

          <Card>
            <h2 className="section-title mb-3">Missing Proof of Delivery</h2>
            {alerts.missingPods?.length === 0
              ? <p className="text-sm text-gray-400">All deliveries have PODs</p>
              : alerts.missingPods?.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-900">{d.rfq?.referenceNumber}</p>
                  <Badge status="DELIVERED" label="POD Missing" />
                </div>
              ))
            }
          </Card>

          <Card>
            <h2 className="section-title mb-3">Overdue Invoices</h2>
            {alerts.overdueInvoices?.length === 0
              ? <p className="text-sm text-gray-400">No overdue invoices</p>
              : alerts.overdueInvoices?.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{i.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{i.client?.name}</p>
                  </div>
                  <Badge status="OVERDUE" />
                </div>
              ))
            }
          </Card>
        </div>
      )}
    </div>
  )
}
