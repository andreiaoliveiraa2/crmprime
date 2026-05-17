'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Cliente } from '@/lib/types'

interface Props {
  clientes: Cliente[]
}

export default function ClienteTablePosVenda({ clientes }: Props) {
  const [busca, setBusca] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const filtrados = clientes.filter(c =>
    busca === '' ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.contato ?? '').includes(busca)
  )

  async function handleExcluir(id: string) {
    if (!confirm('Deseja excluir este cliente?')) return
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) { alert('Erro ao excluir. Tente novamente.'); return }
    router.refresh()
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar por nome, email ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Nome</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Email</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Telefone</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Plano</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Valor</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-stone-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {filtrados.map(c => (
              <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 font-medium text-stone-800">{c.nome}</td>
                <td className="px-6 py-4 text-stone-500">{c.email ?? '—'}</td>
                <td className="px-6 py-4 text-stone-500">{c.contato ?? '—'}</td>
                <td className="px-6 py-4 text-stone-500">{c.tipo_plano ?? '—'}</td>
                <td className="px-6 py-4 font-semibold text-emerald-600">
                  {c.valor_plano != null
                    ? `R$ ${c.valor_plano.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4">
                    <Link href={`/clientes/${c.id}`} className="text-violet-600 hover:underline">Editar</Link>
                    <button onClick={() => handleExcluir(c.id)} className="text-red-400 hover:underline">Excluir</button>
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
