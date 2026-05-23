// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROTAS_RESTRITAS_VENDEDOR = ['/financeiro', '/gestao', '/configuracoes', '/marketing']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil, ativo')
    .eq('auth_user_id', user.id)
    .single()

  // Usuário inativo → logout
  if (usuario?.ativo === false) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Vendedor tentando acessar rota restrita → dashboard
  const pathname = request.nextUrl.pathname
  const restrita = ROTAS_RESTRITAS_VENDEDOR.some(r => pathname.startsWith(r))
  if (usuario?.perfil === 'vendedor' && restrita) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|signup|reset-senha|api).*)',
  ],
}
