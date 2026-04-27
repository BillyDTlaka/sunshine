'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import { KpiCard } from '@/components/KpiCard'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useDashboardSummary, useDashboardAlerts, useProjectKanban } from '@/lib/hooks'
import { COLORS, STATUS_LABELS } from '@/lib/theme'

const PIPELINE_COLS = ['NEW_REQUEST', 'ESTIMATING', 'QUOTED', 'SUBMITTED', 'WON', 'EXECUTING']

const PIPELINE_COL_STYLE: Record<string, { dot: string; label: string }> = {
  NEW_REQUEST: { dot: 'bg-gray-400',    label: 'New Request' },
  ESTIMATING:  { dot: 'bg-purple-500',  label: 'Estimating' },
  QUOTED:      { dot: 'bg-blue-500',    label: 'Quoted' },
  SUBMITTED:   { dot: 'bg-amber-500',   label: 'Submitted' },
  WON:         { dot: 'bg-emerald-500', label: 'Won' },
  EXECUTING:   { dot: 'bg-brand',       label: 'Executing' },
}

function PipelineBoard({ board }: { board: Record<string, any[]> }) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {PIPELINE_COLS.map(col => {
        const items: any[] = board[col] ?? []
        const style = PIPELINE_COL_STYLE[col]
        return (
          <div key={col} className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-2">
              <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', style.dot)} />
              <span className="text-xs font-semibold text-gray-600 truncate">{style.label}</span>
              <span className="ml-auto text-xs font-bold text-gray-400">{items.length}</span>
            </div>
            <div className="space-y-1.5">
              {items.slice(0, 4).map((p: any) => (
                <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 hover:border-brand/40 hover:bg-white transition-all cursor-pointer">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{p.client?.name}</p>
                  </div>
                </Link>
              ))}
              {items.length > 4 && (
                <Link href={`/dashboard/projects?status=${col}`}>
                  <p className="text-xs text-brand hover:underline text-center py-1">+{items.length - 4} more</p>
                </Link>
              )}
              {items.length === 0 && <p className="text-xs text-gray-200 text-center py-2">—</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const { data: summary, isLoading } = useDashboardSummary()
  const { data: alerts } = useDashboardAlerts()
  const { data: board } = useProjectKanban()

  if (isLoading) return <div className="animate-pulse text-gray-400 py-12 text-center">Loading dashboard...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">LCK Project Commercial Operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="New Requests"
          value={summary?.newRequests ?? 0}
          icon="📥"
          color={COLORS.gray500}
          sub="Awaiting action"
        />
        <KpiCard
          label="In Execution"
          value={summary?.inExecution ?? 0}
          icon="⚙️"
          color={COLORS.brand}
          sub="Active projects"
        />
        <KpiCard
          label="Pending Approvals"
          value={summary?.pendingApprovals ?? 0}
          icon="✅"
          color={COLORS.warning}
          sub="Awaiting sign-off"
        />
        <KpiCard
          label="Late Projects"
          value={summary?.lateProjects ?? 0}
          icon="⚠️"
          color={COLORS.danger}
          sub="Past deadline"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Month Revenue"
          value={`R ${Number(summary?.monthRevenue ?? 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`}
          icon="💰"
          color={COLORS.success}
          sub="Won this month"
        />
        <KpiCard
          label="Win Rate"
          value={`${summary?.winRate ?? 0}%`}
          icon="🏆"
          color={COLORS.purple}
          sub="All time"
        />
        <KpiCard
          label="Open RFQs"
          value={summary?.openRfqs ?? 0}
          icon="📋"
          color={COLORS.info}
          sub="In pipeline"
        />
        <KpiCard
          label="Unpaid Invoices"
          value={summary?.invoicesOutstanding ?? 0}
          icon="🧾"
          color={COLORS.danger}
          sub="Outstanding"
        />
      </div>

      {/* Pipeline Board */}
      {board && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Project Pipeline</h2>
            <Link href="/dashboard/projects" className="text-xs text-brand hover:underline font-semibold">
              View all →
            </Link>
          </div>
          <PipelineBoard board={board} />
        </Card>
      )}

      {/* Alerts */}
      {alerts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* My overdue tasks */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">My Overdue Tasks</h2>
              <Link href="/dashboard/tasks" className="text-xs text-brand hover:underline">View all</Link>
            </div>
            {alerts.myPendingTasks?.length === 0
              ? <p className="text-sm text-gray-400">No overdue tasks — great work!</p>
              : alerts.myPendingTasks?.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{t.project?.projectId} · {t.project?.title}</p>
                  </div>
                  <Badge status={t.status} />
                </div>
              ))
            }
          </Card>

          {/* Pending approvals */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Pending Approvals</h2>
              <Link href="/dashboard/approvals" className="text-xs text-brand hover:underline">View all</Link>
            </div>
            {alerts.pendingApprovals?.length === 0
              ? <p className="text-sm text-gray-400">No pending approvals</p>
              : alerts.pendingApprovals?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-900">
                    {a.entityType?.replace(/_/g, ' ')}
                  </p>
                  <Badge status="PENDING" />
                </div>
              ))
            }
          </Card>

          {/* Late projects */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Late Projects</h2>
              <Link href="/dashboard/projects" className="text-xs text-brand hover:underline">View all</Link>
            </div>
            {alerts.lateProjects?.length === 0
              ? <p className="text-sm text-gray-400">No late projects</p>
              : alerts.lateProjects?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3">
                  <div className="min-w-0">
                    <Link href={`/dashboard/projects/${p.id}`} className="text-sm font-medium text-gray-900 hover:text-brand truncate block">{p.title}</Link>
                    <p className="text-xs text-gray-400">{p.client?.name} · Due {new Date(p.deadline).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <Badge status={p.status} />
                </div>
              ))
            }
          </Card>

          {/* Overdue invoices */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Overdue Invoices</h2>
              <Link href="/dashboard/invoices" className="text-xs text-brand hover:underline">View all</Link>
            </div>
            {alerts.overdueInvoices?.length === 0
              ? <p className="text-sm text-gray-400">No overdue invoices</p>
              : alerts.overdueInvoices?.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 font-mono">{i.invoiceNumber}</p>
                    <p className="text-xs text-gray-400">{i.client?.name}</p>
                  </div>
                  <Badge status="OVERDUE" />
                </div>
              ))
            }
          </Card>
        </div>
      )}
    </div>
  )
}
