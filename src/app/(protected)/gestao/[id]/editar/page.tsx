import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import VendedorForm from '@/components/VendedorForm'

export default async function EditarVendedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: vendedor } = await supabase
    .from('vendedores')
    .select('*')
    .eq('id', id)
    .single()

  if (!vendedor) notFound()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Editar Vendedor</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>{vendedor.nome}</p>
      </div>
      <VendedorForm vendedor={vendedor} />
    </div>
  )
}
