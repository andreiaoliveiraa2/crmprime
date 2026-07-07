'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { revalidatePath } from 'next/cache'

export async function salvarMetas(
  vendedorId: string | null,
  mesRef: string,                                       // 'YYYY-MM-01'
  valores: { operadora: string; meta_valor: number }[],
): Promise<void> {
  const usuario = await getUsuarioAtual()
  if (!usuario || usuario.perfil !== 'admin') throw new Error('Não autorizado')

  const supabase = await createClient()

  // Redefine o mês: apaga as metas do escopo+mês e regrava só as com valor > 0.
  let del = supabase.from('metas').delete().eq('mes_referencia', mesRef)
  del = vendedorId === null ? del.is('vendedor_id', null) : del.eq('vendedor_id', vendedorId)
  const { error: eDel } = await del
  if (eDel) throw new Error(eDel.message)

  const linhas = valores
    .filter(v => v.meta_valor > 0)
    .map(v => ({ vendedor_id: vendedorId, mes_referencia: mesRef, operadora: v.operadora, meta_valor: v.meta_valor }))

  if (linhas.length > 0) {
    const { error } = await supabase.from('metas').insert(linhas)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/gestao')
}
