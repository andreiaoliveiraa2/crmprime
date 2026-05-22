// src/components/CnpjRecebimentoSection.tsx
'use client'

import { useState } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CnpjRecebimento, CnpjRecebimentoInsert } from '@/lib/types'

interface Props {
  cnpjs: CnpjRecebimento[]
}

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }

const EMPTY: CnpjRecebimentoInsert = {
  nome: '', razao_social: null, cnpj: null, banco: null,
  agencia: null, conta: null, tipo_conta: null, pix: null, status: 'Ativo',
}

export default function CnpjRecebimentoSection({ cnpjs }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [editando, setEditando] = useState<CnpjRecebimento | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<CnpjRecebimentoInsert>(EMPTY)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function abrirNovo() {
    setForm(EMPTY)
    setEditando(null)
    setCriando(true)
    setErro('')
  }

  function abrirEditar(c: CnpjRecebimento) {
    setForm({
      nome: c.nome, razao_social: c.razao_social, cnpj: c.cnpj,
      banco: c.banco, agencia: c.agencia, conta: c.conta,
      tipo_conta: c.tipo_conta, pix: c.pix, status: c.status,
    })
    setEditando(c)
    setCriando(false)
    setErro('')
  }

  function fechar() {
    setCriando(false)
    setEditando(null)
    setErro('')
  }

  function set(field: keyof CnpjRecebimentoInsert, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value || null }))
  }

  async function salvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true)
    setErro('')

    if (editando) {
      const { error } = await supabase
        .from('cnpjs_recebimento')
        .update({ ...form, nome: form.nome.trim() })
        .eq('id', editando.id)
      if (error) { setErro('Erro: ' + error.message); setSalvando(false); return }
    } else {
      const { error } = await supabase
        .from('cnpjs_recebimento')
        .insert({ ...form, nome: form.nome.trim() })
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
            CNPJs / Contas de Recebimento
          </h3>
          <p className="text-sm mt-0.5" style={{ color: '#7a7065' }}>
            CNPJs usados para recebimento de comissões.
          </p>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Plus size={13} /> Adicionar CNPJ
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {cnpjs.length === 0 && (
          <p className="text-sm" style={{ color: '#9a918a' }}>Nenhum CNPJ cadastrado.</p>
        )}
        {cnpjs.map(c => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#f9f7f4', border: '1px solid #e8e4dd' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>{c.nome}</p>
              {c.cnpj && <p className="text-xs mt-0.5" style={{ color: '#7a7065' }}>CNPJ: {c.cnpj}</p>}
              {c.banco && <p className="text-xs" style={{ color: '#7a7065' }}>{c.banco} — Ag {c.agencia} / {c.conta}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: c.status === 'Ativo' ? '#dcfce7' : '#fee2e2',
                  color: c.status === 'Ativo' ? '#15803d' : '#b91c1c',
                }}>
                {c.status}
              </span>
              <button onClick={() => abrirEditar(c)}
                className="p-1.5 rounded-lg hover:bg-white transition-colors"
                style={{ color: '#9a918a' }}>
                <Pencil size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e8e4dd' }}>
              <h3 className="text-base font-bold" style={{ color: '#2d1f4e' }}>
                {editando ? 'Editar CNPJ' : 'Novo CNPJ'}
              </h3>
              <button onClick={fechar} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} style={{ color: '#9a918a' }} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className={labelCls} style={labelStyle}>Nome *</label>
                <input className={inputCls} style={inputStyle} value={form.nome}
                  onChange={e => set('nome', e.target.value)} placeholder="Ex: A2 Prime" />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Razão Social</label>
                <input className={inputCls} style={inputStyle} value={form.razao_social ?? ''}
                  onChange={e => set('razao_social', e.target.value)} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>CNPJ</label>
                <input className={inputCls} style={inputStyle} value={form.cnpj ?? ''}
                  onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={labelStyle}>Banco</label>
                  <input className={inputCls} style={inputStyle} value={form.banco ?? ''}
                    onChange={e => set('banco', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Agência</label>
                  <input className={inputCls} style={inputStyle} value={form.agencia ?? ''}
                    onChange={e => set('agencia', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={labelStyle}>Conta</label>
                  <input className={inputCls} style={inputStyle} value={form.conta ?? ''}
                    onChange={e => set('conta', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Tipo</label>
                  <select className={inputCls} style={inputStyle} value={form.tipo_conta ?? ''}
                    onChange={e => set('tipo_conta', e.target.value)}>
                    <option value="">—</option>
                    <option value="Corrente">Corrente</option>
                    <option value="Poupança">Poupança</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>PIX</label>
                <input className={inputCls} style={inputStyle} value={form.pix ?? ''}
                  onChange={e => set('pix', e.target.value)} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Status</label>
                <div className="flex gap-3 mt-1">
                  {(['Ativo', 'Inativo'] as const).map(v => (
                    <button key={v} type="button" onClick={() => set('status', v)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                      style={{
                        borderColor: form.status === v ? '#2d1f4e' : '#e8e4dd',
                        backgroundColor: form.status === v ? '#2d1f4e' : '#ffffff',
                        color: form.status === v ? '#ffffff' : '#5a4e3c',
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
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
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
