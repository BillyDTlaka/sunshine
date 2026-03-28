'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import {
  useRfqs, useAllClientQuotes, useAllPurchaseOrders,
  usePendingApprovals, useApprove, useReject, useClients,
} from '@/lib/hooks'
import { rfqsApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

const TABS = ['RFQs / RFPs', 'Supplier Pricing', 'Quotes', 'Approvals', 'Purchase Orders'] as const
type Tab = typeof TABS[number]

const RFQ_STATUSES = [
  '', 'RFQ_DRAFT', 'RFQ_OPEN', 'SUPPLIER_QUOTES_REQUESTED', 'SUPPLIER_QUOTES_RECEIVED',
  'PRICING_IN_PROGRESS', 'INTERNAL_REVIEW_PENDING', 'APPROVED_FOR_CLIENT',
  'SENT_TO_CLIENT', 'CLIENT_ACCEPTED', 'PO_RECEIVED', 'CLOSED', 'LOST', 'CANCELLED',
]

const QUOTE_STATUSES = ['', 'DRAFT', 'SUBMITTED_FOR_REVIEW', 'APPROVED', 'REJECTED', 'SENT', 'ACCEPTED', 'LOST']

// ─── New RFQ/RFP Modal ────────────────────────────────────────────────────────
function NewRfqModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []
  const [form, setForm] = useState({ type: 'RFQ', clientId: '', description: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.clientId) { setError('Client is required'); return }
    setSaving(true)
    try {
      await rfqsApi.create({
        type: form.type,
        clientId: form.clientId,
        description: form.description || undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      })
      qc.invalidateQueries({ queryKey: ['rfqs'] })
      onClose()
    } catch {
      setError('Failed to create. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">New Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        {/* Type selector */}
        <div className="flex gap-3">
          {(['RFQ', 'RFP'] as const).map(t => (
            <button
              key={t}
              onClick={() => set('type', t)}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                form.type === t
                  ? 'border-brand bg-brand-light text-brand'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {t === 'RFQ' ? '📋 RFQ' : '📄 RFP'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          {form.type === 'RFQ'
            ? 'Request for Quotation — you are asking suppliers to quote'
            : 'Request for Proposal — client is asking you to propose a solution'}
        </p>

        <div className="space-y-3">
          <div>
            <label className="label">Client *</label>
            <select className="input" value={form.clientId} onChange={e => set('clientId', e.target.value)}>
              <option value="">Select client...</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input h-20 resize-none"
              placeholder="Brief description of the requirement..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input
              type="date"
              className="input"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating...' : `Create ${form.type}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RFQs / RFPs Tab ─────────────────────────────────────────────────────────
function RfqsTab() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showNew, setShowNew] = useState(false)

  const { data, isLoading } = useRfqs({
    search,
    status: status || undefined,
    page,
    limit: 20,
  })

  const filtered = typeFilter
    ? { ...data, data: data?.data?.filter((r: any) => r.type === typeFilter) }
    : data

  return (
    <div className="space-y-4">
      {showNew && <NewRfqModal onClose={() => setShowNew(false)} />}

      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <input
            className="input w-60"
            placeholder="Search reference or description..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="input w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            {RFQ_STATUSES.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {[['', 'All'], ['RFQ', 'RFQ'], ['RFP', 'RFP']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTypeFilter(v)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  typeFilter === v ? 'bg-brand text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ New</button>
      </div>

      <Card padding={false}>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Account Manager</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Quotes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered?.data?.map((rfq: any) => (
                <tr key={rfq.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{rfq.referenceNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      rfq.type === 'RFP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {rfq.type ?? 'RFQ'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{rfq.client?.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {rfq.accountManager ? `${rfq.accountManager.firstName} ${rfq.accountManager.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('en-ZA') : '—'}
                  </td>
                  <td className="px-4 py-3"><Badge status={rfq.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{rfq._count?.clientQuotes ?? 0}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/sales/${rfq.id}`} className="text-brand hover:underline text-xs font-semibold">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered?.data?.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No results found</td></tr>
              )}
            </tbody>
          </table>
        )}
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

// ─── Supplier Pricing Tab ─────────────────────────────────────────────────────
function SupplierPricingTab() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useRfqs({
    search,
    status: 'SUPPLIER_QUOTES_REQUESTED',
    page,
    limit: 20,
  })

  const allStatuses = [
    'SUPPLIER_QUOTES_REQUESTED', 'SUPPLIER_QUOTES_RECEIVED', 'PRICING_IN_PROGRESS',
  ]
  const { data: allData } = useRfqs({ page: 1, limit: 200 })
  const pricingRfqs = allData?.data?.filter((r: any) => allStatuses.includes(r.status)) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="input w-60"
          placeholder="Search RFQ / RFP..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <p className="text-sm text-gray-500">{pricingRfqs.length} document{pricingRfqs.length !== 1 ? 's' : ''} awaiting supplier pricing</p>
      </div>

      <Card padding={false}>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Supplier Quotes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pricingRfqs.map((rfq: any) => (
                <tr key={rfq.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{rfq.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{rfq.client?.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('en-ZA') : '—'}
                  </td>
                  <td className="px-4 py-3"><Badge status={rfq.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{rfq._count?.supplierQuotes ?? 0} quotes</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/sales/${rfq.id}`} className="text-brand hover:underline text-xs font-semibold">
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
              {pricingRfqs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No documents awaiting supplier pricing</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

// ─── Quotes Tab ───────────────────────────────────────────────────────────────
function QuotesTab() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAllClientQuotes({
    search,
    status: status || undefined,
    page,
    limit: 20,
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          className="input w-60"
          placeholder="Search by client or reference..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select className="input w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {QUOTE_STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <Card padding={false}>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Total Sell (ZAR)</th>
                <th className="px-4 py-3">GM %</th>
                <th className="px-4 py-3">Valid Until</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((q: any) => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{q.rfq?.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{q.rfq?.client?.name}</td>
                  <td className="px-4 py-3 text-gray-500">v{q.versionNumber}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    R {Number(q.totalSell).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${Number(q.grossMarginPct) >= 20 ? 'text-green-600' : Number(q.grossMarginPct) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Number(q.grossMarginPct).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-ZA') : '—'}
                  </td>
                  <td className="px-4 py-3"><Badge status={q.status} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/sales/${q.rfq?.id}`} className="text-brand hover:underline text-xs font-semibold">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No quotes found</td></tr>
              )}
            </tbody>
          </table>
        )}
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

// ─── Approvals Tab ────────────────────────────────────────────────────────────
function ApprovalsTab() {
  const { data: approvals, isLoading } = usePendingApprovals()
  const approve = useApprove()
  const reject = useReject()
  const [comments, setComments] = useState<Record<string, string>>({})
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    await approve.mutateAsync({ id, comments: comments[id] })
    setActiveId(null)
  }

  const handleReject = async (id: string) => {
    if (!comments[id]) { alert('A rejection reason is required'); return }
    await reject.mutateAsync({ id, comments: comments[id] })
    setActiveId(null)
  }

  if (isLoading) return <div className="text-gray-400 animate-pulse p-4">Loading approvals...</div>

  if (!approvals?.length) {
    return (
      <Card>
        <p className="text-gray-400 text-center py-4">No pending approvals — you are all caught up!</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {approvals.map((approval: any) => (
        <Card key={approval.id} className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{approval.entityType.replace('_', ' ')}</p>
              {approval.clientQuote && (
                <>
                  <p className="font-semibold text-gray-900">
                    {approval.clientQuote.rfq?.referenceNumber} · {approval.clientQuote.rfq?.client?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Quote v{approval.clientQuote.versionNumber} ·
                    <span className="font-medium"> R {Number(approval.clientQuote.totalSell).toLocaleString('en-ZA')}</span> ·
                    GM {Number(approval.clientQuote.grossMarginPct).toFixed(1)}%
                  </p>
                </>
              )}
              {approval.requisition && (
                <>
                  <p className="font-semibold text-gray-900">{approval.requisition.supplier?.name}</p>
                  <p className="text-sm text-gray-500">R {Number(approval.requisition.amount).toLocaleString('en-ZA')}</p>
                </>
              )}
            </div>
            <Badge status="PENDING" />
          </div>

          {activeId === approval.id && (
            <textarea
              className="input h-20 resize-none"
              placeholder="Comments (required for rejection)..."
              value={comments[approval.id] ?? ''}
              onChange={e => setComments(prev => ({ ...prev, [approval.id]: e.target.value }))}
            />
          )}

          <div className="flex gap-2">
            {activeId !== approval.id ? (
              <button className="btn-secondary text-xs py-1.5" onClick={() => setActiveId(approval.id)}>Review</button>
            ) : (
              <>
                <button className="btn-primary text-xs py-1.5" onClick={() => handleApprove(approval.id)} disabled={approve.isPending}>Approve</button>
                <button className="btn-danger text-xs py-1.5" onClick={() => handleReject(approval.id)} disabled={reject.isPending}>Reject</button>
                <button className="text-xs text-gray-400 hover:text-gray-700 px-2" onClick={() => setActiveId(null)}>Cancel</button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── Purchase Orders Tab ──────────────────────────────────────────────────────
function PurchaseOrdersTab() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAllPurchaseOrders({ search, page, limit: 20 })

  return (
    <div className="space-y-4">
      <input
        className="input w-60"
        placeholder="Search PO number, client..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">RFQ/RFP Ref</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">PO Date</th>
                <th className="px-4 py-3">PO Amount (ZAR)</th>
                <th className="px-4 py-3">Quote Value (ZAR)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((po: any) => (
                <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{po.poNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-600">{po.rfq?.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{po.client?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(po.poDate).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    R {Number(po.poAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    R {Number(po.clientQuote?.totalSell ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/sales/${po.rfq?.id}`} className="text-brand hover:underline text-xs font-semibold">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No purchase orders found</td></tr>
              )}
            </tbody>
          </table>
        )}
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const [tab, setTab] = useState<Tab>('RFQs / RFPs')

  return (
    <div className="space-y-4">
      <h1 className="page-title">Sales</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'RFQs / RFPs' && <RfqsTab />}
      {tab === 'Supplier Pricing' && <SupplierPricingTab />}
      {tab === 'Quotes' && <QuotesTab />}
      {tab === 'Approvals' && <ApprovalsTab />}
      {tab === 'Purchase Orders' && <PurchaseOrdersTab />}
    </div>
  )
}
