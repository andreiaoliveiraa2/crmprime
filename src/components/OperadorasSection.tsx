'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Operadora } from '@/lib/types'
import { Plus, Pencil, Check, X, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

const inputCls = 'border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }

export default function OperadorasSection() {
  const [operadoras, setOperadoras] = useState<Operadora[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editandoNome, setEditandoNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const supabase = createClient()

  async function carregar() {
    try {
      const { data } = await supabase.from('operadoras').select('*').order('nome')
      if (data) setOperadoras(data)
    } catch { /* silently ignore */ }
  }

  useEffect(() => { carregar() }, [])

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) return
    setLoading(true)
    setErro('')
    try {
      const { error } = await supabase.from('operadoras').insert({ nome: novoNome.trim(), ativo: true })
      if (error) { setErro('Erro ao adicionar.'); return }
      setNovoNome('')
      await carregar()
    } catch {
      setErro('Erro ao adicionar.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSalvarEdicao(id: string) {
    if (!editandoNome.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase.from('operadoras').update({ nome: editandoNome.trim() }).eq('id', id)
      if (!error) { setEditandoId(null); await carregar() }
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleAtivo(op: Operadora) {
    try {
      await supabase.from('operadoras').update({ ativo: !op.ativo }).eq('id', op.id)
      await carregar()
    } catch { /* silently ignore */ }
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"?`)) return
    try {
      await supabase.from('operadoras').delete().eq('id', id)
      await carregar()
    } catch { /* silently ignore */ }
  }

  return (
    <div className="bg-white rounded-2xl border p-6 max-w-lg" style={{ borderColor: '#e8e4dd' }}>
      <h3 className="text-base font-semibold mb-5" style={{ color: '#2d1f4e' }}>Operadoras</h3>

      {/* Adicionar nova */}
      <form onSubmit={handleAdicionar} className="flex gap-2 mb-5">
        <input
          type="text"
          value={novoNome}
          onChange={e => setNovoNome(e.target.value)}
          placeholder="Nome da operadora..."
          className={`flex-1 ${inputCls}`}
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={loading || !novoNome.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
        >
          <Plus size={14} /> Adicionar
        </button>
      </form>

      {erro && <p className="text-sm mb-3" style={{ color: '#b5455a' }}>{erro}</p>}

      {/* Lista */}
      <div className="space-y-1.5">
        {operadoras.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: '#9a918a' }}>Nenhuma operadora cadastrada.</p>
        )}
        {operadoras.map(op => (
          <div key={op.id}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: op.ativo ? '#faf8f5' : '#f5f5f5', border: '1px solid #e8e4dd' }}
          >
            {editandoId === op.id ? (
              <>
                <input
                  type="text"
                  value={editandoNome}
                  onChange={e => setEditandoNome(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSalvarEdicao(op.id); if (e.key === 'Escape') setEditandoId(null) }}
                  className={`flex-1 ${inputCls} py-1`}
                  style={inputStyle}
                  autoFocus
                />
                <button onClick={() => handleSalvarEdicao(op.id)} className="p-1 rounded-lg hover:opacity-70" style={{ color: '#15803d' }}>
                  <Check size={15} />
                </button>
                <button onClick={() => setEditandoId(null)} className="p-1 rounded-lg hover:opacity-70" style={{ color: '#9a918a' }}>
                  <X size={15} />
                </button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-sm font-medium ${!op.ativo ? 'line-through' : ''}`}
                  style={{ color: op.ativo ? '#2d1f4e' : '#9a918a' }}>
                  {op.nome}
                </span>
                {!op.ativo && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                    Inativa
                  </span>
                )}
                <button onClick={() => { setEditandoId(op.id); setEditandoNome(op.nome) }}
                  className="p-1 rounded-lg hover:opacity-70 transition-opacity" style={{ color: '#b89a6a' }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleToggleAtivo(op)}
                  className="p-1 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ color: op.ativo ? '#15803d' : '#9a918a' }}
                  title={op.ativo ? 'Inativar' : 'Ativar'}
                >
                  {op.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => handleExcluir(op.id, op.nome)}
                  className="p-1 rounded-lg hover:opacity-70 transition-opacity" style={{ color: '#b91c1c' }}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
