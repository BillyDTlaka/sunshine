'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import {
  useActiveProjects, useAllSupplierAwards, useAllProFormas,
  useAllRequisitions, useAllPayments,
  useMarkProFormaReceived, useSubmitRequisition, useRecordPayment,
  useSuppliers, useUpdateRfqStatus,
} from '@/lib/hooks'
import { useAuthStore } from '@/store/auth.store'

const TABS = ['Active Projects', 'Supplier Selection', 'Pro Formas', 'Requisitions', 'Payments'] as const
type Tab = typeof TABS[number]

const ACTIVE_STATUSES = [
  'PO_RECEIVED', 'SUPPLIER_SELECTION_PENDING', 'SUPPLIER_SELECTED',
  'PRO_FORMA_REQUESTED', 'PRO_FORMA_RECEIVED', 'REQUISITION_PENDING',
  'REQUISITION_APPROVED', 'PAYMENT_PENDING', 'PAID_TO_SUPPLIER',
  'DELIVERY_SCHEDULED', 'IN_TRANSIT', 'DELIVERED',
]

const PIPELINE_STEPS = [
  { statuses: ['PO_RECEIVED', 'SUPPLIER_SELECTION_PENDING'], label: 'PO Received' },
  { statuses: ['SUPPLIER_SELECTED'], label: 'Supplier Selected' },
  { statuses: ['PRO_FORMA_REQUESTED', 'PRO_FORMA_RECEIVED'], label: 'Pro Forma' },
  { statuses: ['REQUISITION_PENDING', 'REQUISITION_APPROVED', 'PAYMENT_PENDING'], label: 'Requisition' },
  { statuses: ['PAID_TO_SUPPLIER'], label: 'Paid' },
  { statuses: ['DELIVERY_SCHEDULED', 'IN_TRANSIT', 'DELIVERED'], label: 'Delivery' },
]

function PipelineDots({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STEPS.map((step, i) => {
        const done = PIPELINE_STEPS.slice(0, i).some(s => s.statuses.includes(status))
        const active = step.statuses.includes(status)
        return (
          <div key={i} className="flex items-center gap-1">
            <div
              title={step.label}
              className={`w-2 h-2 rounded-full ${active ? 'bg-brand' : done ? 'bg-green-500' : 'bg-gray-200'}`}
            />
            {i < PIPELINE_STEPS.length - 1 && <div className={`w-3 h-px ${done ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Mark Pro Forma Received Modal ────────────────────────────────────────────
function MarkReceivedModal({ pf, onClose }: { pf: any; onClose: () => void }) {
  const [amount, setAmount] = useState(pf.amount ? Number(pf.amount) : '')
  const mutation = useMarkProFormaReceived()

  const handleSave = async () => {
    if (!amount) { alert('Amount is required'); return }
    await mutation.mutateAsync({ id: pf.id, amount: Number(amount) })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Mark Pro Forma Received</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <p className="text-sm text-gray-500">{pf.supplier?.name} — {pf.rfq?.referenceNumber}</p>
        <div>
          <label className="label">Amount (ZAR) *</label>
          <input
            type="number"
            className="input"
            value={amount}
            onChange={e => setAmount(e.target.value as any)}
            placeholder="0.00"
            min={0}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function RecordPaymentModal({ requisition, onClose }: { requisition: any; onClose: () => void }) {
  const mutation = useRecordPayment()
  const [form, setForm] = useState({
    supplierId: requisition.supplier?.id ?? '',
    amount: Number(requisition.amount),
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'EFT',
    reference: '',
    notes: '',
  })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.reference) { alert('Reference is required'); return }
    await mutation.mutateAsync({
      reqId: requisition.id,
      data: { ...form, paymentDate: new Date(form.paymentDate).toISOString() },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="text-sm text-gray-500">{requisition.rfq?.referenceNumber} — {requisition.supplier?.name}</div>
        <div className="space-y-3">
          <div>
            <label className="label">Amount (ZAR)</label>
            <input type="number" className="input" value={form.amount} onChange={e => set('amount', Number(e.target.value))} min={0} />
          </div>
          <div>
            <label className="label">Payment Date</label>
            <input type="date" className="input" value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              {['EFT', 'CREDIT_CARD', 'CASH', 'OTHER'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reference *</label>
            <input className="input" placeholder="Bank reference / EFT ref" value={form.reference} onChange={e => set('reference', e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input h-16 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Active Projects Tab ──────────────────────────────────────────────────────
function ActiveProjectsTab() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useActiveProjects({ search, status: status || undefined, page, limit: 20 })

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <input className="input w-60" placeholder="Search reference or client..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="input w-52" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Active Statuses</option>
          {ACTIVE_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <Card padding={false}>
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Account Manager</th>
                <th className="px-4 py-3">Awarded Supplier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pipeline</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((rfq: any) => (
                <tr key={rfq.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{rfq.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{rfq.client?.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {rfq.accountManager ? `${rfq.accountManager.firstName} ${rfq.accountManager.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{rfq.supplierAwards?.[0]?.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3"><Badge status={rfq.status} /></td>
                  <td className="px-4 py-3"><PipelineDots status={rfq.status} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/project-admin/${rfq.id}`} className="text-brand hover:underline text-xs font-semibold">Manage →</Link>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No active projects</td></tr>
              )}
            </tbody>
          </table>
        )}
        <Pagination data={data} page={page} setPage={setPage} />
      </Card>
    </div>
  )
}

// ─── Supplier Selection Tab ───────────────────────────────────────────────────
function SupplierSelectionTab() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAllSupplierAwards({ search, page, limit: 20 })

  return (
    <div className="space-y-4">
      <input className="input w-60" placeholder="Search reference or supplier..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      <Card padding={false}>
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Awarded Supplier</th>
                <th className="px-4 py-3">Quote Total (ZAR)</th>
                <th className="px-4 py-3">Rationale</th>
                <th className="px-4 py-3">Awarded By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((award: any) => (
                <tr key={award.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{award.rfq?.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{award.rfq?.client?.name}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{award.supplier?.name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    R {Number(award.supplierQuote?.totalCost ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{award.rationale ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {award.awardedBy ? `${award.awardedBy.firstName} ${award.awardedBy.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(award.awardedAt).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/project-admin/${award.rfq?.id}`} className="text-brand hover:underline text-xs font-semibold">View →</Link>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No supplier awards yet</td></tr>
              )}
            </tbody>
          </table>
        )}
        <Pagination data={data} page={page} setPage={setPage} />
      </Card>
    </div>
  )
}

// ─── Pro Formas Tab ───────────────────────────────────────────────────────────
function ProFormasTab() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [markReceiving, setMarkReceiving] = useState<any | null>(null)
  const { data, isLoading } = useAllProFormas({ search, status: status || undefined, page, limit: 20 })

  return (
    <div className="space-y-4">
      {markReceiving && <MarkReceivedModal pf={markReceiving} onClose={() => setMarkReceiving(null)} />}
      <div className="flex gap-3">
        <input className="input w-60" placeholder="Search reference or supplier..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="input w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {['REQUESTED', 'RECEIVED', 'OVERDUE'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <Card padding={false}>
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Amount (ZAR)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((pf: any) => (
                <tr key={pf.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{pf.rfq?.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{pf.rfq?.client?.name}</td>
                  <td className="px-4 py-3 text-gray-700">{pf.supplier?.name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {pf.amount ? `R ${Number(pf.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-4 py-3"><Badge status={pf.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(pf.requestedAt).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {pf.receivedAt ? new Date(pf.receivedAt).toLocaleDateString('en-ZA') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {pf.status === 'REQUESTED' ? (
                      <button onClick={() => setMarkReceiving(pf)} className="text-brand hover:underline text-xs font-semibold">
                        Mark Received
                      </button>
                    ) : (
                      <Link href={`/dashboard/project-admin/${pf.rfq?.id}`} className="text-brand hover:underline text-xs font-semibold">View →</Link>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No pro formas found</td></tr>
              )}
            </tbody>
          </table>
        )}
        <Pagination data={data} page={page} setPage={setPage} />
      </Card>
    </div>
  )
}

// ─── Requisitions Tab ─────────────────────────────────────────────────────────
function RequisitionsTab() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const submitMutation = useSubmitRequisition()
  const { data, isLoading } = useAllRequisitions({ search, status: status || undefined, page, limit: 20 })

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input className="input w-60" placeholder="Search reference or supplier..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="input w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <Card padding={false}>
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Amount (ZAR)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((req: any) => (
                <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">{req.rfq?.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{req.rfq?.client?.name}</td>
                  <td className="px-4 py-3 text-gray-700">{req.supplier?.name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    R {Number(req.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3"><Badge status={req.status} /></td>
                  <td className="px-4 py-3 text-gray-500">
                    {req.requestedBy ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(req.createdAt).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3 flex gap-2">
                    {req.status === 'DRAFT' && (
                      <button
                        onClick={() => submitMutation.mutate(req.id)}
                        disabled={submitMutation.isPending}
                        className="text-brand hover:underline text-xs font-semibold"
                      >
                        Submit
                      </button>
                    )}
                    <Link href={`/dashboard/project-admin/${req.rfq?.id}`} className="text-gray-400 hover:text-brand text-xs">View →</Link>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No requisitions found</td></tr>
              )}
            </tbody>
          </table>
        )}
        <Pagination data={data} page={page} setPage={setPage} />
      </Card>
    </div>
  )
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
function PaymentsTab() {
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [recordingFor, setRecordingFor] = useState<any | null>(null)
  const { user } = useAuthStore()
  const canRecordPayment = user?.role === 'FINANCE' || user?.role === 'ADMIN'

  const { data: reqData } = useAllRequisitions({ status: 'APPROVED', limit: 200 })
  const { data, isLoading } = useAllPayments({ search, fromDate: fromDate || undefined, toDate: toDate || undefined, page, limit: 20 })

  return (
    <div className="space-y-4">
      {recordingFor && <RecordPaymentModal requisition={recordingFor} onClose={() => setRecordingFor(null)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-3 flex-wrap">
          <input className="input w-52" placeholder="Search reference, supplier..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <input type="date" className="input w-36" value={fromDate} onChange={e => setFromDate(e.target.value)} title="From date" />
          <span className="self-center text-gray-400 text-sm">to</span>
          <input type="date" className="input w-36" value={toDate} onChange={e => setToDate(e.target.value)} title="To date" />
        </div>
        {canRecordPayment && reqData?.data?.length > 0 && (
          <div className="flex items-center gap-2">
            <select className="input w-64" onChange={e => {
              const req = reqData.data.find((r: any) => r.id === e.target.value)
              if (req) setRecordingFor(req)
              e.target.value = ''
            }}>
              <option value="">+ Record Payment for...</option>
              {reqData.data.map((req: any) => (
                <option key={req.id} value={req.id}>
                  {req.rfq?.referenceNumber} — {req.supplier?.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Card padding={false}>
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Amount (ZAR)</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Bank Ref</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((pmt: any) => (
                <tr key={pmt.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">
                    {pmt.requisition?.rfq?.referenceNumber}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{pmt.requisition?.rfq?.client?.name}</td>
                  <td className="px-4 py-3 text-gray-700">{pmt.supplier?.name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    R {Number(pmt.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{pmt.paymentMethod.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(pmt.paymentDate).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{pmt.reference ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{pmt.notes ?? '—'}</td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No payments found</td></tr>
              )}
            </tbody>
          </table>
        )}
        <Pagination data={data} page={page} setPage={setPage} />
      </Card>
    </div>
  )
}

// ─── Shared Pagination ────────────────────────────────────────────────────────
function Pagination({ data, page, setPage }: { data: any; page: number; setPage: (fn: (p: number) => number) => void }) {
  if (!data || data.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
      <p className="text-xs text-gray-500">{data.total} total</p>
      <div className="flex gap-2">
        <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Prev</button>
        <span className="text-xs text-gray-500 py-1">Page {page} of {data.totalPages}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page === data.totalPages} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Next</button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectAdminPage() {
  const [tab, setTab] = useState<Tab>('Active Projects')

  return (
    <div className="space-y-4">
      <h1 className="page-title">Project Administration</h1>

      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Active Projects'    && <ActiveProjectsTab />}
      {tab === 'Supplier Selection' && <SupplierSelectionTab />}
      {tab === 'Pro Formas'         && <ProFormasTab />}
      {tab === 'Requisitions'       && <RequisitionsTab />}
      {tab === 'Payments'           && <PaymentsTab />}
    </div>
  )
}
