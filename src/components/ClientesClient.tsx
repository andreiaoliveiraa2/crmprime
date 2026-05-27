'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cliente, STATUS_CLIENTE } from '@/lib/types'
import { useOperadoras } from '@/lib/useOperadoras'
import ClienteExportModal from './ClienteExportModal'
import { Plus, Download, Search, Eye, Pencil, Trash2, Upload } from 'lucide-react'

interface Props {
  clientes: Cliente[]
}

const statusCor: Record<string, { bg: string; text: string }> = {
  'Ativo':     { bg: '#dcfce7', text: '#15803d' },
  'Inativo':   { bg: '#fef9c3', text: '#a16207' },
  'Cancelado': { bg: '#fee2e2', text: '#b91c1c' },
}

const selectCls = 'border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2'
const selectStyle = (val: string) => ({ borderColor: '#e8e4dd', color: val ? '#1a1a1a' : '#9a918a' })

export default function ClientesClient({ clientes }: Props) {
  const [busca, setBusca]               = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroOperadora, setFiltroOp]  = useState('')
  const [filtroVendedor, setFiltroVend] = useState('')
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim]       = useState('')
  const [exportando, setExportando]     = useState(false)
  const [vendedores, setVendedores]     = useState<string[]>([])

  const router = useRouter()
  const supabase = createClient()
  const operadoras = useOperadoras()

  useEffect(() => {
    supabase
      .from('vendedores')
      .select('nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        if (data) setVendedores(data.map((v: { nome: string }) => v.nome))
      })
  }, [])

  const filtrados = useMemo(() => {
    return clientes.filter(c => {
      if (busca) {
        const q = busca.toLowerCase()
        const match =
          c.nome.toLowerCase().includes(q) ||
          (c.contato ?? '').includes(q) ||
          (c.cpf ?? '').includes(q) ||
          (c.email ?? '').toLowerCase().includes(q)
        if (!match) return false
      }
      if (filtroStatus    && c.status    !== filtroStatus)    return false
      if (filtroOperadora && c.operadora !== filtroOperadora) return false
      if (filtroVendedor  && c.vendedor  !== filtroVendedor)  return false
      if (filtroInicio && c.data_venda && c.data_venda < filtroInicio) return false
      if (filtroFim    && c.data_venda && c.data_venda > filtroFim)    return false
      return true
    })
  }, [clientes, busca, filtroStatus, filtroOperadora, filtroVendedor, filtroInicio, filtroFim])

  const temFiltro = filtroStatus || filtroOperadora || filtroVendedor || filtroInicio || filtroFim

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir cliente "${nome}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) { alert('Erro ao excluir. Tente novamente.'); return }
    router.refresh()
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Clientes</h1>
          <p className="text-sm mt-1" style={{ color: '#7a7065' }}>
            {filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''}{temFiltro || busca ? ' (filtrado)' : ' na carteira'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setExportando(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ border: '1px solid #b89a6a', color: '#b89a6a', backgroundColor: '#ffffff' }}
          >
            <Download size={15} />
            Exportar
          </button>
          <Link
            href="/clientes/importar"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#b89a6a', color: '#ffffff' }}
          >
            <Upload size={15} />
            Importar Carteira
          </Link>
          <Link
            href="/clientes/novo"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
          >
            <Plus size={15} />
            Novo Cliente
          </Link>
        </div>
      </div>

      {/* Busca + Filtros */}
      <div className="bg-white rounded-xl p-4 mb-5 space-y-3" style={{ border: '1px solid #e8e4dd' }}>
        {/* Busca */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9a918a' }} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, telefone ou email..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: '#e8e4dd' }}
          />
        </div>

        {/* Filtros em linha */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className={selectCls} style={selectStyle(filtroStatus)}>
            <option value="">Todos os status</option>
            {STATUS_CLIENTE.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filtroOperadora} onChange={e => setFiltroOp(e.target.value)}
            className={selectCls} style={selectStyle(filtroOperadora)}>
            <option value="">Todas as operadoras</option>
            {operadoras.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select value={filtroVendedor} onChange={e => setFiltroVend(e.target.value)}
            className={selectCls} style={selectStyle(filtroVendedor)}>
            <option value="">Todos os vendedores</option>
            {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <div className="flex items-center gap-2">
            <input type="date" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)}
              className={selectCls} style={{ borderColor: '#e8e4dd' }} />
            <span className="text-xs" style={{ color: '#9a918a' }}>até</span>
            <input type="date" value={filtroFim} onChange={e => setFiltroFim(e.target.value)}
              className={selectCls} style={{ borderColor: '#e8e4dd' }} />
          </div>

          {temFiltro && (
            <button
              onClick={() => { setFiltroStatus(''); setFiltroOp(''); setFiltroVend(''); setFiltroInicio(''); setFiltroFim('') }}
              className="px-3 py-2 text-sm font-medium rounded-xl hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#2d1f4e' }}>
                {['Nome', 'Status', 'Operadora', 'Tipo de Plano', 'Valor', 'Vendedor', 'Data da Venda', 'Telefone', 'Ações'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-white whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: '#9a918a' }}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {filtrados.map((c: Cliente, i: number) => {
                const sc = statusCor[c.status] ?? statusCor['Ativo']
                return (
                  <tr key={c.id} className="border-t"
                    style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf8f5', borderColor: '#f0ece6' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>{c.nome}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                        style={{ backgroundColor: sc.bg, color: sc.text }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{c.operadora ?? '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{c.tipo_plano ?? '—'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#15803d' }}>
                      {c.valor_plano != null
                        ? `R$ ${c.valor_plano.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{c.vendedor ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#5a4e3c' }}>
                      {c.data_venda ? new Date(c.data_venda).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{c.contato ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/clientes/${c.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: '#ede9f8', color: '#2d1f4e' }}>
                          <Eye size={11} /> Ver
                        </Link>
                        <Link href={`/clientes/${c.id}/editar`}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
                          <Pencil size={11} /> Editar
                        </Link>
                        <button onClick={() => handleExcluir(c.id, c.nome)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {exportando && (
        <ClienteExportModal clientes={filtrados} onClose={() => setExportando(false)} />
      )}
    </div>
  )
}
