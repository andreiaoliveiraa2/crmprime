import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ClienteTablePosVenda from '@/components/ClienteTablePosVenda'
import { Plus } from 'lucide-react'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Clientes</h1>
          <p className="text-sm text-stone-500 mt-1">Clientes com planos ativos</p>
        </div>
        <Link href="/clientes/novo"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
          <Plus size={16} />
          Novo Cliente
        </Link>
      </div>
      <ClienteTablePosVenda clientes={clientes ?? []} />
    </div>
  )
}
