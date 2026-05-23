import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import PipelineClient from '@/components/PipelineClient'

export default async function CrmPage() {
  const supabase = await createClient()
  const usuario  = await getUsuarioAtual()

  let query = supabase.from('leads').select('*').order('criado_em', { ascending: false })
  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    query = query.eq('vendedor_id', usuario.vendedor_id)
  }
  const { data: leads } = await query

  return (
    <div className="p-5 md:p-7">
      <PipelineClient leads={leads ?? []} perfil={usuario?.perfil ?? 'admin'} />
    </div>
  )
}
