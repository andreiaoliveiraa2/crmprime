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
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Editar Lead</h1>
      <p className="text-sm text-stone-500 mb-6">{lead.nome}</p>
      <LeadForm lead={lead} />
    </div>
  )
}
