import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CompletarPerfilForm from '@/components/CompletarPerfilForm'

export default async function CompletarPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (usuario) redirect('/dashboard')

  const vendedorId = user.user_metadata?.vendedor_id as string | undefined

  if (!vendedorId) redirect('/login?erro=convite-invalido')

  const { data: vendedor } = await supabase
    .from('vendedores')
    .select('nome')
    .eq('id', vendedorId)
    .single()

  return (
    <CompletarPerfilForm
      authUserId={user.id}
      vendedorId={vendedorId}
      nomeInicial={vendedor?.nome ?? ''}
      email={user.email ?? ''}
    />
  )
}
