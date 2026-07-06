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

export async function testarGoogleIcal(urls: string): Promise<{ ok: boolean; qtd?: number; erro?: string }> {
  await assertAdmin()
  const lista = urls.split(/[\n,;]+/).map(u => u.trim()).filter(Boolean)
  if (!lista.length) return { ok: false, erro: 'Cole pelo menos um link.' }
  const hoje = new Date()
  const ini = new Date(hoje); ini.setDate(hoje.getDate() - 30)
  const fim = new Date(hoje); fim.setDate(hoje.getDate() + 60)
  let total = 0
  const erros: string[] = []
  for (const u of lista) {
    try {
      const res = await fetch(u.replace(/^webcal:\/\//i, 'https://'), { cache: 'no-store' })
      if (!res.ok) { erros.push(`um link retornou erro ${res.status}`); continue }
      total += parseIcs(await res.text(), ini, fim).length
    } catch (e) {
      erros.push((e as Error).message)
    }
  }
  if (erros.length === lista.length) return { ok: false, erro: erros[0] ?? 'Nenhum link funcionou.' }
  return { ok: true, qtd: total }
}
