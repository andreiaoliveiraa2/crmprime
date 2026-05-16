import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/StatsCard'
import RenovacoesProximas from '@/components/RenovacoesProximas'
import { Etapa, ETAPAS } from '@/lib/types'

const etapaColors: Record<Etapa, 'blue' | 'yellow' | 'gray' | 'green' | 'red'> = {
  Lead: 'blue',
  Contato: 'yellow',
  Proposta: 'gray',
  Fechado: 'green',
  Perdido: 'red',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase.from('clientes').select('*')
  const lista = clientes ?? []

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatsCard title="Total de Clientes" value={lista.length} color="blue" />
        {ETAPAS.map(etapa => (
          <StatsCard
            key={etapa}
            title={etapa}
            value={lista.filter(c => c.etapa === etapa).length}
            color={etapaColors[etapa]}
          />
        ))}
      </div>

      <RenovacoesProximas clientes={lista} />
    </div>
  )
}
