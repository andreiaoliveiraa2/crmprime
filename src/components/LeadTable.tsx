'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Lead, EtapaLead, ETAPAS_LEAD } from '@/lib/types'

type Filtro = EtapaLead | 'Todos'
const FILTROS: Filtro[] = ['Todos', ...ETAPAS_LEAD]

const etapaBadge: Record<EtapaLead, string> = {
  'Novo Lead':        'bg-stone-100 text-stone-600',
  'Contato Feito':    'bg-blue-50 text-blue-700',
  'Cotação':          'bg-amber-50 text-amber-700',
  'Proposta Enviada': 'bg-purple-50 text-purple-700',
  'Negociação':       'bg-orange-50 text-orange-700',
  'Fechado':          'bg-emerald-50 text-emerald-700',
  'Perdido':          'bg-pink-50 text-pink-700',
}

interface Props {
  leads: Lead[]
}

export default function LeadTable({ leads }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('Todos')
  const [busca, setBusca] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const filtrados = leads.filter(l => {
    const matchFiltro = filtro === 'Todos' || l.etapa === filtro
    const matchBusca =
      busca === '' ||
      l.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (l.telefone ?? '').includes(busca)
    return matchFiltro && matchBusca
  })

  async function handleExcluir(id: string) {
    if (!confirm('Deseja excluir este lead?')) return
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) { alert('Erro ao excluir. Tente novamente.'); return }
    router.refresh()
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
        />
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtro === f
                ? 'bg-violet-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Nome</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Telefone</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Tipo de Plano</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Etapa</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-stone-400">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
            {filtrados.map(l => (
              <tr key={l.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 font-medium text-stone-800">{l.nome}</td>
                <td className="px-6 py-4 text-stone-500">{l.telefone ?? '—'}</td>
                <td className="px-6 py-4 text-stone-500">{l.tipo_plano ?? '—'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${etapaBadge[l.etapa]}`}>
                    {l.etapa}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4">
                    <Link href={`/crm/${l.id}`} className="text-violet-600 hover:underline">
                      Editar
                    </Link>
                    <button onClick={() => handleExcluir(l.id)} className="text-red-400 hover:underline">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
