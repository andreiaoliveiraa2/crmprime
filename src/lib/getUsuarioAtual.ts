// src/lib/getUsuarioAtual.ts
import { createClient } from '@/lib/supabase/server'
import { Usuario } from '@/lib/types'

export type UsuarioAtual = Pick<Usuario, 'id' | 'auth_user_id' | 'nome' | 'perfil' | 'vendedor_id'>

export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('usuarios')
    .select('id, auth_user_id, nome, perfil, vendedor_id')
    .eq('auth_user_id', user.id)
    .single()

  return data as UsuarioAtual | null
}
