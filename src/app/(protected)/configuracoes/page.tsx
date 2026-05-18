import { createClient } from '@/lib/supabase/server'
import AlterarSenhaForm from '@/components/AlterarSenhaForm'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Configurações</h1>
        <p className="text-sm text-stone-500 mt-1">Dados da sua conta</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-lg">
        <h3 className="text-base font-semibold text-stone-800 mb-5">Perfil</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">E-mail</label>
            <p className="text-sm text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
              {user?.email ?? '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">ID da conta</label>
            <p className="text-xs text-stone-400 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 font-mono break-all">
              {user?.id ?? '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">Conta criada em</label>
            <p className="text-sm text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      <AlterarSenhaForm />
    </div>
  )
}
