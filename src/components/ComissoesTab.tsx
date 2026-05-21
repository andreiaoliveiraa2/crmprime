'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import { Comissao, Venda, RegraComissao, EMPRESAS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useOperadoras } from '@/lib/useOperadoras'

interface Props {
  comissoes: Comissao[]
  vendas: Venda[]
  regras: RegraComissao[]
  onAtualizar: () => void
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

type ComissaoComVenda = Comissao & {
  cliente_nome: string
  operadora: string
}

export default function ComissoesTab({ comissoes, vendas, regras, onAtualizar }: Props) {
  const supabase = createClient()
  const operadoras = useOperadoras()

  // Filter state
  const [filtroOperadora, setFiltroOperadora] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'parcela' | 'vitalicio'>('todos')
  const [filtroStatusEmpresa, setFiltroStatusEmpresa] = useState<'todos' | 'Pendente' | 'Recebido'>('todos')
  const [filtroStatusVendedor, setFiltroStatusVendedor] = useState<'todos' | 'Pendente' | 'Recebido'>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Build lookup maps
  const vendaMap = useMemo(() => {
    const m = new Map<string, Venda>()
    for (const v of vendas) m.set(v.id, v)
    return m
  }, [vendas])

  // Join comissoes with vendas
  const comissoesComVenda = useMemo<ComissaoComVenda[]>(() => {
    return comissoes.map(c => {
      const venda = vendaMap.get(c.venda_id)
      return {
        ...c,
        cliente_nome: venda?.cliente_nome ?? '—',
        operadora: venda?.operadora ?? '—',
      }
    })
  }, [comissoes, vendaMap])

  // Dynamic filter options
  const vendedores = useMemo(() => {
    const ids = [...new Set(comissoes.map(c => c.venda_id))]
    const vendedorSet = new Set<string>()
    for (const id of ids) {
      const v = vendaMap.get(id)
      if (v?.vendedor) vendedorSet.add(v.vendedor)
    }
    return [...vendedorSet].sort()
  }, [comissoes, vendaMap])

  // Summary cards
  const aReceberCorretora = useMemo(() =>
    comissoes
      .filter(c => c.status_empresa === 'Pendente')
      .reduce((sum, c) => sum + (c.valor_empresa ?? 0), 0),
    [comissoes]
  )

  const aPagarVendedores = useMemo(() =>
    comissoes
      .filter(c => c.status_vendedor === 'Pendente')
      .reduce((sum, c) => sum + (c.valor_vendedor ?? 0), 0),
    [comissoes]
  )

  // Filtered commissions
  const comissoesFiltradas = useMemo(() => {
    return comissoesComVenda.filter(c => {
      const venda = vendaMap.get(c.venda_id)
      if (filtroOperadora && c.operadora !== filtroOperadora) return false
      if (filtroVendedor && venda?.vendedor !== filtroVendedor) return false
      if (filtroTipo !== 'todos' && c.tipo !== filtroTipo) return false
      if (filtroStatusEmpresa !== 'todos' && c.status_empresa !== filtroStatusEmpresa) return false
      if (filtroStatusVendedor !== 'todos' && c.status_vendedor !== filtroStatusVendedor) return false
      if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
      if (dataInicio && c.data_prevista < dataInicio) return false
      if (dataFim && c.data_prevista > dataFim) return false
      return true
    })
  }, [comissoesComVenda, vendaMap, filtroOperadora, filtroVendedor, filtroTipo, filtroStatusEmpresa, filtroStatusVendedor, filtroEmpresa, dataInicio, dataFim])

  const temFiltro = filtroEmpresa || filtroOperadora || filtroVendedor || filtroTipo !== 'todos' || filtroStatusEmpresa !== 'todos' || filtroStatusVendedor !== 'todos' || dataInicio || dataFim

  function limparFiltros() {
    setFiltroEmpresa('')
    setFiltroOperadora('')
    setFiltroVendedor('')
    setFiltroTipo('todos')
    setFiltroStatusEmpresa('todos')
    setFiltroStatusVendedor('todos')
    setDataInicio('')
    setDataFim('')
  }

  async function toggleStatusEmpresa(comissao: Comissao) {
    const novoStatus = comissao.status_empresa === 'Pendente' ? 'Recebido' : 'Pendente'
    const update: Record<string, string | null> = {
      status_empresa: novoStatus,
      data_recebida_empresa: novoStatus === 'Recebido' ? new Date().toISOString().split('T')[0] : null,
    }
    await supabase.from('comissoes').update(update).eq('id', comissao.id)
    onAtualizar()
  }

  async function toggleStatusVendedor(comissao: Comissao) {
    const novoStatus = comissao.status_vendedor === 'Pendente' ? 'Recebido' : 'Pendente'
    const update: Record<string, string | null> = {
      status_vendedor: novoStatus,
      data_recebida_vendedor: novoStatus === 'Recebido' ? new Date().toISOString().split('T')[0] : null,
    }
    await supabase.from('comissoes').update(update).eq('id', comissao.id)
    onAtualizar()
  }

  function tipoLabel(c: ComissaoComVenda): string {
    if (c.tipo === 'vitalicio') return 'Vitalício'
    return `Parcela ${c.numero_parcela ?? ''}`
  }

  const badgePendente = { backgroundColor: '#fef3c7', color: '#92400e' }
  const badgeRecebido = { backgroundColor: '#dcfce7', color: '#15803d' }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1 — A receber (Corretora) */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4" style={{ border: '1px solid #e8e4dd' }}>
          <div className="p-2 rounded-xl" style={{ backgroundColor: '#ede9f8' }}>
            <CheckCircle size={20} style={{ color: '#2d1f4e' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">A receber (Corretora)</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f4e' }}>{formatBRL(aReceberCorretora)}</p>
          </div>
        </div>

        {/* Card 2 — A pagar (Vendedores) */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4" style={{ border: '1px solid #e8e4dd' }}>
          <div className="p-2 rounded-xl" style={{ backgroundColor: '#fef9e7' }}>
            <Clock size={20} style={{ color: '#b89a6a' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">A pagar (Vendedores)</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f4e' }}>{formatBRL(aPagarVendedores)}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #e8e4dd' }}>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filtroEmpresa}
            onChange={e => setFiltroEmpresa(e.target.value)}
            className={selectCls}
            style={{ borderColor: '#e8e4dd', color: filtroEmpresa ? '#1a1a1a' : '#9a918a' }}
          >
            <option value="">Todas as empresas</option>
            {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

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

          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value as 'todos' | 'parcela' | 'vitalicio')}
            className={selectCls}
            style={{ borderColor: '#e8e4dd', color: filtroTipo !== 'todos' ? '#1a1a1a' : '#9a918a' }}
          >
            <option value="todos">Todos os tipos</option>
            <option value="parcela">Parcela</option>
            <option value="vitalicio">Vitalício</option>
          </select>

          <select
            value={filtroStatusEmpresa}
            onChange={e => setFiltroStatusEmpresa(e.target.value as 'todos' | 'Pendente' | 'Recebido')}
            className={selectCls}
            style={{ borderColor: '#e8e4dd', color: filtroStatusEmpresa !== 'todos' ? '#1a1a1a' : '#9a918a' }}
          >
            <option value="todos">Status empresa: todos</option>
            <option value="Pendente">Empresa: Pendente</option>
            <option value="Recebido">Empresa: Recebido</option>
          </select>

          <select
            value={filtroStatusVendedor}
            onChange={e => setFiltroStatusVendedor(e.target.value as 'todos' | 'Pendente' | 'Recebido')}
            className={selectCls}
            style={{ borderColor: '#e8e4dd', color: filtroStatusVendedor !== 'todos' ? '#1a1a1a' : '#9a918a' }}
          >
            <option value="todos">Status vendedor: todos</option>
            <option value="Pendente">Vendedor: Pendente</option>
            <option value="Recebido">Vendedor: Recebido</option>
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
      </div>

      {/* Tabela de Comissões */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#2d1f4e' }}>
                {['Cliente', 'Operadora', 'Tipo', 'Valor Bruto', 'Corretora', 'Status Empresa', 'Vendedor', 'Status Vendedor', 'Data Prevista'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-white whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comissoesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: '#9a918a' }}>
                    Nenhuma comissão encontrada.
                  </td>
                </tr>
              )}
              {comissoesFiltradas.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-t"
                  style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf8f5', borderColor: '#f0ece6' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>{c.cliente_nome}</td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{c.operadora}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#5a4e3c' }}>{tipoLabel(c)}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#5a4e3c' }}>{formatBRL(c.valor_bruto)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ color: '#15803d' }}>{formatBRL(c.valor_empresa ?? 0)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatusEmpresa(c)}
                      className="px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                      style={c.status_empresa === 'Recebido' ? badgeRecebido : badgePendente}
                      title="Clique para alternar status"
                    >
                      {c.status_empresa}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {c.tipo === 'vitalicio' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#ede9f8', color: '#2d1f4e' }}>
                        Vitalício · Só Corretora
                      </span>
                    ) : (
                      <span className="whitespace-nowrap font-medium" style={{ color: '#b89a6a' }}>{formatBRL(c.valor_vendedor ?? 0)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatusVendedor(c)}
                      className="px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                      style={c.status_vendedor === 'Recebido' ? badgeRecebido : badgePendente}
                      title="Clique para alternar status"
                    >
                      {c.status_vendedor}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#5a4e3c' }}>{formatDate(c.data_prevista)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regras de Comissão */}
      <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>Regras de Comissão</h2>
          <a href="/gestao/operadoras"
            className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#f0ece6', color: '#2d1f4e' }}>
            Gerenciar em Gestão →
          </a>
        </div>

        {regras.length === 0 ? (
          <p className="text-sm" style={{ color: '#9a918a' }}>Nenhuma regra cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f4f1ec' }}>
                  {['Operadora', '% Total', 'Nº Parcelas', '% Vitalício', 'Status'].map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold whitespace-nowrap" style={{ color: '#5a4e3c' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regras.map((r, i) => (
                  <tr key={r.id} className="border-t"
                    style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf8f5', borderColor: '#f0ece6' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>{r.operadora}</td>
                    <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{r.percentual_total}%</td>
                    <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{r.num_parcelas}</td>
                    <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{r.percentual_vitalicio}%</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={r.ativo ? { backgroundColor: '#dcfce7', color: '#15803d' } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                        {r.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
