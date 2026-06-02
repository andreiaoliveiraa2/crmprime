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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go(next)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go(next)
    })

    const timer = setTimeout(() => go('/login?erro=confirmacao'), 5000)

    return () => { subscription.unsubscribe(); clearTimeout(timer) }
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
