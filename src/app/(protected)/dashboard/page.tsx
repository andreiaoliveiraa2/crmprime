import { createClient } from '@/lib/supabase/server'
import DashboardCard from '@/components/DashboardCard'
import { Users, ArrowLeftRight, FileText, CheckCircle, Activity, Calendar, ChevronRight, BarChart3 } from 'lucide-react'
import { Lead, Cliente, Compromisso } from '@/lib/types'
import Link from 'next/link'

const etapaBadge: Record<string, { bg: string; color: string }> = {
  'Novo Lead':        { bg: '#f0f0f0',             color: '#6b7280' },
  'Contato Feito':    { bg: '#dbeafe',             color: '#1d4ed8' },
  'Cotação':          { bg: 'rgba(184,154,106,0.15)', color: '#92601a' },
  'Proposta Enviada': { bg: '#fef3c7',             color: '#b45309' },
  'Negociação':       { bg: '#ffedd5',             color: '#c2410c' },
  'Fechado':          { bg: '#dcfce7',             color: '#15803d' },
  'Perdido':          { bg: '#fce7f3',             color: '#be185d' },
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

  const inicioSemana = new Date()
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1)
  inicioSemana.setHours(0, 0, 0, 0)
  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(inicioSemana.getDate() + 6)
  fimSemana.setHours(23, 59, 59, 999)

  const [{ data: leadsData }, { data: clientesData }, { data: compromissosData }] = await Promise.all([
    supabase.from('leads').select('*').order('criado_em', { ascending: false }),
    supabase.from('clientes').select('*').order('criado_em', { ascending: false }),
    supabase.from('compromissos')
      .select('*')
      .gte('data_hora', inicioSemana.toISOString())
      .lte('data_hora', fimSemana.toISOString())
      .order('data_hora', { ascending: true })
      .limit(4),
  ])

  const leads: Lead[] = leadsData ?? []
  const clientes: Cliente[] = clientesData ?? []
  const compromissos: Compromisso[] = (compromissosData ?? []) as Compromisso[]

  // Métricas principais
  const emNegociacao = leads.filter(l =>
    l.etapa === 'Contato Feito' || (l.etapa as string) === 'Cotação' || l.etapa === 'Negociação'
  ).length
  const propostasEnviadas = leads.filter(l => l.etapa === 'Proposta Enviada').length
  const etapasAtivas = ['Novo Lead', 'Contato Feito', 'Proposta Enviada', 'Negociação'] as const
  const leadsAtivos = leads.filter(l => etapasAtivas.includes(l.etapa as typeof etapasAtivas[number])).length

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

  // Vendas do mês por operadora (donut)
  const DONUT_COLORS = ['#5b3fb5', '#b89a6a', '#2e8b57', '#b5455a', '#c48a2a', '#4a90c4', '#7c6f9e']
  const operadorasMap: Record<string, number> = {}
  for (const c of clientesMes) {
    const op = c.operadora ?? 'Sem operadora'
    operadorasMap[op] = (operadorasMap[op] ?? 0) + 1
  }
  const vendasPorOperadora = Object.entries(operadorasMap)
    .sort((a, b) => b[1] - a[1])
    .map(([operadora, count], i) => ({ operadora, count, color: DONUT_COLORS[i % DONUT_COLORS.length] }))
  const totalOperadoras = vendasPorOperadora.reduce((s, v) => s + v.count, 0)

  // Donut SVG geometry
  const R = 52
  const CIRCUNF = 2 * Math.PI * R
  let acumulado = 0
  const segmentos = vendasPorOperadora.map(v => {
    const comprimento = totalOperadoras > 0 ? (v.count / totalOperadoras) * CIRCUNF : 0
    const offset = -acumulado
    acumulado += comprimento
    return { ...v, comprimento, offset }
  })

  const leadsRecentes = leads.slice(0, 4)
  const clientesRecentes = clientes.slice(0, 4)

  const hoje = new Date()
  const dataFormatada = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const mesAtual = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">

        {/* Saudação */}
        <div className="py-1">
          <h1 className="font-semibold" style={{ fontSize: '22px', color: '#2d1f4e', lineHeight: '1.3' }}>
            Olá, Andreia 👋
          </h1>
          <p className="mt-1" style={{ fontSize: '13px', color: '#7a7065' }}>
            Aqui está o resumo do seu dia
          </p>
        </div>

        {/* Data + versículo */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <span
            className="text-xs font-medium capitalize px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(45,31,78,0.07)', color: '#2d1f4e' }}
          >
            {dataFormatada}
          </span>
          <div
            className="bg-white px-4 py-3 rounded-xl"
            style={{ border: '1px solid #e8e4dd', borderLeft: '3px solid #b89a6a', maxWidth: '320px' }}
          >
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '12px', color: '#5a4e3c', lineHeight: '1.6' }}>
              "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos."
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color: '#b89a6a' }}>Provérbios 16:3</p>
          </div>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <DashboardCard
          title="Total de Clientes"
          value={clientes.length}
          icon={Users}
          subtitle="clientes ativos na carteira"
          iconBg="#ede9fb"
          iconColor="#5b3fb5"
        />
        <DashboardCard
          title="Em Negociação"
          value={emNegociacao}
          icon={ArrowLeftRight}
          subtitle="atendimentos em aberto"
          iconBg="#fdf4e7"
          iconColor="#c48a2a"
        />
        <DashboardCard
          title="Propostas Enviadas"
          value={propostasEnviadas}
          icon={FileText}
          subtitle="aguardando retorno"
          iconBg="#fbe9ef"
          iconColor="#b5455a"
        />
        <DashboardCard
          title="Fechados no Mês"
          value={clientesMes.length}
          icon={CheckCircle}
          subtitle={`vendas concluídas em ${mesAtual}`}
          iconBg="#e8f5ee"
          iconColor="#2e8b57"
        />
      </div>

      {/* Bloco Central — Leads Recentes + Clientes Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">

        {/* Leads Recentes */}
        <div className="bg-white p-4" style={{ border: '1px solid #e8e4dd', borderRadius: '12px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>Leads Recentes</h3>
            <Link
              href="/crm"
              className="flex items-center gap-0.5 text-xs font-medium transition-colors"
              style={{ color: '#b89a6a' }}
            >
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>

          {leadsRecentes.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: '#9a918a' }}>Nenhum lead cadastrado.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: '#f0ece6' }}>
              {leadsRecentes.map(l => {
                const badge = etapaBadge[l.etapa] ?? { bg: '#f0f0f0', color: '#6b7280' }
                return (
                  <li key={l.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>{l.nome}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9a918a' }}>
                        {[l.tipo_plano, l.operadora].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: badge.bg, color: badge.color }}>
                      {l.etapa}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Clientes Recentes */}
        <div className="bg-white p-4" style={{ border: '1px solid #e8e4dd', borderRadius: '12px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>Clientes Recentes</h3>
            <Link
              href="/clientes"
              className="flex items-center gap-0.5 text-xs font-medium transition-colors"
              style={{ color: '#b89a6a' }}
            >
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>

          {clientesRecentes.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: '#9a918a' }}>Nenhum cliente cadastrado ainda.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: '#f0ece6' }}>
              {clientesRecentes.map(c => (
                <li key={c.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>{c.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9a918a' }}>
                      {[c.operadora, c.quantidade_vidas ? `${c.quantidade_vidas} vidas` : null].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                    Ativo
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bloco Inferior — Agenda da Semana + Vendas por Operadora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Agenda da Semana */}
        <div className="bg-white p-4" style={{ border: '1px solid #e8e4dd', borderRadius: '12px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>Agenda da Semana</h3>
            <Link
              href="/agenda"
              className="flex items-center gap-0.5 text-xs font-medium"
              style={{ color: '#b89a6a' }}
            >
              Ver agenda <ChevronRight size={12} />
            </Link>
          </div>

          {compromissos.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: '#9a918a' }}>Nenhum compromisso esta semana.</p>
          ) : (
            <div className="space-y-2">
              {compromissos.map(c => {
                const dt = new Date(c.data_hora)
                const dia = dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
                const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                const isAgendado = c.status === 'Agendado'
                return (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: '#faf8f5' }}>
                    <div className="shrink-0 w-20">
                      <p className="text-xs capitalize font-medium" style={{ color: '#b89a6a' }}>{dia}</p>
                      <p className="text-xs" style={{ color: '#b89a6a' }}>{hora}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1a1a1a' }}>{c.titulo}</p>
                      {c.observacao && <p className="text-xs mt-0.5 truncate" style={{ color: '#9a918a' }}>{c.observacao}</p>}
                    </div>
                    <span className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={isAgendado ? { backgroundColor: '#dbeafe', color: '#1d4ed8' } : { backgroundColor: '#fef9c3', color: '#a16207' }}>
                      {c.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Vendas do Mês por Operadora — donut SVG */}
        <div className="bg-white p-4" style={{ border: '1px solid #e8e4dd', borderRadius: '12px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>Vendas por Operadora</h3>
            <span className="text-xs capitalize" style={{ color: '#9a918a' }}>{mesAtual}</span>
          </div>

          {totalOperadoras === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: '#9a918a' }}>Nenhuma venda com operadora este mês.</p>
          ) : (
            <div className="flex items-center gap-4">
              {/* Donut SVG menor */}
              <div className="shrink-0">
                <svg width="110" height="110" viewBox="0 0 140 140">
                  {/* Trilha de fundo */}
                  <circle
                    cx="70" cy="70" r={R}
                    fill="none"
                    stroke="#f0ece6"
                    strokeWidth="20"
                  />
                  {/* Segmentos */}
                  {segmentos.map((seg, i) => (
                    <circle
                      key={i}
                      cx="70" cy="70" r={R}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="20"
                      strokeDasharray={`${seg.comprimento} ${CIRCUNF}`}
                      strokeDashoffset={seg.offset}
                      strokeLinecap="butt"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px' }}
                    />
                  ))}
                  {/* Total no centro */}
                  <text x="70" y="66" textAnchor="middle" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                    <tspan fontSize="22" fontWeight="700" fill="#2d1f4e">{totalOperadoras}</tspan>
                  </text>
                  <text x="70" y="82" textAnchor="middle" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                    <tspan fontSize="10" fill="#9a918a">vendas</tspan>
                  </text>
                </svg>
              </div>

              {/* Legenda ao lado */}
              <div className="flex-1 space-y-1.5">
                {segmentos.map((seg, i) => {
                  const pct = totalOperadoras > 0 ? Math.round((seg.count / totalOperadoras) * 100) : 0
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-xs truncate" style={{ color: '#5a4e3c' }}>{seg.operadora}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold" style={{ color: '#2d1f4e' }}>{seg.count}</span>
                        <span className="text-xs w-7 text-right" style={{ color: '#9a918a' }}>{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
