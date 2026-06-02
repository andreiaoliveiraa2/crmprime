import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SENHA_PADRAO = 'Prime@2025'

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(String(email))) {
    return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const adminClient = createAdminClient()

  const { data: invited, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { vendedor_id },
    redirectTo: `${appUrl}/auth/callback?next=/reset-senha`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Define senha padrão para o vendedor entrar sem precisar clicar no e-mail
  await adminClient.auth.admin.updateUserById(invited.user.id, { password: SENHA_PADRAO })

  return NextResponse.json({ success: true, senha: SENHA_PADRAO })
}
