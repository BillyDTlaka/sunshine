import { Card } from './Card'

interface KpiCardProps {
  label: string
  value: string | number
  icon: string
  color?: string
  sub?: string
}

export function KpiCard({ label, value, icon, color = '#8B3A3A', sub }: KpiCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </Card>
  )
}
