import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import MpaChatButton from '@/components/MpaChatButton'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nome, perfil, vendedor_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuario) {
    const vendedorId = user.user_metadata?.vendedor_id
    if (vendedorId) redirect('/completar-perfil')
    redirect('/login?erro=conta-sem-perfil')
  }

  const perfil = usuario.perfil
  const nome   = usuario.nome

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f4f1ec' }}>
      <Sidebar perfil={perfil} nome={nome} />
      <main className="flex-1 md:ml-64 print:ml-0">{children}</main>
      <MpaChatButton />
    </div>
  )
}
