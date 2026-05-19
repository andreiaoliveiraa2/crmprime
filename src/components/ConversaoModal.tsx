'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, ClienteInsert, TIPOS_PLANO } from '@/lib/types'
import { X, CheckCircle } from 'lucide-react'

interface Props {
  lead: Lead
  onClose: () => void
  onCancelar: () => void
  onReverteFechado?: () => void
}

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }

export default function ConversaoModal({ lead, onClose, onCancelar, onReverteFechado }: Props) {
  const [email, setEmail]           = useState('')
  const [telefone, setTelefone]     = useState(lead.telefone ?? '')
  const [operadora, setOperadora]   = useState(lead.operadora ?? '')
  const [tipo_plano, setTipoPlano]  = useState(lead.tipo_plano ?? '')
  const [qtdVidas, setQtdVidas]     = useState('')
  const [valor_plano, setValorPlano] = useState('')
  const [observacoes, setObservacoes] = useState(lead.observacoes ?? '')
  const [erro, setErro]             = useState('')
  const [loading, setLoading]       = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const valorNormalizado = valor_plano.replace(/\./g, '').replace(',', '.')
    const valor = Number(valorNormalizado)
    if (!valor_plano || isNaN(valor) || valor <= 0) {
      setErro('Informe um valor válido (ex: 350,00)')
      return
    }

    setLoading(true)

    const payload: ClienteInsert = {
      nome:             lead.nome ?? lead.telefone ?? 'Lead sem nome',
      contato:          telefone || null,
      email:            email || null,
      tipo_plano:       tipo_plano || null,
      operadora:        operadora || null,
      quantidade_vidas: qtdVidas ? Number(qtdVidas) : null,
      valor_plano:      valor,
      observacoes:      observacoes || null,
      lead_id:          lead.id,
      cpf:              null,
      data_nascimento:  null,
      endereco:         null,
      administradora:   null,
      numero_contrato:  null,
      data_venda:       null,
      data_implantacao: null,
      status:           'Ativo',
      vendedor:         lead.vendedor ?? null,
      comissao:         null,
    }

    const { error } = await supabase.from('clientes').insert(payload)
    if (error) {
      setErro('Erro ao converter. Tente novamente.')
      setLoading(false)
      onReverteFechado?.()
      return
    }

    await supabase.from('leads').delete().eq('id', lead.id)

    setLoading(false)
    onClose()
    router.push('/clientes')
  }

  const nomeExibido = lead.nome ?? lead.telefone ?? 'Lead sem nome'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#ffffff' }}>

        {/* Cabeçalho */}
        <div className="px-6 py-5 flex items-start justify-between"
          style={{ backgroundColor: '#2d1f4e' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(184,154,106,0.2)' }}>
              <CheckCircle size={18} style={{ color: '#b89a6a' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Converter em Cliente</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {nomeExibido}
              </p>
            </div>
          </div>
          <button onClick={onCancelar} className="text-white/50 hover:text-white transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="p-5 space-y-4"
          style={{ backgroundColor: '#f4f1ec' }}>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>Telefone</label>
              <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className={inputCls} style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>Operadora</label>
              <input type="text" value={operadora} onChange={e => setOperadora(e.target.value)}
                placeholder="Ex: Unimed, Amil..."
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Tipo de Plano</label>
              <select value={tipo_plano} onChange={e => setTipoPlano(e.target.value)}
                className={inputCls} style={inputStyle}>
                <option value="">Selecione...</option>
                {TIPOS_PLANO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>
                Valor do Plano (R$) <span style={{ color: '#b5455a' }}>*</span>
              </label>
              <input type="text" value={valor_plano} onChange={e => setValorPlano(e.target.value)}
                placeholder="0,00"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Qtd. de Vidas</label>
              <input type="number" min="1" value={qtdVidas} onChange={e => setQtdVidas(e.target.value)}
                placeholder="1"
                className={inputCls} style={inputStyle} />
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
              rows={2} placeholder="Informações adicionais..."
              className={`${inputCls} resize-none`} style={inputStyle} />
          </div>

          {erro && (
            <p className="text-sm font-medium" style={{ color: '#b5455a' }}>{erro}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancelar}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: '#e8e4dd', color: '#5a4e3c' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
              {loading ? 'Convertendo...' : 'Converter em Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
