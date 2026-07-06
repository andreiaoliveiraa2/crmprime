'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { parseIcs } from '@/lib/googleAgenda'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const u = await getUsuarioAtual()
  if (!u || u.perfil !== 'admin') throw new Error('Não autorizado')
}

export async function getGoogleIcalUrl(): Promise<string> {
  await assertAdmin()
  const admin = createAdminClient()
  const { data } = await admin
    .from('integracoes')
    .select('valor')
    .eq('chave', 'google_ical_url')
    .maybeSingle()
  return data?.valor ?? ''
}

export async function salvarGoogleIcalUrl(formData: FormData) {
  await assertAdmin()
  const url = String(formData.get('url') ?? '').trim()
  const admin = createAdminClient()
  await admin.from('integracoes').upsert(
    {
      chave: 'google_ical_url',
      valor: url || null,
      ativo: !!url,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'chave' }
  )
  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  revalidatePath('/configuracoes')
}

export async function testarGoogleIcal(url: string): Promise<{ ok: boolean; qtd?: number; erro?: string }> {
  await assertAdmin()
  const limpa = url.trim().replace(/^webcal:\/\//i, 'https://')
  if (!limpa) return { ok: false, erro: 'Cole o link primeiro.' }
  try {
    const res = await fetch(limpa, { cache: 'no-store' })
    if (!res.ok) return { ok: false, erro: `O link retornou erro ${res.status}. Confira se copiou o endereço secreto certo.` }
    const hoje = new Date()
    const ini = new Date(hoje); ini.setDate(hoje.getDate() - 30)
    const fim = new Date(hoje); fim.setDate(hoje.getDate() + 60)
    const qtd = parseIcs(await res.text(), ini, fim).length
    return { ok: true, qtd }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}
