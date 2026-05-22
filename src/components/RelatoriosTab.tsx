'use client'

import { useState, useMemo } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Venda, Comissao, Conta, CnpjRecebimento } from '@/lib/types'

interface Props {
  vendas: Venda[]
  comissoes: Comissao[]
  contas: Conta[]
  cnpjs: CnpjRecebimento[]
  operadoras: { id: string; nome: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function currentYearMonth(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function todayStr(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

/** Returns true if dateStr (YYYY-MM-DD) falls within [start, end] inclusive */
function inRange(dateStr: string | null, start: string, end: string): boolean {
  if (!dateStr) return false
  const d = dateStr.split('T')[0]
  return d >= start && d <= end
}

/** Convert anoMes "YYYY-MM" to [start, end] date strings */
function monthRange(anoMes: string): [string, string] {
  const [y, m] = anoMes.split('-').map(Number)
  const start = `${anoMes}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const end = `${anoMes}-${String(lastDay).padStart(2, '0')}`
  return [start, end]
}

// ─── Export helpers ───────────────────────────────────────────────────────────

type SheetRow = Record<string, string | number>

async function exportExcel(filename: string, rows: SheetRow[]) {
  const xlsx = await import('xlsx')
  const ws = xlsx.utils.json_to_sheet(rows)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, 'Relatório')
  xlsx.writeFile(wb, `${filename}.xlsx`)
}

async function exportPDF(title: string, filename: string, headers: string[], rows: (string | number)[][]) {
  const { default: jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.setTextColor(45, 31, 78)
  doc.text(title, 14, 16)
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    headStyles: { fillColor: [45, 31, 78] as [number, number, number], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 248, 245] as [number, number, number] },
    styles: { fontSize: 9 },
  })
  doc.save(`${filename}.pdf`)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <p className="text-sm py-4 text-center" style={{ color: '#9ca3af' }}>
      Sem dados para o período selecionado.
    </p>
  )
}

interface ExportButtonsProps {
  onExcel: () => void
  onPDF: () => void
}

function ExportButtons({ onExcel, onPDF }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExcel}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ backgroundColor: '#f4f1ec', color: '#2d1f4e', border: '1px solid #e8e4dd' }}
      >
        <FileSpreadsheet size={14} />
        Excel
      </button>
      <button
        onClick={onPDF}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ backgroundColor: '#2d1f4e', color: '#fff' }}
      >
        <FileText size={14} />
        PDF
      </button>
    </div>
  )
}

interface ReportCardProps {
  title: string
  description: string
  onExcel: () => void
  onPDF: () => void
  children: React.ReactNode
}

function ReportCard({ title, description, onExcel, onPDF, children }: ReportCardProps) {
  return (
    <div
      className="bg-white rounded-xl p-6"
      style={{ border: '1px solid #e8e4dd' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>{title}</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{description}</p>
        </div>
        <ExportButtons onExcel={onExcel} onPDF={onPDF} />
      </div>
      {children}
    </div>
  )
}

interface DataTableProps {
  headers: string[]
  rows: (string | number)[][]
}

function DataTable({ headers, rows }: DataTableProps) {
  if (rows.length === 0) return <EmptyState />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ backgroundColor: '#2d1f4e' }}>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2 text-left text-xs font-semibold"
                style={{ color: '#fff' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf8f5' }}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-xs" style={{ color: '#374151' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RelatoriosTab({ vendas, comissoes, contas, cnpjs, operadoras }: Props) {
  const [modo, setModo] = useState<'mes' | 'periodo'>('mes')
  const [anoMes, setAnoMes] = useState(currentYearMonth())
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroOperadora, setFiltroOperadora] = useState('')


  // Compute effective date range
  const [rangeStart, rangeEnd] = useMemo<[string, string]>(() => {
    if (modo === 'mes') return monthRange(anoMes)
    if (dataInicio && dataFim) return [dataInicio, dataFim]
    return ['', '']
  }, [modo, anoMes, dataInicio, dataFim])

  const hasRange = rangeStart !== '' && rangeEnd !== ''

  // ── Report 1: Vendas do Período ────────────────────────────────────────────
  const vendasPeriodo = useMemo(() => {
    if (!hasRange) return []
    return vendas.filter((v) =>
      inRange(v.data_venda, rangeStart, rangeEnd) &&
      (!filtroEmpresa || v.empresa === filtroEmpresa) &&
      (!filtroOperadora || v.operadora === filtroOperadora)
    )
  }, [vendas, rangeStart, rangeEnd, hasRange, filtroEmpresa, filtroOperadora])

  const vendasPorOperadora = useMemo(() => {
    const map = new Map<string, { quantidade: number; total: number }>()
    for (const v of vendasPeriodo) {
      const cur = map.get(v.operadora) ?? { quantidade: 0, total: 0 }
      map.set(v.operadora, { quantidade: cur.quantidade + 1, total: cur.total + v.valor_plano })
    }
    return Array.from(map.entries()).map(([operadora, data]) => ({
      operadora,
      quantidade: data.quantidade,
      total: data.total,
    }))
  }, [vendasPeriodo])

  const totalVendasValor = useMemo(
    () => vendasPeriodo.reduce((acc, v) => acc + v.valor_plano, 0),
    [vendasPeriodo]
  )

  // ── Report 2: Comissão por Vendedor ────────────────────────────────────────
  const vendasMap = useMemo(() => new Map(vendas.map((v) => [v.id, v])), [vendas])

  const comissoesPeriodo = useMemo(() => {
    if (!hasRange) return []
    return comissoes.filter((c) => {
      const venda = vendasMap.get(c.venda_id)
      if (!venda) return false
      if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
      if (filtroOperadora && venda.operadora !== filtroOperadora) return false
      return inRange(venda.data_venda, rangeStart, rangeEnd)
    })
  }, [comissoes, vendasMap, rangeStart, rangeEnd, hasRange, filtroEmpresa, filtroOperadora])

  const comissaoPorVendedor = useMemo(() => {
    const map = new Map<string, { recebido: number; pendente: number; producao: number }>()
    for (const c of comissoesPeriodo) {
      const venda = vendasMap.get(c.venda_id)
      const vendedor = venda?.vendedor ?? 'Desconhecido'
      const cur = map.get(vendedor) ?? { recebido: 0, pendente: 0, producao: 0 }
      map.set(vendedor, {
        recebido: cur.recebido + (c.status_vendedor === 'Recebido' ? c.valor_vendedor : 0),
        pendente: cur.pendente + (c.status_vendedor === 'Pendente' ? c.valor_vendedor : 0),
        producao: cur.producao + (venda?.valor_plano ?? 0),
      })
    }
    return Array.from(map.entries()).map(([vendedor, data]) => ({
      vendedor,
      recebido: data.recebido,
      pendente: data.pendente,
      percentual: totalVendasValor > 0 ? ((data.recebido + data.pendente) / totalVendasValor) * 100 : 0,
    }))
  }, [comissoesPeriodo, vendasMap, totalVendasValor])

  // ── Report 3: Retenção da Empresa ──────────────────────────────────────────
  const comissoesEmpresaPeriodo = useMemo(() => {
    if (!hasRange) return []
    return comissoes.filter(
      (c) =>
        c.status_empresa === 'Recebido' &&
        (!filtroEmpresa || c.empresa === filtroEmpresa) &&
        (!filtroOperadora || (vendasMap.get(c.venda_id)?.operadora ?? '') === filtroOperadora) &&
        inRange(c.data_recebida_empresa, rangeStart, rangeEnd)
    )
  }, [comissoes, vendasMap, rangeStart, rangeEnd, hasRange, filtroEmpresa, filtroOperadora])

  const totalComissoesEmpresa = useMemo(
    () => comissoesEmpresaPeriodo.reduce((acc, c) => acc + c.valor_empresa, 0),
    [comissoesEmpresaPeriodo]
  )

  const retencaoPorOperadora = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of comissoesEmpresaPeriodo) {
      const venda = vendasMap.get(c.venda_id)
      const operadora = venda?.operadora ?? 'Desconhecida'
      map.set(operadora, (map.get(operadora) ?? 0) + c.valor_empresa)
    }
    return Array.from(map.entries()).map(([operadora, total]) => ({
      operadora,
      total,
      percentual: totalComissoesEmpresa > 0 ? (total / totalComissoesEmpresa) * 100 : 0,
    }))
  }, [comissoesEmpresaPeriodo, vendasMap, totalComissoesEmpresa])

  // ── Report 4: Vitalícios Ativos ────────────────────────────────────────────
  const vitaliciosAtivos = useMemo(() => {
    return comissoes.filter((c) => {
      if (c.tipo !== 'vitalicio' || c.status_empresa !== 'Pendente') return false
      if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
      if (filtroOperadora && (vendasMap.get(c.venda_id)?.operadora ?? '') !== filtroOperadora) return false
      return true
    })
  }, [comissoes, vendasMap, filtroEmpresa, filtroOperadora])

  const totalVitalicioEmpresa = useMemo(
    () => vitaliciosAtivos.reduce((acc, c) => acc + c.valor_empresa, 0),
    [vitaliciosAtivos]
  )
  const totalVitalicioVendedor = useMemo(
    () => vitaliciosAtivos.reduce((acc, c) => acc + c.valor_vendedor, 0),
    [vitaliciosAtivos]
  )

  // ── Report 5: Pendências Financeiras ──────────────────────────────────────
  const comissoesPendentes = useMemo(() => {
    if (!hasRange) return []
    return comissoes.filter(
      (c) =>
        (c.status_empresa === 'Pendente' || c.status_vendedor === 'Pendente') &&
        (!filtroEmpresa || c.empresa === filtroEmpresa) &&
        (!filtroOperadora || (vendasMap.get(c.venda_id)?.operadora ?? '') === filtroOperadora) &&
        inRange(c.data_prevista, rangeStart, rangeEnd)
    )
  }, [comissoes, vendasMap, rangeStart, rangeEnd, hasRange, filtroEmpresa, filtroOperadora])

  const contasVencidas = useMemo(() => {
    const today = todayStr()
    return contas.filter((c) =>
      c.status === 'Pendente' &&
      c.vencimento < today &&
      (!filtroEmpresa || c.empresa === filtroEmpresa)
    )
  }, [contas, filtroEmpresa])

  // ── Table row builders ─────────────────────────────────────────────────────
  const vendasTableRows = useMemo(
    () =>
      vendasPorOperadora.map((r) => [r.operadora, r.quantidade, formatBRL(r.total)]),
    [vendasPorOperadora]
  )

  const comissaoTableRows = useMemo(
    () =>
      comissaoPorVendedor.map((r) => [
        r.vendedor,
        formatBRL(r.recebido),
        formatBRL(r.pendente),
        `${r.percentual.toFixed(1)}%`,
      ]),
    [comissaoPorVendedor]
  )

  const retencaoTableRows = useMemo(
    () =>
      retencaoPorOperadora.map((r) => [
        r.operadora,
        formatBRL(r.total),
        `${r.percentual.toFixed(1)}%`,
      ]),
    [retencaoPorOperadora]
  )

  const vitaliciosTableRows = useMemo(
    () =>
      vitaliciosAtivos.map((c) => {
        const venda = vendasMap.get(c.venda_id)
        return [
          venda?.cliente_nome ?? '—',
          venda?.operadora ?? '—',
          formatBRL(c.valor_empresa),
          formatBRL(c.valor_vendedor),
        ]
      }),
    [vitaliciosAtivos, vendasMap]
  )

  const pendComissoesRows = useMemo(
    () =>
      comissoesPendentes.map((c) => {
        const venda = vendasMap.get(c.venda_id)
        return [
          venda?.cliente_nome ?? '—',
          venda?.operadora ?? '—',
          c.tipo === 'parcela' ? `Parcela ${c.numero_parcela ?? ''}` : 'Vitalício',
          formatBRL(c.valor_empresa),
          formatBRL(c.valor_vendedor),
          formatDate(c.data_prevista),
        ]
      }),
    [comissoesPendentes, vendasMap]
  )

  const contasVencidasRows = useMemo(
    () =>
      contasVencidas.map((c) => [
        c.descricao,
        formatBRL(c.valor),
        c.tipo === 'receber' ? 'A Receber' : 'A Pagar',
        formatDate(c.vencimento),
      ]),
    [contasVencidas]
  )

  // ── Export handlers ────────────────────────────────────────────────────────
  function periodoLabel() {
    if (modo === 'mes') return anoMes
    return `${dataInicio}_${dataFim}`
  }

  // Report 1
  function exportVendasExcel() {
    const rows = vendasPorOperadora.map((r) => ({
      Operadora: r.operadora,
      Quantidade: r.quantidade,
      'Valor Total': r.total,
    }))
    exportExcel(`vendas_${periodoLabel()}`, rows)
  }
  function exportVendasPDF() {
    exportPDF(
      `Vendas do Período — ${periodoLabel()}`,
      `vendas_${periodoLabel()}`,
      ['Operadora', 'Quantidade', 'Valor Total'],
      vendasTableRows
    )
  }

  // Report 2
  function exportComissaoExcel() {
    const rows = comissaoPorVendedor.map((r) => ({
      Vendedor: r.vendedor,
      'Valor Recebido': r.recebido,
      'Valor Pendente': r.pendente,
      '% sobre Produção': `${r.percentual.toFixed(1)}%`,
    }))
    exportExcel(`comissao_vendedor_${periodoLabel()}`, rows)
  }
  function exportComissaoPDF() {
    exportPDF(
      `Comissão por Vendedor — ${periodoLabel()}`,
      `comissao_vendedor_${periodoLabel()}`,
      ['Vendedor', 'Valor Recebido', 'Valor Pendente', '% sobre Produção'],
      comissaoTableRows
    )
  }

  // Report 3
  function exportRetencaoExcel() {
    const rows = retencaoPorOperadora.map((r) => ({
      Operadora: r.operadora,
      'Valor Retido': r.total,
      '% sobre Total': `${r.percentual.toFixed(1)}%`,
    }))
    exportExcel(`retencao_empresa_${periodoLabel()}`, rows)
  }
  function exportRetencaoPDF() {
    exportPDF(
      `Retenção da Empresa — ${periodoLabel()}`,
      `retencao_empresa_${periodoLabel()}`,
      ['Operadora', 'Valor Retido', '% sobre Total'],
      retencaoTableRows
    )
  }

  // Report 4
  function exportVitaliciosExcel() {
    const rows = vitaliciosAtivos.map((c) => {
      const venda = vendasMap.get(c.venda_id)
      return {
        Cliente: venda?.cliente_nome ?? '—',
        Operadora: venda?.operadora ?? '—',
        'Valor Mensal Empresa': c.valor_empresa,
        'Valor Mensal Vendedor': c.valor_vendedor,
      }
    })
    exportExcel('vitalicos_ativos', rows)
  }
  function exportVitaliciosPDF() {
    exportPDF(
      'Vitalícios Ativos',
      'vitalicos_ativos',
      ['Cliente', 'Operadora', 'Valor Mensal Empresa', 'Valor Mensal Vendedor'],
      vitaliciosTableRows
    )
  }

  // Report 5 — Comissões
  function exportPendComissoesExcel() {
    const rows = comissoesPendentes.map((c) => {
      const venda = vendasMap.get(c.venda_id)
      return {
        Cliente: venda?.cliente_nome ?? '—',
        Operadora: venda?.operadora ?? '—',
        Tipo: c.tipo === 'parcela' ? `Parcela ${c.numero_parcela ?? ''}` : 'Vitalício',
        'Valor Empresa': c.valor_empresa,
        'Valor Vendedor': c.valor_vendedor,
        'Data Prevista': c.data_prevista,
      }
    })
    exportExcel(`pendencias_comissoes_${periodoLabel()}`, rows)
  }
  function exportPendComissoesPDF() {
    exportPDF(
      `Comissões Pendentes — ${periodoLabel()}`,
      `pendencias_comissoes_${periodoLabel()}`,
      ['Cliente', 'Operadora', 'Tipo', 'Valor Empresa', 'Valor Vendedor', 'Data Prevista'],
      pendComissoesRows
    )
  }

  // Report 5 — Contas
  function exportContasVencidasExcel() {
    const rows = contasVencidas.map((c) => ({
      Descrição: c.descricao,
      Valor: c.valor,
      Tipo: c.tipo === 'receber' ? 'A Receber' : 'A Pagar',
      Vencimento: c.vencimento,
    }))
    exportExcel('contas_vencidas', rows)
  }
  function exportContasVencidasPDF() {
    exportPDF(
      'Contas Vencidas',
      'contas_vencidas',
      ['Descrição', 'Valor', 'Tipo', 'Vencimento'],
      contasVencidasRows
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div
        className="bg-white rounded-xl p-5"
        style={{ border: '1px solid #e8e4dd' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
            <button
              onClick={() => setModo('mes')}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: modo === 'mes' ? '#2d1f4e' : '#fff',
                color: modo === 'mes' ? '#fff' : '#6b7280',
              }}
            >
              Mês/Ano
            </button>
            <button
              onClick={() => setModo('periodo')}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: modo === 'periodo' ? '#2d1f4e' : '#fff',
                color: modo === 'periodo' ? '#fff' : '#6b7280',
              }}
            >
              Período
            </button>
          </div>

          <select
            value={filtroEmpresa}
            onChange={e => setFiltroEmpresa(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: '#e8e4dd', color: filtroEmpresa ? '#1a1a1a' : '#9a918a' }}
          >
            <option value="">Todas as empresas</option>
            {cnpjs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>

          <select
            value={filtroOperadora}
            onChange={e => setFiltroOperadora(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: '#e8e4dd', color: filtroOperadora ? '#1a1a1a' : '#9a918a' }}
          >
            <option value="">Todas as operadoras</option>
            {operadoras.map(op => <option key={op.id} value={op.nome}>{op.nome}</option>)}
          </select>

          {modo === 'mes' ? (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: '#2d1f4e' }}>
                Mês:
              </label>
              <input
                type="month"
                value={anoMes}
                onChange={(e) => setAnoMes(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ border: '1px solid #e8e4dd', color: '#2d1f4e' }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: '#2d1f4e' }}>
                  De:
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #e8e4dd', color: '#2d1f4e' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: '#2d1f4e' }}>
                  Até:
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #e8e4dd', color: '#2d1f4e' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report 1: Vendas do Período */}
      <ReportCard
        title="Vendas do Período"
        description="Total de vendas agrupadas por operadora no período selecionado."
        onExcel={exportVendasExcel}
        onPDF={exportVendasPDF}
      >
        {vendasPeriodo.length > 0 && (
          <div className="flex gap-6 mb-4 flex-wrap">
            <div>
              <span className="text-xs" style={{ color: '#9ca3af' }}>Total de vendas</span>
              <p className="text-lg font-bold" style={{ color: '#2d1f4e' }}>
                {vendasPeriodo.length}
              </p>
            </div>
            <div>
              <span className="text-xs" style={{ color: '#9ca3af' }}>Valor total</span>
              <p className="text-lg font-bold" style={{ color: '#2d1f4e' }}>
                {formatBRL(totalVendasValor)}
              </p>
            </div>
          </div>
        )}
        <DataTable
          headers={['Operadora', 'Quantidade', 'Valor Total']}
          rows={vendasTableRows}
        />
      </ReportCard>

      {/* Report 2: Comissão por Vendedor */}
      <ReportCard
        title="Comissão por Vendedor"
        description="Comissões recebidas e pendentes por vendedor no período."
        onExcel={exportComissaoExcel}
        onPDF={exportComissaoPDF}
      >
        <DataTable
          headers={['Vendedor', 'Valor Recebido', 'Valor Pendente', '% sobre Produção']}
          rows={comissaoTableRows}
        />
      </ReportCard>

      {/* Report 3: Retenção da Empresa */}
      <ReportCard
        title="Retenção da Empresa"
        description="Valores retidos pela empresa agrupados por operadora (comissões recebidas no período)."
        onExcel={exportRetencaoExcel}
        onPDF={exportRetencaoPDF}
      >
        {retencaoPorOperadora.length > 0 && (
          <div className="mb-4">
            <span className="text-xs" style={{ color: '#9ca3af' }}>Total retido no período</span>
            <p className="text-lg font-bold" style={{ color: '#2d1f4e' }}>
              {formatBRL(totalComissoesEmpresa)}
            </p>
          </div>
        )}
        <DataTable
          headers={['Operadora', 'Valor Retido', '% sobre Total']}
          rows={retencaoTableRows}
        />
      </ReportCard>

      {/* Report 4: Vitalícios Ativos */}
      <ReportCard
        title="Vitalícios Ativos"
        description="Todos os vitalícios com status empresa pendente (independente de período)."
        onExcel={exportVitaliciosExcel}
        onPDF={exportVitaliciosPDF}
      >
        {vitaliciosAtivos.length > 0 && (
          <div className="flex gap-6 mb-4 flex-wrap">
            <div>
              <span className="text-xs" style={{ color: '#9ca3af' }}>Total mensal empresa</span>
              <p className="text-lg font-bold" style={{ color: '#2d1f4e' }}>
                {formatBRL(totalVitalicioEmpresa)}
              </p>
            </div>
            <div>
              <span className="text-xs" style={{ color: '#9ca3af' }}>Total mensal vendedores</span>
              <p className="text-lg font-bold" style={{ color: '#2d1f4e' }}>
                {formatBRL(totalVitalicioVendedor)}
              </p>
            </div>
          </div>
        )}
        <DataTable
          headers={['Cliente', 'Operadora', 'Valor Mensal Empresa', 'Valor Mensal Vendedor']}
          rows={vitaliciosTableRows}
        />
      </ReportCard>

      {/* Report 5: Pendências Financeiras */}
      <div
        className="bg-white rounded-xl p-6"
        style={{ border: '1px solid #e8e4dd' }}
      >
        <h2 className="text-base font-semibold mb-1" style={{ color: '#2d1f4e' }}>
          Pendências Financeiras
        </h2>
        <p className="text-xs mb-5" style={{ color: '#9ca3af' }}>
          Comissões pendentes no período e contas vencidas em aberto.
        </p>

        {/* Sub-section: Comissões Pendentes */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>
              Comissões Pendentes
            </h3>
            <ExportButtons onExcel={exportPendComissoesExcel} onPDF={exportPendComissoesPDF} />
          </div>
          <DataTable
            headers={['Cliente', 'Operadora', 'Tipo', 'Valor Empresa', 'Valor Vendedor', 'Data Prevista']}
            rows={pendComissoesRows}
          />
        </div>

        {/* Sub-section: Contas Vencidas */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>
              Contas Vencidas
            </h3>
            <ExportButtons onExcel={exportContasVencidasExcel} onPDF={exportContasVencidasPDF} />
          </div>
          <DataTable
            headers={['Descrição', 'Valor', 'Tipo', 'Vencimento']}
            rows={contasVencidasRows}
          />
        </div>
      </div>
    </div>
  )
}
