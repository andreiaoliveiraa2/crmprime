import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import AgendaClient from '@/components/AgendaClient'

export default async function AgendaPage() {
  const supabase = await createClient()
  const usuario  = await getUsuarioAtual()

  if (usuario?.perfil === 'vendedor') redirect('/dashboard')

  const { data: eventos } = await supabase
    .from('agenda')
    .select('*')
    .order('data_hora', { ascending: true })

  return (
    <div className="p-6 md:p-8">
      <AgendaClient
        eventos={eventos ?? []}
        vendedorId={null}
      />
    </div>
  )
}
