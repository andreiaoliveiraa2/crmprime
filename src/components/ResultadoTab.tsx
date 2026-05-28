'use client'

import { useState, useMemo } from 'react'
import { Printer } from 'lucide-react'
import { Comissao, Conta, DespesaFixa, Venda } from '@/lib/types'

interface Props {
  comissoes: Comissao[]
  contas: Conta[]
  despesasFixas: DespesaFixa[]
  vendas: Venda[]
}

function formatBRL(v: number) {
  return `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthRange(ym: string): [string, string] {
  const [y, m] = ym.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return [`${ym}-01`, `${ym}-${String(last).padStart(2, '0')}`]
}

function inRange(date: string | null | undefined, start: string, end: string) {
  if (!date) return false
  return date.split('T')[0] >= start && date.split('T')[0] <= end
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function TRow({ label, bruto, lucroProj, lucroReal, bold }: {
  label: string
  bruto: number
  lucroProj: number
  lucroReal: number
  bold?: boolean
}) {
  const cls = bold ? 'font-bold' : ''
  return (
    <tr style={{ borderBottom: bold ? undefined : '1px solid #f0ece6', borderTop: bold ? '2px solid #e8e4dd' : undefined }}>
      <td className={`px-5 py-3 text-sm ${cls}`} style={{ color: '#2d1f4e' }}>{label}</td>
      <td className={`px-5 py-3 text-sm text-right ${cls}`} style={{ color: '#2d1f4e' }}>{formatBRL(bruto)}</td>
      <td className={`px-5 py-3 text-sm text-right ${cls}`} style={{ color: '#15803d' }}>{formatBRL(lucroProj)}</td>
      <td className={`px-5 py-3 text-sm text-right ${cls}`} style={{ color: '#b89a6a' }}>{formatBRL(lucroReal)}</td>
    </tr>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

function monthsBetween(start: string, end: string): number {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  return Math.max(1, (ey - sy) * 12 + (em - sm) + 1)
}

export default function ResultadoTab({ comissoes, contas, despesasFixas, vendas }: Props) {
  const [modo, setModo] = useState<'mes' | 'periodo'>('mes')
  const [anoMes, setAnoMes] = useState(currentYearMonth())
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [start, end] = useMemo<[string, string]>(() => {
    if (modo === 'mes') return monthRange(anoMes)
    if (dataInicio && dataFim) return [dataInicio, dataFim]
    return ['', '']
  }, [modo, anoMes, dataInicio, dataFim])

  const hasRange = start !== '' && end !== ''

  const numMeses = useMemo(
    () => hasRange ? monthsBetween(start, end) : 1,
    [start, end, hasRange]
  )

  const labelMes = useMemo(() => {
    if (modo === 'mes')
      return new Date(anoMes + '-15').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    if (hasRange)
      return `${start.split('-').reverse().join('/')} – ${end.split('-').reverse().join('/')}`
    return ''
  }, [modo, anoMes, start, end, hasRange])

  // Join com vendas para obter nome do vendedor
  const vendaMap = useMemo(() => new Map(vendas.map(v => [v.id, v])), [vendas])

  // Comissões ativas (excluindo Direto — não passam pelo caixa da corretora; e vitalicio — já contabilizado em contas a receber)
  const comissoesAtivas = useMemo(() =>
    comissoes.filter(c => c.status_empresa !== 'Direto' && c.tipo !== 'vitalicio'),
    [comissoes]
  )

  // Pendentes com data_prevista no período selecionado
  const pendentesMes = useMemo(() => {
    if (!hasRange) return []
    return comissoesAtivas.filter(c =>
      c.status_empresa === 'Pendente' && inRange(c.data_prevista, start, end)
    )
  }, [comissoesAtivas, start, end, hasRange])

  // Recebidas com data_recebida_empresa no período selecionado
  const recebidosMes = useMemo(() => {
    if (!hasRange) return []
    return comissoesAtivas.filter(c =>
      c.status_empresa === 'Recebido' && inRange(c.data_recebida_empresa, start, end)
    )
  }, [comissoesAtivas, start, end, hasRange])

  // Totais do mês
  const brutoTotal = useMemo(() =>
    pendentesMes.reduce((s, c) => s + c.valor_bruto, 0), [pendentesMes])

  const lucroProjecaoTotal = useMemo(() =>
    pendentesMes.reduce((s, c) => s + (c.valor_empresa ?? 0), 0), [pendentesMes])

  const lucroRealizadoTotal = useMemo(() =>
    recebidosMes.reduce((s, c) => s + (c.valor_empresa ?? 0), 0), [recebidosMes])

  // Tabela por vendedor
  const porVendedor = useMemo(() => {
    const map = new Map<string, { bruto: number; lucroProj: number; lucroReal: number }>()

    for (const c of pendentesMes) {
      const nome = vendaMap.get(c.venda_id)?.vendedor ?? '—'
      const prev = map.get(nome) ?? { bruto: 0, lucroProj: 0, lucroReal: 0 }
      prev.bruto += c.valor_bruto
      prev.lucroProj += c.valor_empresa ?? 0
      map.set(nome, prev)
    }

    for (const c of recebidosMes) {
      const nome = vendaMap.get(c.venda_id)?.vendedor ?? '—'
      const prev = map.get(nome) ?? { bruto: 0, lucroProj: 0, lucroReal: 0 }
      prev.lucroReal += c.valor_empresa ?? 0
      map.set(nome, prev)
    }

    return Array.from(map.entries())
      .map(([nome, vals]) => ({ nome, ...vals }))
      .sort((a, b) => b.lucroProj - a.lucroProj)
  }, [pendentesMes, recebidosMes, vendaMap])

  // Tabela por operadora
  const porOperadora = useMemo(() => {
    const map = new Map<string, { bruto: number; lucroProj: number; lucroReal: number }>()

    for (const c of pendentesMes) {
      const nome = vendaMap.get(c.venda_id)?.operadora ?? '—'
      const prev = map.get(nome) ?? { bruto: 0, lucroProj: 0, lucroReal: 0 }
      prev.bruto += c.valor_bruto
      prev.lucroProj += c.valor_empresa ?? 0
      map.set(nome, prev)
    }

    for (const c of recebidosMes) {
      const nome = vendaMap.get(c.venda_id)?.operadora ?? '—'
      const prev = map.get(nome) ?? { bruto: 0, lucroProj: 0, lucroReal: 0 }
      prev.lucroReal += c.valor_empresa ?? 0
      map.set(nome, prev)
    }

    return Array.from(map.entries())
      .map(([nome, vals]) => ({ nome, ...vals }))
      .sort((a, b) => b.lucroProj - a.lucroProj)
  }, [pendentesMes, recebidosMes, vendaMap])

  // Despesas e contas do mês
  const despesasFixasTotal = useMemo(() =>
    despesasFixas.filter(d => d.ativo).reduce((s, d) => s + d.valor, 0) * numMeses,
    [despesasFixas, numMeses]
  )

  const contasReceberMes = useMemo(() => {
    if (!hasRange) return 0
    return contas.filter(c => c.tipo === 'receber' && c.status === 'Pendente' && inRange(c.vencimento, start, end))
      .reduce((s, c) => s + c.valor, 0)
  }, [contas, start, end, hasRange])

  const contasPagarMes = useMemo(() => {
    if (!hasRange) return 0
    return contas.filter(c => c.tipo === 'pagar' && c.status === 'Pendente' && inRange(c.vencimento, start, end))
      .reduce((s, c) => s + c.valor, 0)
  }, [contas, start, end, hasRange])

  // despesasFixasTotal só entra no resultado quando não há contas geradas para o período
  // (evita dupla contagem no mês corrente e preserva projeção para meses futuros)
  const temContasFixasNoPeriodo = useMemo(() =>
    hasRange && contas.some(c => c.despesa_fixa_id != null && inRange(c.vencimento, start, end)),
    [contas, start, end, hasRange]
  )
  const despesasProjetadas = temContasFixasNoPeriodo ? 0 : despesasFixasTotal

  const resultadoFinal = lucroProjecaoTotal + lucroRealizadoTotal + contasReceberMes - contasPagarMes - despesasProjetadas
  const positivo = resultadoFinal >= 0

  const temExtras = despesasProjetadas > 0 || contasPagarMes > 0 || contasReceberMes > 0

  return (
    <div className="space-y-5">

      {/* Título visível só na impressão */}
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-bold" style={{ color: '#2d1f4e' }}>Resultado — A2 Prime Corretora de Seguros</h2>
        {labelMes && <p className="text-sm capitalize mt-0.5" style={{ color: '#9a918a' }}>{labelMes}</p>}
      </div>

      {/* Filtro de período */}
      <div className="print:hidden bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
        <div className="flex flex-wrap items-center gap-3">

          {/* Toggle Mês / Período */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
            {(['mes', 'periodo'] as const).map(m => (
              <button key={m} onClick={() => setModo(m)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ backgroundColor: modo === m ? '#2d1f4e' : '#fff', color: modo === m ? '#fff' : '#9a918a' }}>
                {m === 'mes' ? 'Mês' : 'Período'}
              </button>
            ))}
          </div>

          {modo === 'mes' ? (
            <input type="month" value={anoMes} onChange={e => setAnoMes(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#e8e4dd', color: '#2d1f4e' }} />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                className="border rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: '#e8e4dd', color: '#2d1f4e' }} />
              <span className="text-sm" style={{ color: '#9a918a' }}>até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                className="border rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: '#e8e4dd', color: '#2d1f4e' }} />
            </div>
          )}

          {labelMes && (
            <span className="text-sm capitalize ml-1" style={{ color: '#9a918a' }}>{labelMes}</span>
          )}
        </div>
      </div>

      {/* Aviso quando período não preenchido */}
      {!hasRange && (
        <p className="text-sm text-center py-6" style={{ color: '#9a918a' }}>
          Selecione a data de início e fim para ver o resultado.
        </p>
      )}

      {hasRange && (
        <>
          {/* Botão imprimir */}
          <div className="print:hidden flex justify-end">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: '#2d1f4e', color: '#fff' }}
            >
              <Printer size={15} />
              Imprimir / Salvar PDF
            </button>
          </div>

          {/* Cards resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e4dd' }}>
              <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#9a918a' }}>Bruto Previsto</p>
              <p className="text-xl font-bold" style={{ color: '#2d1f4e' }}>{formatBRL(brutoTotal)}</p>
              <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Total da operadora (antes de repassar)</p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e4dd' }}>
              <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#9a918a' }}>Lucro Previsto</p>
              <p className="text-xl font-bold" style={{ color: '#15803d' }}>{formatBRL(lucroProjecaoTotal)}</p>
              <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Sua parte após repasse ao vendedor</p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e4dd' }}>
              <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#9a918a' }}>Lucro Realizado</p>
              <p className="text-xl font-bold" style={{ color: '#b89a6a' }}>{formatBRL(lucroRealizadoTotal)}</p>
              <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Parcelas efetivamente recebidas</p>
            </div>
          </div>

          {/* Tabela por vendedor */}
          {porVendedor.length > 0 ? (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
              <div className="px-5 pt-5 pb-3">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9a918a' }}>
                  Por Vendedor — {labelMes}
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0ece6', borderTop: '1px solid #f0ece6' }}>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: '#9a918a' }}>Vendedor</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: '#9a918a' }}>Bruto Previsto</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: '#9a918a' }}>Lucro Previsto</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: '#9a918a' }}>Lucro Realizado</th>
                  </tr>
                </thead>
                <tbody>
                  {porVendedor.map((v, i) => (
                    <TRow key={i} label={v.nome} bruto={v.bruto} lucroProj={v.lucroProj} lucroReal={v.lucroReal} />
                  ))}
                  <TRow label="Total" bruto={brutoTotal} lucroProj={lucroProjecaoTotal} lucroReal={lucroRealizadoTotal} bold />
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #e8e4dd' }}>
              <p className="text-sm" style={{ color: '#9a918a' }}>Nenhuma comissão prevista para {labelMes}.</p>
            </div>
          )}

          {/* Tabela por operadora */}
          {porOperadora.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
              <div className="px-5 pt-5 pb-3">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9a918a' }}>
                  Por Operadora — {labelMes}
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0ece6', borderTop: '1px solid #f0ece6' }}>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: '#9a918a' }}>Operadora</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: '#9a918a' }}>Bruto Previsto</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: '#9a918a' }}>Lucro Previsto</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: '#9a918a' }}>Lucro Realizado</th>
                  </tr>
                </thead>
                <tbody>
                  {porOperadora.map((v, i) => (
                    <TRow key={i} label={v.nome} bruto={v.bruto} lucroProj={v.lucroProj} lucroReal={v.lucroReal} />
                  ))}
                  <TRow label="Total" bruto={brutoTotal} lucroProj={lucroProjecaoTotal} lucroReal={lucroRealizadoTotal} bold />
                </tbody>
              </table>
            </div>
          )}

          {/* Resultado final (com despesas e contas) */}
          {temExtras && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
              <p className="text-xs font-bold mb-4 uppercase tracking-wide" style={{ color: '#9a918a' }}>
                Resultado Final — {labelMes}
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#5a4e3c' }}>Lucro previsto (comissões)</span>
                  <span className="font-semibold" style={{ color: '#15803d' }}>+ {formatBRL(lucroProjecaoTotal)}</span>
                </div>
                {lucroRealizadoTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#5a4e3c' }}>Lucro realizado (comissões recebidas)</span>
                    <span className="font-semibold" style={{ color: '#b89a6a' }}>+ {formatBRL(lucroRealizadoTotal)}</span>
                  </div>
                )}
                {contasReceberMes > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#5a4e3c' }}>Contas a receber no período</span>
                    <span className="font-semibold" style={{ color: '#15803d' }}>+ {formatBRL(contasReceberMes)}</span>
                  </div>
                )}
                {contasPagarMes > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#5a4e3c' }}>Contas a pagar no período</span>
                    <span className="font-semibold" style={{ color: '#b91c1c' }}>− {formatBRL(contasPagarMes)}</span>
                  </div>
                )}
                {despesasProjetadas > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#5a4e3c' }}>
                      Despesas fixas projetadas{numMeses > 1 ? ` (${numMeses} meses)` : ''}
                    </span>
                    <span className="font-semibold" style={{ color: '#b91c1c' }}>− {formatBRL(despesasProjetadas)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '2px solid #e8e4dd' }}>
                  <span className="font-bold text-sm" style={{ color: '#2d1f4e' }}>Resultado final</span>
                  <span className="text-lg font-bold" style={{ color: positivo ? '#15803d' : '#b91c1c' }}>
                    {positivo ? '' : '− '}{formatBRL(resultadoFinal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <p className="print:hidden text-xs text-center" style={{ color: '#9a918a' }}>
            Bruto: total da operadora. Lucro previsto: sua parte (após repasse), comissões com data prevista no período.
            Realizado: parcelas marcadas como recebidas.
          </p>
        </>
      )}
    </div>
  )
}
