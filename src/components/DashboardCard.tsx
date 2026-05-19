import { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  subtitle?: string
  iconBg?: string
  iconColor?: string
}

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  subtitle,
  iconBg = 'rgba(184,154,106,0.12)',
  iconColor = '#b89a6a',
}: DashboardCardProps) {
  return (
    <div
      className="bg-white p-5 hover:shadow-md transition-shadow duration-200"
      style={{ border: '1px solid #e8e4dd', borderRadius: '12px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-stone-500 leading-snug pr-2">{title}</p>
        <div
          className="p-2 rounded-lg shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>{value}</p>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: '#9a918a' }}>{subtitle}</p>
      )}
    </div>
  )
}
