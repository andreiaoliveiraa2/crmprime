import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { createClient } from '@/lib/supabase/server'
import LeadForm from '@/components/LeadForm'

export default async function NovoLeadPage() {
  const usuario = await getUsuarioAtual()
  let vendedorAtual: { id: string; nome: string } | null = null

  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('vendedores')
      .select('id, nome')
      .eq('id', usuario.vendedor_id)
      .single()
    if (data) vendedorAtual = data
  }

  return (
    <div className="p-5 md:p-7">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#2d1f4e' }}>Novo Lead</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>Preencha os dados do novo contato</p>
      </div>
      <LeadForm vendedorAtual={vendedorAtual} />
    </div>
  )
}
