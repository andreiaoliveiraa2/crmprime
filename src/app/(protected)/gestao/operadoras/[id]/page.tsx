import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OperadoraForm from '@/components/OperadoraForm'
import Link from 'next/link'
import { CnpjRecebimento, RegraComCnpj } from '@/lib/types'

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

  // Carregar parcelas e cnpjs disponíveis
  const [{ data: parcelasTodasRaw }, { data: cnpjsRaw }] = await Promise.all([
    regraIds.length > 0
      ? supabase.from('parcelas_regra').select('*').in('regra_id', regraIds).order('numero_parcela')
      : Promise.resolve({ data: [] }),
    supabase.from('cnpjs_recebimento').select('*').eq('status', 'Ativo').order('nome'),
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
    adesao_direta: (r.adesao_direta as boolean) ?? false,
    ativo: (r.ativo as boolean) ?? true,
    parcelas_regra: ((parcelasTodasRaw ?? []) as Array<{ regra_id: string; numero_parcela: number; percentual_empresa: number; percentual_vendedor: number }>)
      .filter(p => p.regra_id === r.id)
      .map(p => ({ numero_parcela: p.numero_parcela, percentual_empresa: p.percentual_empresa, percentual_vendedor: p.percentual_vendedor })),
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
      />
    </div>
  )
}
