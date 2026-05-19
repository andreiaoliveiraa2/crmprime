import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: cliente } = await supabase.from('clientes').select('*').eq('id', id).single()

  if (!cliente) notFound()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Editar Cliente</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>{cliente.nome}</p>
      </div>
      <ClienteFormPosVenda cliente={cliente} />
    </div>
  )
}
