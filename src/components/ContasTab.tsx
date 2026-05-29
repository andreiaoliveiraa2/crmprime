'use client'

import { useState, useMemo } from 'react'
import { X, CheckCircle2, AlertCircle, Clock, CalendarClock, UserCheck, Building2 } from 'lucide-react'
import { Conta, CnpjRecebimento, DespesaFixa, CategoriaDespesa, Comissao, Venda } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import ContasUnificadasSection from '@/components/ContasUnificadasSection'

interface Props {
  contas: Conta[]
  comissoes: Comissao[]
  vendas: Venda[]
  onAtualizar: () => void
  cnpjs: CnpjRecebimento[]
  despesasFixas: DespesaFixa[]
  categorias: CategoriaDespesa[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(s: string | null) {
  if (!s) return '—'
  const [y, m, d] = s.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function currentMonthPrefix() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ contas, comissoes }: { contas: Conta[]; comissoes: Comissao[] }) {
  const mes = currentMonthPrefix()
  const today = todayStr()

  const pagarMes = contas.filter(c => c.tipo === 'pagar' && c.vencimento.startsWith(mes))
  const comissoesMes = comissoes.filter(c => c.tipo === 'parcela' && c.status_vendedor === 'Pendente' && c.status_empresa !== 'Direto' && c.data_prevista?.startsWith(mes))
  const totalComissoesMes = comissoesMes.reduce((s, c) => s + (c.valor_vendedor ?? 0), 0)
  const totalPagar = pagarMes.reduce((s, c) => s + c.valor, 0) + totalComissoesMes
  const totalPago = pagarMes.filter(c => c.status === 'Pago').reduce((s, c) => s + c.valor, 0)
  const totalAtraso = contas
    .filter(c => c.tipo === 'pagar' && c.status === 'Pendente' && c.vencimento.split('T')[0] < today)
    .reduce((s, c) => s + c.valor, 0)

  const proxima = contas
    .filter(c => c.tipo === 'pagar' && c.status === 'Pendente' && c.vencimento.split('T')[0] >= today)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0]

  const totalReceberComissoes = comissoes
    .filter(c => c.status_empresa === 'Pendente' && c.data_prevista?.startsWith(mes))
    .reduce((s, c) => s + (c.valor_bruto ?? 0), 0)
  const totalReceberContas = contas
    .filter(c => c.tipo === 'receber' && c.status === 'Pendente' && c.vencimento.startsWith(mes))
    .reduce((s, c) => s + c.valor, 0)
  const totalReceber = totalReceberComissoes + totalReceberContas

  const cards = [
    {
      label: 'Total a pagar no mês',
      value: formatBRL(totalPagar),
      icon: Clock,
      cor: '#2d1f4e',
      bg: '#f0ecf8',
    },
    {
      label: 'Total já pago',
      value: formatBRL(totalPago),
      icon: CheckCircle2,
      cor: '#15803d',
      bg: '#dcfce7',
    },
    {
      label: 'Total em atraso',
      value: formatBRL(totalAtraso),
      icon: AlertCircle,
      cor: '#b91c1c',
      bg: '#fee2e2',
    },
    {
      label: 'Próximo vencimento',
      value: proxima ? formatDate(proxima.vencimento) : '—',
      icon: CalendarClock,
      cor: '#b89a6a',
      bg: '#fdf5e8',
    },
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, cor, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '2px solid #d4af7a' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg p-1.5" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color: cor }} />
              </div>
              <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: cor }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} style={{ color: '#15803d' }} />
          <span className="text-xs font-medium" style={{ color: '#15803d' }}>Total a receber no mês</span>
          <span className="text-xs" style={{ color: '#6b7280' }}>(comissões + contas)</span>
        </div>
        <span className="text-sm font-bold" style={{ color: '#15803d' }}>{formatBRL(totalReceber)}</span>
      </div>
    </div>
  )
}

// ─── Comissões Vendedores Section ────────────────────────────────────────────

function ComissoesVendedoresSection({ comissoes, vendas, onAtualizar }: {
  comissoes: Comissao[]
  vendas: Venda[]
  onAtualizar: () => void
}) {
  const supabase = createClient()
  const vendaMap = useMemo(() => new Map(vendas.map(v => [v.id, v])), [vendas])

  const mv = useMemo(() => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ultimo = new Date(ano, hoje.getMonth() + 1, 0).getDate()
    return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${String(ultimo).padStart(2, '0')}` }
  }, [])

  const [dataInicio, setDataInicio] = useState(mv.inicio)
  const [dataFim, setDataFim] = useState(mv.fim)
  const filtersActive = dataInicio !== mv.inicio || dataFim !== mv.fim

  const pendentes = useMemo(() =>
    comissoes
      .filter(c =>
        c.tipo === 'parcela' &&
        c.status_vendedor === 'Pendente' &&
        c.status_empresa !== 'Direto' &&
        (c.valor_vendedor ?? 0) > 0 &&
        (!dataInicio || c.data_prevista >= dataInicio) &&
        (!dataFim || c.data_prevista <= dataFim)
      )
      .sort((a, b) => {
        if (a.venda_id !== b.venda_id) return a.venda_id.localeCompare(b.venda_id)
        return (a.numero_parcela ?? 0) - (b.numero_parcela ?? 0)
      }),
    [comissoes, dataInicio, dataFim]
  )

  const total = pendentes.reduce((s, c) => s + (c.valor_vendedor ?? 0), 0)

  async function marcarPago(c: Comissao) {
    await supabase.from('comissoes').update({
      status_vendedor: 'Recebido',
      data_recebida_vendedor: new Date().toISOString().split('T')[0],
    }).eq('id', c.id)
    onAtualizar()
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: '1px solid #f0ece6' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#fce7f3' }}>
            <UserCheck size={15} style={{ color: '#be185d' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#2d1f4e' }}>Comissões a Pagar — Vendedores</h3>
            <p className="text-xs mt-0.5" style={{ color: '#b89a6a' }}>
              Total pendente: <span className="font-semibold">{formatBRL(total)}</span>
            </p>
          </div>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">De</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
              className="border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none" style={{ borderColor: '#e8e4dd' }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Até</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
              className="border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none" style={{ borderColor: '#e8e4dd' }} />
          </div>
          {filtersActive && (
            <button onClick={() => { setDataInicio(mv.inicio); setDataFim(mv.fim) }}
              className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50"
              style={{ borderColor: '#e8e4dd', color: '#6b7280' }}>
              Mês atual
            </button>
          )}
        </div>
      </div>

      {pendentes.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm" style={{ color: '#9ca3af' }}>
          Nenhuma comissão pendente para vendedores.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#f9f8f6', color: '#6b7280' }}>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Vendedor</th>
                <th className="px-4 py-3 text-left font-medium">Operadora</th>
                <th className="px-4 py-3 text-left font-medium">Parcela</th>
                <th className="px-4 py-3 text-left font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Vencimento</th>
                <th className="px-4 py-3 text-left font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendentes.map(c => {
                const venda = vendaMap.get(c.venda_id)
                const overdue = c.data_prevista && c.data_prevista < todayStr()
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors"
                    style={overdue ? { backgroundColor: '#fff8f8' } : undefined}>
                    <td className="px-4 py-3 font-medium" style={{ color: overdue ? '#b91c1c' : '#1f2937' }}>
                      {venda?.cliente_nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{venda?.vendedor ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{venda?.operadora ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{c.numero_parcela === 1 ? 'Adesão' : `Parcela ${c.numero_parcela}`}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#be185d' }}>
                      {formatBRL(c.valor_vendedor ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                        {formatDate(c.data_prevista)}
                      </span>
                      {overdue && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Vencido</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => marcarPago(c)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
                      >
                        Pagar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Comissões a Receber (Operadora) Section ─────────────────────────────────

function ComissoesAReceberSection({ comissoes, vendas, onAtualizar }: {
  comissoes: Comissao[]
  vendas: Venda[]
  onAtualizar: () => void
}) {
  const supabase = createClient()
  const vendaMap = useMemo(() => new Map(vendas.map(v => [v.id, v])), [vendas])

  const mv = useMemo(() => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ultimo = new Date(ano, hoje.getMonth() + 1, 0).getDate()
    return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${String(ultimo).padStart(2, '0')}` }
  }, [])

  const [dataInicio, setDataInicio] = useState(mv.inicio)
  const [dataFim, setDataFim] = useState(mv.fim)

  const temFiltro = dataInicio !== mv.inicio || dataFim !== mv.fim
  function limpar() { setDataInicio(mv.inicio); setDataFim(mv.fim) }

  // Quantos meses completos estão no período selecionado
  const numMeses = useMemo(() => {
    if (!dataInicio || !dataFim) return 1
    const [sy, sm] = dataInicio.split('-').map(Number)
    const [ey, em] = dataFim.split('-').map(Number)
    return Math.max(1, (ey - sy) * 12 + (em - sm) + 1)
  }, [dataInicio, dataFim])

  const pendentes = useMemo(() =>
    comissoes
      .filter(c => {
        if (!c.data_prevista) return false
        // Vitalício: recorrente — aparece sempre (não depende do período selecionado),
        // independente de status (já foi recebido este mês mas volta no próximo)
        if (c.tipo === 'vitalicio') {
          return c.status_empresa !== 'Cancelado'
        }
        // Parcelas: só quando Pendente e no mês exato
        return c.status_empresa === 'Pendente' && c.data_prevista >= dataInicio && c.data_prevista <= dataFim
      })
      .sort((a, b) => {
        if (a.venda_id !== b.venda_id) return a.venda_id.localeCompare(b.venda_id)
        if (a.tipo === 'parcela' && b.tipo === 'vitalicio') return -1
        if (a.tipo === 'vitalicio' && b.tipo === 'parcela') return 1
        return (a.numero_parcela ?? 999) - (b.numero_parcela ?? 999)
      }),
    [comissoes, dataInicio, dataFim]
  )

  // Vitalício multiplica pelo número de meses do período
  const total = pendentes.reduce((s, c) => {
    const valor = c.valor_bruto ?? 0
    return s + (c.tipo === 'vitalicio' ? valor * numMeses : valor)
  }, 0)

  async function marcarRecebido(c: Comissao) {
    await supabase.from('comissoes').update({
      status_empresa: 'Recebido',
      data_recebida_empresa: new Date().toISOString().split('T')[0],
    }).eq('id', c.id)
    onAtualizar()
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #f0ece6' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#e0f2fe' }}>
              <Building2 size={15} style={{ color: '#0369a1' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#2d1f4e' }}>Comissões a Receber — Operadora</h3>
              <p className="text-xs mt-0.5" style={{ color: '#b89a6a' }}>
                Total no período: <span className="font-semibold">{formatBRL(total)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs" style={{ color: '#6b7280' }}>De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs" style={{ color: '#6b7280' }}>Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }}
              />
            </div>
            {temFiltro && (
              <button onClick={limpar} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-80" style={{ color: '#6b7280', border: '1px solid #e8e4dd' }}>
                <X size={11} /> Mês atual
              </button>
            )}
          </div>
        </div>
      </div>

      {pendentes.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm" style={{ color: '#9ca3af' }}>
          Nenhuma comissão pendente para o período selecionado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#f9f8f6', color: '#6b7280' }}>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Operadora</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Parcela</th>
                <th className="px-4 py-3 text-left font-medium">Valor Bruto</th>
                <th className="px-4 py-3 text-left font-medium">Data Prevista</th>
                <th className="px-4 py-3 text-left font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#f0ece6' }}>
              {pendentes.map(c => {
                const venda = vendaMap.get(c.venda_id)
                const overdue = c.data_prevista < new Date().toISOString().split('T')[0]
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>
                      {venda?.cliente_nome ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#6b7280' }}>
                      {venda?.operadora ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={c.tipo === 'parcela'
                          ? { backgroundColor: '#ede9f8', color: '#2d1f4e' }
                          : { backgroundColor: '#fef3c7', color: '#92400e' }}>
                        {c.tipo === 'parcela' ? 'Parcela' : 'Vitalício'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: '#6b7280' }}>
                      {c.numero_parcela ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#15803d' }}>
                      {c.tipo === 'vitalicio' && numMeses > 1
                        ? <>{formatBRL(c.valor_bruto ?? 0)} <span className="text-xs font-normal" style={{ color: '#9a918a' }}>× {numMeses} meses = {formatBRL((c.valor_bruto ?? 0) * numMeses)}</span></>
                        : formatBRL(c.valor_bruto ?? 0)
                      }
                    </td>
                    <td className="px-4 py-3">
                      {c.tipo === 'vitalicio'
                        ? <span className="text-xs font-medium" style={{ color: '#b89a6a' }}>Recorrente mensal</span>
                        : <>
                            <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                              {formatDate(c.data_prevista)}
                            </span>
                            {overdue && <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Vencido</span>}
                          </>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => marcarRecebido(c)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#0369a1', color: '#ffffff' }}
                      >
                        Receber
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── ContasTab (main export) ──────────────────────────────────────────────────

export default function ContasTab({ contas, comissoes, vendas, onAtualizar, cnpjs, categorias }: Props) {
  return (
    <div className="space-y-6">
      <SummaryCards contas={contas} comissoes={comissoes} />
      <ComissoesAReceberSection comissoes={comissoes} vendas={vendas} onAtualizar={onAtualizar} />
      <ComissoesVendedoresSection comissoes={comissoes} vendas={vendas} onAtualizar={onAtualizar} />
      <ContasUnificadasSection contas={contas} cnpjs={cnpjs} categorias={categorias} onAtualizar={onAtualizar} />
    </div>
  )
}
