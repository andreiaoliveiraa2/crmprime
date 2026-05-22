import { createClient } from '@/lib/supabase/server'
import DashboardCard from '@/components/DashboardCard'
import { Users, ArrowLeftRight, FileText, CheckCircle, Calendar, ChevronRight, AlertCircle } from 'lucide-react'
import { Lead, Cliente, Compromisso, TIPO_COR, STATUS_COR } from '@/lib/types'
import Link from 'next/link'

const etapaBadge: Record<string, { bg: string; color: string }> = {
  'Novo Lead':     { bg: '#f0f0f0',                color: '#6b7280' },
  'Contato Feito': { bg: '#dbeafe',                color: '#1d4ed8' },
  'Cotação':       { bg: 'rgba(184,154,106,0.15)', color: '#92601a' },
  'Negociação':    { bg: '#ffedd5',                color: '#c2410c' },
  'Vendido':       { bg: '#dcfce7',                color: '#15803d' },
  'Perdido':       { bg: '#fce7f3',                color: '#be185d' },
}

function fmtHora(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function fmtDia(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function isUrgente(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return diff > 0 && diff < 60 * 60 * 1000
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const agora = new Date()
  const inicioDia = new Date(agora); inicioDia.setHours(0,0,0,0)
  const fimDia    = new Date(agora); fimDia.setHours(23,59,59,999)
  const inicioSemana = new Date(agora)
  inicioSemana.setDate(agora.getDate() - agora.getDay() + 1)
  inicioSemana.setHours(0,0,0,0)
  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(inicioSemana.getDate() + 6)
  fimSemana.setHours(23,59,59,999)
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [
    { data: leadsData },
    { data: clientesData },
    { data: eventosHojeData },
    { data: eventosSemanaData },
    { data: pendentesData },
  ] = await Promise.all([
    supabase.from('leads').select('*').order('criado_em', { ascending: false }),
    supabase.from('clientes').select('*').order('criado_em', { ascending: false }),
    supabase.from('agenda').select('*')
      .gte('data_hora', inicioDia.toISOString())
      .lte('data_hora', fimDia.toISOString())
      .order('data_hora', { ascending: true }),
    supabase.from('agenda').select('*')
      .gte('data_hora', inicioSemana.toISOString())
      .lte('data_hora', fimSemana.toISOString())
      .order('data_hora', { ascending: true })
      .limit(5),
    supabase.from('agenda').select('*')
      .eq('status', 'Agendado')
      .lt('data_hora', inicioDia.toISOString())
      .order('data_hora', { ascending: false })
      .limit(3),
  ])

  const leads: Lead[]           = leadsData ?? []
  const clientes: Cliente[]     = clientesData ?? []
  const eventosHoje: Compromisso[]   = (eventosHojeData ?? []) as Compromisso[]
  const eventosSemana: Compromisso[] = (eventosSemanaData ?? []) as Compromisso[]
  const pendentes: Compromisso[]     = (pendentesData ?? []) as Compromisso[]

  const emNegociacao      = leads.filter(l => ['Contato Feito','Cotação','Negociação'].includes(l.etapa)).length
  const propostasEnviadas = leads.filter(l => l.etapa === 'Cotação').length
  const clientesMes       = clientes.filter(c => c.criado_em && new Date(c.criado_em) >= inicioMes)
  const temUrgente        = eventosHoje.some(ev => isUrgente(ev.data_hora) && ev.status === 'Agendado')

  // Donut
  const DONUT_COLORS = ['#5b3fb5','#b89a6a','#2e8b57','#b5455a','#c48a2a','#4a90c4','#7c6f9e']
  const operadorasMap: Record<string, number> = {}
  for (const c of clientesMes) {
    const op = c.operadora ?? 'Sem operadora'
    operadorasMap[op] = (operadorasMap[op] ?? 0) + 1
  }
  const vendasPorOperadora = Object.entries(operadorasMap)
    .sort((a,b) => b[1]-a[1])
    .map(([operadora, count], i) => ({ operadora, count, color: DONUT_COLORS[i % DONUT_COLORS.length] }))
  const totalOperadoras = vendasPorOperadora.reduce((s,v) => s+v.count, 0)
  const R = 52, CIRCUNF = 2*Math.PI*R
  let acumulado = 0
  const segmentos = vendasPorOperadora.map(v => {
    const comprimento = totalOperadoras > 0 ? (v.count/totalOperadoras)*CIRCUNF : 0
    const offset = -acumulado; acumulado += comprimento
    return { ...v, comprimento, offset }
  })

  const leadsRecentes    = leads.filter(l => l.etapa !== 'Vendido' && l.etapa !== 'Perdido').slice(0,3)
  const clientesRecentes = clientes.slice(0,3)
  const dataFormatada    = agora.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const mesAtual         = agora.toLocaleDateString('pt-BR', { month:'long', year:'numeric' })

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div className="py-1">
          <h1 className="font-semibold" style={{ fontSize:'22px', color:'#2d1f4e', lineHeight:'1.3' }}>
            Olá, Andreia 👋
          </h1>
          <p className="mt-1" style={{ fontSize:'13px', color:'#7a7065' }}>
            {eventosHoje.length > 0
              ? `Você tem ${eventosHoje.length} compromisso${eventosHoje.length>1?'s':''} hoje`
              : 'Aqui está o resumo do seu dia'}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-xs font-medium capitalize px-3 py-1.5 rounded-full"
            style={{ backgroundColor:'rgba(45,31,78,0.07)', color:'#2d1f4e' }}>
            {dataFormatada}
          </span>
          <div className="bg-white px-4 py-3 rounded-xl"
            style={{ border:'1px solid #e8e4dd', borderLeft:'3px solid #b89a6a', maxWidth:'320px' }}>
            <p style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:'12px', color:'#5a4e3c', lineHeight:'1.6' }}>
              "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos."
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color:'#b89a6a' }}>Provérbios 16:3</p>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <DashboardCard title="Total de Clientes" value={clientes.length} icon={Users}
          subtitle="clientes ativos na carteira" iconBg="#ede9fb" iconColor="#5b3fb5" />
        <DashboardCard title="Em Negociação" value={emNegociacao} icon={ArrowLeftRight}
          subtitle="atendimentos em aberto" iconBg="#fdf4e7" iconColor="#c48a2a" />
        <DashboardCard title="Em Cotação" value={propostasEnviadas} icon={FileText}
          subtitle="aguardando retorno" iconBg="#fbe9ef" iconColor="#b5455a" />
        <DashboardCard title="Fechados no Mês" value={clientesMes.length} icon={CheckCircle}
          subtitle={`vendas em ${mesAtual}`} iconBg="#e8f5ee" iconColor="#2e8b57" />
      </div>

      {/* Compromissos de Hoje + Vendas por Operadora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">

        {/* Lembretes */}
        <div className="bg-white p-4" style={{ border:'1px solid #e8e4dd', borderRadius:'12px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color:'#2d1f4e' }}>Compromissos de Hoje</h3>
              {temUrgente && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor:'#fee2e2', color:'#dc2626' }}>
                  <AlertCircle size={11} /> Em breve
                </span>
              )}
            </div>
            <Link href="/agenda" className="flex items-center gap-0.5 text-xs font-medium" style={{ color:'#b89a6a' }}>
              Ver agenda <ChevronRight size={12} />
            </Link>
          </div>

          {eventosHoje.length === 0 && pendentes.length === 0
            ? <p className="text-xs py-6 text-center" style={{ color:'#9a918a' }}>Nenhum compromisso hoje.</p>
            : <div className="space-y-2">
                {/* Pendentes de dias anteriores */}
                {pendentes.map(ev => {
                  const cor = TIPO_COR[ev.tipo] ?? '#6b7280'
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg"
                      style={{ backgroundColor:'#fff7ed', border:'1px solid #fed7aa' }}>
                      <div className="shrink-0 w-16">
                        <p className="text-xs font-medium" style={{ color:'#ea580c' }}>{fmtDia(ev.data_hora)}</p>
                        <p className="text-xs" style={{ color:'#ea580c' }}>{fmtHora(ev.data_hora)}</p>
                      </div>
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color:'#1a1a1a' }}>{ev.titulo}</p>
                        <p className="text-xs" style={{ color:'#ea580c' }}>Pendente</p>
                      </div>
                    </div>
                  )
                })}

                {/* Eventos de hoje — máx 3 */}
                {eventosHoje.slice(0, 3).map(ev => {
                  const cor = TIPO_COR[ev.tipo] ?? '#6b7280'
                  const urgente = isUrgente(ev.data_hora) && ev.status === 'Agendado'
                  const sc = STATUS_COR[ev.status]
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg"
                      style={{
                        backgroundColor: urgente ? '#fef2f2' : '#faf8f5',
                        border: `1px solid ${urgente ? '#fca5a5' : '#f0ece6'}`,
                      }}>
                      <div className="shrink-0 w-16">
                        <p className="text-sm font-bold" style={{ color: urgente ? '#dc2626' : '#2d1f4e' }}>
                          {fmtHora(ev.data_hora)}
                        </p>
                        {urgente && <p className="text-xs font-semibold" style={{ color:'#dc2626' }}>em breve!</p>}
                      </div>
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color:'#1a1a1a' }}>{ev.titulo}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor:`${cor}18`, color:cor }}>{ev.tipo}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor:sc.bg, color:sc.text }}>{ev.status}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </div>

        {/* Vendas por Operadora */}
        <div className="bg-white p-4" style={{ border:'1px solid #e8e4dd', borderRadius:'12px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color:'#2d1f4e' }}>Vendas por Operadora</h3>
            <span className="text-xs capitalize" style={{ color:'#9a918a' }}>{mesAtual}</span>
          </div>
          {totalOperadoras === 0
            ? <p className="text-xs py-6 text-center" style={{ color:'#9a918a' }}>Nenhuma venda com operadora este mês.</p>
            : <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <svg width="110" height="110" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={R} fill="none" stroke="#f0ece6" strokeWidth="20" />
                    {segmentos.map((seg, i) => (
                      <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={seg.color}
                        strokeWidth="20" strokeDasharray={`${seg.comprimento} ${CIRCUNF}`}
                        strokeDashoffset={seg.offset} strokeLinecap="butt"
                        style={{ transform:'rotate(-90deg)', transformOrigin:'70px 70px' }} />
                    ))}
                    <text x="70" y="66" textAnchor="middle" style={{ fontFamily:'Segoe UI,sans-serif' }}>
                      <tspan fontSize="22" fontWeight="700" fill="#2d1f4e">{totalOperadoras}</tspan>
                    </text>
                    <text x="70" y="82" textAnchor="middle" style={{ fontFamily:'Segoe UI,sans-serif' }}>
                      <tspan fontSize="10" fill="#9a918a">vendas</tspan>
                    </text>
                  </svg>
                </div>
                <div className="flex-1 space-y-1.5">
                  {segmentos.map((seg, i) => {
                    const pct = totalOperadoras > 0 ? Math.round((seg.count/totalOperadoras)*100) : 0
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor:seg.color }} />
                          <span className="text-xs truncate" style={{ color:'#5a4e3c' }}>{seg.operadora}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold" style={{ color:'#2d1f4e' }}>{seg.count}</span>
                          <span className="text-xs w-7 text-right" style={{ color:'#9a918a' }}>{pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
          }
        </div>
      </div>

      {/* Leads Recentes + Clientes Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <div className="bg-white p-4" style={{ border:'1px solid #e8e4dd', borderRadius:'12px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color:'#2d1f4e' }}>Leads Recentes</h3>
            <Link href="/crm" className="flex items-center gap-0.5 text-xs font-medium" style={{ color:'#b89a6a' }}>
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          {leadsRecentes.length === 0
            ? <p className="text-xs py-6 text-center" style={{ color:'#9a918a' }}>Nenhum lead cadastrado.</p>
            : <ul className="divide-y" style={{ borderColor:'#f0ece6' }}>
                {leadsRecentes.map(l => {
                  const badge = etapaBadge[l.etapa] ?? { bg:'#f0f0f0', color:'#6b7280' }
                  return (
                    <li key={l.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color:'#1a1a1a' }}>{l.nome}</p>
                        <p className="text-xs mt-0.5" style={{ color:'#9a918a' }}>
                          {[l.tipo_plano, l.operadora].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ backgroundColor:badge.bg, color:badge.color }}>{l.etapa}</span>
                    </li>
                  )
                })}
              </ul>
          }
        </div>

        <div className="bg-white p-4" style={{ border:'1px solid #e8e4dd', borderRadius:'12px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color:'#2d1f4e' }}>Clientes Recentes</h3>
            <Link href="/clientes" className="flex items-center gap-0.5 text-xs font-medium" style={{ color:'#b89a6a' }}>
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          {clientesRecentes.length === 0
            ? <p className="text-xs py-6 text-center" style={{ color:'#9a918a' }}>Nenhum cliente cadastrado ainda.</p>
            : <ul className="divide-y" style={{ borderColor:'#f0ece6' }}>
                {clientesRecentes.map(c => (
                  <li key={c.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color:'#1a1a1a' }}>{c.nome}</p>
                      <p className="text-xs mt-0.5" style={{ color:'#9a918a' }}>
                        {[c.operadora, c.quantidade_vidas ? `${c.quantidade_vidas} vidas` : null].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor:'#dcfce7', color:'#15803d' }}>Ativo</span>
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>

    </div>
  )
}
