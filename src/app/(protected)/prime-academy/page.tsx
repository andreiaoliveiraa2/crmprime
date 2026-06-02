import { GraduationCap } from 'lucide-react'

export default function PrimeAcademyPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-2">
        <GraduationCap size={28} style={{ color: '#b89a6a' }} />
        <h1 className="text-2xl font-bold text-gray-900">Prime Academy</h1>
      </div>
      <p className="text-gray-500 text-sm">Em breve — central de conhecimento e treinamento da A2 Prime.</p>
    </div>
  )
}
