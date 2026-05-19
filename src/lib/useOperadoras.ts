'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useOperadoras() {
  const [operadoras, setOperadoras] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('operadoras')
      .select('nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        if (data) setOperadoras(data.map((o: { nome: string }) => o.nome))
      })
  }, [])

  return operadoras
}
