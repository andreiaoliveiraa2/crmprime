import { createClient } from '@/lib/supabase/server'
import AlterarSenhaForm from '@/components/AlterarSenhaForm'
import OperadorasSection from '@/components/OperadorasSection'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Configurações</h1>
        <p className="text-sm mt-1" style={{ color: '#7a7065' }}>Dados da conta e cadastros do sistema</p>
      </div>

      <div className="space-y-6">
        {/* Perfil */}
        <div className="bg-white rounded-2xl border p-6 max-w-lg" style={{ borderColor: '#e8e4dd' }}>
          <h3 className="text-base font-semibold mb-5" style={{ color: '#2d1f4e' }}>Perfil</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9a918a' }}>E-mail</label>
              <p className="text-sm px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#f4f1ec', color: '#2d1f4e', border: '1px solid #e8e4dd' }}>
                {user?.email ?? '—'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9a918a' }}>Conta criada em</label>
              <p className="text-sm px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#f4f1ec', color: '#2d1f4e', border: '1px solid #e8e4dd' }}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Operadoras */}
        <OperadorasSection />

        {/* Alterar senha */}
        <AlterarSenhaForm />
      </div>
    </div>
  )
}
