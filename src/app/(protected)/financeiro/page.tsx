import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import FinanceiroClient from '@/components/FinanceiroClient'
import { CnpjRecebimento, DespesaFixa, CategoriaDespesa } from '@/lib/types'

export default async function FinanceiroPage() {
  const usuario = await getUsuarioAtual()
  if (!usuario || usuario.perfil !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const [
    { data: vendas },
    { data: comissoes },
    { data: regras },
    { data: cnpjsRaw },
    { data: operadorasRaw },
    { data: despesasFixasRaw },
    { data: categoriasRaw },
  ] = await Promise.all([
    supabase.from('vendas').select('*').or('origem.eq.manual,cliente_id.not.is.null').order('criado_em', { ascending: false }).limit(5000),
    supabase.from('comissoes').select('*').order('criado_em', { ascending: false }).limit(5000),
    supabase.from('regras_comissao').select('*'),
    supabase.from('cnpjs_recebimento').select('*').order('nome'),
    supabase.from('operadoras').select('id, nome').order('nome'),
    supabase.from('despesas_fixas').select('*').order('nome'),
    supabase.from('categorias_despesa').select('*').eq('ativo', true).order('nome'),
  ])

  // ── Gera contas a pagar do mês atual para despesas fixas ativas ──────────
  const now = new Date()
  const anoAtual = now.getFullYear()
  const mesAtual = now.getMonth()
  const mesStr = String(mesAtual + 1).padStart(2, '0')
  const prefixoMes = `${anoAtual}-${mesStr}`
  const ultimoDiaMes = String(new Date(anoAtual, mesAtual + 1, 0).getDate()).padStart(2, '0')
  const fimMes = `${prefixoMes}-${ultimoDiaMes}`

  const { data: contasMesAtual } = await supabase
    .from('contas')
    .select('despesa_fixa_id')
    .eq('tipo', 'pagar')
    .gte('vencimento', `${prefixoMes}-01`)
    .lte('vencimento', fimMes)
    .not('despesa_fixa_id', 'is', null)

  const despesasComContaNoMes = new Set(
    (contasMesAtual ?? []).map(c => c.despesa_fixa_id).filter(Boolean)
  )

  const despesasParaGerar = (despesasFixasRaw ?? []).filter(
    (d: DespesaFixa) => d.ativo && !despesasComContaNoMes.has(d.id)
  )

  if (despesasParaGerar.length > 0) {
    const ultimoDia = parseInt(ultimoDiaMes)
    const novasContas = despesasParaGerar.map((d: DespesaFixa) => ({
      tipo: 'pagar' as const,
      descricao: d.nome,
      valor: d.valor,
      vencimento: `${prefixoMes}-${String(Math.min(d.dia_vencimento, ultimoDia)).padStart(2, '0')}`,
      status: 'Pendente' as const,
      observacoes: null,
      empresa: d.empresa,
      categoria: d.categoria,
      despesa_fixa_id: d.id,
      cliente_vitalicio_id: null,
      tipo_lancamento: 'recorrente' as const,
      grupo_id: null,
      parcela_numero: null,
      total_parcelas: null,
    }))
    const { error: insertErrDespesas } = await supabase.from('contas').insert(novasContas)
    if (insertErrDespesas && !insertErrDespesas.code?.includes('23505')) {
      console.error('Erro ao gerar contas de despesas fixas:', insertErrDespesas)
    }
  }

  // ── Gera contas a receber dos próximos 12 meses para clientes vitalícios ─
  const { data: clientesVitaliciosRaw } = await supabase
    .from('clientes')
    .select('id, nome, operadora, vitalicio_valor_estimado, vitalicio_dia_previsto')
    .eq('fase_cliente', 'vitalicio')
    .eq('status', 'Ativo')
    .not('vitalicio_valor_estimado', 'is', null)

  // Horizonte de 12 meses: mês atual + próximos 11
  const horizonte = 12
  const fimHorizonte = (() => {
    const d = new Date(anoAtual, mesAtual + horizonte, 0)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const { data: contasVitalicioHorizonte } = await supabase
    .from('contas')
    .select('cliente_vitalicio_id, vencimento')
    .eq('tipo', 'receber')
    .gte('vencimento', `${prefixoMes}-01`)
    .lte('vencimento', fimHorizonte)
    .not('cliente_vitalicio_id', 'is', null)

  // Chave: "clienteId-yyyy-mm" → já existe
  const vitaliciosComConta = new Set(
    (contasVitalicioHorizonte ?? []).map(c => {
      const mes = (c.vencimento as string).substring(0, 7)
      return `${c.cliente_vitalicio_id}-${mes}`
    })
  )

  if ((clientesVitaliciosRaw ?? []).length > 0) {
    type ClienteVit = { id: string; nome: string; operadora: string | null; vitalicio_valor_estimado: number; vitalicio_dia_previsto: number | null }
    const novasContasVitalicio: object[] = []

    for (let i = 0; i < horizonte; i++) {
      const d = new Date(anoAtual, mesAtual + i, 1)
      const ano = d.getFullYear()
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const prefixo = `${ano}-${mes}`
      const ultimoDia = new Date(ano, d.getMonth() + 1, 0).getDate()

      for (const c of clientesVitaliciosRaw as ClienteVit[]) {
        const chave = `${c.id}-${prefixo}`
        if (vitaliciosComConta.has(chave)) continue
        novasContasVitalicio.push({
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
    }

    if (novasContasVitalicio.length > 0) {
      const { error: insertErr } = await supabase.from('contas').insert(novasContasVitalicio)
      if (insertErr && !insertErr.code?.includes('23505')) {
        console.error('Erro ao gerar contas vitalício:', insertErr)
      }
    }
  }

  // ── Busca contas (inclui as recém-geradas) ───────────────────────────────
  const { data: contas } = await supabase
    .from('contas')
    .select('*')
    .order('vencimento', { ascending: true })

  return (
    <div className="p-6 md:p-8">
      <FinanceiroClient
        vendas={vendas ?? []}
        comissoes={comissoes ?? []}
        contas={contas ?? []}
        regras={regras ?? []}
        cnpjs={(cnpjsRaw ?? []) as CnpjRecebimento[]}
        operadoras={(operadorasRaw ?? []) as { id: string; nome: string }[]}
        despesasFixas={(despesasFixasRaw ?? []) as DespesaFixa[]}
        categorias={(categoriasRaw ?? []) as CategoriaDespesa[]}
      />
    </div>
  )
}
