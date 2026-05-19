import LeadForm from '@/components/LeadForm'

export default function NovoLeadPage() {
  return (
    <div className="p-5 md:p-7">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#2d1f4e' }}>Novo Lead</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
          Preencha os dados do novo contato
        </p>
      </div>
      <LeadForm />
    </div>
  )
}
