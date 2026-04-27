'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { useCreateProject, useProgram, useParseRfq, useMasterData } from '@/lib/hooks'

type Mode = 'manual' | 'upload'

interface LineItem {
  key: string
  description: string
  qty: string
  unit: string
  notes: string
  aiPopulated?: boolean
}

const DEFAULT_UNITS = ['Each', 'm', 'm²', 'm³', 'kg', 'Roll', 'Box', 'Set', 'Lot', 'Hour', 'Day']

let keyCounter = 0
const newKey = () => String(++keyCounter)

const emptyLine = (): LineItem => ({ key: newKey(), description: '', qty: '1', unit: 'Each', notes: '' })

const AI_HEADER_FIELDS = ['title', 'requestReference', 'campus', 'department', 'deadline', 'priority', 'scopeOfWork', 'notes']

export default function NewQuotePage() {
  const { programId } = useParams<{ programId: string }>()
  const router = useRouter()
  const { mutateAsync: createProject, isPending: isSaving } = useCreateProject()
  const { mutate: parseRfq, isPending: isParsing } = useParseRfq()
  const { data: program } = useProgram(programId)
  const { data: unitsData } = useMasterData('units', { limit: 200, status: 'ACTIVE' })
  const units: string[] = ((unitsData?.data ?? []) as any[]).map((u: any) => u.name)
  const unitOptions = units.length > 0 ? units : DEFAULT_UNITS

  const [mode, setMode] = useState<Mode>('manual')
  const [aiHeaderFields, setAiHeaderFields] = useState<Set<string>>(new Set())
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    requestReference: '',
    campus: '',
    department: '',
    priority: 'MEDIUM',
    deadline: '',
    scopeOfWork: '',
    notes: '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()])
  const [labourRequired, setLabourRequired] = useState(false)
  const [labourScope, setLabourScope] = useState('')
  const [error, setError] = useState('')
  const [parseError, setParseError] = useState('')

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setAiHeaderFields(s => { const n = new Set(s); n.delete(field); return n })
  }

  const setLine = (key: string, field: keyof LineItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setLineItems(ls => ls.map(l => l.key === key ? { ...l, [field]: e.target.value, aiPopulated: false } : l))
  }

  const addLine = () => setLineItems(ls => [...ls, emptyLine()])

  const removeLine = (key: string) => setLineItems(ls => ls.filter(l => l.key !== key))

  const handleFile = (file: File) => {
    setParseError('')
    parseRfq(file, {
      onSuccess: (parsed: any) => {
        const updates: any = {}
        const aiFields = new Set<string>()
        for (const f of AI_HEADER_FIELDS) {
          if (parsed[f] != null && parsed[f] !== '') {
            updates[f] = f === 'deadline' && parsed[f] ? parsed[f].substring(0, 10) : parsed[f]
            aiFields.add(f)
          }
        }
        setForm(f => ({ ...f, ...updates }))
        setAiHeaderFields(aiFields)

        if (parsed.labourRequired != null) setLabourRequired(!!parsed.labourRequired)
        if (parsed.labourScope) setLabourScope(parsed.labourScope)

        if (Array.isArray(parsed.lineItems) && parsed.lineItems.length > 0) {
          setLineItems(parsed.lineItems.map((li: any) => ({
            key: newKey(),
            description: li.description ?? '',
            qty: String(li.qty ?? 1),
            unit: li.unit ?? 'Each',
            notes: li.notes ?? '',
            aiPopulated: true,
          })))
        }

        setMode('manual')
      },
      onError: (err: any) => {
        setParseError(err?.response?.data?.message ?? 'Failed to parse document. Try again or fill in manually.')
      },
    })
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!program?.clientId) { setError('Program not loaded'); return }
    const validLines = lineItems.filter(l => l.description.trim())
    if (validLines.length === 0) { setError('At least one line item is required'); return }
    try {
      const payload: any = {
        title: form.title,
        clientId: program.clientId,
        programId,
        priority: form.priority,
        labourRequired,
        labourScope: labourRequired ? labourScope : undefined,
        lineItems: validLines.map(l => ({
          description: l.description.trim(),
          qty: parseFloat(l.qty) || 1,
          unit: l.unit,
          notes: l.notes.trim() || undefined,
        })),
      }
      if (form.requestReference) payload.requestReference = form.requestReference
      if (form.campus) payload.campus = form.campus
      if (form.department) payload.department = form.department
      if (form.deadline) payload.deadline = new Date(form.deadline).toISOString()
      if (form.scopeOfWork) payload.scopeOfWork = form.scopeOfWork
      if (form.notes) payload.notes = form.notes

      const project = await createProject(payload)
      router.push(`/dashboard/projects/${programId}/${project.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create quote')
    }
  }

  const aiInput = (field: string) =>
    aiHeaderFields.has(field) ? 'input border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-300' : 'input'

  const aiLabel = (field: string) =>
    `label flex items-center gap-1.5 ${aiHeaderFields.has(field) ? 'text-emerald-700' : ''}`

  const aiPopCount = aiHeaderFields.size + lineItems.filter(l => l.aiPopulated).length

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/projects" className="hover:text-brand">Projects</Link>
        <span>/</span>
        <Link href={`/dashboard/projects/${programId}`} className="hover:text-brand">{program?.name ?? '...'}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Quote</span>
      </div>

      <h1 className="page-title">New Quote</h1>

      {program && (
        <div className="flex items-center gap-3 bg-brand/5 border border-brand/20 rounded-xl px-4 py-3 text-sm">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8B3A3A" strokeWidth={2} className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <span className="text-gray-600">
            <strong className="text-gray-900">{program.client?.name}</strong> · {program.name}
          </span>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'manual' ? 'bg-brand text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand/40'}`}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Fill in manually
        </button>
        <button type="button" onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'upload' ? 'bg-brand text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand/40'}`}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload RFQ document
        </button>
        {aiPopCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl ml-auto">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            AI populated {aiPopCount} field{aiPopCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Upload panel */}
      {mode === 'upload' && (
        <Card>
          <h2 className="section-title mb-2">Upload RFQ Document</h2>
          <p className="text-xs text-gray-500 mb-4">Upload a PDF or text file. AI will extract the details and line items into the form.</p>
          {isParsing ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Analysing document with AI...</p>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${dragOver ? 'border-brand bg-brand/5' : 'border-gray-300 hover:border-brand/50 hover:bg-gray-50'}`}
            >
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#8B3A3A" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Drop your RFQ here, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF or plain text files</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={onFileChange} />
            </div>
          )}
          {parseError && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{parseError}</p>}
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <Card>
          <h2 className="section-title mb-4">Quote Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={aiLabel('title')}>
                Title *{aiHeaderFields.has('title') && <AiBadge />}
              </label>
              <input className={aiInput('title')} required value={form.title} onChange={setField('title')} placeholder="e.g. Supply and install network switches — Science Block" />
            </div>
            <div>
              <label className={aiLabel('requestReference')}>
                Client Reference{aiHeaderFields.has('requestReference') && <AiBadge />}
              </label>
              <input className={aiInput('requestReference')} value={form.requestReference} onChange={setField('requestReference')} placeholder="e.g. WITS-ICT-2026-045" />
            </div>
            <div>
              <label className={aiLabel('priority')}>
                Priority{aiHeaderFields.has('priority') && <AiBadge />}
              </label>
              <select className={aiInput('priority')} value={form.priority} onChange={setField('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className={aiLabel('campus')}>
                Campus / Site{aiHeaderFields.has('campus') && <AiBadge />}
              </label>
              <input className={aiInput('campus')} value={form.campus} onChange={setField('campus')} placeholder="e.g. East Campus, Building 12" />
            </div>
            <div>
              <label className={aiLabel('department')}>
                Department{aiHeaderFields.has('department') && <AiBadge />}
              </label>
              <input className={aiInput('department')} value={form.department} onChange={setField('department')} placeholder="e.g. ICT Services" />
            </div>
            <div>
              <label className={aiLabel('deadline')}>
                Submission Deadline{aiHeaderFields.has('deadline') && <AiBadge />}
              </label>
              <input className={`${aiInput('deadline')} w-48`} type="date" value={form.deadline} onChange={setField('deadline')} />
            </div>
          </div>
        </Card>

        {/* Line Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Line Items *</h2>
            <span className="text-xs text-gray-400">{lineItems.filter(l => l.description.trim()).length} item{lineItems.filter(l => l.description.trim()).length !== 1 ? 's' : ''}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-2 pr-3 w-8">#</th>
                  <th className="pb-2 pr-3">Description *</th>
                  <th className="pb-2 pr-3 w-24">Qty *</th>
                  <th className="pb-2 pr-3 w-28">Unit *</th>
                  <th className="pb-2 pr-3">Notes</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineItems.map((line, i) => (
                  <tr key={line.key} className={line.aiPopulated ? 'bg-emerald-50/30' : ''}>
                    <td className="py-2 pr-3 text-gray-400 text-xs align-middle">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1.5">
                        {line.aiPopulated && <span className="flex-shrink-0"><AiBadge /></span>}
                        <input
                          className={`input text-sm ${line.aiPopulated ? 'border-emerald-300 bg-emerald-50/60' : ''}`}
                          value={line.description}
                          onChange={setLine(line.key, 'description')}
                          placeholder="Item description"
                          required={i === 0}
                        />
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className={`input text-sm w-full ${line.aiPopulated ? 'border-emerald-300 bg-emerald-50/60' : ''}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.qty}
                        onChange={setLine(line.key, 'qty')}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        className={`input text-sm w-full ${line.aiPopulated ? 'border-emerald-300 bg-emerald-50/60' : ''}`}
                        value={line.unit}
                        onChange={setLine(line.key, 'unit')}
                      >
                        {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="input text-sm"
                        value={line.notes}
                        onChange={setLine(line.key, 'notes')}
                        placeholder="Optional spec or note"
                      />
                    </td>
                    <td className="py-2 align-middle">
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => removeLine(line.key)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" onClick={addLine}
            className="mt-3 flex items-center gap-1.5 text-xs text-brand hover:text-brand/80 font-medium transition-colors">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add line item
          </button>
        </Card>

        {/* Labour */}
        <Card>
          <h2 className="section-title mb-3">Labour / Installation</h2>
          <div className="flex gap-3 mb-3">
            <button type="button" onClick={() => setLabourRequired(false)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${!labourRequired ? 'bg-brand text-white border-brand shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              Materials only
            </button>
            <button type="button" onClick={() => setLabourRequired(true)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${labourRequired ? 'bg-brand text-white border-brand shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              Materials + Labour
            </button>
          </div>
          {labourRequired && (
            <div>
              <label className="label">Installation / Services Scope</label>
              <textarea className="input resize-none" rows={3} value={labourScope} onChange={e => setLabourScope(e.target.value)}
                placeholder="Describe the installation or services work required..." />
            </div>
          )}
        </Card>

        {/* Scope & Notes */}
        <Card>
          <h2 className="section-title mb-4">Scope & Notes</h2>
          <div className="space-y-4">
            <div>
              <label className={aiLabel('scopeOfWork')}>
                Overall Scope{aiHeaderFields.has('scopeOfWork') && <AiBadge />}
              </label>
              <textarea className={`${aiInput('scopeOfWork')} resize-none`} rows={3} value={form.scopeOfWork} onChange={setField('scopeOfWork')} placeholder="Optional — overall context or project background..." />
            </div>
            <div>
              <label className={aiLabel('notes')}>
                Notes / Special Requirements{aiHeaderFields.has('notes') && <AiBadge />}
              </label>
              <textarea className={`${aiInput('notes')} resize-none`} rows={2} value={form.notes} onChange={setField('notes')} placeholder="Terms, evaluation criteria, delivery requirements..." />
            </div>
          </div>
        </Card>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving || isParsing} className="btn-primary">
            {isSaving ? 'Saving...' : 'Save Quote'}
          </button>
          <Link href={`/dashboard/projects/${programId}`} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-normal text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
      <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      AI
    </span>
  )
}
