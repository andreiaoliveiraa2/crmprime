'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadInsert, EtapaLead, ETAPAS_LEAD, TIPOS_PLANO } from '@/lib/types'

interface Props {
  lead?: Lead
}

export default function LeadForm({ lead }: Props) {
  const [nome, setNome] = useState(lead?.nome ?? '')
  const [telefone, setTelefone] = useState(lead?.telefone ?? '')
  const [tipo_plano, setTipoPlano] = useState(lead?.tipo_plano ?? '')
  const [etapa, setEtapa] = useState<EtapaLead>(lead?.etapa ?? 'Novo Lead')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const editando = !!lead

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) { setErro('Nome é obrigatório'); return }
    setLoading(true)

    const payload: LeadInsert = {
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      tipo_plano: tipo_plano || null,
      operadora: lead?.operadora ?? null,
      responsavel: lead?.responsavel ?? null,
      etapa,
    }

    if (editando) {
      const { error } = await supabase.from('leads').update(payload).eq('id', lead.id)
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    } else {
      const { error } = await supabase.from('leads').insert(payload)
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    }

    setLoading(false)
    router.push('/crm')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-stone-700 mb-1">
          Nome <span className="text-red-500">*</span>
        </label>
        <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-stone-700 mb-1">
          Telefone / WhatsApp
        </label>
        <input id="telefone" type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
          placeholder="(00) 00000-0000"
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      <div>
        <label htmlFor="tipo_plano" className="block text-sm font-medium text-stone-700 mb-1">
          Tipo de Plano
        </label>
        <select id="tipo_plano" value={tipo_plano} onChange={e => setTipoPlano(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
          <option value="">Selecione...</option>
          {TIPOS_PLANO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="etapa" className="block text-sm font-medium text-stone-700 mb-1">
          Etapa <span className="text-red-500">*</span>
        </label>
        <select id="etapa" value={etapa} onChange={e => setEtapa(e.target.value as EtapaLead)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
          {ETAPAS_LEAD.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {erro && <p className="text-red-600 text-sm">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={() => router.push('/crm')}
          className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl font-medium hover:bg-stone-200 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
