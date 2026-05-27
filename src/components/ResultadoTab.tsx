'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Comissao, Conta, DespesaFixa } from '@/lib/types'

interface Props {
  comissoes: Comissao[]
  contas: Conta[]
  despesasFixas: DespesaFixa[]
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

function monthsBetween(start: string, end: string): number {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  return Math.max(1, (ey - sy) * 12 + (em - sm) + 1)
}

function inRange(date: string | null | undefined, start: string, end: string) {
  if (!date) return false
  const d = date.split('T')[0]
  return d >= start && d <= end
}

// ─── Row de item ──────────────────────────────────────────────────────────────

function ItemRow({ label, valor, cor }: { label: string; valor: number; cor?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1" style={{ borderBottom: '1px solid #f0ece6' }}>
      <span className="text-sm" style={{ color: '#5a4e3c' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: cor ?? '#2d1f4e' }}>
        {formatBRL(valor)}
      </span>
    </div>
  )
}

// ─── Bloco (entradas ou saídas) ───────────────────────────────────────────────

function Bloco({
  titulo, itens, total, corTotal,
}: {
  titulo: string
  itens: { label: string; valor: number }[]
  total: number
  corTotal: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
      <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#9a918a' }}>{titulo}</p>
      <div>
        {itens.map((item, i) => (
          <ItemRow key={i} label={item.label} valor={item.valor} />
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '2px solid #e8e4dd' }}>
        <span className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Total</span>
        <span className="text-base font-bold" style={{ color: corTotal }}>{formatBRL(total)}</span>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ResultadoTab({ comissoes, contas, despesasFixas }: Props) {
  const [modo, setModo] = useState<'mes' | 'periodo'>('mes')
  const [anoMes, setAnoMes] = useState(currentYearMonth())
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [visao, setVisao] = useState<'projecao' | 'realizado'>('projecao')

  const [start, end] = useMemo<[string, string]>(() => {
    if (modo === 'mes') return monthRange(anoMes)
    if (dataInicio && dataFim) return [dataInicio, dataFim]
    return ['', '']
  }, [modo, anoMes, dataInicio, dataFim])

  const hasRange = start !== '' && end !== ''

  const numMeses = useMemo(() => hasRange ? monthsBetween(start, end) : 1, [start, end, hasRange])

  // ── Entradas ────────────────────────────────────────────────────────────────
  // Projeção: todos os pendentes (sem filtro de data — comissões futuras já existem)
  // Realizado: apenas o que foi recebido/pago no período selecionado

  const comissoesCorretora = useMemo(() => {
    if (visao === 'projecao') {
      return comissoes
        .filter(c => c.status_empresa === 'Pendente')
        .reduce((s, c) => s + (c.valor_empresa ?? 0), 0)
    }
    if (!hasRange) return 0
    return comissoes
      .filter(c => c.status_empresa === 'Recebido' && inRange(c.data_recebida_empresa, start, end))
      .reduce((s, c) => s + (c.valor_empresa ?? 0), 0)
  }, [comissoes, start, end, hasRange, visao])

  const contasReceber = useMemo(() => {
    if (visao === 'projecao') {
      return contas
        .filter(c => c.tipo === 'receber' && c.status === 'Pendente')
        .reduce((s, c) => s + c.valor, 0)
    }
    if (!hasRange) return 0
    return contas
      .filter(c => c.tipo === 'receber' && c.status === 'Pago' && inRange(c.vencimento, start, end))
      .reduce((s, c) => s + c.valor, 0)
  }, [contas, start, end, hasRange, visao])

  const totalEntradas = comissoesCorretora + contasReceber

  // ── Saídas ──────────────────────────────────────────────────────────────────
  // NOTA: comissões dos vendedores NÃO entram aqui.
  // valor_empresa já é o valor líquido da corretora (o que sobra depois de separar a parte do vendedor).
  // Incluir valor_vendedor como saída seria subtrair duas vezes.

  const contasPagar = useMemo(() => {
    if (visao === 'projecao') {
      return contas
        .filter(c => c.tipo === 'pagar' && c.status === 'Pendente')
        .reduce((s, c) => s + c.valor, 0)
    }
    if (!hasRange) return 0
    return contas
      .filter(c => c.tipo === 'pagar' && c.status === 'Pago' && inRange(c.vencimento, start, end))
      .reduce((s, c) => s + c.valor, 0)
  }, [contas, start, end, hasRange, visao])

  const despesasFixasTotal = useMemo(
    () => despesasFixas.filter(d => d.ativo).reduce((s, d) => s + d.valor, 0) * numMeses,
    [despesasFixas, numMeses]
  )

  const totalSaidas = contasPagar + despesasFixasTotal

  // ── Resultado ────────────────────────────────────────────────────────────────

  const resultado = totalEntradas - totalSaidas
  const positivo = resultado >= 0

  const labelPeriodo = modo === 'mes'
    ? new Date(anoMes + '-15').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    : start && end ? `${start.split('-').reverse().join('/')} – ${end.split('-').reverse().join('/')}` : '—'

  // Projeção sempre mostra; Realizado só se tiver período selecionado
  const podeExibir = visao === 'projecao' || hasRange

  return (
    <div className="space-y-5">

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
        <div className="flex flex-wrap items-center gap-3">

          {/* Modo — só relevante para Realizado */}
          {visao === 'realizado' && (
            <>
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
            </>
          )}

          {/* Visão */}
          <div className={`flex rounded-xl overflow-hidden ${visao === 'projecao' ? '' : 'ml-auto'}`} style={{ border: '1px solid #e8e4dd' }}>
            {([['projecao', 'Projeção'], ['realizado', 'Realizado']] as const).map(([v, label]) => (
              <button key={v} onClick={() => setVisao(v)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ backgroundColor: visao === v ? '#b89a6a' : '#fff', color: visao === v ? '#fff' : '#9a918a' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!podeExibir ? (
        <p className="text-sm text-center py-8" style={{ color: '#9a918a' }}>Selecione um período para ver o resultado.</p>
      ) : (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e4dd' }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} style={{ color: '#15803d' }} />
                <p className="text-xs font-semibold" style={{ color: '#9a918a' }}>Entradas</p>
              </div>
              <p className="text-xl font-bold" style={{ color: '#15803d' }}>{formatBRL(totalEntradas)}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9a918a' }}>
                {visao === 'projecao' ? 'Total pendente' : labelPeriodo}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e4dd' }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={14} style={{ color: '#b91c1c' }} />
                <p className="text-xs font-semibold" style={{ color: '#9a918a' }}>Saídas</p>
              </div>
              <p className="text-xl font-bold" style={{ color: '#b91c1c' }}>{formatBRL(totalSaidas)}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9a918a' }}>
                {visao === 'projecao' ? 'Total pendente' : labelPeriodo}
              </p>
            </div>

            <div className="rounded-2xl p-4" style={{
              border: `2px solid ${positivo ? '#15803d' : '#b91c1c'}`,
              backgroundColor: positivo ? '#f0fdf4' : '#fef2f2',
            }}>
              <p className="text-xs font-semibold mb-1" style={{ color: positivo ? '#15803d' : '#b91c1c' }}>
                {positivo ? 'Lucro' : 'Prejuízo'}
              </p>
              <p className="text-2xl font-bold" style={{ color: positivo ? '#15803d' : '#b91c1c' }}>
                {positivo ? '' : '- '}{formatBRL(resultado)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: positivo ? '#15803d' : '#b91c1c', opacity: 0.7 }}>
                {visao === 'projecao' ? 'Projeção' : 'Realizado'}
              </p>
            </div>
          </div>

          {/* Detalhamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Bloco
              titulo="Entradas"
              itens={[
                { label: 'Comissões da operadora (corretora)', valor: comissoesCorretora },
                { label: 'Contas a receber', valor: contasReceber },
              ]}
              total={totalEntradas}
              corTotal="#15803d"
            />

            <Bloco
              titulo="Saídas"
              itens={[
                { label: 'Contas a pagar', valor: contasPagar },
                {
                  label: `Despesas fixas${numMeses > 1 ? ` (${numMeses}×)` : ''}`,
                  valor: despesasFixasTotal,
                },
              ]}
              total={totalSaidas}
              corTotal="#b91c1c"
            />
          </div>

          {visao === 'projecao' && (
            <p className="text-xs text-center" style={{ color: '#9a918a' }}>
              Projeção: todos os valores pendentes (comissões e contas a receber/pagar) + despesas fixas mensais.
            </p>
          )}
          {visao === 'realizado' && (
            <p className="text-xs text-center" style={{ color: '#9a918a' }}>
              Realizado: apenas valores confirmados como recebidos/pagos no período. Despesas fixas são estimativa mensal.
            </p>
          )}
        </>
      )}
    </div>
  )
}
