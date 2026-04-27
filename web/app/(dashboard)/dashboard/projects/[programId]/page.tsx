'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useProgram, useProjects, useProjectKanban, useUpdateProjectStatus } from '@/lib/hooks'
import { COLORS, STATUS_LABELS, PROJECT_STATUS_ORDER } from '@/lib/theme'

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-gray-300', MEDIUM: 'bg-blue-500', HIGH: 'bg-amber-500', URGENT: 'bg-red-500',
}

const KANBAN_COLUMNS = ['NEW_REQUEST', 'ESTIMATING', 'QUOTED', 'SUBMITTED', 'WON', 'EXECUTING', 'WAITING_CLIENT', 'COMPLETED']

const COLUMN_COLORS: Record<string, string> = {
  NEW_REQUEST: 'border-gray-300', ESTIMATING: 'border-purple-400', QUOTED: 'border-blue-400',
  SUBMITTED: 'border-amber-400', WON: 'border-emerald-400', EXECUTING: 'border-brand',
  WAITING_CLIENT: 'border-orange-400', COMPLETED: 'border-teal-400',
}

function PriorityDot({ priority }: { priority: string }) {
  return <span className={clsx('inline-block w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOT[priority] ?? 'bg-gray-300')} />
}

function ProjectCard({ project, programId, compact = false }: { project: any; programId: string; compact?: boolean }) {
  const isLate = project.deadline && new Date(project.deadline) < new Date() && !['COMPLETED', 'CLOSED', 'LOST'].includes(project.status)
  return (
    <Link href={`/dashboard/projects/${programId}/${project.id}`}>
      <div className={clsx(
        'bg-white rounded-xl border p-3 hover:shadow-md transition-all cursor-pointer group',
        isLate ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
      )}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <PriorityDot priority={project.priority} />
            <span className="font-mono text-xs text-gray-400 flex-shrink-0">{project.projectId}</span>
          </div>
          <Badge status={project.status} />
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-brand transition-colors line-clamp-2">{project.title}</p>
        {project.campus && <p className="text-xs text-gray-400 truncate">{project.campus}</p>}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            {project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'Unassigned'}
          </span>
          <span className={clsx('text-xs', isLate ? 'text-red-600 font-semibold' : 'text-gray-400')}>
            {project.deadline ? new Date(project.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}
          </span>
        </div>
        {!compact && project._count && (
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            <span>{project._count.tasks} tasks</span>
          </div>
        )}
      </div>
    </Link>
  )
}

function KanbanView({ programId }: { programId: string }) {
  // Build a pseudo-board from the program's projects
  const { data: projectsData } = useProjects({ programId, limit: 200 })
  const projects: any[] = projectsData?.data ?? []

  const board: Record<string, any[]> = {}
  for (const col of KANBAN_COLUMNS) board[col] = []
  for (const p of projects) {
    if (board[p.status]) board[p.status].push(p)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 480 }}>
      {KANBAN_COLUMNS.map(col => {
        const cards: any[] = board[col] ?? []
        return (
          <div key={col} className="flex-shrink-0 w-64">
            <div className={clsx('rounded-t-lg border-t-2 px-3 py-2 bg-white border-x border-b border-gray-100 mb-2', COLUMN_COLORS[col])}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{STATUS_LABELS[col] ?? col}</span>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{cards.length}</span>
              </div>
            </div>
            <div className="space-y-2">
              {cards.map(p => <ProjectCard key={p.id} project={p} programId={programId} compact />)}
              {cards.length === 0 && <div className="text-xs text-gray-300 text-center py-4">Empty</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TableView({ programId }: { programId: string }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProjects({ programId, search: search || undefined, status: status || undefined, page, limit: 25 })

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap gap-3">
        <input className="input w-64" placeholder="Search projects..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="input w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {PROJECT_STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
        </select>
      </Card>
      <Card padding={false}>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tasks</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((p: any) => {
                  const isLate = p.deadline && new Date(p.deadline) < new Date() && !['COMPLETED', 'CLOSED', 'LOST'].includes(p.status)
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <PriorityDot priority={p.priority} />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{p.title}</p>
                            <p className="font-mono text-xs text-gray-400">{p.projectId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-semibold', { 'text-gray-400': p.priority === 'LOW', 'text-blue-600': p.priority === 'MEDIUM', 'text-amber-600': p.priority === 'HIGH', 'text-red-600': p.priority === 'URGENT' })}>
                          {p.priority}
                        </span>
                      </td>
                      <td className={clsx('px-4 py-3 text-sm', isLate ? 'text-red-600 font-semibold' : 'text-gray-500')}>
                        {p.deadline ? new Date(p.deadline).toLocaleDateString('en-ZA') : '—'}
                      </td>
                      <td className="px-4 py-3"><Badge status={p.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{p._count?.tasks ?? 0}</td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/projects/${programId}/${p.id}`} className="text-brand hover:underline text-xs font-semibold">Open →</Link>
                      </td>
                    </tr>
                  )
                })}
                {data?.data?.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No projects found</td></tr>}
              </tbody>
            </table>
            {data && data.totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 text-sm">
                <span className="text-gray-500">Page {data.page} of {data.totalPages}</span>
                <div className="flex gap-2">
                  <button className="btn-secondary py-1 px-3 text-xs disabled:opacity-40" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                  <button className="btn-secondary py-1 px-3 text-xs disabled:opacity-40" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

export default function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>()
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const { data: program, isLoading } = useProgram(programId)

  if (isLoading) return <div className="animate-pulse text-gray-400 py-12 text-center">Loading...</div>
  if (!program) return <div className="text-red-500 py-12 text-center">Program not found</div>

  const now = new Date()
  const active = program.startDate && new Date(program.startDate) <= now && (!program.endDate || new Date(program.endDate) >= now)

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/projects" className="hover:text-brand">Projects</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{program.name}</span>
      </div>

      {/* Program header */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{program.client?.name}</p>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold', program.contracted ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500')}>
                {program.contracted ? 'Contracted' : 'Not Contracted'}
              </span>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold', active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500')}>
                {active ? 'Active' : (program.endDate && new Date(program.endDate) < now ? 'Ended' : 'Upcoming')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{program.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {program.startDate ? new Date(program.startDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No start date'}
              {' → '}
              {program.endDate ? new Date(program.endDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Ongoing'}
            </p>
            {program.notes && <p className="text-sm text-gray-400 mt-1">{program.notes}</p>}
          </div>
          <Link href={`/dashboard/projects/${programId}/new`} className="btn-primary">+ New Project</Link>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-6 text-sm">
          <span><strong className="text-gray-900">{program._count?.projects ?? program.projects?.length ?? 0}</strong> <span className="text-gray-500">projects</span></span>
          <span><strong className="text-gray-900">{program.projects?.filter((p: any) => p.status === 'EXECUTING').length ?? 0}</strong> <span className="text-gray-500">in execution</span></span>
          <span><strong className="text-gray-900">{program.projects?.filter((p: any) => ['COMPLETED', 'CLOSED'].includes(p.status)).length ?? 0}</strong> <span className="text-gray-500">completed</span></span>
        </div>
      </Card>

      {/* View toggle */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 w-fit">
        {(['kanban', 'table'] as const).map(v => (
          <button
            key={v}
            className={clsx('px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize', view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
            onClick={() => setView(v)}
          >
            {v === 'kanban' ? 'Kanban' : 'Table'}
          </button>
        ))}
      </div>

      {view === 'kanban' ? <KanbanView programId={programId} /> : <TableView programId={programId} />}
    </div>
  )
}
