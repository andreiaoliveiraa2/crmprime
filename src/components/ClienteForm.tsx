'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cliente, ClienteInsert, Etapa, ETAPAS } from '@/lib/types'

interface Props {
  cliente?: Cliente
}

export default function ClienteForm({ cliente }: Props) {
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [contato, setContato] = useState(cliente?.contato ?? '')
  const [data, setData] = useState(cliente?.data ?? '')
  const [etapa, setEtapa] = useState<Etapa>(cliente?.etapa ?? 'Lead')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const editando = !!cliente

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!nome.trim()) {
      setErro('Nome é obrigatório')
      return
    }

    setLoading(true)

    const payload: ClienteInsert = {
      nome: nome.trim(),
      contato: contato.trim() || null,
      data: data || null,
      etapa,
    }

    if (editando) {
      const { error } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', cliente.id)
      if (error) {
        setErro('Erro ao salvar. Tente novamente.')
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase.from('clientes').insert(payload)
      if (error) {
        setErro('Erro ao salvar. Tente novamente.')
        setLoading(false)
        return
      }
    }

    router.push('/crm')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="contato" className="block text-sm font-medium text-gray-700 mb-1">
          Contato
        </label>
        <input
          id="contato"
          type="text"
          value={contato}
          onChange={e => setContato(e.target.value)}
          placeholder="Telefone ou e-mail"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1">
          Data de vencimento
        </label>
        <input
          id="data"
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="etapa" className="block text-sm font-medium text-gray-700 mb-1">
          Etapa <span className="text-red-500">*</span>
        </label>
        <select
          id="etapa"
          value={etapa}
          onChange={e => setEtapa(e.target.value as Etapa)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ETAPAS.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {erro && <p className="text-red-600 text-sm">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/crm')}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
