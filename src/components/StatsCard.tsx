type Color = 'blue' | 'green' | 'yellow' | 'red' | 'gray'

interface StatsCardProps {
  title: string
  value: number
  color?: Color
}

const colorClasses: Record<Color, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
}

export default function StatsCard({ title, value, color = 'blue' }: StatsCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}
