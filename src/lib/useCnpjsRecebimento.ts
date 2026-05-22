'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CnpjRecebimento } from '@/lib/types'

export function useCnpjsRecebimento() {
  const [cnpjs, setCnpjs] = useState<CnpjRecebimento[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('cnpjs_recebimento')
      .select('*')
      .eq('status', 'Ativo')
      .order('nome')
      .then(({ data }) => {
        if (data) setCnpjs(data as CnpjRecebimento[])
      })
  }, [])

  return cnpjs
}
