'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cliente, ClienteInsert, TIPOS_PLANO } from '@/lib/types'

interface Props {
  cliente?: Cliente
}

export default function ClienteFormPosVenda({ cliente }: Props) {
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [contato, setContato] = useState(cliente?.contato ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [tipo_plano, setTipoPlano] = useState(cliente?.tipo_plano ?? '')
  const [valor_plano, setValorPlano] = useState(cliente?.valor_plano?.toString() ?? '')
  const [observacoes, setObservacoes] = useState(cliente?.observacoes ?? '')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const editando = !!cliente

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!nome.trim()) { setErro('Nome é obrigatório'); return }

    const valor = Number(valor_plano.replace(',', '.'))
    if (!valor_plano || isNaN(valor)) { setErro('Valor do plano é obrigatório'); return }

    setLoading(true)

    const payload: ClienteInsert = {
      nome: nome.trim(),
      contato: contato.trim() || null,
      email: email.trim() || null,
      tipo_plano: tipo_plano || null,
      operadora: cliente?.operadora ?? null,
      quantidade_vidas: cliente?.quantidade_vidas ?? null,
      valor_plano: valor,
      observacoes: observacoes.trim() || null,
      lead_id: cliente?.lead_id ?? null,
    }

    if (editando) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    } else {
      const { error } = await supabase.from('clientes').insert(payload)
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    }

    setLoading(false)
    router.push('/clientes')
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
        <label htmlFor="telefone" className="block text-sm font-medium text-stone-700 mb-1">Telefone</label>
        <input id="telefone" type="text" value={contato} onChange={e => setContato(e.target.value)}
          placeholder="(00) 00000-0000"
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">E-mail</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      <div>
        <label htmlFor="tipo_plano" className="block text-sm font-medium text-stone-700 mb-1">Tipo de Plano</label>
        <select id="tipo_plano" value={tipo_plano} onChange={e => setTipoPlano(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
          <option value="">Selecione...</option>
          {TIPOS_PLANO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="valor_plano" className="block text-sm font-medium text-stone-700 mb-1">
          Valor do Plano (R$) <span className="text-red-500">*</span>
        </label>
        <input id="valor_plano" type="text" value={valor_plano} onChange={e => setValorPlano(e.target.value)}
          placeholder="0,00"
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
        <textarea id="observacoes" value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={4}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
      </div>

      {erro && <p className="text-red-600 text-sm">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={() => router.push('/clientes')}
          className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl font-medium hover:bg-stone-200 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
