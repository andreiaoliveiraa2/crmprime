import { createClient } from '@/lib/supabase/server'
import DashboardCard from '@/components/DashboardCard'
import { Users, Activity, TrendingUp, DollarSign } from 'lucide-react'
import { Lead, Cliente } from '@/lib/types'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: leadsData }, { data: clientesData }] = await Promise.all([
    supabase.from('leads').select('*').order('criado_em', { ascending: false }),
    supabase.from('clientes').select('*').order('criado_em', { ascending: false }),
  ])

  const leads: Lead[] = leadsData ?? []
  const clientes: Cliente[] = clientesData ?? []

  const leadsAtivos = leads.filter(l => l.etapa !== 'Fechado' && l.etapa !== 'Perdido').length
  const vendasAndamento = leads.filter(l => l.etapa === 'Proposta Enviada' || l.etapa === 'Negociação').length

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const ganhosMes = clientes
    .filter(c => new Date(c.criado_em) >= inicioMes)
    .reduce((sum, c) => sum + (c.valor_plano ?? 0), 0)

  const leadsRecentes = leads.slice(0, 5)
  const clientesRecentes = clientes.slice(0, 5)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <DashboardCard title="Total de Clientes" value={clientes.length} icon={Users} color="violet" subtitle="clientes ativos" />
        <DashboardCard title="Leads Ativos" value={leadsAtivos} icon={Activity} color="blue" subtitle="em negociação" />
        <DashboardCard title="Vendas em Andamento" value={vendasAndamento} icon={TrendingUp} color="amber" subtitle="proposta + negociação" />
        <DashboardCard
          title="Ganhos no Mês"
          value={`R$ ${ganhosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="emerald"
          subtitle="clientes fechados este mês"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-800">Leads Recentes</h3>
            <Link href="/crm" className="text-xs text-violet-600 hover:underline">Ver todos</Link>
          </div>
          {leadsRecentes.length === 0 ? (
            <p className="text-sm text-stone-400">Nenhum lead cadastrado.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {leadsRecentes.map(l => (
                <li key={l.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{l.nome}</p>
                    <p className="text-xs text-stone-400">{l.tipo_plano ?? '—'}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-600 font-medium">
                    {l.etapa}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-800">Clientes Recentes</h3>
            <Link href="/clientes" className="text-xs text-violet-600 hover:underline">Ver todos</Link>
          </div>
          {clientesRecentes.length === 0 ? (
            <p className="text-sm text-stone-400">Nenhum cliente fechado ainda.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {clientesRecentes.map(c => (
                <li key={c.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{c.nome}</p>
                    <p className="text-xs text-stone-400">{c.tipo_plano ?? '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    R$ {(c.valor_plano ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
