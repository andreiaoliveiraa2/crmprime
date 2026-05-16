import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ClienteTable from '@/components/ClienteTable'

export default async function CrmPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Link
          href="/crm/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Novo Cliente
        </Link>
      </div>

      <ClienteTable clientes={clientes ?? []} />
    </div>
  )
}
