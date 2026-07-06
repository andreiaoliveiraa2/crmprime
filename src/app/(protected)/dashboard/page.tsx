import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { Lead, Cliente, Compromisso } from '@/lib/types'
import Link from 'next/link'
import {
  ChevronRight, Sparkles, ListChecks, Wallet, Calendar, Users,
  AlertCircle, Target, TrendingUp, PieChart, Image as ImageIcon,
  Camera, CalendarDays, Shield,
} from 'lucide-react'
import AlertaAgenda from '@/components/AlertaAgenda'
import { getEventosGoogleAgenda } from '@/lib/googleAgenda'

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDia(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const usuario = await getUsuarioAtual()
  const isVendedor = usuario?.perfil === 'vendedor'
  const vendedorId = usuario?.vendedor_id ?? null
  const nomeUsuario = usuario?.nome?.split(' ')[0] ?? 'Você'

  const agora = new Date()
  const inicioDia = new Date(agora); inicioDia.setHours(0,0,0,0)
  const fimDia = new Date(agora); fimDia.setHours(23,59,59,999)
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999)
  const semanaNum = Math.ceil(agora.getDate() / 7)
  const totalSemanas = Math.ceil(new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate() / 7)
  const mesNome = agora.toLocaleDateString('pt-BR', { month: 'long' })
  const dataFormatada = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  let leadsQ = supabase.from('leads').select('*').order('criado_em', { ascending: false })
  let clientesQ = supabase.from('clientes').select('*')
  let agendaHojeQ = supabase.from('agenda').select('*').gte('data_hora', inicioDia.toISOString()).lte('data_hora', fimDia.toISOString()).order('data_hora', { ascending: true })
  let pendentesQ = supabase.from('agenda').select('*').eq('status', 'Agendado').lt('data_hora', inicioDia.toISOString()).order('data_hora', { ascending: false }).limit(5)
  let vendasMesQ = supabase.from('vendas').select('*').gte('data_venda', inicioMes.toISOString()).lte('data_venda', fimMes.toISOString())
  const carteiraAgentQ = supabase.from('agente_execucoes').select('ultima_acao, executado_em').eq('agente', 'Carteira').order('executado_em', { ascending: false }).limit(1)

  if (isVendedor && vendedorId) {
    leadsQ = leadsQ.eq('vendedor_id', vendedorId)
    clientesQ = clientesQ.eq('vendedor_id', vendedorId)
    agendaHojeQ = agendaHojeQ.eq('vendedor_id', vendedorId)
    pendentesQ = pendentesQ.eq('vendedor_id', vendedorId)
  }

  const [
    { data: leadsData },
    { data: clientesData },
    { data: eventosHojeData },
    { data: pendentesData },
    { data: vendasMesData },
    { data: carteiraAgentData },
  ] = await Promise.all([leadsQ, clientesQ, agendaHojeQ, pendentesQ, vendasMesQ, carteiraAgentQ])

  const leads: Lead[] = leadsData ?? []
  const clientes: Cliente[] = clientesData ?? []
  const eventosHoje: Compromisso[] = (eventosHojeData ?? []) as Compromisso[]
  const pendentes: Compromisso[] = (pendentesData ?? []) as Compromisso[]

  // Google Agenda (só admin): mescla os compromissos do Google de hoje no card "Agenda"
  let agendaHoje: Compromisso[] = eventosHoje
  if (!isVendedor) {
    const googleHoje = (await getEventosGoogleAgenda(inicioDia, fimDia)).map(g => ({
      id: g.id, titulo: g.titulo, data_hora: g.data_hora,
      tipo: 'Google', status: 'Google', vendedor_id: null,
    }) as unknown as Compromisso)
    agendaHoje = [...eventosHoje, ...googleHoje].sort((a, b) => a.data_hora.localeCompare(b.data_hora))
  }
  const vendasMes = vendasMesData ?? []

  // Dados calculados
  const leadsAbertos = leads.filter(l => !['Vendido', 'Perdido'].includes(l.etapa))
  const leadsQuentes = leadsAbertos.filter(l => {
    const dias = (Date.now() - new Date(l.criado_em).getTime()) / (1000 * 60 * 60 * 24)
    return dias <= 3 && l.etapa !== 'Novo Lead'
  })
  const semRetorno = leadsAbertos.filter(l => {
    const dias = (Date.now() - new Date(l.atualizado_em).getTime()) / (1000 * 60 * 60 * 24)
    return dias >= 3
  })

  const clientesAtivos = clientes.filter(c => c.status === 'Ativo')
  const clientesRisco = clientesAtivos.filter(c => {
    if (!c.data_vencimento_plano) return false
    const dias = (new Date(c.data_vencimento_plano).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return dias <= 30 && dias >= 0
  })

  // Comissões por operadora (valor)
  const comissoesPorOp: Record<string, number> = {}
  for (const v of vendasMes) {
    const op = v.operadora ?? 'Sem operadora'
    comissoesPorOp[op] = (comissoesPorOp[op] ?? 0) + (v.valor_plano ?? 0)
  }
  const totalComissoes = Object.values(comissoesPorOp).reduce((s, v) => s + v, 0)
  const comissoesOrdenadas = Object.entries(comissoesPorOp).sort((a, b) => b[1] - a[1])

  // Vendas por operadora (contagem) — para o donut
  const DONUT_COLORS = ['#5b3fb5', '#b89a6a', '#2e8b57', '#b5455a', '#c48a2a', '#4a90c4', '#7c6f9e']
  const vendasPorOpMap: Record<string, number> = {}
  for (const v of vendasMes) {
    const op = v.operadora ?? 'Sem operadora'
    vendasPorOpMap[op] = (vendasPorOpMap[op] ?? 0) + 1
  }
  const vendasPorOperadora = Object.entries(vendasPorOpMap)
    .sort((a, b) => b[1] - a[1])
    .map(([operadora, count], i) => ({ operadora, count, color: DONUT_COLORS[i % DONUT_COLORS.length] }))
  const totalVendasCount = vendasMes.length
  const R = 52, CIRCUNF = 2 * Math.PI * R
  let acumulado = 0
  const segmentos = vendasPorOperadora.map(v => {
    const comprimento = totalVendasCount > 0 ? (v.count / totalVendasCount) * CIRCUNF : 0
    const offset = -acumulado; acumulado += comprimento
    return { ...v, comprimento, offset }
  })

  // Meta (usando vendas do mês vs meta fixa — pode ser configurável depois)
  const metaMes = 15000
  const totalVendas = vendasMes.reduce((s, v) => s + (v.valor_plano ?? 0), 0)
  const pctMeta = metaMes > 0 ? Math.round((totalVendas / metaMes) * 100) : 0
  const faltaMeta = Math.max(0, metaMes - totalVendas)
  const semanasRestantes = Math.max(1, totalSemanas - semanaNum + 1)

  // Funil
  const abordagens = leads.filter(l => new Date(l.criado_em) >= inicioMes).length
  const propostas = leads.filter(l => new Date(l.criado_em) >= inicioMes && ['Cotação', 'Negociação', 'Vendido'].includes(l.etapa)).length
  const vendidos = leads.filter(l => new Date(l.criado_em) >= inicioMes && l.etapa === 'Vendido').length

  // Carteira
  const carteira = {
    ativos: clientesAtivos.length,
    risco: clientesRisco.length,
  }

  // Alerta do agente Carteira (gerado pelo cron das 6h)
  const carteiraAlerta = carteiraAgentData?.[0]?.ultima_acao ?? null

  // Prioridades do dia
  const prioridades: { titulo: string; detalhe: string; agente?: boolean }[] = []
  if (carteiraAlerta && carteiraAlerta !== 'Nenhum plano vencendo nos próximos 30 dias.') {
    prioridades.push({ titulo: 'Agente Carteira', detalhe: carteiraAlerta, agente: true })
  }
  if (leadsQuentes.length > 0) {
    const l = leadsQuentes[0]
    prioridades.push({ titulo: `Lead quente: ${l.nome}`, detalhe: `${l.etapa} — responder hoje` })
  }
  if (pendentes.length > 0) {
    prioridades.push({ titulo: `${pendentes.length} compromisso${pendentes.length > 1 ? 's' : ''} pendente${pendentes.length > 1 ? 's' : ''}`, detalhe: 'De dias anteriores — resolver' })
  }
  if (semRetorno.length > 0) {
    prioridades.push({ titulo: `${semRetorno.length} lead${semRetorno.length > 1 ? 's' : ''} sem retorno`, detalhe: 'Mais de 3 dias sem atualização' })
  }
  if (prioridades.length === 0) {
    prioridades.push({ titulo: 'Tudo em dia!', detalhe: 'Nenhuma urgência — aproveite pra prospectar' })
  }

  // Sistema de cards: densidade do dashboard antigo (p-4, cantos 12px)
  const cardBase = "bg-white p-4 hover:shadow-md transition-all duration-200"
  const cardGrey = { border: '1px solid #e8e4dd', borderRadius: '12px' }
  const cardGold = { border: '2px solid #d4af7a', borderRadius: '12px' }

  return (
    <div className="px-5 md:px-7 pt-10 md:pt-14 pb-6 md:pb-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div className="py-1">
          <h1 className="font-semibold" style={{ fontSize: '22px', color: '#2d1f4e', lineHeight: '1.3' }}>
            Olá, {nomeUsuario} 👋
          </h1>
          <p className="mt-1" style={{ fontSize: '13px', color: '#7a7065' }}>
            {eventosHoje.length > 0
              ? `Você tem ${eventosHoje.length} compromisso${eventosHoje.length > 1 ? 's' : ''} hoje`
              : 'Aqui está o resumo do seu dia'}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-xs font-medium capitalize px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(45,31,78,0.07)', color: '#2d1f4e' }}>
            {dataFormatada}
          </span>
          <div className="px-4 py-3 rounded-xl bg-white" style={{ border: '1px solid #e8e4dd', borderLeft: '3px solid #b89a6a', maxWidth: 320 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '12px', color: '#5a4e3c', lineHeight: '1.6' }}>
              &ldquo;Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.&rdquo;
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color: '#b89a6a' }}>Provérbios 16:3</p>
          </div>
        </div>
      </div>

      <AlertaAgenda eventosHoje={eventosHoje} pendentes={pendentes} />

      {/* Grid de Cards */}
      <div className="grid grid-cols-12 gap-3">

        {/* PRIORIDADES — span 8 (faixa dourada de topo) */}
        <Link href="/crm" className={`col-span-12 lg:col-span-8 ${cardBase}`} style={{ ...cardGold, background: 'linear-gradient(120deg, #f8f5ff 0%, #faf8f5 100%)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(184,154,106,0.14)' }}>
              <ListChecks size={15} style={{ color: '#b89a6a' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Resolva primeiro</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>As que mais importam hoje</p>
            </div>
            <ChevronRight size={16} style={{ color: '#d4c9bc' }} />
          </div>
          <div className="space-y-2">
            {prioridades.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5" style={{ borderBottom: i < Math.min(prioridades.length, 3) - 1 ? '1px solid #f0ece6' : 'none' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-white" style={{ background: p.agente ? 'linear-gradient(135deg, #a855f7, #d4a843)' : 'linear-gradient(135deg, #5b3fb5, #b89a6a)' }}>
                  {p.agente ? <Shield size={13} /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div><p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>{p.titulo}</p><p className="text-xs" style={{ color: '#9a918a' }}>{p.detalhe}</p></div>
              </div>
            ))}
          </div>
        </Link>

        {/* COMISSÕES — span 4 (faixa dourada de topo) */}
        <Link href="/financeiro" className={`col-span-12 lg:col-span-4 ${cardBase}`} style={cardGold}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
              <Wallet size={15} style={{ color: '#22c55e' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Vou receber</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>este mês</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-extrabold" style={{ background: 'linear-gradient(90deg, #22c55e, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              R$ {totalComissoes.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="space-y-2">
            {comissoesOrdenadas.slice(0, 3).map(([op, val], i) => {
              const pct = totalComissoes > 0 ? Math.round((val / totalComissoes) * 100) : 0
              const colors = ['linear-gradient(90deg, #5b3fb5, #8b6fc0)', 'linear-gradient(90deg, #b89a6a, #d4bc8a)', 'linear-gradient(90deg, #3b82f6, #60a5fa)']
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-16 truncate" style={{ color: '#9a918a' }}>{op}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece6' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % 3] }} />
                  </div>
                  <span className="w-20 text-right font-bold" style={{ color: '#2d1f4e' }}>R$ {val.toLocaleString('pt-BR')}</span>
                </div>
              )
            })}
          </div>
        </Link>

        {/* AGENDA — span 4 */}
        <Link href="/agenda" className={`col-span-12 md:col-span-4 ${cardBase}`} style={cardGrey}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(91,63,181,0.12)' }}>
              <Calendar size={15} style={{ color: '#5b3fb5' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Agenda</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>hoje</p>
            </div>
            {agendaHoje.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(91,63,181,0.12)', color: '#5b3fb5' }}>{agendaHoje.length}</span>}
          </div>
          {agendaHoje.length === 0
            ? <p className="text-xs py-4 text-center" style={{ color: '#9a918a' }}>Agenda livre hoje</p>
            : <div className="space-y-2">
                {agendaHoje.slice(0, 4).map(ev => {
                  const ehGoogle = String(ev.id).startsWith('google-')
                  return (
                    <div key={ev.id} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ehGoogle ? '#4285F4' : '#5b3fb5' }} />
                      <div><b style={{ color: '#2d1f4e' }}>{fmtHora(ev.data_hora)}</b> <span style={{ color: '#5a4e3c' }}>— {ev.titulo}</span>{ehGoogle && <span className="text-xs ml-1" style={{ color: '#4285F4' }}>· Google</span>}</div>
                    </div>
                  )
                })}
              </div>
          }
        </Link>

        {/* CARTEIRA — span 4 */}
        <Link href="/clientes" className={`col-span-12 md:col-span-4 ${cardBase}`} style={cardGrey}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(184,154,106,0.14)' }}>
              <Users size={15} style={{ color: '#b89a6a' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Carteira</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>clientes ativos</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-extrabold" style={{ color: '#2d1f4e' }}>{carteira.ativos}</p>
              <p className="text-xs" style={{ color: '#9a918a' }}>ativos</p>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#5b3fb5' }} />
                <span style={{ color: '#5a4e3c' }}>Ativos</span>
                <span className="ml-auto font-bold" style={{ color: '#2d1f4e' }}>{clientesAtivos.length}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                <span style={{ color: '#ef4444' }}>Em risco</span>
                <span className="ml-auto font-bold" style={{ color: '#ef4444' }}>{carteira.risco}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* PENDÊNCIAS — span 4 */}
        <Link href="/agenda" className={`col-span-12 md:col-span-4 ${cardBase}`} style={cardGrey}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(212,168,67,0.15)' }}>
              <AlertCircle size={15} style={{ color: '#b89a6a' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Pendências</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>precisam de ação</p>
            </div>
            {pendentes.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212,168,67,0.15)', color: '#b89a6a' }}>{pendentes.length}</span>}
          </div>
          {pendentes.length === 0
            ? <p className="text-xs py-4 text-center" style={{ color: '#9a918a' }}>Tudo em dia!</p>
            : <div className="space-y-2">
                {pendentes.slice(0, 3).map(ev => (
                  <div key={ev.id} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#b89a6a' }} />
                    <div><b style={{ color: '#2d1f4e' }}>{ev.titulo}</b> <span className="text-xs" style={{ color: '#9a918a' }}>{fmtDia(ev.data_hora)}</span></div>
                  </div>
                ))}
              </div>
          }
        </Link>

        {/* META DO MÊS — span 4 */}
        <div className={`col-span-12 md:col-span-4 ${cardBase}`} style={cardGrey}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
              <Target size={15} style={{ color: '#22c55e' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Meta do mês</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>{mesNome} · semana {semanaNum} de {totalSemanas}</p>
            </div>
          </div>
          {/* Barra total */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-xl font-extrabold" style={{ background: 'linear-gradient(90deg, #22c55e, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              R$ {totalVendas.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs" style={{ color: '#9a918a' }}>/ R$ {metaMes.toLocaleString('pt-BR')}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto" style={{ backgroundColor: pctMeta >= 80 ? 'rgba(34,197,94,0.12)' : 'rgba(212,168,67,0.15)', color: pctMeta >= 80 ? '#22c55e' : '#b89a6a' }}>{pctMeta}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: '#f0ece6' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, pctMeta)}%`, background: 'linear-gradient(90deg, #22c55e, #86efac)' }} />
          </div>
          {/* Funil */}
          <div className="rounded-xl p-3 mb-2" style={{ backgroundColor: '#faf8f5', border: '1px solid #f0ece6' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#9a918a' }}>FUNIL DO MÊS</p>
            <div className="flex justify-between text-center">
              <div><p className="text-lg font-extrabold" style={{ color: '#5b3fb5' }}>{abordagens}</p><p className="text-xs" style={{ color: '#9a918a' }}>Abordagens</p></div>
              <span className="self-center"><ChevronRight size={14} style={{ color: '#d4d0cc' }} /></span>
              <div><p className="text-lg font-extrabold" style={{ color: '#b89a6a' }}>{propostas}</p><p className="text-xs" style={{ color: '#9a918a' }}>Propostas</p></div>
              <span className="self-center"><ChevronRight size={14} style={{ color: '#d4d0cc' }} /></span>
              <div><p className="text-lg font-extrabold" style={{ color: '#22c55e' }}>{vendidos}</p><p className="text-xs" style={{ color: '#9a918a' }}>Vendas</p></div>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: '#9a918a' }}>
            Falta <b style={{ color: '#b89a6a' }}>R$ {faltaMeta.toLocaleString('pt-BR')}</b> · ~<b style={{ color: '#b89a6a' }}>R$ {Math.round(faltaMeta / semanasRestantes).toLocaleString('pt-BR')}</b>/semana
          </p>
        </div>

        {/* LEADS RECENTES — span 4 */}
        <Link href="/crm" className={`col-span-12 md:col-span-4 ${cardBase}`} style={cardGrey}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
              <TrendingUp size={15} style={{ color: '#ef4444' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Leads recentes</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>em negociação</p>
            </div>
            {leadsAbertos.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>{leadsAbertos.length}</span>}
          </div>
          {leadsAbertos.length === 0
            ? <p className="text-xs py-4 text-center" style={{ color: '#9a918a' }}>Nenhum lead aberto</p>
            : <div className="space-y-2">
                {leadsAbertos.slice(0, 4).map(l => {
                  const etapaCor: Record<string, string> = { 'Novo Lead': '#9a918a', 'Contato Feito': '#3b82f6', 'Cotação': '#b89a6a', 'Negociação': '#ef4444' }
                  return (
                    <div key={l.id} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: etapaCor[l.etapa] ?? '#9a918a' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: '#2d1f4e' }}>{l.nome}</p>
                        <p className="text-xs" style={{ color: '#9a918a' }}>{l.etapa}{l.operadora ? ` · ${l.operadora}` : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </Link>

        {/* VENDAS POR OPERADORA — span 4 (donut) */}
        <Link href="/financeiro" className={`col-span-12 md:col-span-4 ${cardBase}`} style={cardGrey}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(91,63,181,0.12)' }}>
              <PieChart size={15} style={{ color: '#5b3fb5' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Vendas por operadora</h3>
              <p className="text-xs capitalize" style={{ color: '#9a918a' }}>{mesNome}</p>
            </div>
          </div>
          {totalVendasCount === 0
            ? <p className="text-xs py-4 text-center" style={{ color: '#9a918a' }}>Nenhuma venda este mês</p>
            : <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <svg width="104" height="104" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={R} fill="none" stroke="#f0ece6" strokeWidth="20" />
                    {segmentos.map((seg, i) => (
                      <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={seg.color}
                        strokeWidth="20" strokeDasharray={`${seg.comprimento} ${CIRCUNF}`}
                        strokeDashoffset={seg.offset} strokeLinecap="butt"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px' }} />
                    ))}
                    <text x="70" y="66" textAnchor="middle" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                      <tspan fontSize="22" fontWeight="700" fill="#2d1f4e">{totalVendasCount}</tspan>
                    </text>
                    <text x="70" y="82" textAnchor="middle" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                      <tspan fontSize="10" fill="#9a918a">vendas</tspan>
                    </text>
                  </svg>
                </div>
                <div className="flex-1 space-y-1.5">
                  {segmentos.map((seg, i) => {
                    const pct = totalVendasCount > 0 ? Math.round((seg.count / totalVendasCount) * 100) : 0
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
          }
        </Link>

        {/* POSTS DE HOJE — span 4 */}
        <Link href="/mpa" className={`col-span-12 md:col-span-4 ${cardBase}`} style={cardGrey}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(91,63,181,0.12)' }}>
              <ImageIcon size={15} style={{ color: '#5b3fb5' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Posts de hoje</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>seus 2 perfis, prontos</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(91,63,181,0.12)', color: '#5b3fb5' }}>2</span>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl p-3" style={{ backgroundColor: '#faf8f5', border: '1px solid #f0ece6' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold" style={{ color: '#b89a6a' }}>EMPRESA</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto" style={{ backgroundColor: 'rgba(91,63,181,0.12)', color: '#5b3fb5' }}>19h</span>
              </div>
              <p className="text-xs font-semibold" style={{ color: '#2d1f4e' }}>Clique para gerar com IA</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#faf8f5', border: '1px solid #f0ece6' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold" style={{ color: '#5b3fb5' }}>PESSOAL</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto" style={{ backgroundColor: 'rgba(184,154,106,0.15)', color: '#b89a6a' }}>12h</span>
              </div>
              <p className="text-xs font-semibold" style={{ color: '#2d1f4e' }}>Clique para gerar com IA</p>
            </div>
          </div>
        </Link>

        {/* STORIES DE HOJE — span 4 */}
        <Link href="/mpa" className={`col-span-12 md:col-span-4 ${cardBase}`} style={cardGrey}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(212,168,67,0.15)' }}>
              <Camera size={15} style={{ color: '#b89a6a' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Stories de hoje</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>sua rotina, pronta</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212,168,67,0.15)', color: '#b89a6a' }}>5</span>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl p-3" style={{ backgroundColor: '#faf8f5', border: '1px solid #f0ece6' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold" style={{ color: '#b89a6a' }}>EMPRESA · 3 telas</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(91,63,181,0.12)', color: '#5b3fb5' }}>Dica</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>Enquete</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>CTA</span>
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#faf8f5', border: '1px solid #f0ece6' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold" style={{ color: '#5b3fb5' }}>PESSOAL · 2 telas</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212,168,67,0.15)', color: '#b89a6a' }}>Bastidores</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(91,63,181,0.12)', color: '#5b3fb5' }}>Caixinha</span>
              </div>
            </div>
          </div>
        </Link>

        {/* SEMANA DE CONTEÚDO — span 8 */}
        <Link href="/mpa" className={`col-span-12 lg:col-span-8 ${cardBase}`} style={cardGrey}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
              <CalendarDays size={15} style={{ color: '#3b82f6' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Sua semana de conteúdo</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>variado: carrossel, post e reels</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>5 agendados</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { dia: 'SEG', tipo: 'Carrossel', tema: 'Carência', bg: 'linear-gradient(135deg, #5b3fb5, #b89a6a)', color: '#fff' },
              { dia: 'TER', tipo: 'Post', tema: 'Frase', bg: 'rgba(212,168,67,0.15)', color: '#b89a6a' },
              { dia: 'QUA', tipo: 'Reels', tema: 'Mito x verdade', bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
              { dia: 'QUI', tipo: 'Carrossel', tema: 'Objeção', bg: 'linear-gradient(135deg, #5b3fb5, #b89a6a)', color: '#fff' },
              { dia: 'SEX', tipo: 'Stories', tema: 'Bastidores', bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#faf8f5', border: '1px solid #f0ece6' }}>
                <p className="text-xs mb-2" style={{ color: '#9a918a' }}>{item.dia}</p>
                <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: item.bg, color: item.color }}>
                  <Sparkles size={14} />
                </div>
                <p className="text-xs font-semibold" style={{ color: '#2d1f4e' }}>{item.tipo}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9a918a' }}>{item.tema}</p>
              </div>
            ))}
          </div>
        </Link>

      </div>
    </div>
  )
}
