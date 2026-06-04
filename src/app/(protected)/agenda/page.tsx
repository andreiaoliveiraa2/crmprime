import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import AgendaClient from '@/components/AgendaClient'

export default async function AgendaPage() {
  const supabase = await createClient()
  const usuario  = await getUsuarioAtual()

  // Se vendedor não tem vendedor_id no perfil, busca na tabela de vendedores
  let vendedorId: string | null = null
  if (usuario?.perfil === 'vendedor') {
    if (usuario.vendedor_id) {
      vendedorId = usuario.vendedor_id
    } else {
      const { data: vend } = await supabase.from('vendedores').select('id').maybeSingle()
      vendedorId = vend?.id ?? null
    }
  }

  // Admin vê só os próprios eventos (vendedor_id IS NULL)
  // Vendedor vê só os seus eventos (RLS já filtra pelo vendedor_id)
  let query = supabase.from('agenda').select('*').order('data_hora', { ascending: true })
  if (usuario?.perfil === 'admin') {
    query = query.is('vendedor_id', null)
  }
  const { data: eventos } = await query

  return (
    <div className="p-6 md:p-8">
      <AgendaClient
        eventos={eventos ?? []}
        vendedorId={vendedorId}
      />
    </div>
  )
}
