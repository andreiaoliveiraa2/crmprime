import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Editar Cliente</h1>
      <p className="text-sm text-stone-500 mb-6">{cliente.nome}</p>
      <ClienteFormPosVenda cliente={cliente} />
    </div>
  )
}
