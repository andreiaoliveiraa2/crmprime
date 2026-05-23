import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import ClientesClient from '@/components/ClientesClient'

export default async function ClientesPage() {
  const supabase = await createClient()
  const usuario  = await getUsuarioAtual()

  let query = supabase.from('clientes').select('*').order('criado_em', { ascending: false })
  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    query = query.eq('vendedor_id', usuario.vendedor_id)
  }
  const { data: clientes } = await query

  return (
    <div className="p-6 md:p-8">
      <ClientesClient clientes={clientes ?? []} />
    </div>
  )
}
