import { redirect } from 'next/navigation'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import ImportarVitalicioClient from '@/components/ImportarVitalicioClient'

export default async function ImportarVitalicioPage() {
  const usuario = await getUsuarioAtual()
  if (!usuario || usuario.perfil !== 'admin') redirect('/clientes')

  return (
    <div className="p-6 md:p-8">
      <ImportarVitalicioClient />
    </div>
  )
}
