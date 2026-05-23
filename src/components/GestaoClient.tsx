'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Vendedor, TIPOS_VENDEDOR, NIVEIS_VENDEDOR } from '@/lib/types'
import { Plus, Search, Eye, Pencil, UserX, Trash2 } from 'lucide-react'

interface Props {
  vendedores: Vendedor[]
}

const selectCls = 'border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2'
const selectStyle = { borderColor: '#e8e4dd' }

export default function GestaoClient({ vendedores: inicial }: Props) {
  const [lista, setLista]                     = useState(inicial)
  const [busca, setBusca]                     = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('')
  const [filtroNivel, setFiltroNivel]   = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [confirmandoId, setConfirmandoId]         = useState<string | null>(null)
  const [confirmandoExcluirId, setConfirmandoExcluirId] = useState<string | null>(null)

  const supabase = createClient()

  const filtrados = useMemo(() => {
    return lista.filter(v => {
      if (busca) {
        const q = busca.toLowerCase()
        const match =
          v.nome.toLowerCase().includes(q) ||
          (v.cpf_cnpj ?? '').includes(q)
        if (!match) return false
      }
      if (filtroTipo && v.tipo !== filtroTipo) return false
      if (filtroNivel && v.nivel !== filtroNivel) return false
      if (filtroStatus === 'ativo' && !v.ativo) return false
      if (filtroStatus === 'inativo' && v.ativo) return false
      return true
    })
  }, [lista, busca, filtroTipo, filtroNivel, filtroStatus])

  async function desativar(id: string) {
    await supabase.from('vendedores').update({ ativo: false }).eq('id', id)
    setLista(prev => prev.map(v => v.id === id ? { ...v, ativo: false } : v))
    setConfirmandoId(null)
  }

  async function excluir(id: string) {
    await supabase.from('vendedores').delete().eq('id', id)
    setLista(prev => prev.filter(v => v.id !== id))
    setConfirmandoExcluirId(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Gestão</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
            Vendedores e corretores cadastrados
          </p>
        </div>
        <Link
          href="/gestao/novo"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#2d1f4e' }}
        >
          <Plus size={16} />
          Novo Vendedor
        </Link>
      </div>

      {/* Filtros */}
      <div
        className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3"
        style={{ border: '1px solid #e8e4dd' }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#9a918a' }}
          />
          <input
            className="w-full border rounded-xl pl-9 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: '#e8e4dd' }}
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <select
          className={selectCls}
          style={selectStyle}
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {TIPOS_VENDEDOR.map(t => <option key={t}>{t}</option>)}
        </select>
        <select
          className={selectCls}
          style={selectStyle}
          value={filtroNivel}
          onChange={e => setFiltroNivel(e.target.value)}
        >
          <option value="">Todos os níveis</option>
          {NIVEIS_VENDEDOR.map(n => <option key={n}>{n}</option>)}
        </select>
        <select
          className={selectCls}
          style={selectStyle}
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f4f1ec', borderBottom: '1px solid #e8e4dd' }}>
                {['Nome', 'Tipo', 'Nível', 'Status', 'Telefone', ''].map(h => (
                  <th
                    key={h}
                    className={`px-4 py-3 font-semibold ${h === '' ? 'text-right' : 'text-left'}`}
                    style={{ color: '#2d1f4e' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-sm"
                    style={{ color: '#9a918a' }}
                  >
                    Nenhum vendedor encontrado
                  </td>
                </tr>
              )}
              {filtrados.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f4f1ec' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#1a1a1a' }}>{v.nome}</td>
                  <td className="px-4 py-3" style={{ color: '#4a4a4a' }}>{v.tipo ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#4a4a4a' }}>{v.nivel ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={v.ativo
                        ? { backgroundColor: '#dcfce7', color: '#15803d' }
                        : { backgroundColor: '#fee2e2', color: '#b91c1c' }
                      }
                    >
                      {v.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#4a4a4a' }}>{v.telefone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/gestao/${v.id}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Ver ficha"
                      >
                        <Eye size={15} style={{ color: '#2d1f4e' }} />
                      </Link>
                      <Link
                        href={`/gestao/${v.id}/editar`}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Editar"
                      >
                        <Pencil size={15} style={{ color: '#b89a6a' }} />
                      </Link>
                      {confirmandoId === v.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => desativar(v.id)}
                            className="px-2 py-1 text-xs rounded-lg text-white"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmandoId(null)}
                            className="px-2 py-1 text-xs rounded-lg"
                            style={{ backgroundColor: '#e8e4dd', color: '#4a4a4a' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : confirmandoExcluirId === v.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <span className="text-xs" style={{ color: '#9a918a' }}>Excluir?</span>
                          <button
                            onClick={() => excluir(v.id)}
                            className="px-2 py-1 text-xs rounded-lg text-white"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmandoExcluirId(null)}
                            className="px-2 py-1 text-xs rounded-lg"
                            style={{ backgroundColor: '#e8e4dd', color: '#4a4a4a' }}
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setConfirmandoId(v.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100"
                            title="Desativar"
                            disabled={!v.ativo}
                          >
                            <UserX
                              size={15}
                              style={{ color: v.ativo ? '#ef4444' : '#d1d5db' }}
                            />
                          </button>
                          {!v.ativo && (
                            <button
                              onClick={() => setConfirmandoExcluirId(v.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100"
                              title="Excluir definitivamente"
                            >
                              <Trash2 size={15} style={{ color: '#ef4444' }} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
