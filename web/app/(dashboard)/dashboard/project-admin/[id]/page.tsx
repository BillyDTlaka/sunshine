'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import {
  useRfq, useSupplierQuotes, useUpdateRfqStatus,
  useMarkProFormaReceived, useSubmitRequisition, useRecordPayment,
} from '@/lib/hooks'
import { supplierAwardsApi, proFormasApi, requisitionsApi, projectAdminApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'

const PROJ_TRANSITIONS: Record<string, string[]> = {
  PO_RECEIVED: ['SUPPLIER_SELECTION_PENDING'],
  SUPPLIER_SELECTION_PENDING: ['SUPPLIER_SELECTED'],
  SUPPLIER_SELECTED: ['PRO_FORMA_REQUESTED'],
  PRO_FORMA_REQUESTED: ['PRO_FORMA_RECEIVED'],
  PRO_FORMA_RECEIVED: ['REQUISITION_PENDING'],
  REQUISITION_PENDING: ['REQUISITION_APPROVED'],
  REQUISITION_APPROVED: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['PAID_TO_SUPPLIER'],
  PAID_TO_SUPPLIER: ['DELIVERY_SCHEDULED'],
  DELIVERY_SCHEDULED: ['IN_TRANSIT', 'DELIVERED'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: ['DELIVERY_CONFIRMED'],
  DELIVERY_CONFIRMED: ['INVOICE_DRAFT'],
}

// ─── Award Supplier Modal ─────────────────────────────────────────────────────
function AwardSupplierModal({ rfq, onClose }: { rfq: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: supplierQuotes } = useSupplierQuotes(rfq.id)
  const quotes = Array.isArray(supplierQuotes) ? supplierQuotes : supplierQuotes?.data ?? rfq.supplierQuotes ?? []
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [rationale, setRationale] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedQuoteId) { alert('Select a supplier quote'); return }
    const sq = quotes.find((q: any) => q.id === selectedQuoteId)
    if (!sq) return
    setSaving(true)
    try {
      await supplierAwardsApi.create(rfq.id, { supplierQuoteId: sq.id, supplierId: sq.supplierId, rationale })
      qc.invalidateQueries({ queryKey: ['rfq', rfq.id] })
      qc.invalidateQueries({ queryKey: ['project-admin'] })
      onClose()
    } catch {
      alert('Failed to award supplier')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Select Supplier</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-2">
          {quotes.length === 0 && <p className="text-sm text-gray-400">No supplier quotes available.</p>}
          {quotes.map((sq: any) => (
            <label
              key={sq.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selectedQuoteId === sq.id ? 'border-brand bg-brand-light' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input type="radio" name="sq" value={sq.id} checked={selectedQuoteId === sq.id} onChange={() => setSelectedQuoteId(sq.id)} className="text-brand" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{sq.supplier?.name}</p>
                <p className="text-xs text-gray-500">
                  R {Number(sq.totalCost).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} ·
                  Lead time: {sq.leadTimeDays ?? '—'} days ·
                  {sq.lines?.length ?? 0} lines
                </p>
              </div>
              <Badge status={sq.status} />
            </label>
          ))}
        </div>

        <div>
          <label className="label">Rationale</label>
          <textarea className="input h-20 resize-none" placeholder="Why this supplier was selected..." value={rationale} onChange={e => setRationale(e.target.value)} />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Awarding...' : 'Award Supplier'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Request Pro Forma Modal ──────────────────────────────────────────────────
function RequestProFormaModal({ rfq, onClose }: { rfq: any; onClose: () => void }) {
  const qc = useQueryClient()
  const award = rfq.supplierAwards?.[0]
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('ZAR')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!award) { alert('No supplier awarded yet'); return }
    setSaving(true)
    try {
      await proFormasApi.create(rfq.id, {
        supplierId: award.supplierId,
        supplierAwardId: award.id,
        amount: amount ? Number(amount) : undefined,
        currency,
      })
      qc.invalidateQueries({ queryKey: ['rfq', rfq.id] })
      qc.invalidateQueries({ queryKey: ['project-admin'] })
      onClose()
    } catch {
      alert('Failed to request pro forma')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Request Pro Forma</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <p className="text-sm text-gray-500">Supplier: <span className="font-medium text-gray-900">{award?.supplier?.name}</span></p>
        <div className="space-y-3">
          <div>
            <label className="label">Expected Amount (optional)</label>
            <input type="number" className="input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min={0} />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
              {['ZAR', 'USD', 'EUR', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Requesting...' : 'Request Pro Forma'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Requisition Modal ─────────────────────────────────────────────────
function CreateRequisitionModal({ rfq, onClose }: { rfq: any; onClose: () => void }) {
  const qc = useQueryClient()
  const award = rfq.supplierAwards?.[0]
  const proFormas = rfq.proFormaInvoices ?? []
  const [form, setForm] = useState({
    proFormaInvoiceId: proFormas[0]?.id ?? '',
    supplierId: award?.supplierId ?? '',
    amount: proFormas[0]?.amount ? Number(proFormas[0].amount) : '',
    description: '',
    approverId: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.proFormaInvoiceId || !form.amount) { alert('Pro Forma and Amount are required'); return }
    setSaving(true)
    try {
      const req = await requisitionsApi.create(rfq.id, form)
      qc.invalidateQueries({ queryKey: ['rfq', rfq.id] })
      qc.invalidateQueries({ queryKey: ['project-admin'] })
      onClose()
    } catch {
      alert('Failed to create requisition')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Create Requisition</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Pro Forma Invoice</label>
            <select className="input" value={form.proFormaInvoiceId} onChange={e => {
              const pf = proFormas.find((p: any) => p.id === e.target.value)
              set('proFormaInvoiceId', e.target.value)
              if (pf?.amount) set('amount', Number(pf.amount))
            }}>
              <option value="">Select pro forma...</option>
              {proFormas.map((pf: any) => (
                <option key={pf.id} value={pf.id}>
                  {pf.supplier?.name} — {pf.amount ? `R ${Number(pf.amount).toLocaleString('en-ZA')}` : 'No amount'} ({pf.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount (ZAR) *</label>
            <input type="number" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} min={0} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input h-16 resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Purpose of this requisition..." />
          </div>
          <div>
            <label className="label">Approver User ID</label>
            <input className="input" value={form.approverId} onChange={e => set('approverId', e.target.value)} placeholder="Paste approver UUID..." />
            <p className="text-xs text-gray-400 mt-1">The approver will receive this in their Approvals queue.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating...' : 'Create Requisition'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Mark Pro Forma Received (inline) ─────────────────────────────────────────
function MarkPFReceivedModal({ pf, onClose }: { pf: any; onClose: () => void }) {
  const [amount, setAmount] = useState(pf.amount ? Number(pf.amount) : '')
  const mutation = useMarkProFormaReceived()
  const handleSave = async () => {
    if (!amount) { alert('Amount required'); return }
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
        <div>
          <label className="label">Confirmed Amount (ZAR)</label>
          <input type="number" className="input" value={amount} onChange={e => setAmount(e.target.value as any)} min={0} />
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
function RecordPaymentModal({ requisition, rfqId, onClose }: { requisition: any; rfqId: string; onClose: () => void }) {
  const mutation = useRecordPayment()
  const qc = useQueryClient()
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
    if (!form.reference) { alert('Reference required'); return }
    await mutation.mutateAsync({ reqId: requisition.id, data: { ...form, paymentDate: new Date(form.paymentDate).toISOString() } })
    qc.invalidateQueries({ queryKey: ['rfq', rfqId] })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Record Supplier Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <p className="text-sm text-gray-500">{requisition.supplier?.name}</p>
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
            <label className="label">Method</label>
            <select className="input" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              {['EFT', 'CREDIT_CARD', 'CASH', 'OTHER'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reference *</label>
            <input className="input" value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="Bank ref / EFT number" />
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectAdminDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: rfq, isLoading } = useRfq(id)
  const updateStatus = useUpdateRfqStatus()
  const submitReq = useSubmitRequisition()
  const { user } = useAuthStore()
  const canRecordPayment = user?.role === 'FINANCE' || user?.role === 'ADMIN'

  const [showAward, setShowAward] = useState(false)
  const [showProForma, setShowProForma] = useState(false)
  const [showMarkPF, setShowMarkPF] = useState<any | null>(null)
  const [showRequisition, setShowRequisition] = useState(false)
  const [showPayment, setShowPayment] = useState<any | null>(null)

  if (isLoading) return <div className="animate-pulse text-gray-400 p-4">Loading...</div>
  if (!rfq) return <div className="text-red-500 p-4">Not found</div>

  const allowedTransitions = PROJ_TRANSITIONS[rfq.status] ?? []
  const award = rfq.supplierAwards?.[0]
  const proFormas = rfq.proFormaInvoices ?? []
  const requisitions = rfq.requisitions ?? []
  const latestReq = requisitions[0]

  const canAward = !award && ['SUPPLIER_SELECTION_PENDING', 'SUPPLIER_SELECTED'].includes(rfq.status)
  const canRequestPF = award && rfq.status === 'SUPPLIER_SELECTED' && proFormas.length === 0
  const canMarkPFReceived = proFormas.some((pf: any) => pf.status === 'REQUESTED')
  const canCreateReq = proFormas.some((pf: any) => pf.status === 'RECEIVED') && requisitions.length === 0
  const canSubmitReq = latestReq?.status === 'DRAFT'
  const canPay = canRecordPayment && latestReq?.status === 'APPROVED'

  return (
    <div className="space-y-6 max-w-5xl">
      {showAward && <AwardSupplierModal rfq={rfq} onClose={() => setShowAward(false)} />}
      {showProForma && <RequestProFormaModal rfq={rfq} onClose={() => setShowProForma(false)} />}
      {showMarkPF && <MarkPFReceivedModal pf={showMarkPF} onClose={() => setShowMarkPF(null)} />}
      {showRequisition && <CreateRequisitionModal rfq={rfq} onClose={() => setShowRequisition(false)} />}
      {showPayment && <RecordPaymentModal requisition={showPayment} rfqId={rfq.id} onClose={() => setShowPayment(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/project-admin" className="text-xs text-gray-400 hover:text-brand">← Project Admin</Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="page-title font-mono">{rfq.referenceNumber}</h1>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              rfq.type === 'RFP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>{rfq.type ?? 'RFQ'}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{rfq.client?.name} {rfq.description ? `· ${rfq.description}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge status={rfq.status} />
          {allowedTransitions.map(s => (
            <button
              key={s}
              onClick={() => updateStatus.mutate({ id: rfq.id, status: s })}
              disabled={updateStatus.isPending}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              → {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500 mb-1">Client</p>
          <p className="font-semibold text-gray-900">{rfq.client?.name}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">PO Amount</p>
          <p className="font-semibold text-gray-900">
            {rfq.purchaseOrders?.[0]
              ? `R ${Number(rfq.purchaseOrders[0].poAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
              : '—'}
          </p>
          <p className="text-xs text-gray-400">{rfq.purchaseOrders?.[0]?.poNumber ?? ''}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">Account Manager</p>
          <p className="font-semibold text-gray-900">
            {rfq.accountManager ? `${rfq.accountManager.firstName} ${rfq.accountManager.lastName}` : '—'}
          </p>
        </Card>
      </div>

      {/* Section A: Supplier Award */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Supplier Award</h2>
          {canAward && (
            <button onClick={() => setShowAward(true)} className="btn-primary text-xs py-1.5 px-3">Select Supplier</button>
          )}
        </div>
        {!award ? (
          <p className="text-sm text-gray-400">No supplier awarded yet</p>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900">{award.supplier?.name}</p>
              <p className="text-sm text-gray-500">
                Quote total: R {Number(award.supplierQuote?.totalCost ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} ·
                {award.supplierQuote?.lines?.length ?? 0} lines
              </p>
              {award.rationale && <p className="text-xs text-gray-400 mt-1 italic">"{award.rationale}"</p>}
            </div>
            <p className="text-xs text-gray-400">{new Date(award.awardedAt).toLocaleDateString('en-ZA')}</p>
          </div>
        )}
      </Card>

      {/* Section B: Pro Forma */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Pro Forma Invoice</h2>
          <div className="flex gap-2">
            {canRequestPF && (
              <button onClick={() => setShowProForma(true)} className="btn-secondary text-xs py-1.5 px-3">Request Pro Forma</button>
            )}
          </div>
        </div>
        {proFormas.length === 0 ? (
          <p className="text-sm text-gray-400">No pro formas yet</p>
        ) : proFormas.map((pf: any) => (
          <div key={pf.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-semibold text-gray-900">{pf.supplier?.name}</p>
              <p className="text-xs text-gray-400">
                {pf.amount ? `R ${Number(pf.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} · ` : ''}
                Requested {new Date(pf.requestedAt).toLocaleDateString('en-ZA')}
                {pf.receivedAt ? ` · Received ${new Date(pf.receivedAt).toLocaleDateString('en-ZA')}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge status={pf.status} />
              {pf.status === 'REQUESTED' && (
                <button onClick={() => setShowMarkPF(pf)} className="btn-secondary text-xs py-1 px-2">Mark Received</button>
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* Section C: Requisitions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Requisitions</h2>
          {canCreateReq && (
            <button onClick={() => setShowRequisition(true)} className="btn-primary text-xs py-1.5 px-3">Create Requisition</button>
          )}
        </div>
        {requisitions.length === 0 ? (
          <p className="text-sm text-gray-400">No requisitions yet</p>
        ) : requisitions.map((req: any) => (
          <div key={req.id} className="border border-gray-100 rounded-xl p-4 mb-3 last:mb-0 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{req.supplier?.name}</p>
                <p className="text-sm text-gray-600">
                  R {Number(req.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  {req.description ? ` · ${req.description}` : ''}
                </p>
                <p className="text-xs text-gray-400">
                  Requested by {req.requestedBy ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : '—'} ·
                  {new Date(req.createdAt).toLocaleDateString('en-ZA')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={req.status} />
                {req.status === 'DRAFT' && (
                  <button onClick={() => submitReq.mutate(req.id)} disabled={submitReq.isPending} className="btn-secondary text-xs py-1 px-2">
                    Submit
                  </button>
                )}
                {canPay && req.status === 'APPROVED' && (
                  <button onClick={() => setShowPayment(req)} className="btn-primary text-xs py-1 px-2">Record Payment</button>
                )}
              </div>
            </div>

            {/* Approval history */}
            {req.approvals?.length > 0 && (
              <div className="border-t border-gray-50 pt-2 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase">Approvals</p>
                {req.approvals.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Badge status={a.decision} />
                    <span className="text-gray-500">
                      {a.approver ? `${a.approver.firstName} ${a.approver.lastName}` : ''}
                      {a.decidedAt ? ` · ${new Date(a.decidedAt).toLocaleDateString('en-ZA')}` : ''}
                      {a.comments ? ` · "${a.comments}"` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Payments sub-table */}
            {req.supplierPayments?.length > 0 && (
              <div className="border-t border-gray-50 pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Payments</p>
                {req.supplierPayments.map((pmt: any) => (
                  <div key={pmt.id} className="flex items-center justify-between text-xs text-gray-600 py-1">
                    <span className="font-mono">{pmt.reference ?? '—'}</span>
                    <span>{pmt.paymentMethod.replace('_', ' ')}</span>
                    <span>{new Date(pmt.paymentDate).toLocaleDateString('en-ZA')}</span>
                    <span className="font-semibold text-gray-900">R {Number(pmt.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Supplier quotes reference */}
      {rfq.supplierQuotes?.length > 0 && (
        <Card>
          <h2 className="section-title mb-4">Supplier Quotes Reference</h2>
          {rfq.supplierQuotes.map((sq: any) => (
            <div key={sq.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{sq.supplier?.name}</p>
                <p className="text-xs text-gray-400">{sq.lines?.length ?? 0} lines · Lead time: {sq.leadTimeDays ?? '—'} days</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">R {Number(sq.totalCost).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                <Badge status={sq.status} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
