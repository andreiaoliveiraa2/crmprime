import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import FinanceiroClient from '@/components/FinanceiroClient'
import { CnpjRecebimento, DespesaFixa, CategoriaDespesa } from '@/lib/types'

export default async function FinanceiroPage() {
  const usuario = await getUsuarioAtual()
  if (usuario !== null && usuario.perfil !== 'admin') redirect('/dashboard')

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
    supabase.from('vendas').select('*').or('origem.eq.manual,cliente_id.not.is.null').order('criado_em', { ascending: false }).limit(100),
    supabase.from('comissoes').select('*').order('criado_em', { ascending: false }).limit(200),
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

  const { data: contasMesAtual } = await supabase
    .from('contas')
    .select('despesa_fixa_id')
    .eq('tipo', 'pagar')
    .gte('vencimento', `${prefixoMes}-01`)
    .lte('vencimento', `${prefixoMes}-31`)
    .not('despesa_fixa_id', 'is', null)

  const despesasComContaNoMes = new Set(
    (contasMesAtual ?? []).map(c => c.despesa_fixa_id).filter(Boolean)
  )

  const despesasParaGerar = (despesasFixasRaw ?? []).filter(
    (d: DespesaFixa) => d.ativo && !despesasComContaNoMes.has(d.id)
  )

  if (despesasParaGerar.length > 0) {
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate()
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
      tipo_lancamento: 'recorrente' as const,
      grupo_id: null,
      parcela_numero: null,
      total_parcelas: null,
    }))
    await supabase.from('contas').insert(novasContas)
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
