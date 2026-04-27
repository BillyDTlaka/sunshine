'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useMyTasks, useTasks, useUpdateTask } from '@/lib/hooks'

const PRIORITY_STYLES: Record<string, string> = {
  LOW:    'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH:   'bg-amber-50 text-amber-700',
  URGENT: 'bg-red-50 text-red-700 font-bold',
}

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

function TaskCard({ task, onStatusChange }: { task: any; onStatusChange: (id: string, status: string) => void }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  return (
    <div className={clsx(
      'bg-white rounded-xl border p-4 transition-all',
      task.status === 'DONE' ? 'opacity-60' : '',
      isOverdue ? 'border-red-200' : 'border-gray-100',
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox-style status toggle */}
        <button
          className={clsx(
            'w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 transition-all',
            task.status === 'DONE' ? 'bg-brand border-brand' : 'border-gray-300 hover:border-brand'
          )}
          onClick={() => onStatusChange(task.id, task.status === 'DONE' ? 'TODO' : 'DONE')}
        >
          {task.status === 'DONE' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-full h-full p-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={clsx('text-sm font-semibold text-gray-900', task.status === 'DONE' && 'line-through text-gray-400')}>
              {task.title}
            </p>
            <Badge status={task.status} />
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Link href={`/dashboard/projects/${task.project?.id}`} className="text-xs text-brand hover:underline font-mono">
              {task.project?.projectId}
            </Link>
            <span className="text-xs text-gray-500 truncate">{task.project?.title}</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_STYLES[task.priority] ?? 'bg-gray-100 text-gray-500')}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span className={clsx('text-xs', isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400')}>
                {isOverdue ? 'Overdue · ' : ''}{new Date(task.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {task.assignee && (
              <span className="text-xs text-gray-400">{task.assignee.firstName} {task.assignee.lastName}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [filter, setFilter] = useState<'mine' | 'all'>('mine')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const myTasksQuery = useMyTasks()
  const allTasksQuery = useTasks({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  })

  const { mutateAsync: updateTask } = useUpdateTask()

  const rawTasks = filter === 'mine' ? (myTasksQuery.data ?? []) : (allTasksQuery.data ?? [])
  const isLoading = filter === 'mine' ? myTasksQuery.isLoading : allTasksQuery.isLoading

  // Client-side filter when on "mine" tab (API already filters by assignee)
  const tasks = rawTasks.filter((t: any) => {
    if (statusFilter && t.status !== statusFilter) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  const overdueTasks = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE')
  const activeTasks = tasks.filter((t: any) => ['TODO', 'IN_PROGRESS', 'BLOCKED'].includes(t.status))
  const doneTasks = tasks.filter((t: any) => t.status === 'DONE')

  const handleStatusChange = async (id: string, status: string) => {
    await updateTask({ id, data: { status } })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filter === 'mine' ? 'Your work queue' : 'All tasks across projects'}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      {!isLoading && (
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Active', count: activeTasks.length, color: 'text-blue-600' },
            { label: 'Overdue', count: overdueTasks.length, color: 'text-red-600' },
            { label: 'Done', count: doneTasks.length, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
              <span className={clsx('text-xl font-bold', s.color)}>{s.count}</span>
              <span className="text-sm text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(['mine', 'all'] as const).map(f => (
            <button
              key={f}
              className={clsx('px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize', filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
              onClick={() => setFilter(f)}
            >
              {f === 'mine' ? 'My Tasks' : 'All Tasks'}
            </button>
          ))}
        </div>
        <select className="input w-36 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input w-32 text-sm" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </Card>

      {/* Task list */}
      {isLoading ? (
        <div className="animate-pulse text-gray-400 text-center py-12">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              {filter === 'mine' ? 'No tasks assigned to you' : 'No tasks found'}
            </p>
            <p className="text-gray-300 text-xs mt-1">Tasks are created inside projects</p>
            <Link href="/dashboard/projects" className="btn-primary mt-4 inline-block text-xs py-1.5">
              Go to Projects
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Overdue section */}
          {overdueTasks.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <span>⚠</span> Overdue ({overdueTasks.length})
              </h2>
              <div className="space-y-2 mb-4">
                {overdueTasks.map((t: any) => <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} />)}
              </div>
            </div>
          )}

          {/* Active section */}
          {activeTasks.filter((t: any) => !overdueTasks.includes(t)).length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Active</h2>
              <div className="space-y-2 mb-4">
                {activeTasks.filter((t: any) => !overdueTasks.includes(t)).map((t: any) => <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} />)}
              </div>
            </div>
          )}

          {/* Done section */}
          {doneTasks.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Done</h2>
              <div className="space-y-2">
                {doneTasks.map((t: any) => <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
