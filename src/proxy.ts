import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROTAS_RESTRITAS_VENDEDOR = ['/financeiro', '/gestao', '/configuracoes', '/marketing']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const rotasPublicas = ['/login', '/signup', '/auth/callback', '/reset-senha']
  const isPublica = rotasPublicas.some(r => pathname.startsWith(r))

  if (!user && !isPublica) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('perfil, ativo')
      .eq('auth_user_id', user.id)
      .single()

    if (usuario?.ativo === false) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const restrita = ROTAS_RESTRITAS_VENDEDOR.some(r => pathname.startsWith(r))
    if (usuario?.perfil === 'vendedor' && restrita) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|auth/callback|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
