'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useRfq, useClientQuotes, useSupplierQuotes, useUpdateRfqStatus } from '@/lib/hooks'
import { clientQuotesApi, supplierQuotesApi, purchaseOrdersApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

const LINE_CATEGORIES = ['HARDWARE', 'SOFTWARE', 'LICENCE', 'LABOUR_FIXED', 'LABOUR_TM', 'OTHER'] as const

// ─── New Supplier Quote Modal ─────────────────────────────────────────────────
function NewSupplierQuoteModal({ rfq, onClose }: { rfq: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [supplierId, setSupplierId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [leadTimeDays, setLeadTimeDays] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [lines, setLines] = useState(
    rfq.lineItems?.map((li: any) => ({
      rfqLineItemId: li.id,
      description: li.description,
      quantity: Number(li.quantity),
      unitCost: 0,
      totalCost: 0,
      notes: '',
    })) ?? []
  )
  const [saving, setSaving] = useState(false)

  const updateLine = (i: number, k: string, v: any) => {
    setLines((prev: any[]) => prev.map((l, idx) => {
      if (idx !== i) return l
      const updated = { ...l, [k]: v }
      if (k === 'unitCost' || k === 'quantity') {
        updated.totalCost = (k === 'unitCost' ? Number(v) : l.unitCost) * (k === 'quantity' ? Number(v) : l.quantity)
      }
      return updated
    }))
  }

  const handleSave = async () => {
    if (!supplierId) { alert('Select a supplier'); return }
    setSaving(true)
    try {
      await supplierQuotesApi.create(rfq.id, {
        supplierId,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : undefined,
        paymentTerms: paymentTerms || undefined,
        lines,
      })
      qc.invalidateQueries({ queryKey: ['rfq', rfq.id] })
      onClose()
    } catch {
      alert('Failed to save supplier quote')
    } finally {
      setSaving(false)
    }
  }

  const suppliers = [] // Would need a suppliers list - using rfq context

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 my-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Add Supplier Quote</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Supplier ID</label>
            <input className="input" placeholder="Paste supplier ID..." value={supplierId} onChange={e => setSupplierId(e.target.value)} />
          </div>
          <div>
            <label className="label">Valid Until</label>
            <input type="date" className="input" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
          </div>
          <div>
            <label className="label">Lead Time (days)</label>
            <input type="number" className="input" value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Terms</label>
            <input className="input" placeholder="e.g. Net 30" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Line Items</h3>
          <div className="space-y-2">
            {lines.map((line: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                <div className="col-span-5 text-xs text-gray-700 font-medium truncate">{line.description}</div>
                <div className="col-span-2">
                  <input
                    type="number"
                    className="input text-xs py-1"
                    value={line.quantity}
                    onChange={e => updateLine(i, 'quantity', e.target.value)}
                    min={0}
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    className="input text-xs py-1"
                    placeholder="Unit cost"
                    value={line.unitCost || ''}
                    onChange={e => updateLine(i, 'unitCost', e.target.value)}
                    min={0}
                  />
                </div>
                <div className="col-span-2 text-xs text-right text-gray-600 font-semibold">
                  R {Number(line.totalCost).toLocaleString('en-ZA')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Quote'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Build Quote Modal ────────────────────────────────────────────────────────
function BuildQuoteModal({ rfq, onClose }: { rfq: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [defaultMarkupPct, setDefaultMarkupPct] = useState(20)
  const [validUntil, setValidUntil] = useState('')
  const [terms, setTerms] = useState('')
  const [lines, setLines] = useState(
    rfq.lineItems?.map((li: any, idx: number) => ({
      lineNumber: idx + 1,
      rfqLineItemId: li.id,
      description: li.description,
      category: li.category,
      quantity: Number(li.quantity),
      unit: li.unit ?? 'Each',
      unitCost: 0,
      markupPct: 20,
      labourType: li.category.startsWith('LABOUR') ? (li.category === 'LABOUR_FIXED' ? 'FIXED' : 'TIME_AND_MATERIAL') : undefined,
      labourRate: undefined,
      labourHoursEstimated: undefined,
      labourFixedFee: undefined,
      notes: '',
    })) ?? []
  )
  const [saving, setSaving] = useState(false)

  const updateLine = (i: number, k: string, v: any) => {
    setLines((prev: any[]) => prev.map((l, idx) => idx !== i ? l : { ...l, [k]: v }))
  }

  const applyMarkup = () => {
    setLines((prev: any[]) => prev.map(l => ({ ...l, markupPct: defaultMarkupPct })))
  }

  const totalCost = lines.reduce((s: number, l: any) => s + (l.unitCost * l.quantity), 0)
  const totalSell = lines.reduce((s: number, l: any) => {
    if (l.category === 'LABOUR_FIXED' || l.category === 'LABOUR_TM') {
      return s + (l.labourFixedFee ?? (l.labourRate ?? 0) * (l.labourHoursEstimated ?? 0))
    }
    return s + l.unitCost * (1 + l.markupPct / 100) * l.quantity
  }, 0)
  const gm = totalSell > 0 ? ((totalSell - totalCost) / totalSell * 100) : 0

  const handleSave = async () => {
    setSaving(true)
    try {
      await clientQuotesApi.create(rfq.id, {
        defaultMarkupPct,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        terms: terms || undefined,
        lines,
      })
      qc.invalidateQueries({ queryKey: ['rfq', rfq.id] })
      qc.invalidateQueries({ queryKey: ['client-quotes'] })
      onClose()
    } catch {
      alert('Failed to build quote')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 space-y-4 my-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Build Client Quote</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Default Markup %</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="input flex-1"
                value={defaultMarkupPct}
                onChange={e => setDefaultMarkupPct(Number(e.target.value))}
                min={0}
              />
              <button onClick={applyMarkup} className="btn-secondary text-xs px-3">Apply All</button>
            </div>
          </div>
          <div>
            <label className="label">Valid Until</label>
            <input type="date" className="input" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Terms</label>
            <input className="input" placeholder="e.g. Net 30" value={terms} onChange={e => setTerms(e.target.value)} />
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex gap-6 bg-gray-50 rounded-xl px-4 py-3 text-sm">
          <div><span className="text-gray-500">Cost: </span><span className="font-semibold">R {totalCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
          <div><span className="text-gray-500">Sell: </span><span className="font-semibold text-brand">R {totalSell.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
          <div><span className="text-gray-500">GM: </span><span className={`font-semibold ${gm >= 20 ? 'text-green-600' : gm >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>{gm.toFixed(1)}%</span></div>
        </div>

        {/* Lines */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 uppercase border-b border-gray-100">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2 w-48">Description</th>
                <th className="pb-2 pr-2">Category</th>
                <th className="pb-2 pr-2">Qty</th>
                <th className="pb-2 pr-2">Unit Cost</th>
                <th className="pb-2 pr-2">Markup %</th>
                <th className="pb-2 pr-2">Unit Sell</th>
                <th className="pb-2">Total Sell</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line: any, i: number) => {
                const isLabour = line.category === 'LABOUR_FIXED' || line.category === 'LABOUR_TM'
                const unitSell = isLabour
                  ? (line.labourFixedFee ?? (line.labourRate ?? 0) * (line.labourHoursEstimated ?? 0))
                  : line.unitCost * (1 + line.markupPct / 100)
                const totalLineSell = isLabour ? unitSell : unitSell * line.quantity

                return (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5 pr-2 text-gray-400">{line.lineNumber}</td>
                    <td className="py-1.5 pr-2">
                      <input
                        className="input py-1 text-xs"
                        value={line.description}
                        onChange={e => updateLine(i, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        className="input py-1 text-xs w-28"
                        value={line.category}
                        onChange={e => updateLine(i, 'category', e.target.value)}
                      >
                        {LINE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <input type="number" className="input py-1 text-xs w-16" value={line.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} min={0} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input type="number" className="input py-1 text-xs w-24" value={line.unitCost || ''} placeholder="0.00" onChange={e => updateLine(i, 'unitCost', Number(e.target.value))} min={0} />
                    </td>
                    <td className="py-1.5 pr-2">
                      {!isLabour ? (
                        <input type="number" className="input py-1 text-xs w-16" value={line.markupPct} onChange={e => updateLine(i, 'markupPct', Number(e.target.value))} min={0} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-2 font-medium text-gray-700">
                      R {unitSell.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 font-semibold text-gray-900">
                      R {totalLineSell.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Quote'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PO Modal ─────────────────────────────────────────────────────────────────
function RecordPoModal({ rfq, onClose }: { rfq: any; onClose: () => void }) {
  const qc = useQueryClient()
  const acceptedQuote = rfq.clientQuotes?.find((q: any) => q.status === 'ACCEPTED' || q.status === 'SENT')
  const [form, setForm] = useState({
    clientQuoteId: acceptedQuote?.id ?? '',
    clientId: rfq.clientId,
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    poAmount: acceptedQuote ? Number(acceptedQuote.totalSell) : 0,
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.poNumber) { alert('PO Number is required'); return }
    setSaving(true)
    try {
      await purchaseOrdersApi.create(rfq.id, {
        ...form,
        poDate: new Date(form.poDate).toISOString(),
      })
      qc.invalidateQueries({ queryKey: ['rfq', rfq.id] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      onClose()
    } catch {
      alert('Failed to record PO')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Record Purchase Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Quote</label>
            <select className="input" value={form.clientQuoteId} onChange={e => set('clientQuoteId', e.target.value)}>
              <option value="">Select quote...</option>
              {rfq.clientQuotes?.map((q: any) => (
                <option key={q.id} value={q.id}>v{q.versionNumber} — R {Number(q.totalSell).toLocaleString('en-ZA')} ({q.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">PO Number *</label>
            <input className="input" placeholder="e.g. PO-2026-001" value={form.poNumber} onChange={e => set('poNumber', e.target.value)} />
          </div>
          <div>
            <label className="label">PO Date</label>
            <input type="date" className="input" value={form.poDate} onChange={e => set('poDate', e.target.value)} />
          </div>
          <div>
            <label className="label">PO Amount (ZAR)</label>
            <input type="number" className="input" value={form.poAmount} onChange={e => set('poAmount', Number(e.target.value))} min={0} />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Record PO'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SalesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: rfq, isLoading } = useRfq(id)
  const updateStatus = useUpdateRfqStatus()
  const [showSupplierQuote, setShowSupplierQuote] = useState(false)
  const [showBuildQuote, setShowBuildQuote] = useState(false)
  const [showPo, setShowPo] = useState(false)

  if (isLoading) return <div className="animate-pulse text-gray-400 p-4">Loading...</div>
  if (!rfq) return <div className="text-red-500 p-4">Not found</div>

  const canAddSupplierQuote = ['RFQ_OPEN', 'SUPPLIER_QUOTES_REQUESTED', 'SUPPLIER_QUOTES_RECEIVED'].includes(rfq.status)
  const canBuildQuote = ['SUPPLIER_QUOTES_RECEIVED', 'PRICING_IN_PROGRESS', 'INTERNAL_REVIEW_PENDING'].includes(rfq.status)
  const canRecordPo = ['CLIENT_ACCEPTED', 'SENT_TO_CLIENT'].includes(rfq.status) && rfq.clientQuotes?.length > 0

  const nextStatuses: Record<string, string[]> = {
    RFQ_DRAFT: ['RFQ_OPEN'],
    RFQ_OPEN: ['SUPPLIER_QUOTES_REQUESTED'],
    SUPPLIER_QUOTES_REQUESTED: ['SUPPLIER_QUOTES_RECEIVED'],
    SUPPLIER_QUOTES_RECEIVED: ['PRICING_IN_PROGRESS'],
    PRICING_IN_PROGRESS: ['INTERNAL_REVIEW_PENDING'],
    INTERNAL_REVIEW_PENDING: ['APPROVED_FOR_CLIENT'],
    APPROVED_FOR_CLIENT: ['SENT_TO_CLIENT'],
    SENT_TO_CLIENT: ['CLIENT_ACCEPTED', 'LOST'],
    CLIENT_ACCEPTED: ['PO_RECEIVED'],
  }

  const availableTransitions = nextStatuses[rfq.status] ?? []

  return (
    <div className="space-y-6 max-w-5xl">
      {showSupplierQuote && <NewSupplierQuoteModal rfq={rfq} onClose={() => setShowSupplierQuote(false)} />}
      {showBuildQuote && <BuildQuoteModal rfq={rfq} onClose={() => setShowBuildQuote(false)} />}
      {showPo && <RecordPoModal rfq={rfq} onClose={() => setShowPo(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/sales" className="text-xs text-gray-400 hover:text-brand">← Sales</Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="page-title font-mono">{rfq.referenceNumber}</h1>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              rfq.type === 'RFP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {rfq.type ?? 'RFQ'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{rfq.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={rfq.status} />
          {availableTransitions.map(s => (
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

      {/* Details */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500 mb-1">Client</p>
          <p className="font-semibold text-gray-900">{rfq.client?.name}</p>
          {rfq.contact && <p className="text-sm text-gray-500">{rfq.contact.firstName} {rfq.contact.lastName}</p>}
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
        <h2 className="section-title mb-4">Scope / Line Items</h2>
        {rfq.lineItems?.length === 0 ? (
          <p className="text-sm text-gray-400">No line items added</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Description</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4">Qty</th>
                <th className="pb-2">Unit</th>
              </tr>
            </thead>
            <tbody>
              {rfq.lineItems?.map((line: any) => (
                <tr key={line.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-400">{line.lineNumber}</td>
                  <td className="py-2 pr-4 font-medium text-gray-900">{line.description}</td>
                  <td className="py-2 pr-4"><Badge status={line.category} label={line.category.replace(/_/g, ' ')} /></td>
                  <td className="py-2 pr-4">{Number(line.quantity)}</td>
                  <td className="py-2 text-gray-500">{line.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Supplier Quotes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Supplier Quotes</h2>
          {canAddSupplierQuote && (
            <button onClick={() => setShowSupplierQuote(true)} className="btn-secondary text-xs py-1.5 px-3">+ Add Supplier Quote</button>
          )}
        </div>
        {rfq.supplierQuotes?.length === 0 ? (
          <p className="text-sm text-gray-400">No supplier quotes yet</p>
        ) : rfq.supplierQuotes?.map((sq: any) => (
          <div key={sq.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-semibold text-gray-900">{sq.supplier?.name}</p>
              <p className="text-xs text-gray-400">
                {sq.lines?.length} lines ·
                Lead time: {sq.leadTimeDays ?? '—'} days ·
                {sq.validUntil ? ` Valid until ${new Date(sq.validUntil).toLocaleDateString('en-ZA')}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">R {Number(sq.totalCost).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
              <Badge status={sq.status} />
            </div>
          </div>
        ))}
      </Card>

      {/* Client Quotes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Client Quotes</h2>
          {canBuildQuote && (
            <button onClick={() => setShowBuildQuote(true)} className="btn-primary text-xs py-1.5 px-3">+ Build Quote</button>
          )}
        </div>
        {rfq.clientQuotes?.length === 0 ? (
          <p className="text-sm text-gray-400">No quotes yet</p>
        ) : rfq.clientQuotes?.map((q: any) => (
          <div key={q.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <div>
              <span className="text-sm font-semibold text-gray-900">Version {q.versionNumber}</span>
              <span className="ml-3 text-sm text-gray-500">R {Number(q.totalSell).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
              <span className="ml-2 text-xs text-gray-400">GM {Number(q.grossMarginPct).toFixed(1)}%</span>
              {q.preparedBy && <span className="ml-2 text-xs text-gray-400">by {q.preparedBy.firstName} {q.preparedBy.lastName}</span>}
            </div>
            <Badge status={q.status} />
          </div>
        ))}
      </Card>

      {/* Purchase Orders */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Purchase Orders</h2>
          {canRecordPo && (
            <button onClick={() => setShowPo(true)} className="btn-primary text-xs py-1.5 px-3">+ Record PO</button>
          )}
        </div>
        {rfq.purchaseOrders?.length === 0 ? (
          <p className="text-sm text-gray-400">No purchase orders yet</p>
        ) : rfq.purchaseOrders?.map((po: any) => (
          <div key={po.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-semibold text-gray-900 font-mono">{po.poNumber}</p>
              <p className="text-xs text-gray-400">{new Date(po.poDate).toLocaleDateString('en-ZA')}</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">R {Number(po.poAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
          </div>
        ))}
      </Card>
    </div>
  )
}
