import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OperadoraForm from '@/components/OperadoraForm'
import Link from 'next/link'
import { CnpjRecebimento, RegraComCnpj, NivelVendedor } from '@/lib/types'

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

  // Carregar todas as regras desta operadora que têm CNPJ vinculado
  const { data: regrasRaw } = await supabase
    .from('regras_comissao')
    .select('*')
    .eq('operadora', operadora.nome)
    .not('cnpj_recebimento_id', 'is', null)

  const regraIds = (regrasRaw ?? []).map((r: { id: string }) => r.id)

  // Carregar repassos de todas essas regras em paralelo com cnpjs disponíveis
  const [{ data: repasseTodos }, { data: cnpjsRaw }, { data: niveisRaw }] = await Promise.all([
    regraIds.length > 0
      ? supabase.from('repasse_grupo_vendedor').select('*').in('regra_id', regraIds)
      : Promise.resolve({ data: [] }),
    supabase.from('cnpjs_recebimento').select('*').eq('status', 'Ativo').order('nome'),
    supabase.from('niveis_vendedor').select('*').eq('ativo', true).order('nome'),
  ])

  const cnpjsDisponiveis = (cnpjsRaw ?? []) as CnpjRecebimento[]

  const regrasExistentes: RegraComCnpj[] = (regrasRaw ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    cnpjId: r.cnpj_recebimento_id as string,
    cnpjNome: cnpjsDisponiveis.find(c => c.id === r.cnpj_recebimento_id)?.nome ?? '',
    percentual_total: (r.percentual_total as number) ?? 0,
    num_parcelas: (r.num_parcelas as number) ?? 1,
    percentual_vitalicio: (r.percentual_vitalicio as number) ?? 0,
    desconta_imposto: (r.desconta_imposto as boolean) ?? false,
    percentual_imposto: (r.percentual_imposto as number) ?? 0,
    ativo: (r.ativo as boolean) ?? true,
    repasse: ((repasseTodos ?? []) as Array<{ regra_id: string; nivel: string; percentual: number }>)
      .filter(rp => rp.regra_id === r.id)
      .map(rp => ({ nivel: rp.nivel, percentual: rp.percentual })),
  }))

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
        cnpjsDisponiveis={cnpjsDisponiveis}
        regrasExistentes={regrasExistentes}
        niveis={(niveisRaw ?? []) as NivelVendedor[]}
      />
    </div>
  )
}
