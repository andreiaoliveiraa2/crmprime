'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Cancela todas as vendas (origem='cliente') e comissões pendentes de um cliente.
// Ownership verificada via RLS: se o SELECT do cliente falhar, o caller não tem acesso.
export async function cancelarCliente(clienteId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Não autenticado'

  // RLS no SELECT garante que vendedor só acessa os próprios clientes.
  // Admin acessa qualquer cliente. Se retornar null, acesso negado.
  const { data: clienteAcesso } = await supabase
    .from('clientes')
    .select('id')
    .eq('id', clienteId)
    .maybeSingle()
  if (!clienteAcesso) return 'Sem permissão para cancelar este cliente'

  const admin = createAdminClient()

  const { data: vendas, error: vendasErr } = await admin
    .from('vendas')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('origem', 'cliente')
  if (vendasErr) return `Erro ao buscar vendas: ${vendasErr.message}`

  const { error: updateVendasErr } = await admin
    .from('vendas')
    .update({ status: 'Cancelado' })
    .eq('cliente_id', clienteId)
    .eq('origem', 'cliente')
  if (updateVendasErr) return `Erro ao cancelar vendas: ${updateVendasErr.message}`

  if (vendas && vendas.length > 0) {
    const vendaIds = vendas.map(v => v.id)
    const { error: comErr } = await admin
      .from('comissoes')
      .update({ status_empresa: 'Cancelado', status_vendedor: 'Cancelado' })
      .in('venda_id', vendaIds)
      .eq('status_empresa', 'Pendente')
    if (comErr) return `Erro ao cancelar comissões: ${comErr.message}`
  }

  return null
}

// Cancela vendas ativas e comissões pendentes ao transicionar cliente para vitalício.
// Mesma verificação de ownership via RLS.
export async function cancelarVendasParaVitalicio(clienteId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Não autenticado'

  const { data: clienteAcesso } = await supabase
    .from('clientes')
    .select('id')
    .eq('id', clienteId)
    .maybeSingle()
  if (!clienteAcesso) return 'Sem permissão para operar neste cliente'

  const admin = createAdminClient()

  const { data: vendasAtivas, error: vendasErr } = await admin
    .from('vendas')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('status', 'Ativo')
    .eq('origem', 'cliente')
  if (vendasErr) return `Erro ao buscar vendas: ${vendasErr.message}`

  if (!vendasAtivas || vendasAtivas.length === 0) return null

  const vendaIds = vendasAtivas.map(v => v.id)

  const { error: updateVendasErr } = await admin
    .from('vendas')
    .update({ status: 'Cancelado' })
    .in('id', vendaIds)
  if (updateVendasErr) return `Erro ao cancelar vendas: ${updateVendasErr.message}`

  const { error: comErr } = await admin
    .from('comissoes')
    .update({ status_empresa: 'Cancelado', status_vendedor: 'Cancelado' })
    .in('venda_id', vendaIds)
    .eq('status_empresa', 'Pendente')
  if (comErr) return `Erro ao cancelar comissões: ${comErr.message}`

  return null
}
