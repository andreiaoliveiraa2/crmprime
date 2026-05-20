import { createClient } from '@/lib/supabase/server'
import FinanceiroClient from '@/components/FinanceiroClient'

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const [
    { data: vendas },
    { data: comissoes },
    { data: contas },
    { data: regras },
    { data: parcelas },
  ] = await Promise.all([
    supabase.from('vendas').select('*').order('criado_em', { ascending: false }).limit(100),
    supabase.from('comissoes').select('*').order('criado_em', { ascending: false }).limit(200),
    supabase.from('contas').select('*').order('vencimento', { ascending: true }),
    supabase.from('regras_comissao').select('*'),
    supabase.from('parcelas_regra').select('*'),
  ])

  return (
    <div className="p-6 md:p-8">
      <FinanceiroClient
        vendas={vendas ?? []}
        comissoes={comissoes ?? []}
        contas={contas ?? []}
        regras={regras ?? []}
        parcelas={parcelas ?? []}
      />
    </div>
  )
}
