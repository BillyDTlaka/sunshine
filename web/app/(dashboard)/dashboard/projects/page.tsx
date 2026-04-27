'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { usePrograms, useCreateProgram, useClients } from '@/lib/hooks'

function NewProgramModal({ onClose }: { onClose: () => void }) {
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []
  const { mutateAsync: createProgram, isPending } = useCreateProgram()

  const [form, setForm] = useState({
    name: '',
    clientId: '',
    contracted: false,
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [error, setError] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const payload: any = {
        name: form.name,
        clientId: form.clientId,
        contracted: form.contracted,
      }
      if (form.startDate) payload.startDate = new Date(form.startDate).toISOString()
      if (form.endDate) payload.endDate = new Date(form.endDate).toISOString()
      if (form.notes) payload.notes = form.notes
      await createProgram(payload)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create program')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">New Program</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Client *</label>
            <select className="input" required value={form.clientId} onChange={set('clientId')}>
              <option value="">Select client...</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Program Name *</label>
            <input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Networking Infrastructure Program" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="date" value={form.startDate} onChange={set('startDate')} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input className="input" type="date" value={form.endDate} onChange={set('endDate')} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, contracted: !f.contracted }))}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.contracted ? 'bg-brand' : 'bg-gray-200'
              )}
            >
              <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', form.contracted ? 'translate-x-6' : 'translate-x-1')} />
            </button>
            <span className="text-sm font-medium text-gray-700">Contracted</span>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={set('notes')} placeholder="Optional notes..." />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Creating...' : 'Create Program'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProgramRow({ program }: { program: any }) {
  const now = new Date()
  const started = program.startDate && new Date(program.startDate) <= now
  const ended = program.endDate && new Date(program.endDate) < now

  let statusLabel = 'Upcoming'
  let statusColor = 'text-gray-500 bg-gray-50'
  if (ended) { statusLabel = 'Ended'; statusColor = 'text-gray-400 bg-gray-50' }
  else if (started) { statusLabel = 'Active'; statusColor = 'text-emerald-700 bg-emerald-50' }

  return (
    <Link href={`/dashboard/projects/${program.id}`}>
      <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group">
        {/* Client + Program */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{program.client?.name}</p>
          <p className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors">{program.name}</p>
        </div>

        {/* Contracted badge */}
        <div className="flex-shrink-0 w-28 text-center">
          <span className={clsx(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
            program.contracted ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'
          )}>
            {program.contracted ? 'Contracted' : 'Not Contracted'}
          </span>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 w-24 text-center">
          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', statusColor)}>
            {statusLabel}
          </span>
        </div>

        {/* Dates */}
        <div className="flex-shrink-0 w-48 text-right">
          <p className="text-xs text-gray-500">
            {program.startDate ? new Date(program.startDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            {' → '}
            {program.endDate ? new Date(program.endDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing'}
          </p>
        </div>

        {/* Project count */}
        <div className="flex-shrink-0 w-20 text-right">
          <span className="text-sm font-bold text-gray-700">{program._count?.projects ?? 0}</span>
          <span className="text-xs text-gray-400 ml-1">projects</span>
        </div>

        <span className="text-gray-300 group-hover:text-brand transition-colors flex-shrink-0">→</span>
      </div>
    </Link>
  )
}

export default function ProgramsPage() {
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const { data: programs, isLoading } = usePrograms(search ? { search } : undefined)

  const grouped = (programs ?? []).reduce((acc: Record<string, any[]>, p: any) => {
    const key = p.client?.name ?? 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  const totalProjects = (programs ?? []).reduce((sum: number, p: any) => sum + (p._count?.projects ?? 0), 0)

  return (
    <div className="space-y-5">
      {showNew && <NewProgramModal onClose={() => setShowNew(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {(programs ?? []).length} programs · {totalProjects} projects
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>+ New Program</button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          className="input w-72"
          placeholder="Search programs or clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Programs list */}
      {isLoading ? (
        <div className="animate-pulse text-gray-400 text-center py-16">Loading programs...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold mb-1">No programs yet</p>
            <p className="text-gray-400 text-sm mb-4">Create a program to start grouping projects by client and contract</p>
            <button className="btn-primary" onClick={() => setShowNew(true)}>+ New Program</button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([clientName, clientPrograms]) => (
            <Card key={clientName} padding={false}>
              {/* Client header */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand text-xs font-bold">{clientName[0]}</span>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800">{clientName}</h2>
                  <span className="text-xs text-gray-400 ml-1">{clientPrograms.length} {clientPrograms.length === 1 ? 'program' : 'programs'}</span>
                </div>
              </div>

              {/* Column headers */}
              <div className="flex items-center gap-4 px-5 py-2 border-b border-gray-100">
                <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Program</div>
                <div className="flex-shrink-0 w-28 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Contract</div>
                <div className="flex-shrink-0 w-24 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</div>
                <div className="flex-shrink-0 w-48 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Duration</div>
                <div className="flex-shrink-0 w-20 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Projects</div>
                <div className="flex-shrink-0 w-4" />
              </div>

              {clientPrograms.map(p => <ProgramRow key={p.id} program={p} />)}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
