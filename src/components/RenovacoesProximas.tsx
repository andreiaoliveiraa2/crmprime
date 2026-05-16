import { Cliente } from '@/lib/types'

interface Props {
  clientes: Cliente[]
}

export default function RenovacoesProximas({ clientes }: Props) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const em30Dias = new Date(hoje)
  em30Dias.setDate(hoje.getDate() + 30)

  const proximas = clientes.filter(c => {
    if (!c.data) return false
    const data = new Date(c.data + 'T00:00:00')
    return data >= hoje && data <= em30Dias
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Renovações Próximas (30 dias)
      </h3>

      {proximas.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma renovação nos próximos 30 dias.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {proximas.map(c => (
            <li key={c.id} className="py-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.nome}</p>
                {c.contato && <p className="text-xs text-gray-500">{c.contato}</p>}
              </div>
              <span className="text-sm text-orange-600 font-medium">
                {new Date(c.data! + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
