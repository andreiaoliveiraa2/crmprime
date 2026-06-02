import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { redirect } from 'next/navigation'
import { Comissao } from '@/lib/types'

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

function tipoLabel(c: Comissao) {
  if (c.tipo === 'vitalicio') return 'Vitalício'
  if (c.numero_parcela === 1) return 'Adesão'
  return `Parcela ${c.numero_parcela}`
}

export default async function MinhasComissoesPage() {
  const usuario = await getUsuarioAtual()
  if (!usuario || usuario.perfil !== 'vendedor') redirect('/dashboard')

  const supabase = await createClient()

  const { data: comissoesRaw } = await supabase
    .from('comissoes')
    .select('*, vendas!inner(cliente_nome, operadora)')
    .order('data_prevista', { ascending: false })

  const comissoes = (comissoesRaw ?? []) as (Comissao & {
    vendas: { cliente_nome: string; operadora: string }
  })[]

  const totalPendente = comissoes
    .filter(c => c.status_vendedor === 'Pendente')
    .reduce((s, c) => s + c.valor_vendedor, 0)

  const totalRecebido = comissoes
    .filter(c => c.status_vendedor === 'Recebido')
    .reduce((s, c) => s + c.valor_vendedor, 0)

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Minhas Comissões</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
          Valores a receber pelas suas vendas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4" style={{ border: '2px solid #d4af7a' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#9a918a' }}>A Receber</p>
          <p className="text-xl font-bold" style={{ color: '#2d1f4e' }}>{fmtMoeda(totalPendente)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4" style={{ border: '2px solid #d4af7a' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#9a918a' }}>Já Recebido</p>
          <p className="text-xl font-bold" style={{ color: '#15803d' }}>{fmtMoeda(totalRecebido)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        {comissoes.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: '#9a918a' }}>
            Nenhuma comissão registrada ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e4dd', backgroundColor: '#faf8f5' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Operadora</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Tipo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Previsto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f0ece6' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>
                    {c.vendas.cliente_nome}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>
                    {c.vendas.operadora}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{tipoLabel(c)}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: '#2d1f4e' }}>
                    {fmtMoeda(c.valor_vendedor)}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{fmtData(c.data_prevista)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={c.status_vendedor === 'Recebido'
                        ? { backgroundColor: '#dcfce7', color: '#15803d' }
                        : { backgroundColor: '#fef9c3', color: '#a16207' }
                      }
                    >
                      {c.status_vendedor}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
