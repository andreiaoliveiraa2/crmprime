// src/app/actions/usuarios.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function seedAdminAtual(nome: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const admin = createAdminClient()
  const { data: existe } = await admin
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (existe) return { ok: true, msg: 'Já cadastrado' }

  const { error } = await admin.from('usuarios').insert({
    auth_user_id: user.id,
    nome,
    email: user.email ?? null,
    perfil: 'admin',
    vendedor_id: null,
    ativo: true,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/configuracoes')
  return { ok: true }
}

export async function convidarUsuario(formData: FormData) {
  const nome       = formData.get('nome') as string
  const email      = formData.get('email') as string
  const perfil     = formData.get('perfil') as 'admin' | 'vendedor'
  const vendedor_id = formData.get('vendedor_id') as string | null

  if (!nome || !email || !perfil) throw new Error('Campos obrigatórios faltando')
  if (perfil === 'vendedor' && !vendedor_id) throw new Error('Selecione o vendedor vinculado')

  const admin = createAdminClient()

  const { data: authUser, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome },
  })
  if (inviteErr) throw new Error(inviteErr.message)

  const { error: dbErr } = await admin.from('usuarios').insert({
    auth_user_id: authUser.user.id,
    nome,
    email,
    perfil,
    vendedor_id: vendedor_id || null,
    ativo: true,
  })
  if (dbErr) throw new Error(dbErr.message)

  revalidatePath('/configuracoes')
}

export async function editarUsuario(formData: FormData) {
  const id          = formData.get('id') as string
  const nome        = formData.get('nome') as string
  const perfil      = formData.get('perfil') as 'admin' | 'vendedor'
  const vendedor_id = formData.get('vendedor_id') as string | null
  const ativo       = formData.get('ativo') === 'true'

  const admin = createAdminClient()
  const { error } = await admin
    .from('usuarios')
    .update({ nome, perfil, vendedor_id: vendedor_id || null, ativo })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/configuracoes')
}

export async function reenviarConvite(email: string) {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(email)
  if (error) throw new Error(error.message)
}
