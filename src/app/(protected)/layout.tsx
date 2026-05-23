import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import Sidebar from '@/components/Sidebar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const usuario = await getUsuarioAtual()
  const perfil = usuario?.perfil ?? 'admin'
  const nome   = usuario?.nome ?? user.email ?? 'Usuário'

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f4f1ec' }}>
      <Sidebar perfil={perfil} nome={nome} />
      <main className="flex-1 md:ml-64">{children}</main>
    </div>
  )
}
