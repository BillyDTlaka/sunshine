'use client'

import { Card } from '@/components/Card'
import { KpiCard } from '@/components/KpiCard'
import { useWinLossReport, useReceivablesReport, useMarginReport } from '@/lib/hooks'
import { COLORS } from '@/lib/theme'

export default function ReportsPage() {
  const { data: winLoss } = useWinLossReport()
  const { data: receivables } = useReceivablesReport()
  const { data: margins } = useMarginReport()

  const totalReceivable = receivables?.reduce((s: number, i: any) => s + Number(i.totalAmount), 0) ?? 0
  const avgMargin = margins?.length
    ? margins.reduce((s: number, q: any) => s + Number(q.grossMarginPct), 0) / margins.length
    : 0

  return (
    <div className="space-y-6">
      <h1 className="page-title">Reports</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Win Rate" value={`${(winLoss?.winRate ?? 0).toFixed(0)}%`} icon="🏆" color={COLORS.success} />
        <KpiCard label="Deals Won" value={winLoss?.won ?? 0} icon="✅" color={COLORS.success} />
        <KpiCard label="Deals Lost" value={winLoss?.lost ?? 0} icon="❌" color={COLORS.danger} />
        <KpiCard label="Avg Margin" value={`${avgMargin.toFixed(1)}%`} icon="📊" color={COLORS.purple} />
      </div>

      {/* Receivables */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Outstanding Receivables</h2>
          <span className="font-bold text-gray-900">R {totalReceivable.toLocaleString('en-ZA')}</span>
        </div>
        {receivables?.length === 0
          ? <p className="text-sm text-gray-400">No outstanding invoices</p>
          : receivables?.map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</p>
                <p className="text-xs text-gray-500">{inv.client?.name} · Due {new Date(inv.dueDate).toLocaleDateString('en-ZA')}</p>
              </div>
              <p className="font-semibold text-gray-900">R {Number(inv.totalAmount).toLocaleString('en-ZA')}</p>
            </div>
          ))
        }
      </Card>

      {/* Margin by Quote */}
      <Card>
        <h2 className="section-title mb-4">Margin by Quote</h2>
        {margins?.length === 0
          ? <p className="text-sm text-gray-400">No approved quotes</p>
          : margins?.slice(0, 10).map((q: any) => (
            <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{q.rfq?.referenceNumber}</p>
                <p className="text-xs text-gray-500">{q.rfq?.client?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">R {Number(q.totalSell).toLocaleString('en-ZA')}</p>
                <p className="text-xs text-gray-500">GM {Number(q.grossMarginPct).toFixed(1)}%</p>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  )
}
