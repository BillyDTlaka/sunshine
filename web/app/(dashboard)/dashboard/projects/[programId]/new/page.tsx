'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { useCreateProject, useClients, useProgram } from '@/lib/hooks'

export default function NewProjectPage() {
  const { programId } = useParams<{ programId: string }>()
  const router = useRouter()
  const { mutateAsync: createProject, isPending } = useCreateProject()
  const { data: program } = useProgram(programId)
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []

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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

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
      setError(err?.response?.data?.message ?? 'Failed to create project')
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/projects" className="hover:text-brand">Projects</Link>
        <span>/</span>
        <Link href={`/dashboard/projects/${programId}`} className="hover:text-brand">{program?.name ?? '...'}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Project</span>
      </div>

      <h1 className="page-title">New Project</h1>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <h2 className="section-title mb-4">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Project Title *</label>
              <input className="input" required value={form.title} onChange={set('title')} placeholder="e.g. Supply network switches — Building A" />
            </div>
            <div>
              <label className="label">Request Reference</label>
              <input className="input" value={form.requestReference} onChange={set('requestReference')} placeholder="e.g. RFQ-2026-045" />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Campus / Site</label>
              <input className="input" value={form.campus} onChange={set('campus')} placeholder="e.g. Main Campus, Block C" />
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={set('department')} placeholder="e.g. IT Department" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Deadline</label>
              <input className="input w-48" type="date" value={form.deadline} onChange={set('deadline')} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="section-title mb-4">Scope</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Scope of Work</label>
              <textarea className="input resize-none" rows={3} value={form.scopeOfWork} onChange={set('scopeOfWork')} placeholder="Describe what needs to be done..." />
            </div>
            <div>
              <label className="label">Deliverables</label>
              <textarea className="input resize-none" rows={2} value={form.deliverables} onChange={set('deliverables')} placeholder="List the expected deliverables..." />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={2} value={form.notes} onChange={set('notes')} placeholder="Any additional notes..." />
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
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? 'Creating...' : 'Create Project'}
          </button>
          <Link href={`/dashboard/projects/${programId}`} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
