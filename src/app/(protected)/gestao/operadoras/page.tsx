import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function OperadorasPage() {
  const supabase = await createClient()
  const { data: operadoras } = await supabase
    .from('operadoras')
    .select('*')
    .order('nome')

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Operadoras</h1>
          <p className="text-sm mt-1" style={{ color: '#7a7065' }}>
            Cadastros e regras de comissão por operadora
          </p>
        </div>
        <Link href="/gestao/operadoras/nova"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Plus size={15} /> Nova Operadora
        </Link>
      </div>

      {(!operadoras || operadoras.length === 0) && (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #e8e4dd' }}>
          <p className="text-sm" style={{ color: '#9a918a' }}>Nenhuma operadora cadastrada.</p>
          <Link href="/gestao/operadoras/nova"
            className="inline-block mt-4 px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
            Cadastrar primeira operadora
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(operadoras ?? []).map(op => (
          <div key={op.id} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-bold" style={{ color: '#2d1f4e' }}>{op.nome}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2"
                style={{
                  backgroundColor: op.ativo ? '#dcfce7' : '#fee2e2',
                  color: op.ativo ? '#15803d' : '#b91c1c',
                }}>
                {op.ativo ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            {op.empresa && (
              <p className="text-xs mb-1 font-medium" style={{ color: '#b89a6a' }}>{op.empresa}</p>
            )}
            {op.telefone && (
              <p className="text-xs mb-1" style={{ color: '#7a7065' }}>{op.telefone}</p>
            )}
            {op.email_gestor && (
              <p className="text-xs mb-3 truncate" style={{ color: '#7a7065' }}>{op.email_gestor}</p>
            )}
            <Link href={`/gestao/operadoras/${op.id}`}
              className="inline-block mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#f0ece6', color: '#2d1f4e' }}>
              Editar
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
