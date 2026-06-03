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

  const adminClient = createAdminClient()

  const { data: created, error } = await adminClient.auth.admin.createUser({
    email,
    password: SENHA_PADRAO,
    user_metadata: { vendedor_id },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // createUser nao confirma o e-mail automaticamente — updateUserById faz isso
  await adminClient.auth.admin.updateUserById(created.user.id, {
    password: SENHA_PADRAO,
    email_confirm: true,
  })

  return NextResponse.json({ success: true, senha: SENHA_PADRAO })
}
