'use server'

import { createClient } from '@/lib/supabase/server'

export async function gerarContasVitalicioPeriodo(dataInicio: string, dataFim: string): Promise<void> {
  const supabase = await createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, operadora, vitalicio_valor_estimado, vitalicio_dia_previsto')
    .eq('fase_cliente', 'vitalicio')
    .eq('status', 'Ativo')
    .not('vitalicio_valor_estimado', 'is', null)

  if (!clientes || clientes.length === 0) return

  // Busca contas já geradas no período
  const { data: existentes } = await supabase
    .from('contas')
    .select('cliente_vitalicio_id, vencimento')
    .eq('tipo', 'receber')
    .gte('vencimento', dataInicio)
    .lte('vencimento', dataFim)
    .not('cliente_vitalicio_id', 'is', null)

  const jaExiste = new Set(
    (existentes ?? []).map(c => `${c.cliente_vitalicio_id}-${(c.vencimento as string).substring(0, 7)}`)
  )

  // Itera por todos os meses do período selecionado
  const [sy, sm] = dataInicio.split('-').map(Number)
  const [ey, em] = dataFim.split('-').map(Number)
  const novas: object[] = []

  for (let y = sy, m = sm; y < ey || (y === ey && m <= em); ) {
    const prefixo = `${y}-${String(m).padStart(2, '0')}`
    const ultimoDia = new Date(y, m, 0).getDate()

    for (const c of clientes) {
      const chave = `${c.id}-${prefixo}`
      if (jaExiste.has(chave)) continue
      novas.push({
        tipo: 'receber',
        descricao: `Vitalício — ${c.nome}${c.operadora ? ` (${c.operadora})` : ''}`,
        valor: c.vitalicio_valor_estimado,
        vencimento: `${prefixo}-${String(Math.min(c.vitalicio_dia_previsto ?? 10, ultimoDia)).padStart(2, '0')}`,
        status: 'Pendente',
        observacoes: null,
        empresa: null,
        categoria: 'Vitalício',
        despesa_fixa_id: null,
        cliente_vitalicio_id: c.id,
        tipo_lancamento: 'recorrente',
        grupo_id: null,
        parcela_numero: null,
        total_parcelas: null,
      })
    }

    m++
    if (m > 12) { m = 1; y++ }
  }

  if (novas.length > 0) {
    const { error } = await supabase.from('contas').insert(novas)
    if (error && !error.code?.includes('23505')) {
      console.error('gerarContasVitalicioPeriodo:', error)
    }
  }
}
