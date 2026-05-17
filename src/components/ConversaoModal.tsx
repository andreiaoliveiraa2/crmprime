'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, ClienteInsert, TIPOS_PLANO } from '@/lib/types'

interface Props {
  lead: Lead
  onClose: () => void
  onCancelar: () => void
}

export default function ConversaoModal({ lead, onClose, onCancelar }: Props) {
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState(lead.telefone ?? '')
  const [tipo_plano, setTipoPlano] = useState(lead.tipo_plano ?? '')
  const [valor_plano, setValorPlano] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const valor = Number(valor_plano.replace(',', '.'))
    if (!valor_plano || isNaN(valor)) {
      setErro('Valor do plano é obrigatório')
      return
    }

    setLoading(true)

    const payload: ClienteInsert = {
      nome: lead.nome,
      contato: telefone || null,
      email: email || null,
      tipo_plano: tipo_plano || null,
      valor_plano: valor,
      observacoes: observacoes || null,
      lead_id: lead.id,
    }

    const { error } = await supabase.from('clientes').insert(payload)
    if (error) { setErro('Erro ao salvar cliente. Tente novamente.'); setLoading(false); return }

    setLoading(false)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🎉</span>
            <h2 className="text-lg font-bold text-stone-800">Converter para Cliente</h2>
          </div>
          <p className="text-sm text-stone-500">
            Complete os dados de <strong>{lead.nome}</strong>
          </p>
        </div>

        <form onSubmit={handleSalvar} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
            <input type="text" value={lead.nome} disabled
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-stone-50 text-stone-400" />
          </div>

          <div>
            <label htmlFor="conv-email" className="block text-sm font-medium text-stone-700 mb-1">E-mail</label>
            <input id="conv-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          <div>
            <label htmlFor="conv-tel" className="block text-sm font-medium text-stone-700 mb-1">Telefone</label>
            <input id="conv-tel" type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          <div>
            <label htmlFor="conv-tipo" className="block text-sm font-medium text-stone-700 mb-1">Tipo de Plano</label>
            <select id="conv-tipo" value={tipo_plano} onChange={e => setTipoPlano(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">Selecione...</option>
              {TIPOS_PLANO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="conv-valor" className="block text-sm font-medium text-stone-700 mb-1">
              Valor do Plano (R$) <span className="text-red-500">*</span>
            </label>
            <input id="conv-valor" type="text" value={valor_plano} onChange={e => setValorPlano(e.target.value)}
              placeholder="0,00"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          <div>
            <label htmlFor="conv-obs" className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
            <textarea id="conv-obs" value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
          </div>

          {erro && <p className="text-red-600 text-sm">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancelar}
              className="flex-1 bg-stone-100 text-stone-700 py-2.5 rounded-xl font-medium hover:bg-stone-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {loading ? 'Salvando...' : 'Salvar como Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
