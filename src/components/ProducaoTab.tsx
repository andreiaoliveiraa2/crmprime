'use client'

import { useState, useMemo } from 'react'
import { DollarSign, TrendingUp, Repeat, CreditCard, Plus, FileText, FileSpreadsheet } from 'lucide-react'
import { Venda, Comissao, Conta } from '@/lib/types'
import RegistrarVendaModal from './RegistrarVendaModal'
import { useOperadoras } from '@/lib/useOperadoras'

interface Props {
  vendas: Venda[]
  comissoes: Comissao[]
  contas: Conta[]
  onVendaRegistrada: () => void
}

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

const selectCls = 'border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2'

export default function ProducaoTab({ vendas, comissoes, contas, onVendaRegistrada }: Props) {
  const [filtroOperadora, setFiltroOperadora] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  const operadoras = useOperadoras()
  const vendedores = useMemo(() => [...new Set(vendas.map(v => v.vendedor))].sort(), [vendas])

  // Summary card calculations
  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

  const producaoMes = useMemo(() =>
    vendas
      .filter(v => v.data_venda && v.data_venda.startsWith(mesAtual))
      .reduce((sum, v) => sum + (v.valor_plano ?? 0), 0),
    [vendas, mesAtual]
  )

  const comissaoAReceber = useMemo(() =>
    comissoes
      .filter(c => c.status_empresa === 'Pendente')
      .reduce((sum, c) => sum + (c.valor_empresa ?? 0), 0),
    [comissoes]
  )

  const vitaliciosAtivos = useMemo(() => {
    const vendaIds = new Set(
      comissoes
        .filter(c => c.tipo === 'vitalicio' && c.status_empresa === 'Pendente')
        .map(c => c.venda_id)
    )
    return vendaIds.size
  }, [comissoes])

  const contasAPagar = useMemo(() =>
    contas
      .filter(c =>
        c.tipo === 'pagar' &&
        c.status === 'Pendente' &&
        c.vencimento &&
        c.vencimento.startsWith(mesAtual)
      )
      .reduce((sum, c) => sum + (c.valor ?? 0), 0),
    [contas, mesAtual]
  )

  // Filtered vendas
  const vendasFiltradas = useMemo(() => {
    return vendas.filter(v => {
      if (filtroOperadora && v.operadora !== filtroOperadora) return false
      if (filtroVendedor && v.vendedor !== filtroVendedor) return false
      if (dataInicio && v.data_venda < dataInicio) return false
      if (dataFim && v.data_venda > dataFim) return false
      return true
    })
  }, [vendas, filtroOperadora, filtroVendedor, dataInicio, dataFim])

  // Bar chart data: group by operadora
  const chartData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const v of vendasFiltradas) {
      map[v.operadora] = (map[v.operadora] ?? 0) + (v.valor_plano ?? 0)
    }
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1])
    const max = entries.length > 0 ? entries[0][1] : 0
    return { entries, max }
  }, [vendasFiltradas])

  const temFiltro = filtroOperadora || filtroVendedor || dataInicio || dataFim

  function limparFiltros() {
    setFiltroOperadora('')
    setFiltroVendedor('')
    setDataInicio('')
    setDataFim('')
  }

  // Excel export
  function exportarExcel() {
    import('xlsx').then(XLSX => {
      const rows = vendasFiltradas.map(v => ({
        Cliente: v.cliente_nome,
        Operadora: v.operadora,
        'Valor do Plano': v.valor_plano,
        Vendedor: v.vendedor,
        Data: formatDate(v.data_venda),
        Status: v.status,
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Produção')
      XLSX.writeFile(wb, 'producao.xlsx')
    })
  }

  // PDF export
  function exportarPDF() {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF()
        doc.setFontSize(14)
        doc.text('Produção — A2 Prime Corretora de Seguros', 14, 18)
        autoTable(doc, {
          startY: 26,
          head: [['Cliente', 'Operadora', 'Valor do Plano', 'Vendedor', 'Data', 'Status']],
          body: vendasFiltradas.map(v => [
            v.cliente_nome,
            v.operadora,
            formatBRL(v.valor_plano),
            v.vendedor,
            formatDate(v.data_venda),
            v.status,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [45, 31, 78] },
        })
        doc.save('producao.pdf')
      })
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 — Produção do Mês */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4" style={{ border: '1px solid #e8e4dd' }}>
          <div className="p-2 rounded-xl" style={{ backgroundColor: '#ede9f8' }}>
            <DollarSign size={20} style={{ color: '#2d1f4e' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Produção do Mês</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f4e' }}>{formatBRL(producaoMes)}</p>
          </div>
        </div>

        {/* Card 2 — Comissão a Receber */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4" style={{ border: '1px solid #e8e4dd' }}>
          <div className="p-2 rounded-xl" style={{ backgroundColor: '#fef9e7' }}>
            <TrendingUp size={20} style={{ color: '#b89a6a' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Comissão a Receber</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f4e' }}>{formatBRL(comissaoAReceber)}</p>
          </div>
        </div>

        {/* Card 3 — Vitalícios Ativos */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4" style={{ border: '1px solid #e8e4dd' }}>
          <div className="p-2 rounded-xl" style={{ backgroundColor: '#dcfce7' }}>
            <Repeat size={20} style={{ color: '#15803d' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Vitalícios Ativos</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f4e' }}>{vitaliciosAtivos}</p>
          </div>
        </div>

        {/* Card 4 — Contas a Pagar */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4" style={{ border: '1px solid #e8e4dd' }}>
          <div className="p-2 rounded-xl" style={{ backgroundColor: '#fee2e2' }}>
            <CreditCard size={20} style={{ color: '#b91c1c' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Contas a Pagar</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f4e' }}>{formatBRL(contasAPagar)}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar + Registrar Venda Button */}
      <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: '1px solid #e8e4dd' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filtroOperadora}
              onChange={e => setFiltroOperadora(e.target.value)}
              className={selectCls}
              style={{ borderColor: '#e8e4dd', color: filtroOperadora ? '#1a1a1a' : '#9a918a' }}
            >
              <option value="">Todas as operadoras</option>
              {operadoras.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            <select
              value={filtroVendedor}
              onChange={e => setFiltroVendedor(e.target.value)}
              className={selectCls}
              style={{ borderColor: '#e8e4dd', color: filtroVendedor ? '#1a1a1a' : '#9a918a' }}
            >
              <option value="">Todos os vendedores</option>
              {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className={selectCls}
                style={{ borderColor: '#e8e4dd' }}
              />
              <span className="text-xs" style={{ color: '#9a918a' }}>até</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className={selectCls}
                style={{ borderColor: '#e8e4dd' }}
              />
            </div>

            {temFiltro && (
              <button
                onClick={limparFiltros}
                className="px-3 py-2 text-sm font-medium rounded-xl hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}
              >
                Limpar filtros
              </button>
            )}
          </div>

          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
          >
            <Plus size={15} />
            Registrar Venda
          </button>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#2d1f4e' }}>
                {['Cliente', 'Operadora', 'Valor do Plano', 'Vendedor', 'Data', 'Status'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-white whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: '#9a918a' }}>
                    Nenhuma venda registrada.
                  </td>
                </tr>
              )}
              {vendasFiltradas.map((v, i) => (
                <tr
                  key={v.id}
                  className="border-t"
                  style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf8f5', borderColor: '#f0ece6' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>{v.cliente_nome}</td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{v.operadora}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#15803d' }}>{formatBRL(v.valor_plano)}</td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{v.vendedor}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#5a4e3c' }}>{formatDate(v.data_venda)}</td>
                  <td className="px-4 py-3">
                    {v.status === 'Ativo' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                        Cancelado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSS Bar Chart — Produção por Operadora */}
      <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: '#2d1f4e' }}>Produção por Operadora</h2>
        {chartData.entries.length === 0 ? (
          <p className="text-sm text-gray-400">Sem dados para exibir.</p>
        ) : (
          <div className="space-y-3">
            {chartData.entries.map(([operadora, valor]) => {
              const pct = chartData.max > 0 ? (valor / chartData.max) * 100 : 0
              return (
                <div key={operadora} className="flex items-center gap-3">
                  <span className="text-sm w-36 shrink-0 truncate" style={{ color: '#5a4e3c' }} title={operadora}>
                    {operadora}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: '#b89a6a' }}
                    />
                  </div>
                  <span className="text-sm font-medium w-28 text-right shrink-0" style={{ color: '#2d1f4e' }}>
                    {formatBRL(valor)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <button
          onClick={exportarExcel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ border: '1px solid #b89a6a', color: '#b89a6a', backgroundColor: '#ffffff' }}
        >
          <FileSpreadsheet size={15} />
          Exportar Excel
        </button>
        <button
          onClick={exportarPDF}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ border: '1px solid #2d1f4e', color: '#2d1f4e', backgroundColor: '#ffffff' }}
        >
          <FileText size={15} />
          Exportar PDF
        </button>
      </div>

      {/* Registrar Venda Modal */}
      {modalAberto && (
        <RegistrarVendaModal
          vendedores={vendedores}
          onClose={() => setModalAberto(false)}
          onSalvo={() => {
            setModalAberto(false)
            onVendaRegistrada()
          }}
        />
      )}
    </div>
  )
}
