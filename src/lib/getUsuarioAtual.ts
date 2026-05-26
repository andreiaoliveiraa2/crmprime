import { createClient } from '@/lib/supabase/server'
import { Usuario } from '@/lib/types'

export type UsuarioAtual = Pick<Usuario, 'id' | 'auth_user_id' | 'nome' | 'perfil' | 'vendedor_id'>

export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient()

  // Não chama auth.getUser() — a RLS 'usuario_le_proprio' filtra pelo JWT diretamente no banco,
  // evitando conflito quando múltiplos clientes Supabase são criados no mesmo request.
  const { data } = await supabase
    .from('usuarios')
    .select('id, auth_user_id, nome, perfil, vendedor_id')
    .maybeSingle()

  return data as UsuarioAtual | null
}
