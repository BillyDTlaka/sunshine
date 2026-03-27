'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { usePendingApprovals, useApprove, useReject } from '@/lib/hooks'

export default function ApprovalsPage() {
  const { data: approvals, isLoading } = usePendingApprovals()
  const approve = useApprove()
  const reject = useReject()
  const [comments, setComments] = useState<Record<string, string>>({})
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    await approve.mutateAsync({ id, comments: comments[id] })
    setActiveId(null)
  }

  const handleReject = async (id: string) => {
    if (!comments[id]) { alert('A rejection reason is required'); return }
    await reject.mutateAsync({ id, comments: comments[id] })
    setActiveId(null)
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="page-title">Pending Approvals</h1>

      {isLoading && <div className="text-gray-400 animate-pulse">Loading approvals...</div>}

      {!isLoading && approvals?.length === 0 && (
        <Card><p className="text-gray-400 text-center py-4">No pending approvals — you are all caught up!</p></Card>
      )}

      {approvals?.map((approval: any) => (
        <Card key={approval.id} className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{approval.entityType.replace('_', ' ')}</p>
              {approval.clientQuote && (
                <>
                  <p className="font-semibold text-gray-900">{approval.clientQuote.rfq?.referenceNumber} · {approval.clientQuote.rfq?.client?.name}</p>
                  <p className="text-sm text-gray-500">
                    Quote v{approval.clientQuote.versionNumber} ·
                    <span className="font-medium"> R {Number(approval.clientQuote.totalSell).toLocaleString('en-ZA')}</span> ·
                    GM {Number(approval.clientQuote.grossMarginPct).toFixed(1)}%
                  </p>
                </>
              )}
              {approval.requisition && (
                <>
                  <p className="font-semibold text-gray-900">{approval.requisition.supplier?.name}</p>
                  <p className="text-sm text-gray-500">R {Number(approval.requisition.amount).toLocaleString('en-ZA')}</p>
                </>
              )}
            </div>
            <Badge status="PENDING" />
          </div>

          {activeId === approval.id && (
            <textarea
              className="input h-20 resize-none"
              placeholder="Comments (required for rejection)..."
              value={comments[approval.id] ?? ''}
              onChange={e => setComments(prev => ({ ...prev, [approval.id]: e.target.value }))}
            />
          )}

          <div className="flex gap-2">
            {activeId !== approval.id ? (
              <button className="btn-secondary text-xs py-1.5" onClick={() => setActiveId(approval.id)}>Review</button>
            ) : (
              <>
                <button
                  className="btn-primary text-xs py-1.5"
                  onClick={() => handleApprove(approval.id)}
                  disabled={approve.isPending}
                >
                  Approve
                </button>
                <button
                  className="btn-danger text-xs py-1.5"
                  onClick={() => handleReject(approval.id)}
                  disabled={reject.isPending}
                >
                  Reject
                </button>
                <button className="text-xs text-gray-400 hover:text-gray-700 px-2" onClick={() => setActiveId(null)}>Cancel</button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
