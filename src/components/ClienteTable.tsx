'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cliente, Etapa, ETAPAS } from '@/lib/types'

type Filtro = Etapa | 'Todos'
const FILTROS: Filtro[] = ['Todos', ...ETAPAS]

interface Props {
  clientes: Cliente[]
}

export default function ClienteTable({ clientes }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('Todos')
  const router = useRouter()
  const supabase = createClient()

  const filtrados = filtro === 'Todos'
    ? clientes
    : clientes.filter(c => c.etapa === filtro)

  async function handleExcluir(id: string) {
    if (!confirm('Deseja excluir este cliente?')) return
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir cliente. Tente novamente.')
      return
    }
    router.refresh()
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Contato</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Data</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Etapa</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {filtrados.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{c.nome}</td>
                <td className="px-6 py-4 text-gray-600">{c.contato ?? '—'}</td>
                <td className="px-6 py-4 text-gray-600">
                  {c.data
                    ? new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')
                    : '—'}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {c.etapa}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4">
                    <Link href={`/crm/${c.id}`} className="text-blue-600 hover:underline">
                      Editar
                    </Link>
                    <button
                      onClick={() => handleExcluir(c.id)}
                      className="text-red-500 hover:underline"
                    >
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
