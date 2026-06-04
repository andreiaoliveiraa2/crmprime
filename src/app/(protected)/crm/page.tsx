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

  const [{ data: leadsData }, { data: vendedoresData }] = await Promise.all([
    query,
    supabase.from('vendedores').select('id, nome').eq('ativo', true),
  ])

  const vendedorMap: Record<string, string> = Object.fromEntries(
    (vendedoresData ?? []).map(v => [v.id, v.nome])
  )

  const leads = (leadsData ?? []).map(l => ({
    ...l,
    vendedor: l.vendedor || (l.vendedor_id ? vendedorMap[l.vendedor_id] : null) || null,
  }))

  return (
    <div className="p-5 md:p-7">
      <PipelineClient leads={leads} perfil={usuario?.perfil ?? 'admin'} />
    </div>
  )
}
