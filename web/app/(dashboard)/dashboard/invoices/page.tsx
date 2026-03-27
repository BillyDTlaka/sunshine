'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useInvoices } from '@/lib/hooks'

export default function InvoicesPage() {
  const [status, setStatus] = useState('')
  const { data: invoices, isLoading } = useInvoices({ status: status || undefined })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Client Invoices</h1>
      </div>

      <Card className="flex gap-3">
        <select className="input w-48" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </Card>

      <Card padding={false}>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">RFQ</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Invoice Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices?.map((inv: any) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.client?.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{inv.rfq?.referenceNumber}</td>
                  <td className="px-4 py-3 font-semibold">R {Number(inv.totalAmount).toLocaleString('en-ZA')}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(inv.invoiceDate).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(inv.dueDate).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3"><Badge status={inv.status} /></td>
                </tr>
              ))}
              {!isLoading && invoices?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No invoices found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
