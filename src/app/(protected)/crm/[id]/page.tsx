import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeadForm from '@/components/LeadForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarLeadPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  return (
    <div className="p-5 md:p-7">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#2d1f4e' }}>Editar Lead</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>{lead.nome ?? lead.telefone ?? 'Lead sem nome'}</p>
      </div>
      <LeadForm lead={lead} />
    </div>
  )
}
