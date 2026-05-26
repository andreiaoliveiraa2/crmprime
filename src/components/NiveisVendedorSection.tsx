'use client'

import { useState } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NivelVendedor } from '@/lib/types'

interface Props {
  niveis: NivelVendedor[]
}

export default function NiveisVendedorSection({ niveis }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [editando, setEditando] = useState<NivelVendedor | null>(null)
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function abrirNovo() {
    setNome(''); setAtivo(true); setEditando(null); setCriando(true); setErro('')
  }

  function abrirEditar(n: NivelVendedor) {
    setNome(n.nome); setAtivo(n.ativo); setEditando(n); setCriando(false); setErro('')
  }

  function fechar() {
    setCriando(false); setEditando(null); setErro('')
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true); setErro('')

    if (editando) {
      const { error } = await supabase
        .from('niveis_vendedor')
        .update({ nome: nome.trim(), ativo })
        .eq('id', editando.id)
      if (error) { setErro('Erro: ' + error.message); setSalvando(false); return }
    } else {
      const { error } = await supabase
        .from('niveis_vendedor')
        .insert({ nome: nome.trim(), ativo })
      if (error) { setErro('Erro: ' + error.message); setSalvando(false); return }
    }

    setSalvando(false)
    fechar()
    router.refresh()
  }

  const modalAberto = criando || !!editando

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e4dd' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>
            Níveis de Vendedor
          </h3>
          <p className="text-sm mt-0.5" style={{ color: '#7a7065' }}>
            Níveis usados no cadastro de vendedores e nas regras de repasse por operadora.
          </p>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Plus size={13} /> Novo nível
        </button>
      </div>

      <div className="space-y-2">
        {niveis.length === 0 && (
          <p className="text-sm" style={{ color: '#9a918a' }}>Nenhum nível cadastrado.</p>
        )}
        {niveis.map(n => (
          <div key={n.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#f9f7f4', border: '1px solid #e8e4dd' }}>
            <p className="text-sm font-medium" style={{ color: n.ativo ? '#2d1f4e' : '#9ca3af' }}>
              {n.nome}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: n.ativo ? '#dcfce7' : '#f3f4f6',
                  color: n.ativo ? '#15803d' : '#6b7280',
                }}>
                {n.ativo ? 'Ativo' : 'Inativo'}
              </span>
              <button onClick={() => abrirEditar(n)}
                className="p-1.5 rounded-lg hover:bg-white transition-colors"
                style={{ color: '#9a918a' }}>
                <Pencil size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e8e4dd' }}>
              <h3 className="text-base font-bold" style={{ color: '#2d1f4e' }}>
                {editando ? 'Editar Nível' : 'Novo Nível'}
              </h3>
              <button onClick={fechar} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} style={{ color: '#9a918a' }} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && salvar()}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: '#e8e4dd' }}
                  placeholder="Ex: Iniciante, Sênior, VIP..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Status</label>
                <div className="flex gap-3">
                  {(['Ativo', 'Inativo'] as const).map(v => (
                    <button key={v} type="button"
                      onClick={() => setAtivo(v === 'Ativo')}
                      className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                      style={{
                        borderColor: (v === 'Ativo') === ativo ? '#2d1f4e' : '#e8e4dd',
                        backgroundColor: (v === 'Ativo') === ativo ? '#2d1f4e' : '#ffffff',
                        color: (v === 'Ativo') === ativo ? '#ffffff' : '#5a4e3c',
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {erro && <p className="text-sm" style={{ color: '#b5455a' }}>{erro}</p>}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#e8e4dd' }}>
              <button onClick={fechar} disabled={salvando}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80"
                style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
