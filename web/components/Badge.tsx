import { STATUS_COLORS, STATUS_LABELS } from '@/lib/theme'

interface BadgeProps {
  status: string
  label?: string
}

export function Badge({ status, label }: BadgeProps) {
  const color = STATUS_COLORS[status] ?? '#6B7280'
  const text = label ?? STATUS_LABELS[status] ?? status

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ color, backgroundColor: `${color}20` }}
    >
      {text}
    </span>
  )
}
