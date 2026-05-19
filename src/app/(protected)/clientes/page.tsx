import { createClient } from '@/lib/supabase/server'
import ClientesClient from '@/components/ClientesClient'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <ClientesClient clientes={clientes ?? []} />
    </div>
  )
}
