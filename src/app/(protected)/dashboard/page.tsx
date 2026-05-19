import { createClient } from '@/lib/supabase/server'
import DashboardCard from '@/components/DashboardCard'
import { Users, Activity, TrendingUp, DollarSign, Calendar, ChevronRight, BarChart3 } from 'lucide-react'
import { Lead, Cliente, ETAPAS_LEAD } from '@/lib/types'
import Link from 'next/link'

const etapaColors: Record<string, string> = {
  'Novo Lead': 'bg-blue-50 text-blue-600',
  'Contato Feito': 'bg-sky-50 text-sky-600',
  'Proposta Enviada': 'bg-amber-50 text-amber-600',
  'Negociação': 'bg-orange-50 text-orange-600',
  'Fechado': 'bg-emerald-50 text-emerald-600',
  'Perdido': 'bg-red-50 text-red-600',
}

const etapaBarColors: Record<string, string> = {
  'Novo Lead': 'bg-blue-400',
  'Contato Feito': 'bg-sky-400',
  'Proposta Enviada': 'bg-amber-400',
  'Negociação': 'bg-orange-400',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: leadsData }, { data: clientesData }] = await Promise.all([
    supabase.from('leads').select('*').order('criado_em', { ascending: false }),
    supabase.from('clientes').select('*').order('criado_em', { ascending: false }),
  ])

  const leads: Lead[] = leadsData ?? []
  const clientes: Cliente[] = clientesData ?? []

  // Métricas principais
  const etapasAtivas = ['Novo Lead', 'Contato Feito', 'Proposta Enviada', 'Negociação'] as const
  const leadsAtivos = leads.filter(l => etapasAtivas.includes(l.etapa as typeof etapasAtivas[number])).length
  const vendasAndamento = leads.filter(l => l.etapa === 'Proposta Enviada' || l.etapa === 'Negociação').length

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const clientesMes = clientes.filter(c => c.criado_em && new Date(c.criado_em) >= inicioMes)
  const ganhosMes = clientesMes.reduce((sum, c) => sum + (c.valor_plano ?? 0), 0)

  // Leads por etapa (pipeline visual)
  const leadsPorEtapa = etapasAtivas.map(etapa => ({
    etapa,
    count: leads.filter(l => l.etapa === etapa).length,
  }))
  const maxLeadsEtapa = Math.max(...leadsPorEtapa.map(e => e.count), 1)

  // Vendas do mês por tipo de plano
  const tiposPlano = ['Saúde', 'Odonto', 'Vida', 'Auto', 'Residencial', 'Empresarial', 'Outro']
  const vendasPorTipo = tiposPlano
    .map(tipo => ({
      tipo,
      total: clientesMes.filter(c => c.tipo_plano === tipo).reduce((s, c) => s + (c.valor_plano ?? 0), 0),
      count: clientesMes.filter(c => c.tipo_plano === tipo).length,
    }))
    .filter(v => v.count > 0)
    .sort((a, b) => b.total - a.total)
  const maxVendas = Math.max(...vendasPorTipo.map(v => v.total), 1)

  const leadsRecentes = leads.slice(0, 6)
  const clientesRecentes = clientes.slice(0, 6)

  const hoje = new Date()
  const dataFormatada = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const mesAtual = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-8">

        {/* Esquerda — saudação */}
        <div>
          <h1
            className="font-semibold"
            style={{ fontSize: '22px', color: '#2d1f4e' }}
          >
            Olá, Andreia 👋
          </h1>
          <p className="mt-1" style={{ fontSize: '13px', color: '#7a7065' }}>
            Aqui está o resumo do seu dia
          </p>
        </div>

        {/* Direita — badge data + versículo */}
        <div className="flex flex-col items-start md:items-end gap-2" style={{ maxWidth: '340px' }}>

          {/* Badge data */}
          <span
            className="text-xs font-medium capitalize px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: 'rgba(45,31,78,0.07)',
              color: '#2d1f4e',
            }}
          >
            {dataFormatada}
          </span>

          {/* Card versículo */}
          <div
            className="bg-white px-4 py-3 rounded-xl w-full"
            style={{
              border: '1px solid #e8e4dd',
              borderLeft: '3px solid #b89a6a',
            }}
          >
            <p
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '12px',
                color: '#5a4e3c',
                lineHeight: '1.6',
              }}
            >
              "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos."
            </p>
            <p
              className="mt-1.5 text-xs font-medium"
              style={{ color: '#b89a6a' }}
            >
              Provérbios 16:3
            </p>
          </div>
        </div>
      </div>

      {/* Cards de métricas — 2 colunas no mobile, 4 no desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title="Total de Clientes"
          value={clientes.length}
          icon={Users}
          subtitle="clientes ativos"
        />
        <DashboardCard
          title="Leads Ativos"
          value={leadsAtivos}
          icon={Activity}
          subtitle="no pipeline"
        />
        <DashboardCard
          title="Em Negociação"
          value={vendasAndamento}
          icon={TrendingUp}
          subtitle="proposta + negociação"
        />
        <DashboardCard
          title="Ganhos no Mês"
          value={`R$ ${ganhosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          subtitle={`${clientesMes.length} ${clientesMes.length === 1 ? 'novo cliente' : 'novos clientes'}`}
        />
      </div>

      {/* Pipeline + Vendas por Tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Leads por Etapa */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Leads por Etapa</h3>
              <p className="text-xs text-stone-400 mt-0.5">{leadsAtivos} leads ativos no pipeline</p>
            </div>
            <Link
              href="/pipeline"
              className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-0.5 transition-colors"
            >
              Ver pipeline <ChevronRight size={12} />
            </Link>
          </div>

          {leadsAtivos === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity size={28} className="text-stone-200 mb-2" />
              <p className="text-sm text-stone-400">Nenhum lead ativo no momento.</p>
              <Link href="/crm/novo" className="text-xs text-violet-600 mt-2 hover:underline">
                Adicionar primeiro lead
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {leadsPorEtapa.map(({ etapa, count }) => (
                <div key={etapa}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-stone-600">{etapa}</span>
                    <span className="text-xs font-bold text-stone-800 tabular-nums">
                      {count} {count === 1 ? 'lead' : 'leads'}
                    </span>
                  </div>
                  <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${etapaBarColors[etapa] ?? 'bg-violet-400'}`}
                      style={{ width: count === 0 ? '0%' : `${Math.max((count / maxLeadsEtapa) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vendas do Mês por Tipo de Plano */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Vendas por Tipo de Plano</h3>
              <p className="text-xs text-stone-400 mt-0.5 capitalize">{mesAtual}</p>
            </div>
            <Link
              href="/clientes"
              className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-0.5 transition-colors"
            >
              Ver clientes <ChevronRight size={12} />
            </Link>
          </div>

          {vendasPorTipo.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 size={28} className="text-stone-200 mb-2" />
              <p className="text-sm text-stone-400">Nenhuma venda registrada este mês.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendasPorTipo.map(({ tipo, total, count }) => (
                <div key={tipo}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-stone-600">{tipo}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400">({count})</span>
                      <span className="text-xs font-bold text-emerald-700 tabular-nums">
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max((total / maxVendas) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos Leads + Últimos Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Leads Recentes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-800">Últimos Leads</h3>
            <Link
              href="/crm"
              className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-0.5 transition-colors"
            >
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>

          {leadsRecentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-stone-400">Nenhum lead cadastrado.</p>
              <Link href="/crm/novo" className="text-xs text-violet-600 mt-2 hover:underline">
                Cadastrar primeiro lead
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {leadsRecentes.map(l => (
                <li key={l.id} className="py-3 flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{l.nome}</p>
                    <p className="text-xs text-stone-400">{l.tipo_plano ?? '—'}</p>
                  </div>
                  <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${etapaColors[l.etapa] ?? 'bg-stone-100 text-stone-600'}`}>
                    {l.etapa}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Clientes Recentes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-800">Últimos Clientes</h3>
            <Link
              href="/clientes"
              className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-0.5 transition-colors"
            >
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>

          {clientesRecentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-stone-400">Nenhum cliente fechado ainda.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {clientesRecentes.map(c => (
                <li key={c.id} className="py-3 flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{c.nome}</p>
                    <p className="text-xs text-stone-400">{c.tipo_plano ?? '—'}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-emerald-600 tabular-nums">
                    R$ {(c.valor_plano ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Compromissos da Semana — placeholder até o módulo de agenda */}
      <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-stone-100 text-stone-400 shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-600">Compromissos da Semana</p>
            <p className="text-xs text-stone-400 mt-0.5">
              O módulo de agenda ainda será configurado. Quando estiver pronto, seus compromissos da semana aparecerão aqui.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
