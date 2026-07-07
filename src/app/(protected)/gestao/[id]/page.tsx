import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FichaVendedor from '@/components/FichaVendedor'

export default async function FichaVendedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const agora = new Date()
  const mesRef = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`

  const [{ data: vendedor }, { data: usuarioVendedor }, { data: operadorasRaw }, { data: metasVend }] = await Promise.all([
    supabase.from('vendedores').select('*').eq('id', id).single(),
    supabase.from('usuarios').select('id, perfil, ativo').eq('vendedor_id', id).maybeSingle(),
    supabase.from('operadoras').select('nome').order('nome'),
    supabase.from('metas').select('operadora, meta_valor').eq('vendedor_id', id).eq('mes_referencia', mesRef),
  ])

  if (!vendedor) notFound()

  const operadoras = (operadorasRaw ?? []).map((o: { nome: string }) => o.nome)
  const metasIniciais: Record<string, number> = {}
  for (const m of (metasVend ?? []) as { operadora: string; meta_valor: number }[]) metasIniciais[m.operadora] = m.meta_valor

  const { data: vendas } = await supabase
    .from('vendas')
    .select('*')
    .eq('vendedor', vendedor.nome)
    .order('data_venda', { ascending: false })

  const vendaIds = (vendas ?? []).map((v: { id: string }) => v.id)
  const { data: comissoes } = vendaIds.length > 0
    ? await supabase.from('comissoes').select('*').in('venda_id', vendaIds)
    : { data: [] }

  return (
    <div className="p-6 md:p-8">
      <FichaVendedor
        vendedor={vendedor}
        vendas={vendas ?? []}
        comissoes={comissoes ?? []}
        usuarioVinculado={usuarioVendedor ?? null}
        operadoras={operadoras}
        mesRef={mesRef}
        metasIniciais={metasIniciais}
      />
    </div>
  )
}
