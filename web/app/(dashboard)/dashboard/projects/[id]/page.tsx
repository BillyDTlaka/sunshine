'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useProject, useUpdateProjectStatus, useCreateTask, useTasks, useUpdateTask, useClients } from '@/lib/hooks'
import { STATUS_LABELS, COLORS, PROJECT_STATUS_ORDER } from '@/lib/theme'

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-gray-400', MEDIUM: 'text-blue-600', HIGH: 'text-amber-600', URGENT: 'text-red-600',
}

const TASK_STATUS_COLS: Record<string, { label: string; color: string }> = {
  TODO:        { label: 'To Do',       color: 'bg-gray-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50' },
  BLOCKED:     { label: 'Blocked',     color: 'bg-red-50' },
  DONE:        { label: 'Done',        color: 'bg-green-50' },
}

function CommercialRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={clsx('flex justify-between items-center py-2 border-b border-gray-50 last:border-0', highlight && 'font-semibold')}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={clsx('text-sm', highlight ? 'text-gray-900' : 'text-gray-700')}>{value}</span>
    </div>
  )
}

function fmt(val: any) {
  if (val == null || val === '') return '—'
  return `R ${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function TaskRow({ task, onStatusChange }: { task: any; onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 group">
      <select
        className={clsx('text-xs font-semibold rounded-full px-2 py-0.5 border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand',
          TASK_STATUS_COLS[task.status]?.color ?? 'bg-gray-100'
        )}
        value={task.status}
        onChange={e => onStatusChange(task.id, e.target.value)}
      >
        {Object.entries(TASK_STATUS_COLS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        <option value="CANCELLED">Cancelled</option>
      </select>
      <span className={clsx('text-xs font-semibold flex-shrink-0', PRIORITY_COLOR[task.priority] ?? 'text-gray-400')}>
        {task.priority}
      </span>
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
    await createTask({
      projectId,
      title: title.trim(),
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    })
    setTitle('')
    setDueDate('')
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-2">
      <input
        className="input flex-1 text-sm py-1.5"
        placeholder="New task title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />
      <select className="input w-28 text-sm py-1.5" value={priority} onChange={e => setPriority(e.target.value)}>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option>
      </select>
      <input className="input w-36 text-sm py-1.5" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      <button type="submit" disabled={isPending || !title.trim()} className="btn-primary py-1.5 text-xs">
        Add
      </button>
      <button type="button" className="text-gray-400 hover:text-gray-600 text-sm px-2" onClick={onDone}>✕</button>
    </form>
  )
}

type Tab = 'overview' | 'commercial' | 'scope' | 'tasks' | 'rfqs'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [addingTask, setAddingTask] = useState(false)
  const [statusChange, setStatusChange] = useState(false)

  const { data: project, isLoading, refetch } = useProject(id)
  const { data: tasksData, refetch: refetchTasks } = useTasks({ projectId: id })
  const tasks = tasksData ?? []

  const { mutateAsync: updateStatus, isPending: updatingStatus } = useUpdateProjectStatus()
  const { mutateAsync: updateTask } = useUpdateTask()

  if (isLoading) return <div className="animate-pulse text-gray-400 py-12 text-center">Loading project...</div>
  if (!project) return <div className="text-red-500 py-12 text-center">Project not found</div>

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ id, status: newStatus })
      setStatusChange(false)
      refetch()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Invalid status transition')
    }
  }

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    await updateTask({ id: taskId, data: { status } })
    refetchTasks()
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'commercial', label: 'Commercial' },
    { key: 'scope', label: 'Scope' },
    { key: 'tasks', label: `Tasks (${tasks.length})` },
    { key: 'rfqs', label: `RFQs (${project.rfqs?.length ?? 0})` },
  ]

  const doneTasks = tasks.filter((t: any) => t.status === 'DONE').length
  const totalTasks = tasks.length

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/projects" className="hover:text-brand">Projects</Link>
        <span>/</span>
        <span className="font-mono text-xs text-gray-400">{project.projectId}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{project.title}</span>
      </div>

      {/* Header card */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="font-mono text-sm font-bold text-brand">{project.projectId}</span>
              <Badge status={project.priority} label={project.priority} />
              {project.deadline && new Date(project.deadline) < new Date() && !['COMPLETED', 'CLOSED', 'LOST'].includes(project.status) && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">OVERDUE</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{project.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span><strong className="text-gray-700">Client:</strong> {project.client?.name}</span>
              {project.campus && <span><strong className="text-gray-700">Site:</strong> {project.campus}</span>}
              {project.department && <span><strong className="text-gray-700">Dept:</strong> {project.department}</span>}
              <span><strong className="text-gray-700">Owner:</strong> {project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'Unassigned'}</span>
              {project.deadline && <span><strong className="text-gray-700">Deadline:</strong> {new Date(project.deadline).toLocaleDateString('en-ZA')}</span>}
            </div>
          </div>

          {/* Status + action */}
          <div className="flex items-center gap-3">
            {statusChange ? (
              <div className="flex items-center gap-2">
                <select
                  className="input text-sm w-44"
                  defaultValue={project.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                >
                  {PROJECT_STATUS_ORDER.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                  ))}
                </select>
                <button onClick={() => setStatusChange(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge status={project.status} />
                <button
                  className="text-xs text-gray-400 hover:text-brand border border-gray-200 rounded px-2 py-1 transition-colors"
                  onClick={() => setStatusChange(true)}
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Task progress bar */}
        {totalTasks > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Task Progress</span>
              <span>{doneTasks}/{totalTasks} done</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-0.5">
        {TABS.map(t => (
          <button
            key={t.key}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t.key ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="section-title mb-3">Project Info</h3>
            <dl className="space-y-2">
              {[
                { label: 'Status', value: <Badge status={project.status} /> },
                { label: 'Priority', value: <span className={clsx('text-sm font-semibold', PRIORITY_COLOR[project.priority] ?? '')}>{project.priority}</span> },
                { label: 'Created', value: new Date(project.createdAt).toLocaleDateString('en-ZA') },
                { label: 'Deadline', value: project.deadline ? new Date(project.deadline).toLocaleDateString('en-ZA') : '—' },
                { label: 'Request Ref', value: project.requestReference ?? '—' },
                { label: 'Campus', value: project.campus ?? '—' },
                { label: 'Department', value: project.department ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 py-1.5">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-900">{value}</span>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <h3 className="section-title mb-3">Quick Financials</h3>
            <CommercialRow label="Est. Revenue" value={fmt(project.estimatedRevenue)} />
            <CommercialRow label="Est. Materials" value={fmt(project.estimatedMaterial)} />
            <CommercialRow label="Est. Labour" value={fmt(project.estimatedLabour)} />
            <CommercialRow label="Markup %" value={project.markupPct ? `${project.markupPct}%` : '—'} />
            <CommercialRow label="Planned Gross Margin" value={fmt(project.plannedGrossMargin)} highlight />
          </Card>
        </div>
      )}

      {tab === 'commercial' && (
        <Card>
          <h3 className="section-title mb-4">Commercial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Estimates</h4>
              <CommercialRow label="Estimated Revenue" value={fmt(project.estimatedRevenue)} />
              <CommercialRow label="Estimated Material Cost" value={fmt(project.estimatedMaterial)} />
              <CommercialRow label="Estimated Labour Cost" value={fmt(project.estimatedLabour)} />
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
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {fmt(Number(project.estimatedRevenue) - Number(project.actualCost))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {tab === 'scope' && (
        <Card>
          <h3 className="section-title mb-4">Scope of Work</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Scope of Work</label>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap min-h-24">
                {project.scopeOfWork ?? <span className="text-gray-400 italic">Not defined</span>}
              </div>
            </div>
            <div>
              <label className="label">Deliverables</label>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap min-h-16">
                {project.deliverables ?? <span className="text-gray-400 italic">Not defined</span>}
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap min-h-12">
                {project.notes ?? <span className="text-gray-400 italic">None</span>}
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === 'tasks' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Tasks</h3>
            {!addingTask && (
              <button className="btn-primary text-xs py-1.5" onClick={() => setAddingTask(true)}>+ Add Task</button>
            )}
          </div>

          {tasks.length === 0 && !addingTask ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">No tasks yet</p>
              <button className="btn-primary text-xs py-1.5" onClick={() => setAddingTask(true)}>+ Add first task</button>
            </div>
          ) : (
            <>
              {tasks.map((t: any) => (
                <TaskRow key={t.id} task={t} onStatusChange={handleTaskStatusChange} />
              ))}
              {addingTask && (
                <AddTaskForm projectId={id} onDone={() => { setAddingTask(false); refetchTasks() }} />
              )}
            </>
          )}
        </Card>
      )}

      {tab === 'rfqs' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Linked RFQs</h3>
            <Link href={`/dashboard/rfqs/new`} className="btn-primary text-xs py-1.5">+ New RFQ</Link>
          </div>
          {project.rfqs?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No RFQs linked to this project</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="py-2">Reference</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Quotes</th>
                  <th className="py-2">Date</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {project.rfqs?.map((rfq: any) => (
                  <tr key={rfq.id} className="border-b border-gray-50">
                    <td className="py-2 font-mono font-semibold text-brand">{rfq.referenceNumber}</td>
                    <td className="py-2 text-gray-500">{rfq.type}</td>
                    <td className="py-2"><Badge status={rfq.status} /></td>
                    <td className="py-2 text-gray-500">{rfq._count?.clientQuotes ?? 0}</td>
                    <td className="py-2 text-gray-400">{new Date(rfq.createdAt).toLocaleDateString('en-ZA')}</td>
                    <td className="py-2">
                      <Link href={`/dashboard/rfqs/${rfq.id}`} className="text-brand hover:underline text-xs font-semibold">Open →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  )
}
