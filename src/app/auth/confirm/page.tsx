'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const next = searchParams.get('next') ?? '/dashboard'
    let done = false

    function go(dest: string) {
      if (!done) { done = true; router.replace(dest) }
    }

    async function handle() {
      // Tenta ler tokens do hash da URL (fluxo implícito do Supabase)
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.replace('#', ''))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (data.session) { go(next); return }
          if (error) { go('/login?erro=confirmacao'); return }
        }
      }

      // Fallback: verifica se já existe sessão ativa (ex: usuário já logado)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { go(next); return }

      // Nenhuma sessão encontrada
      go('/login?erro=confirmacao')
    }

    handle()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Autenticando...</p>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  )
}
