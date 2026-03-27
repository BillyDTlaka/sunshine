'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useRfq } from '@/lib/hooks'

export default function RfqDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: rfq, isLoading } = useRfq(id)

  if (isLoading) return <div className="animate-pulse text-gray-400 p-4">Loading RFQ...</div>
  if (!rfq) return <div className="text-red-500 p-4">RFQ not found</div>

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/rfqs" className="text-xs text-gray-400 hover:text-brand">← RFQs</Link>
          </div>
          <h1 className="page-title font-mono">{rfq.referenceNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">{rfq.description}</p>
        </div>
        <Badge status={rfq.status} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500 mb-1">Client</p>
          <p className="font-semibold text-gray-900">{rfq.client?.name}</p>
          <p className="text-sm text-gray-500">{rfq.contact?.firstName} {rfq.contact?.lastName}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">Account Manager</p>
          <p className="font-semibold text-gray-900">
            {rfq.accountManager ? `${rfq.accountManager.firstName} ${rfq.accountManager.lastName}` : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">Deadline</p>
          <p className="font-semibold text-gray-900">
            {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('en-ZA') : 'Not set'}
          </p>
          <p className="text-xs text-gray-400">Received {new Date(rfq.receivedDate).toLocaleDateString('en-ZA')}</p>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <h2 className="section-title mb-4">Line Items</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="pb-2">#</th>
              <th className="pb-2">Description</th>
              <th className="pb-2">Category</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2">Unit</th>
            </tr>
          </thead>
          <tbody>
            {rfq.lineItems?.map((line: any) => (
              <tr key={line.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-400">{line.lineNumber}</td>
                <td className="py-2 font-medium text-gray-900">{line.description}</td>
                <td className="py-2"><Badge status={line.category} label={line.category.replace(/_/g, ' ')} /></td>
                <td className="py-2">{line.quantity}</td>
                <td className="py-2 text-gray-500">{line.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Client Quotes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Client Quotes</h2>
          <Link href={`/dashboard/quotes?rfqId=${rfq.id}`} className="btn-primary text-xs py-1.5 px-3">+ New Quote</Link>
        </div>
        {rfq.clientQuotes?.length === 0 ? (
          <p className="text-sm text-gray-400">No quotes yet</p>
        ) : rfq.clientQuotes?.map((q: any) => (
          <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <span className="text-sm font-semibold text-gray-900">Version {q.versionNumber}</span>
              <span className="ml-2 text-sm text-gray-500">R {Number(q.totalSell).toLocaleString('en-ZA')}</span>
              <span className="ml-2 text-xs text-gray-400">GM {Number(q.grossMarginPct).toFixed(1)}%</span>
            </div>
            <Badge status={q.status} />
          </div>
        ))}
      </Card>

      {/* Supplier Quotes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Supplier Quotes</h2>
        </div>
        {rfq.supplierQuotes?.length === 0 ? (
          <p className="text-sm text-gray-400">No supplier quotes yet</p>
        ) : rfq.supplierQuotes?.map((sq: any) => (
          <div key={sq.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-semibold text-gray-900">{sq.supplier?.name}</p>
              <p className="text-xs text-gray-400">{sq.lines?.length} lines · Lead time: {sq.leadTimeDays ?? '—'} days</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">R {Number(sq.totalCost).toLocaleString('en-ZA')}</p>
              <Badge status={sq.status} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
