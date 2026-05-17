import LeadForm from '@/components/LeadForm'

export default function NovoLeadPage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Novo Lead</h1>
      <p className="text-sm text-stone-500 mb-6">Adicione um novo lead ao pipeline</p>
      <LeadForm />
    </div>
  )
}
