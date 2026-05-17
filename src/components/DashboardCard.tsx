import { LucideIcon } from 'lucide-react'

type CardColor = 'violet' | 'blue' | 'amber' | 'emerald'

interface DashboardCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: CardColor
  subtitle?: string
}

const colorMap: Record<CardColor, { bg: string; border: string; icon: string; value: string }> = {
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    icon: 'text-violet-500 bg-violet-100',
    value: 'text-violet-700',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    icon: 'text-blue-500 bg-blue-100',
    value: 'text-blue-700',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    icon: 'text-amber-500 bg-amber-100',
    value: 'text-amber-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    icon: 'text-emerald-500 bg-emerald-100',
    value: 'text-emerald-700',
  },
}

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: DashboardCardProps) {
  const c = colorMap[color]
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-6 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-stone-500">{title}</p>
        <div className={`p-2.5 rounded-xl ${c.icon}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
      {subtitle && <p className="text-xs text-stone-400 mt-1">{subtitle}</p>}
    </div>
  )
}
