'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { useCreateProject, useClients, useProgram, useParseRfq } from '@/lib/hooks'

type Mode = 'manual' | 'upload'

const AI_FIELDS = ['title', 'requestReference', 'campus', 'department', 'deadline', 'priority', 'scopeOfWork', 'deliverables', 'notes']

export default function NewQuotePage() {
  const { programId } = useParams<{ programId: string }>()
  const router = useRouter()
  const { mutateAsync: createProject, isPending: isSaving } = useCreateProject()
  const { mutate: parseRfq, isPending: isParsing } = useParseRfq()
  const { data: program } = useProgram(programId)
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []

  const [mode, setMode] = useState<Mode>('manual')
  const [aiPopulated, setAiPopulated] = useState<Set<string>>(new Set())
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
    deliverables: '',
    notes: '',
    estimatedRevenue: '',
    estimatedMaterial: '',
    estimatedLabour: '',
    markupPct: '',
  })
  const [error, setError] = useState('')
  const [parseError, setParseError] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setAiPopulated(s => { const n = new Set(s); n.delete(field); return n })
  }

  const handleFile = (file: File) => {
    setParseError('')
    parseRfq(file, {
      onSuccess: (parsed: any) => {
        const updates: any = {}
        const populated = new Set<string>()

        if (parsed.title) { updates.title = parsed.title; populated.add('title') }
        if (parsed.requestReference) { updates.requestReference = parsed.requestReference; populated.add('requestReference') }
        if (parsed.campus) { updates.campus = parsed.campus; populated.add('campus') }
        if (parsed.department) { updates.department = parsed.department; populated.add('department') }
        if (parsed.deadline) { updates.deadline = parsed.deadline; populated.add('deadline') }
        if (parsed.priority) { updates.priority = parsed.priority; populated.add('priority') }
        if (parsed.scopeOfWork) { updates.scopeOfWork = parsed.scopeOfWork; populated.add('scopeOfWork') }
        if (parsed.deliverables) { updates.deliverables = parsed.deliverables; populated.add('deliverables') }
        if (parsed.notes) { updates.notes = parsed.notes; populated.add('notes') }

        setForm(f => ({ ...f, ...updates }))
        setAiPopulated(populated)
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
    try {
      const payload: any = {
        title: form.title,
        clientId: program.clientId,
        programId,
        priority: form.priority,
      }
      if (form.requestReference) payload.requestReference = form.requestReference
      if (form.campus) payload.campus = form.campus
      if (form.department) payload.department = form.department
      if (form.deadline) payload.deadline = new Date(form.deadline).toISOString()
      if (form.scopeOfWork) payload.scopeOfWork = form.scopeOfWork
      if (form.deliverables) payload.deliverables = form.deliverables
      if (form.notes) payload.notes = form.notes
      if (form.estimatedRevenue) payload.estimatedRevenue = parseFloat(form.estimatedRevenue)
      if (form.estimatedMaterial) payload.estimatedMaterial = parseFloat(form.estimatedMaterial)
      if (form.estimatedLabour) payload.estimatedLabour = parseFloat(form.estimatedLabour)
      if (form.markupPct) payload.markupPct = parseFloat(form.markupPct)

      const project = await createProject(payload)
      router.push(`/dashboard/projects/${programId}/${project.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create quote')
    }
  }

  const labelClass = (field: string) =>
    `label ${aiPopulated.has(field) ? 'text-emerald-700' : ''}`

  const inputClass = (field: string) =>
    `input ${aiPopulated.has(field) ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-300' : ''}`

  return (
    <div className="max-w-3xl space-y-5">
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'manual'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-brand/40'
          }`}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Fill in manually
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'upload'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-brand/40'
          }`}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Upload RFQ document
        </button>
        {aiPopulated.size > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl ml-auto">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            AI populated {aiPopulated.size} field{aiPopulated.size !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Upload panel */}
      {mode === 'upload' && (
        <Card>
          <h2 className="section-title mb-3">Upload RFQ Document</h2>
          <p className="text-xs text-gray-500 mb-4">Upload a PDF or text file. AI will read the document and auto-populate the form fields below.</p>

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
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                dragOver ? 'border-brand bg-brand/5' : 'border-gray-300 hover:border-brand/50 hover:bg-gray-50'
              }`}
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

          {parseError && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{parseError}</p>
          )}
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <h2 className="section-title mb-4">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass('title')}>
                Project Title *
                {aiPopulated.has('title') && <AiBadge />}
              </label>
              <input className={inputClass('title')} required value={form.title} onChange={set('title')} placeholder="e.g. Supply network switches — Building A" />
            </div>
            <div>
              <label className={labelClass('requestReference')}>
                Request Reference
                {aiPopulated.has('requestReference') && <AiBadge />}
              </label>
              <input className={inputClass('requestReference')} value={form.requestReference} onChange={set('requestReference')} placeholder="e.g. RFQ-2026-045" />
            </div>
            <div>
              <label className={labelClass('priority')}>
                Priority
                {aiPopulated.has('priority') && <AiBadge />}
              </label>
              <select className={inputClass('priority')} value={form.priority} onChange={set('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className={labelClass('campus')}>
                Campus / Site
                {aiPopulated.has('campus') && <AiBadge />}
              </label>
              <input className={inputClass('campus')} value={form.campus} onChange={set('campus')} placeholder="e.g. Main Campus, Block C" />
            </div>
            <div>
              <label className={labelClass('department')}>
                Department
                {aiPopulated.has('department') && <AiBadge />}
              </label>
              <input className={inputClass('department')} value={form.department} onChange={set('department')} placeholder="e.g. IT Department" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass('deadline')}>
                Deadline
                {aiPopulated.has('deadline') && <AiBadge />}
              </label>
              <input className={`${inputClass('deadline')} w-48`} type="date" value={form.deadline} onChange={set('deadline')} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="section-title mb-4">Scope</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass('scopeOfWork')}>
                Scope of Work
                {aiPopulated.has('scopeOfWork') && <AiBadge />}
              </label>
              <textarea className={`${inputClass('scopeOfWork')} resize-none`} rows={3} value={form.scopeOfWork} onChange={set('scopeOfWork')} placeholder="Describe what needs to be done..." />
            </div>
            <div>
              <label className={labelClass('deliverables')}>
                Deliverables
                {aiPopulated.has('deliverables') && <AiBadge />}
              </label>
              <textarea className={`${inputClass('deliverables')} resize-none`} rows={2} value={form.deliverables} onChange={set('deliverables')} placeholder="List the expected deliverables..." />
            </div>
            <div>
              <label className={labelClass('notes')}>
                Notes
                {aiPopulated.has('notes') && <AiBadge />}
              </label>
              <textarea className={`${inputClass('notes')} resize-none`} rows={2} value={form.notes} onChange={set('notes')} placeholder="Any additional notes..." />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="section-title mb-4">Commercial Estimate</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Est. Revenue (R)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.estimatedRevenue} onChange={set('estimatedRevenue')} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Est. Materials (R)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.estimatedMaterial} onChange={set('estimatedMaterial')} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Est. Labour (R)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.estimatedLabour} onChange={set('estimatedLabour')} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Markup %</label>
              <input className="input" type="number" step="0.1" min="0" max="100" value={form.markupPct} onChange={set('markupPct')} placeholder="0.0" />
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
    <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      AI
    </span>
  )
}
