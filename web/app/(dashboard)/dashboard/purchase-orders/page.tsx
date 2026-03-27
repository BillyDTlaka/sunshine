'use client'
import { Card } from '@/components/Card'
const title = 'purchase-orders'.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="page-title">{title}</h1>
      <Card><p className="text-gray-400 text-sm">This screen is scaffolded and ready for implementation.</p></Card>
    </div>
  )
}
