import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { createClient } from '@/lib/supabase/server'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'
import { Lead } from '@/lib/types'

interface Props {
  searchParams: Promise<{ lead_id?: string }>
}

export default async function NovoClientePage({ searchParams }: Props) {
  const { lead_id } = await searchParams
  const usuario = await getUsuarioAtual()
  const supabase = await createClient()

  let vendedorAtual: { id: string; nome: string } | null = null
  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    const { data } = await supabase
      .from('vendedores')
      .select('id, nome')
      .eq('id', usuario.vendedor_id)
      .single()
    vendedorAtual = data ?? { id: usuario.vendedor_id, nome: '(vendedor não encontrado)' }
  }

  let leadPrefill: Lead | null = null
  if (lead_id) {
    const { data } = await supabase.from('leads').select('*').eq('id', lead_id).single()
    leadPrefill = data ?? null
  }

  const titulo = leadPrefill ? `Converter Lead — ${leadPrefill.nome ?? leadPrefill.telefone ?? 'sem nome'}` : 'Novo Cliente'
  const subtitulo = leadPrefill ? 'Preencha os dados completos do cliente' : 'Cadastre um cliente com plano ativo'

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>{titulo}</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>{subtitulo}</p>
      </div>
      <ClienteFormPosVenda vendedorAtual={vendedorAtual} leadPrefill={leadPrefill} />
    </div>
  )
}
