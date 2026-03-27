'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useRfqs } from '@/lib/hooks'

const STATUS_OPTIONS = [
  'All', 'RFQ_DRAFT', 'RFQ_OPEN', 'PRICING_IN_PROGRESS', 'INTERNAL_REVIEW_PENDING',
  'APPROVED_FOR_CLIENT', 'SENT_TO_CLIENT', 'PO_RECEIVED', 'DELIVERY_CONFIRMED',
  'INVOICE_ISSUED', 'CLOSED', 'LOST',
]

export default function RfqListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useRfqs({ search, status: status || undefined, page })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">RFQs</h1>
        <Link href="/dashboard/rfqs/new" className="btn-primary">+ New RFQ</Link>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap gap-3">
        <input
          className="input w-64"
          placeholder="Search RFQ..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className="input w-48"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s === 'All' ? '' : s}>{s === 'All' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Account Manager</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Quotes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((rfq: any) => (
                <tr key={rfq.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{rfq.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{rfq.client?.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {rfq.accountManager ? `${rfq.accountManager.firstName} ${rfq.accountManager.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('en-ZA') : '—'}
                  </td>
                  <td className="px-4 py-3"><Badge status={rfq.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{rfq._count?.clientQuotes ?? 0} quotes</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/rfqs/${rfq.id}`} className="text-brand hover:underline text-xs font-semibold">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No RFQs found</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-500">{data.total} total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Prev</button>
              <span className="text-xs text-gray-500 py-1">Page {page} of {data.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === data.totalPages} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
