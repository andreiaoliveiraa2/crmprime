import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FichaVendedor from '@/components/FichaVendedor'

export default async function FichaVendedorPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: vendedor } = await supabase
    .from('vendedores')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!vendedor) notFound()

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
      />
    </div>
  )
}
