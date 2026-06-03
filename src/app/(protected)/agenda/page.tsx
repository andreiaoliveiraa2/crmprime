import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import AgendaClient from '@/components/AgendaClient'

export default async function AgendaPage() {
  const supabase = await createClient()
  const usuario  = await getUsuarioAtual()

  if (usuario?.perfil === 'vendedor') redirect('/dashboard')

  let query = supabase.from('agenda').select('*').order('data_hora', { ascending: true })
  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    query = query.eq('vendedor_id', usuario.vendedor_id)
  }
  const { data: eventos } = await query

  return (
    <div className="p-6 md:p-8">
      <AgendaClient
        eventos={eventos ?? []}
        vendedorId={usuario?.perfil === 'vendedor' ? (usuario.vendedor_id ?? null) : null}
      />
    </div>
  )
}
