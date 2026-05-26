import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

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
    // Só redireciona para completar-perfil se for vendedor convidado
    const vendedorId = user.user_metadata?.vendedor_id
    if (vendedorId) redirect('/completar-perfil')
    // Admin sem registro em usuarios → usa defaults (não entra em loop)
  }

  const perfil = usuario?.perfil ?? 'admin'
  const nome   = usuario?.nome ?? user.email ?? 'Usuário'

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f4f1ec' }}>
      <Sidebar perfil={perfil} nome={nome} />
      <main className="flex-1 md:ml-64">{children}</main>
    </div>
  )
}
