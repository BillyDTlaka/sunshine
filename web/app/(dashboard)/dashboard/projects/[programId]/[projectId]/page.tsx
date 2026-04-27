'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import {
  useProject, useUpdateProjectStatus, useCreateTask, useTasks, useUpdateTask,
  useAddLineItem, useUpdateLineItem, useDeleteLineItem, useSendToSuppliers,
  useSuppliers,
} from '@/lib/hooks'
import { STATUS_LABELS, PROJECT_STATUS_ORDER } from '@/lib/theme'

// ─── Workflow stepper config ──────────────────────────────────────────────────

const WORKFLOW_STEPS: { status: string; label: string; description: string }[] = [
  { status: 'NEW_REQUEST',   label: 'Quote Captured',      description: 'Client RFQ received and captured' },
  { status: 'ESTIMATING',    label: 'Sent to Suppliers',   description: 'Awaiting supplier pricing' },
  { status: 'QUOTED',        label: 'Quote Prepared',      description: 'Pricing received, quote built' },
  { status: 'SUBMITTED',     label: 'Quote Submitted',     description: 'Quote sent to client' },
  { status: 'WON',           label: 'Awarded',             description: 'LCK won the bid' },
  { status: 'EXECUTING',     label: 'Executing',           description: 'Procurement & delivery underway' },
  { status: 'COMPLETED',     label: 'Complete',            description: 'Work completed' },
]

const STATUS_STEP_INDEX: Record<string, number> = {
  NEW_REQUEST:   0,
  ESTIMATING:    1,
  QUOTED:        2,
  SUBMITTED:     3,
  WON:           4,
  EXECUTING:     5,
  WAITING_CLIENT: 5,
  COMPLETED:     6,
  CLOSED:        6,
  LOST:          -1,
}

function WorkflowStepper({ status }: { status: string }) {
  if (status === 'LOST') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="text-red-500 font-semibold">✕ Lost</span>
        <span>This quote was not awarded.</span>
      </div>
    )
  }

  const currentIdx = STATUS_STEP_INDEX[status] ?? 0

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-start gap-0 min-w-max">
        {WORKFLOW_STEPS.map((step, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          const upcoming = i > currentIdx

          return (
            <div key={step.status} className="flex items-start">
              {/* Step */}
              <div className="flex flex-col items-center w-28">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                  done    && 'bg-brand border-brand text-white',
                  active  && 'bg-white border-brand text-brand',
                  upcoming && 'bg-white border-gray-200 text-gray-300',
                )}>
                  {done ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <p className={clsx('text-xs font-semibold mt-1.5 text-center leading-tight', done && 'text-brand', active && 'text-brand', upcoming && 'text-gray-300')}>
                  {step.label}
                </p>
                {active && <p className="text-xs text-gray-400 text-center mt-0.5 leading-tight">{step.description}</p>}
              </div>

              {/* Connector */}
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className={clsx('h-0.5 w-8 mt-4 mx-0.5 flex-shrink-0 transition-all', i < currentIdx ? 'bg-brand' : 'bg-gray-100')} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Send to Suppliers modal ──────────────────────────────────────────────────

function SendToSuppliersModal({ projectId, onClose, onSuccess }: { projectId: string; onClose: () => void; onSuccess: (result: any) => void }) {
  const { data: suppliersData } = useSuppliers({ limit: 200 })
  const suppliers: any[] = (suppliersData as any)?.data ?? (Array.isArray(suppliersData) ? suppliersData : [])

  const { mutateAsync: sendToSuppliers, isPending } = useSendToSuppliers(projectId)
  const [selected, setSelected] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (selected.length === 0) { setError('Select at least one supplier'); return }
    try {
      const result = await sendToSuppliers({
        supplierIds: selected,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        notes: notes || undefined,
      })
      onSuccess(result)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to send to suppliers')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Request Supplier Quotes</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select suppliers to email the line items to</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
          {/* Supplier list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
            {suppliers.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No suppliers found — add suppliers in Master Data first.</p>
            )}
            {suppliers.map((s: any) => (
              <label key={s.id} className={clsx(
                'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors',
                selected.includes(s.id) ? 'border-brand bg-brand/5' : 'border-gray-100 hover:border-gray-200',
              )}>
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={() => toggle(s.id)}
                  className="accent-brand w-4 h-4 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.contactEmail ?? <span className="text-amber-500 italic">No email configured</span>}</p>
                </div>
                {!s.contactEmail && (
                  <span className="text-xs text-amber-500 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">No email</span>
                )}
              </label>
            ))}
          </div>

          {/* Deadline + notes */}
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Quote deadline (optional)</label>
                <input type="date" className="input text-sm w-full" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Selected</label>
                <div className="text-sm font-semibold text-gray-900 pt-2">{selected.length} supplier{selected.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Additional notes (optional)</label>
              <textarea className="input text-sm w-full resize-none" rows={2} placeholder="Any specific instructions for suppliers..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <div className="px-6 pb-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm py-2">Cancel</button>
            <button type="submit" disabled={isPending || selected.length === 0} className="btn-primary text-sm py-2">
              {isPending ? 'Sending...' : `Send to ${selected.length || ''} supplier${selected.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-gray-400', MEDIUM: 'text-blue-600', HIGH: 'text-amber-600', URGENT: 'text-red-600',
}

const TASK_STATUS_COLS: Record<string, { label: string; color: string }> = {
  TODO:        { label: 'To Do',       color: 'bg-gray-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50' },
  BLOCKED:     { label: 'Blocked',     color: 'bg-red-50' },
  DONE:        { label: 'Done',        color: 'bg-green-50' },
}

function fmt(val: any) {
  if (val == null || val === '') return '—'
  return `R ${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function CommercialRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={clsx('flex justify-between items-center py-2 border-b border-gray-50 last:border-0', highlight && 'font-semibold')}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={clsx('text-sm', highlight ? 'text-gray-900' : 'text-gray-700')}>{value}</span>
    </div>
  )
}

function TaskRow({ task, onStatusChange }: { task: any; onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <select
        className={clsx('text-xs font-semibold rounded-full px-2 py-0.5 border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand', TASK_STATUS_COLS[task.status]?.color ?? 'bg-gray-100')}
        value={task.status}
        onChange={e => onStatusChange(task.id, e.target.value)}
      >
        {Object.entries(TASK_STATUS_COLS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        <option value="CANCELLED">Cancelled</option>
      </select>
      <span className={clsx('text-xs font-semibold flex-shrink-0', PRIORITY_COLOR[task.priority] ?? 'text-gray-400')}>{task.priority}</span>
      <span className={clsx('text-sm flex-1', task.status === 'DONE' && 'line-through text-gray-400')}>{task.title}</span>
      <span className="text-xs text-gray-400 flex-shrink-0">
        {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
      </span>
      <span className={clsx('text-xs flex-shrink-0', task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-600 font-semibold' : 'text-gray-400')}>
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}
      </span>
    </div>
  )
}

function AddTaskForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const { mutateAsync: createTask, isPending } = useCreateTask()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTask({ projectId, title: title.trim(), priority, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined })
    setTitle(''); setDueDate(''); onDone()
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-2">
      <input className="input flex-1 text-sm py-1.5" placeholder="New task title..." value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      <select className="input w-28 text-sm py-1.5" value={priority} onChange={e => setPriority(e.target.value)}>
        <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
      </select>
      <input className="input w-36 text-sm py-1.5" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      <button type="submit" disabled={isPending || !title.trim()} className="btn-primary py-1.5 text-xs">Add</button>
      <button type="button" className="text-gray-400 hover:text-gray-600 text-sm px-2" onClick={onDone}>✕</button>
    </form>
  )
}

function LineItemsTab({ project }: { project: any }) {
  const projectId = project.id
  const { mutateAsync: addItem, isPending: adding } = useAddLineItem(projectId)
  const { mutateAsync: updateItem } = useUpdateLineItem(projectId)
  const { mutateAsync: deleteItem } = useDeleteLineItem(projectId)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ description: string; qty: string; unit: string; notes: string }>({ description: '', qty: '1', unit: 'Each', notes: '' })
  const [newForm, setNewForm] = useState({ description: '', qty: '1', unit: 'Each', notes: '' })
  const [addingNew, setAddingNew] = useState(false)

  const lineItems: any[] = project.lineItems ?? []

  const startEdit = (li: any) => {
    setEditId(li.id)
    setEditForm({ description: li.description, qty: String(li.qty), unit: li.unit, notes: li.notes ?? '' })
  }

  const saveEdit = async () => {
    if (!editId) return
    await updateItem({ lineId: editId, data: { description: editForm.description, qty: parseFloat(editForm.qty), unit: editForm.unit, notes: editForm.notes || undefined } })
    setEditId(null)
  }

  const saveNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForm.description.trim()) return
    await addItem({ description: newForm.description.trim(), qty: parseFloat(newForm.qty) || 1, unit: newForm.unit, notes: newForm.notes || undefined })
    setNewForm({ description: '', qty: '1', unit: 'Each', notes: '' })
    setAddingNew(false)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Line Items</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {project.labourRequired && (
            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              Labour required
            </span>
          )}
          <span>{lineItems.length} item{lineItems.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="pb-2 pr-3 w-8">#</th>
              <th className="pb-2 pr-3">Description</th>
              <th className="pb-2 pr-3 w-20">Qty</th>
              <th className="pb-2 pr-3 w-24">Unit</th>
              <th className="pb-2 pr-3">Notes</th>
              <th className="pb-2 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lineItems.map((li: any, i: number) => (
              <tr key={li.id}>
                <td className="py-2 pr-3 text-gray-400 text-xs align-middle">{i + 1}</td>
                {editId === li.id ? (
                  <>
                    <td className="py-1.5 pr-3">
                      <input className="input text-sm" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    </td>
                    <td className="py-1.5 pr-3">
                      <input className="input text-sm" type="number" min="0.01" step="0.01" value={editForm.qty} onChange={e => setEditForm(f => ({ ...f, qty: e.target.value }))} />
                    </td>
                    <td className="py-1.5 pr-3">
                      <input className="input text-sm" value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} />
                    </td>
                    <td className="py-1.5 pr-3">
                      <input className="input text-sm" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                    </td>
                    <td className="py-1.5">
                      <div className="flex gap-1">
                        <button onClick={saveEdit} className="text-xs text-emerald-700 font-semibold hover:underline">Save</button>
                        <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-3 font-medium text-gray-900">{li.description}</td>
                    <td className="py-2 pr-3 text-gray-700">{Number(li.qty).toLocaleString()}</td>
                    <td className="py-2 pr-3 text-gray-500">{li.unit}</td>
                    <td className="py-2 pr-3 text-gray-400 text-xs">{li.notes ?? '—'}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(li)} className="text-xs text-brand hover:underline">Edit</button>
                        <button onClick={() => deleteItem(li.id)} className="text-xs text-red-400 hover:underline">Del</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Add new row inline */}
            {addingNew && (
              <tr>
                <td className="py-1.5 pr-3 text-gray-300 text-xs align-middle">+</td>
                <td className="py-1.5 pr-3"><input className="input text-sm" placeholder="Description" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} autoFocus /></td>
                <td className="py-1.5 pr-3"><input className="input text-sm" type="number" min="0.01" step="0.01" value={newForm.qty} onChange={e => setNewForm(f => ({ ...f, qty: e.target.value }))} /></td>
                <td className="py-1.5 pr-3"><input className="input text-sm" value={newForm.unit} onChange={e => setNewForm(f => ({ ...f, unit: e.target.value }))} /></td>
                <td className="py-1.5 pr-3"><input className="input text-sm" placeholder="Notes" value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} /></td>
                <td className="py-1.5">
                  <div className="flex gap-1">
                    <button onClick={saveNew as any} disabled={adding} className="text-xs text-emerald-700 font-semibold hover:underline">Add</button>
                    <button onClick={() => setAddingNew(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!addingNew && (
        <button onClick={() => setAddingNew(true)} className="mt-3 flex items-center gap-1.5 text-xs text-brand hover:text-brand/80 font-medium transition-colors">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add line item
        </button>
      )}

      {project.labourRequired && project.labourScope && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Labour / Installation Scope</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.labourScope}</p>
        </div>
      )}
    </Card>
  )
}

// ─── Supplier Bids tab ─────────────────────────────────────────────────────────

function SupplierBidsTab({ project, onSent }: { project: any; onSent: () => void }) {
  const [showModal, setShowModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const lineItemCount = project.lineItems?.length ?? 0

  const handleSuccess = (result: any) => {
    setShowModal(false)
    const msg = result.emailsSent > 0
      ? `Sent to ${result.emailsSent} supplier${result.emailsSent !== 1 ? 's' : ''} (ref: ${result.referenceNumber})${result.noEmail?.length ? ` — ${result.noEmail.join(', ')} had no email.` : ''}`
      : `Created ${result.referenceNumber} — no emails sent (suppliers have no email configured)`
    setSuccessMsg(msg)
    onSent()
  }

  return (
    <>
      {showModal && (
        <SendToSuppliersModal
          projectId={project.id}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Supplier Bids</h3>
          <button
            className="btn-primary text-xs py-1.5"
            disabled={lineItemCount === 0}
            title={lineItemCount === 0 ? 'Add line items before sending to suppliers' : undefined}
            onClick={() => { setSuccessMsg(null); setShowModal(true) }}
          >
            + Request Quotes
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">
            {successMsg}
          </div>
        )}

        {lineItemCount === 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
            Add line items to the quote before sending to suppliers.
          </div>
        )}

        {project.rfqs?.length === 0 ? (
          <div className="text-center py-10">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth={1.2} className="mx-auto mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 text-sm">No supplier requests yet</p>
            <p className="text-xs text-gray-300 mt-1">Click &ldquo;Request Quotes&rdquo; to email suppliers</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="py-2 pr-4">Reference</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Suppliers</th>
                <th className="py-2 pr-4">Deadline</th>
                <th className="py-2 pr-4">Sent</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {project.rfqs?.map((rfq: any) => (
                <tr key={rfq.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-mono font-semibold text-brand text-xs">{rfq.referenceNumber}</td>
                  <td className="py-2 pr-4"><Badge status={rfq.status} /></td>
                  <td className="py-2 pr-4 text-gray-500">{rfq._count?.supplierQuotes ?? 0}</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">{rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('en-ZA') : '—'}</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">{new Date(rfq.createdAt).toLocaleDateString('en-ZA')}</td>
                  <td className="py-2">
                    <Link href={`/dashboard/rfqs/${rfq.id}`} className="text-brand hover:underline text-xs font-semibold">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'line-items' | 'suppliers' | 'tasks' | 'commercial'

export default function ProjectDetailPage() {
  const { programId, projectId } = useParams<{ programId: string; projectId: string }>()
  const [tab, setTab] = useState<Tab>('overview')
  const [addingTask, setAddingTask] = useState(false)
  const [statusChange, setStatusChange] = useState(false)

  const { data: project, isLoading, refetch } = useProject(projectId)
  const { data: tasksData, refetch: refetchTasks } = useTasks({ projectId })
  const tasks = tasksData ?? []

  const { mutateAsync: updateStatus, isPending: updatingStatus } = useUpdateProjectStatus()
  const { mutateAsync: updateTask } = useUpdateTask()

  if (isLoading) return <div className="animate-pulse text-gray-400 py-12 text-center">Loading project...</div>
  if (!project) return <div className="text-red-500 py-12 text-center">Project not found</div>

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ id: projectId, status: newStatus })
      setStatusChange(false); refetch()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Invalid status transition')
    }
  }

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    await updateTask({ id: taskId, data: { status } }); refetchTasks()
  }

  const lineItemCount = project.lineItems?.length ?? 0
  const supplierBidCount = project.rfqs?.length ?? 0
  const doneTasks = (tasks as any[]).filter((t: any) => t.status === 'DONE').length
  const totalTasks = (tasks as any[]).length

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',    label: 'Overview' },
    { key: 'line-items',  label: `Line Items (${lineItemCount})` },
    { key: 'suppliers',   label: `Supplier Bids (${supplierBidCount})` },
    { key: 'tasks',       label: `Tasks (${totalTasks})` },
    { key: 'commercial',  label: 'Commercial' },
  ]

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link href="/dashboard/projects" className="hover:text-brand">Projects</Link>
        <span>/</span>
        <Link href={`/dashboard/projects/${programId}`} className="hover:text-brand">
          {project.program?.name ?? 'Program'}
        </Link>
        <span>/</span>
        <span className="font-mono text-xs text-gray-400">{project.projectId}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{project.title}</span>
      </div>

      {/* Header */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="font-mono text-sm font-bold text-brand">{project.projectId}</span>
              <Badge status={project.priority} label={project.priority} />
              {project.labourRequired && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Labour</span>
              )}
              {project.deadline && new Date(project.deadline) < new Date() && !['COMPLETED', 'CLOSED', 'LOST'].includes(project.status) && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">OVERDUE</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{project.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span><strong className="text-gray-700">Client:</strong> {project.client?.name}</span>
              {project.campus && <span><strong className="text-gray-700">Site:</strong> {project.campus}</span>}
              {project.department && <span><strong className="text-gray-700">Dept:</strong> {project.department}</span>}
              {project.requestReference && <span><strong className="text-gray-700">Ref:</strong> {project.requestReference}</span>}
              {project.deadline && <span><strong className="text-gray-700">Deadline:</strong> {new Date(project.deadline).toLocaleDateString('en-ZA')}</span>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {statusChange ? (
              <div className="flex items-center gap-2">
                <select className="input text-sm w-44" defaultValue={project.status} onChange={e => handleStatusChange(e.target.value)} disabled={updatingStatus}>
                  {PROJECT_STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
                </select>
                <button onClick={() => setStatusChange(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge status={project.status} />
                <button className="text-xs text-gray-400 hover:text-brand border border-gray-200 rounded px-2 py-1 transition-colors" onClick={() => setStatusChange(true)}>Change</button>
              </div>
            )}
          </div>
        </div>

        {/* Workflow stepper */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <WorkflowStepper status={project.status} />
        </div>

        {totalTasks > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Task Progress</span>
              <span>{doneTasks}/{totalTasks} done</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }} />
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-0.5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} className={clsx('px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap', tab === t.key ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-900')} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="section-title mb-3">Quote Info</h3>
            {[
              { label: 'Status',      value: <Badge status={project.status} /> },
              { label: 'Priority',    value: <span className={clsx('text-sm font-semibold', PRIORITY_COLOR[project.priority] ?? '')}>{project.priority}</span> },
              { label: 'Client Ref',  value: project.requestReference ?? '—' },
              { label: 'Campus',      value: project.campus ?? '—' },
              { label: 'Department',  value: project.department ?? '—' },
              { label: 'Deadline',    value: project.deadline ? new Date(project.deadline).toLocaleDateString('en-ZA') : '—' },
              { label: 'Labour',      value: project.labourRequired ? 'Required' : 'Materials only' },
              { label: 'Line Items',  value: `${lineItemCount} item${lineItemCount !== 1 ? 's' : ''}` },
              { label: 'Created',     value: new Date(project.createdAt).toLocaleDateString('en-ZA') },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 py-1.5">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900">{value}</span>
              </div>
            ))}
          </Card>

          <div className="space-y-4">
            <Card>
              <h3 className="section-title mb-3">Commercial Summary</h3>
              <CommercialRow label="Est. Revenue" value={fmt(project.estimatedRevenue)} />
              <CommercialRow label="Est. Materials" value={fmt(project.estimatedMaterial)} />
              <CommercialRow label="Est. Labour" value={fmt(project.estimatedLabour)} />
              <CommercialRow label="Markup %" value={project.markupPct ? `${project.markupPct}%` : '—'} />
              <CommercialRow label="Planned Gross Margin" value={fmt(project.plannedGrossMargin)} highlight />
            </Card>

            {(project.scopeOfWork || project.notes) && (
              <Card>
                <h3 className="section-title mb-3">Notes</h3>
                {project.scopeOfWork && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">Scope of Work</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.scopeOfWork}</p>
                  </div>
                )}
                {project.notes && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.notes}</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Line Items */}
      {tab === 'line-items' && <LineItemsTab project={project} />}

      {/* Supplier Bids */}
      {tab === 'suppliers' && <SupplierBidsTab project={project} onSent={refetch} />}

      {/* Tasks */}
      {tab === 'tasks' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Tasks</h3>
            {!addingTask && <button className="btn-primary text-xs py-1.5" onClick={() => setAddingTask(true)}>+ Add Task</button>}
          </div>
          {(tasks as any[]).length === 0 && !addingTask ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">No tasks yet</p>
              <button className="btn-primary text-xs py-1.5" onClick={() => setAddingTask(true)}>+ Add first task</button>
            </div>
          ) : (
            <>
              {(tasks as any[]).map((t: any) => <TaskRow key={t.id} task={t} onStatusChange={handleTaskStatusChange} />)}
              {addingTask && <AddTaskForm projectId={projectId} onDone={() => { setAddingTask(false); refetchTasks() }} />}
            </>
          )}
        </Card>
      )}

      {/* Commercial */}
      {tab === 'commercial' && (
        <Card>
          <h3 className="section-title mb-4">Commercial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Estimates</h4>
              <CommercialRow label="Estimated Revenue" value={fmt(project.estimatedRevenue)} />
              <CommercialRow label="Material Cost" value={fmt(project.estimatedMaterial)} />
              <CommercialRow label="Labour Cost" value={fmt(project.estimatedLabour)} />
              <CommercialRow label="Markup %" value={project.markupPct ? `${project.markupPct}%` : '—'} />
              <CommercialRow label="Planned Gross Margin" value={fmt(project.plannedGrossMargin)} highlight />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actuals</h4>
              <CommercialRow label="Actual Cost" value={fmt(project.actualCost)} />
              <CommercialRow label="Actual Margin" value={fmt(project.actualMargin)} highlight />
              {project.estimatedRevenue && project.actualCost && (
                <div className="mt-4 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Variance (Est. Revenue − Actual Cost)</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{fmt(Number(project.estimatedRevenue) - Number(project.actualCost))}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
