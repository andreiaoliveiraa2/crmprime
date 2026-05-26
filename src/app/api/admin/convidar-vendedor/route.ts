import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('auth_user_id', user.id)
    .single()

  if (usuario?.perfil !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { vendedor_id, email } = await request.json()
  if (!vendedor_id || !email) {
    return NextResponse.json({ error: 'vendedor_id e email são obrigatórios' }, { status: 400 })
  }

  const origin = request.nextUrl.origin
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { vendedor_id },
    redirectTo: `${origin}/auth/callback?next=/completar-perfil`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
