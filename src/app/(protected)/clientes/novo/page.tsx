import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { createClient } from '@/lib/supabase/server'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'

export default async function NovoClientePage() {
  const usuario = await getUsuarioAtual()
  let vendedorAtual: { id: string; nome: string } | null = null

  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('vendedores')
      .select('id, nome')
      .eq('id', usuario.vendedor_id)
      .single()
    if (data) {
      vendedorAtual = data
    } else {
      // vendedor_id set but record not found — lock field to prevent arbitrary selection
      vendedorAtual = { id: usuario.vendedor_id, nome: '(vendedor não encontrado)' }
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Novo Cliente</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>Cadastre um cliente com plano ativo</p>
      </div>
      <ClienteFormPosVenda vendedorAtual={vendedorAtual} />
    </div>
  )
}
