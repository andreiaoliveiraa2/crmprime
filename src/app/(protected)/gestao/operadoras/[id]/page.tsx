import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OperadoraForm from '@/components/OperadoraForm'
import Link from 'next/link'

export default async function EditarOperadoraPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: operadora } = await supabase
    .from('operadoras')
    .select('*')
    .eq('id', id)
    .single()

  if (!operadora) notFound()

  const { data: regra } = await supabase
    .from('regras_comissao')
    .select('*')
    .eq('operadora', operadora.nome)
    .maybeSingle()

  const { data: repasseNiveis } = regra
    ? await supabase.from('repasse_grupo_vendedor').select('*').eq('regra_id', regra.id)
    : { data: [] }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/gestao/operadoras"
          className="text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: '#9a918a' }}>
          ← Voltar para Operadoras
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2d1f4e' }}>
          {operadora.nome}
        </h1>
      </div>
      <OperadoraForm
        operadora={operadora}
        regra={regra ?? undefined}
        repasseNiveis={repasseNiveis ?? []}
      />
    </div>
  )
}
