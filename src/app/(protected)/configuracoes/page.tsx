import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import AlterarSenhaForm from '@/components/AlterarSenhaForm'
import CnpjRecebimentoSection from '@/components/CnpjRecebimentoSection'
import CategoriasDespesaSection from '@/components/CategoriasDespesaSection'
import NiveisVendedorSection from '@/components/NiveisVendedorSection'
import { CnpjRecebimento, CategoriaDespesa, NivelVendedor } from '@/lib/types'

export default async function ConfiguracoesPage() {
  const usuario = await getUsuarioAtual()
  if (!usuario || usuario.perfil !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const [
    { data: { user } },
    { data: cnpjsRaw },
    { data: categoriasRaw },
    { data: niveisRaw },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('cnpjs_recebimento').select('*').order('nome'),
    supabase.from('categorias_despesa').select('*').order('nome'),
    supabase.from('niveis_vendedor').select('*').order('nome'),
  ])

  const cnpjs = (cnpjsRaw ?? []) as CnpjRecebimento[]
  const categorias = (categoriasRaw ?? []) as CategoriaDespesa[]
  const niveis = (niveisRaw ?? []) as NivelVendedor[]

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Configurações</h1>
        <p className="text-sm mt-1" style={{ color: '#7a7065' }}>Dados da conta e cadastros do sistema</p>
      </div>

      <div className="space-y-6 max-w-lg">
        {/* Perfil */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e4dd' }}>
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
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e4dd' }}>
          <h3 className="text-base font-semibold mb-2" style={{ color: '#2d1f4e' }}>Operadoras</h3>
          <p className="text-sm mb-4" style={{ color: '#7a7065' }}>
            Cadastre e configure operadoras, regras de comissão e repasse por nível.
          </p>
          <a href="/gestao/operadoras"
            className="inline-block px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
            Gerenciar Operadoras
          </a>
        </div>

        {/* CNPJs de Recebimento */}
        <CnpjRecebimentoSection cnpjs={cnpjs} />

        {/* Categorias de Despesas */}
        <CategoriasDespesaSection categorias={categorias} />

        {/* Níveis de Vendedor */}
        <NiveisVendedorSection niveis={niveis} />

        {/* Alterar senha */}
        <AlterarSenhaForm />
      </div>
    </div>
  )
}
