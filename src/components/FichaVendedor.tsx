'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Vendedor, Venda, Comissao } from '@/lib/types'
import { Pencil, ArrowLeft } from 'lucide-react'

interface Props {
  vendedor: Vendedor
  vendas: Venda[]
  comissoes: Comissao[]
}

const cardCls = 'bg-white rounded-2xl p-6 mb-4'
const cardStyle = { border: '1px solid #e8e4dd' }
const sectionTitleCls = 'text-sm font-bold mb-4 pb-2 border-b'
const sectionTitleStyle = { color: '#2d1f4e', borderColor: '#e8e4dd' }
const inputCls = 'border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2'
const inputStyle = { borderColor: '#e8e4dd' }

function toISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

const hoje = new Date()
const inicioPadrao = toISODate(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
const fimPadrao    = toISODate(hoje)

function Campo({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold" style={{ color: '#9a918a' }}>{label}</p>
      <p className="text-sm mt-0.5" style={{ color: '#1a1a1a' }}>{value ?? '—'}</p>
    </div>
  )
}

export default function FichaVendedor({ vendedor, vendas, comissoes }: Props) {
  const [tab, setTab]                   = useState<'cadastral' | 'producao'>('cadastral')
  const [filtroInicio, setFiltroInicio] = useState(inicioPadrao)
  const [filtroFim, setFiltroFim]       = useState(fimPadrao)
  const [filtroOp, setFiltroOp]         = useState('')

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Lista de operadoras únicas das vendas deste vendedor
  const operadoras = useMemo(() =>
    [...new Set(vendas.map(v => v.operadora))].sort(),
    [vendas]
  )

  // Vendas filtradas por período e operadora
  const vendasFiltradas = useMemo(() => {
    return vendas.filter(v => {
      const data = v.data_venda
      if (filtroInicio && data < filtroInicio) return false
      if (filtroFim   && data > filtroFim)    return false
      if (filtroOp    && v.operadora !== filtroOp) return false
      return true
    })
  }, [vendas, filtroInicio, filtroFim, filtroOp])

  // IDs das vendas filtradas (para cruzar comissões)
  const idsVendasFiltradas = useMemo(() =>
    new Set(vendasFiltradas.map(v => v.id)),
    [vendasFiltradas]
  )

  // Comissões das vendas filtradas
  const comissoesFiltradas = useMemo(() =>
    comissoes.filter(c => idsVendasFiltradas.has(c.venda_id)),
    [comissoes, idsVendasFiltradas]
  )

  // Cards de resumo
  const totalPeriodo   = vendasFiltradas.reduce((acc, v) => acc + v.valor_plano, 0)
  const numVendas      = vendasFiltradas.length
  const comPagas       = comissoesFiltradas.filter(c => c.status_vendedor === 'Recebido').reduce((acc, c) => acc + c.valor_vendedor, 0)
  const comPendentes   = comissoesFiltradas.filter(c => c.status_vendedor === 'Pendente').reduce((acc, c) => acc + c.valor_vendedor, 0)

  // Breakdown por operadora
  const porOperadora = useMemo(() => {
    const mapa: Record<string, { count: number; total: number }> = {}
    vendasFiltradas.forEach(v => {
      if (!mapa[v.operadora]) mapa[v.operadora] = { count: 0, total: 0 }
      mapa[v.operadora].count++
      mapa[v.operadora].total += v.valor_plano
    })
    return Object.entries(mapa)
      .map(([op, { count, total }]) => ({ op, count, total, pct: totalPeriodo > 0 ? (total / totalPeriodo) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)
  }, [vendasFiltradas, totalPeriodo])

  const tabBtn = (id: 'cadastral' | 'producao', label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all"
      style={tab === id
        ? { backgroundColor: '#2d1f4e', color: '#fff' }
        : { backgroundColor: 'transparent', color: '#9a918a' }
      }
    >
      {label}
    </button>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/gestao"
            className="p-2 rounded-xl hover:bg-white"
            style={{ border: '1px solid #e8e4dd' }}
          >
            <ArrowLeft size={16} style={{ color: '#2d1f4e' }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>
              {vendedor.nome}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {vendedor.tipo && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}
                >
                  {vendedor.tipo}
                </span>
              )}
              {vendedor.nivel && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                >
                  {vendedor.nivel}
                </span>
              )}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={vendedor.ativo
                  ? { backgroundColor: '#dcfce7', color: '#15803d' }
                  : { backgroundColor: '#fee2e2', color: '#b91c1c' }
                }
              >
                {vendedor.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/gestao/${vendedor.id}/editar`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#2d1f4e' }}
        >
          <Pencil size={14} />
          Editar
        </Link>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-6 w-fit"
        style={{ backgroundColor: '#f4f1ec', border: '1px solid #e8e4dd' }}
      >
        {tabBtn('cadastral', 'Dados Cadastrais')}
        {tabBtn('producao', 'Produção')}
      </div>

      {/* ── TAB 1: DADOS CADASTRAIS ── */}
      {tab === 'cadastral' && (
        <>
          <div className={cardCls} style={cardStyle}>
            <p className={sectionTitleCls} style={sectionTitleStyle}>Dados Pessoais</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Campo label="CPF / CNPJ"         value={vendedor.cpf_cnpj} />
              <Campo label="RG"                 value={vendedor.rg} />
              <Campo label="Data de nascimento" value={vendedor.data_nascimento} />
              <Campo label="Sexo"               value={vendedor.sexo} />
              <Campo label="Telefone"           value={vendedor.telefone} />
              <Campo label="E-mail"             value={vendedor.email} />
              <Campo label="CEP"                value={vendedor.endereco_cep} />
              <Campo label="Logradouro"         value={vendedor.endereco_logradouro} />
              <Campo label="Número"             value={vendedor.endereco_numero} />
              <Campo label="Complemento"        value={vendedor.endereco_complemento} />
              <Campo label="Bairro"             value={vendedor.endereco_bairro} />
              <Campo label="Cidade"             value={vendedor.endereco_cidade} />
              <Campo label="Estado"             value={vendedor.endereco_estado} />
            </div>
          </div>

          <div className={cardCls} style={cardStyle}>
            <p className={sectionTitleCls} style={sectionTitleStyle}>Dados Profissionais</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Campo label="Tipo"             value={vendedor.tipo} />
              <Campo label="Corretora"        value={vendedor.corretora} />
              <Campo label="Nível"            value={vendedor.nivel} />
              <Campo label="Data de admissão" value={vendedor.data_admissao} />
              <Campo label="Data de demissão" value={vendedor.data_demissao} />
              <Campo label="SUSEP"            value={vendedor.susep} />
            </div>
          </div>

          <div className={cardCls} style={cardStyle}>
            <p className={sectionTitleCls} style={sectionTitleStyle}>Informações Bancárias</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Campo label="Banco"         value={vendedor.banco} />
              <Campo label="Agência"       value={vendedor.agencia} />
              <Campo label="Conta"         value={vendedor.conta} />
              <Campo label="Tipo de conta" value={vendedor.tipo_conta} />
              <Campo label="PIX"           value={vendedor.pix} />
            </div>
          </div>

          {vendedor.observacoes && (
            <div className={cardCls} style={cardStyle}>
              <p className={sectionTitleCls} style={sectionTitleStyle}>Observações</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#4a4a4a' }}>
                {vendedor.observacoes}
              </p>
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: PRODUÇÃO ── */}
      {tab === 'producao' && (
        <>
          {/* Filtros */}
          <div
            className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-end"
            style={{ border: '1px solid #e8e4dd' }}
          >
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Data início</p>
              <input
                type="date"
                className={inputCls}
                style={inputStyle}
                value={filtroInicio}
                onChange={e => setFiltroInicio(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Data fim</p>
              <input
                type="date"
                className={inputCls}
                style={inputStyle}
                value={filtroFim}
                onChange={e => setFiltroFim(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Operadora</p>
              <select
                className={inputCls}
                style={inputStyle}
                value={filtroOp}
                onChange={e => setFiltroOp(e.target.value)}
              >
                <option value="">Todas</option>
                {operadoras.map(op => <option key={op}>{op}</option>)}
              </select>
            </div>
            <button
              onClick={() => { setFiltroInicio(inicioPadrao); setFiltroFim(fimPadrao); setFiltroOp('') }}
              className="px-3 py-2 text-xs rounded-xl font-semibold"
              style={{ backgroundColor: '#e8e4dd', color: '#4a4a4a' }}
            >
              Limpar
            </button>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Total produzido',       value: fmt(totalPeriodo), sub: `${numVendas} venda${numVendas !== 1 ? 's' : ''}` },
              { label: 'Nº de vendas',          value: String(numVendas), sub: 'no período' },
              { label: 'Comissões pagas',       value: fmt(comPagas),     sub: 'recebidas' },
              { label: 'Comissões pendentes',   value: fmt(comPendentes), sub: 'a receber' },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-4"
                style={{ border: '1px solid #e8e4dd' }}
              >
                <p className="text-xs font-semibold" style={{ color: '#9a918a' }}>{label}</p>
                <p className="text-lg font-bold mt-1" style={{ color: '#2d1f4e' }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#b89a6a' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Breakdown por operadora */}
          {porOperadora.length > 0 && (
            <div className={cardCls} style={cardStyle}>
              <p className={sectionTitleCls} style={sectionTitleStyle}>Por Operadora</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e8e4dd' }}>
                      {['Operadora', 'Nº vendas', 'Total produzido', '% do total'].map(h => (
                        <th
                          key={h}
                          className="text-left py-2 pr-4 font-semibold"
                          style={{ color: '#2d1f4e' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {porOperadora.map(({ op, count, total, pct }) => (
                      <tr key={op} style={{ borderBottom: '1px solid #f4f1ec' }}>
                        <td className="py-2 pr-4 font-medium" style={{ color: '#1a1a1a' }}>{op}</td>
                        <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>{count}</td>
                        <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>{fmt(total)}</td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#e8e4dd' }}>
                              <div
                                className="h-1.5 rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: '#b89a6a' }}
                              />
                            </div>
                            <span style={{ color: '#4a4a4a' }}>{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lista de vendas */}
          <div className={cardCls} style={cardStyle}>
            <p className={sectionTitleCls} style={sectionTitleStyle}>
              Vendas ({numVendas})
            </p>
            {vendasFiltradas.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: '#9a918a' }}>
                Nenhuma venda no período selecionado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e8e4dd' }}>
                      {['Cliente', 'Operadora', 'Valor', 'Data', 'Status'].map(h => (
                        <th
                          key={h}
                          className="text-left py-2 pr-4 font-semibold"
                          style={{ color: '#2d1f4e' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vendasFiltradas.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f4f1ec' }}>
                        <td className="py-2 pr-4" style={{ color: '#1a1a1a' }}>{v.cliente_nome}</td>
                        <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>{v.operadora}</td>
                        <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>{fmt(v.valor_plano)}</td>
                        <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>
                          {new Date(v.data_venda + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={v.status === 'Ativo'
                              ? { backgroundColor: '#dcfce7', color: '#15803d' }
                              : { backgroundColor: '#fee2e2', color: '#b91c1c' }
                            }
                          >
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
