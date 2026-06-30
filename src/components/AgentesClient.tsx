'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Clock, Zap, Shield, TrendingUp, Megaphone, UserCheck, FileText, Eye, CheckCircle } from 'lucide-react'

// ── Super-Heróis ─────────────────────────────────────────────────────────────

const HEROIS = [
  { nome: 'Batman',           papel: 'O Briefer',    role: 'Analisa o pedido e monta o briefing',    img: '/herois/batman.png' },
  { nome: 'Mulher Maravilha', papel: 'A Criadora',   role: 'Cria cotações, scripts, posts, propostas', img: '/herois/mulher-maravilha.png' },
  { nome: 'Aranha',           papel: 'O Revisor',    role: 'Checa qualidade, erros e consistência',  img: '/herois/aranha.png' },
  { nome: 'Flash',            papel: 'O Entregador', role: 'Formata, organiza e prepara pra envio',  img: '/herois/flash.png' },
  { nome: 'Capitão',          papel: 'O Analista',   role: 'Puxa dados, monta relatórios',           img: '/herois/capitao.png' },
]

// ── Agentes técnicos ─────────────────────────────────────────────────────────

const AGENTES_CONFIG = [
  { nome: 'Prospecção',  descricao: 'Qualifica leads novos pelo WhatsApp',          icon: UserCheck,   cor: '#22c55e', corBg: 'rgba(34,197,94,0.1)',   statusPadrao: 'ativo',      acaoPadrao: 'Aguardando novos leads', proximaPadrao: 'Sempre ativo' },
  { nome: 'Carteira',    descricao: 'Monitora planos vencendo, clientes em risco',  icon: Shield,      cor: '#5b3fb5', corBg: 'rgba(91,63,181,0.1)',   statusPadrao: 'agendado',   acaoPadrao: 'Ainda não executou',    proximaPadrao: 'Todo dia às 6h' },
  { nome: 'Comercial',   descricao: 'Identifica leads sem retorno, prepara follow-ups', icon: TrendingUp, cor: '#b89a6a', corBg: 'rgba(184,154,106,0.1)', statusPadrao: 'agendado',  acaoPadrao: 'Ainda não executou',    proximaPadrao: 'Todo dia às 7h' },
  { nome: 'Conteúdo',    descricao: 'Planeja posts, stories e calendário editorial', icon: Megaphone,   cor: '#3b82f6', corBg: 'rgba(59,130,246,0.1)',  statusPadrao: 'agendado',   acaoPadrao: 'Ainda não executou',    proximaPadrao: 'Todo dia às 6h' },
  { nome: 'Financeiro',  descricao: 'Calcula comissões, alerta contas a pagar',     icon: FileText,    cor: '#ef4444', corBg: 'rgba(239,68,68,0.1)',   statusPadrao: 'agendado',   acaoPadrao: 'Ainda não executou',    proximaPadrao: 'Dia 1 de cada mês' },
  { nome: 'Pós-venda',   descricao: 'Onboarding de segurado novo, acompanha carência', icon: CheckCircle, cor: '#0ea5e9', corBg: 'rgba(14,165,233,0.1)', statusPadrao: 'aguardando', acaoPadrao: 'Aguardando nova venda', proximaPadrao: 'Quando fechar venda' },
  { nome: 'Espião',      descricao: 'Monitora perfis e identifica temas em alta',   icon: Eye,         cor: '#8b5cf6', corBg: 'rgba(139,92,246,0.1)',  statusPadrao: 'agendado',   acaoPadrao: 'Ainda não executou',    proximaPadrao: 'Todo dia às 8h' },
]

const STATUS_MAP = {
  ativo:      { label: 'Ativo',      bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  agendado:   { label: 'Agendado',   bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  aguardando: { label: 'Aguardando', bg: 'rgba(184,154,106,0.12)', color: '#b89a6a' },
  erro:       { label: 'Erro',       bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
}

function fmtRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `há ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

interface Execucao { agente: string; status: string; ultima_acao: string | null; executado_em: string }

export default function AgentesClient({ execucoes }: { execucoes: Execucao[] }) {
  const agentsRef = useRef<HTMLDivElement[]>([])
  const connsRef  = useRef<HTMLDivElement[]>([])
  const finalRef  = useRef<HTMLDivElement>(null)

  const ultimaExecucao: Record<string, Execucao> = {}
  for (const e of execucoes) {
    if (!ultimaExecucao[e.agente]) ultimaExecucao[e.agente] = e
  }

  function reset() {
    agentsRef.current.forEach(a => {
      if (!a) return
      a.dataset.state = 'waiting'
      const s = a.querySelector<HTMLSpanElement>('.hstatus')
      if (s) s.innerHTML = 'aguardando'
    })
    connsRef.current.forEach(c => { if (c) c.dataset.lit = 'false' })
    if (finalRef.current) finalRef.current.dataset.show = 'false'
  }

  function run() {
    reset()
    let i = 0
    function step() {
      if (i > 0) {
        const prev = agentsRef.current[i - 1]
        if (prev) { prev.dataset.state = 'done'; const s = prev.querySelector<HTMLSpanElement>('.hstatus'); if (s) s.innerHTML = '✓ feito' }
        const conn = connsRef.current[i - 1]
        if (conn) conn.dataset.lit = 'true'
      }
      if (i < HEROIS.length) {
        const a = agentsRef.current[i]
        if (a) {
          a.dataset.state = 'active'
          const s = a.querySelector<HTMLSpanElement>('.hstatus')
          if (s) s.innerHTML = '<span class="hspinner"></span> trabalhando'
        }
        i++
        setTimeout(step, 1400)
      } else {
        if (finalRef.current) finalRef.current.dataset.show = 'true'
      }
    }
    step()
  }

  useEffect(() => { setTimeout(run, 500) }, [])

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Agentes</h1>
        <p className="text-sm mt-1" style={{ color: '#9a918a' }}>Sua equipe digital trabalhando automaticamente</p>
      </div>

      {/* ── Seção Super-Heróis ── */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#0d0a1f', color: '#e8e4f5' }}>
        <div className="text-center mb-5">
          <h2 className="text-lg font-extrabold">
            Seus{' '}
            <span style={{ background: 'linear-gradient(90deg,#c9a0ff,#d4a843)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              5 super-heróis
            </span>
          </h2>
          <p className="text-xs mt-1" style={{ color: '#7d70ad' }}>Você pede uma vez. Eles fazem em sequência. Você só revisa.</p>
        </div>

        <div className="flex flex-col max-w-lg mx-auto">
          {HEROIS.map((h, i) => (
            <div key={h.nome}>
              <div
                ref={el => { if (el) agentsRef.current[i] = el }}
                data-state="waiting"
                className="hagent flex items-center gap-4 p-3 rounded-2xl transition-all"
                style={{ border: '1px solid transparent' }}
              >
                <div className="hava rounded-2xl shrink-0" style={{ width: 140, height: 140, position: 'relative', background: 'linear-gradient(135deg,#1a1040,#0d0a1f)', flexShrink: 0 }}>
                  <Image src={h.img} alt={h.nome} fill style={{ objectFit: 'contain', padding: 6 }} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">
                    {h.nome} <small style={{ fontWeight: 500, color: '#8a7fb5', fontSize: 11, marginLeft: 4 }}>{h.papel}</small>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#9a8fc0', marginTop: 1 }}>{h.role}</div>
                </div>
                <span className="hstatus font-bold rounded-full px-3 py-1 text-xs whitespace-nowrap" />
              </div>
              {i < HEROIS.length - 1 && (
                <div ref={el => { if (el) connsRef.current[i] = el }} data-lit="false" className="hconn" style={{ width: 2, height: 14, marginLeft: 82 }} />
              )}
            </div>
          ))}
        </div>

        <div ref={finalRef} data-show="false" className="hfinal text-center mt-4">
          <div className="rounded-xl px-4 py-3 inline-block" style={{ background: 'linear-gradient(135deg,rgba(168,85,247,.15),rgba(212,168,67,.12))', border: '1px solid #a855f7' }}>
            <span className="font-bold text-white text-sm">✅ Entrega pronta — é só revisar e aprovar.</span>
          </div>
          <br />
          <button onClick={run} className="mt-3 text-xs font-semibold rounded-full px-4 py-2 hover:opacity-80" style={{ background: '#1d1442', border: '1px solid #2a2150', color: '#c9a0ff' }}>
            ▶ Ver de novo
          </button>
        </div>
      </div>

      {/* ── Agentes técnicos ── */}
      <h2 className="text-sm font-bold mb-3" style={{ color: '#2d1f4e' }}>Automações em execução</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENTES_CONFIG.map((agente) => {
          const Icon = agente.icon
          const exec = ultimaExecucao[agente.nome]
          const statusKey = (exec?.status ?? agente.statusPadrao) as keyof typeof STATUS_MAP
          const status = STATUS_MAP[statusKey] ?? STATUS_MAP.agendado
          const ultimaAcao = exec?.ultima_acao ?? agente.acaoPadrao
          const quando = exec ? fmtRelativo(exec.executado_em) : null

          return (
            <div key={agente.nome} className="bg-white p-5 rounded-2xl hover:shadow-md transition-all" style={{ border: '1px solid #e8e4dd' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: agente.corBg }}>
                  <Icon size={20} style={{ color: agente.cor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>{agente.nome}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#9a918a' }}>{agente.descricao}</p>
                </div>
              </div>
              <div className="space-y-2 pl-13">
                <div className="flex items-start gap-2">
                  <Zap size={12} className="mt-0.5 shrink-0" style={{ color: '#b89a6a' }} />
                  <p className="text-xs" style={{ color: '#5a4e3c' }}>
                    {ultimaAcao}
                    {quando && <span className="ml-1" style={{ color: '#9a918a' }}>({quando})</span>}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock size={12} className="mt-0.5 shrink-0" style={{ color: '#9a918a' }} />
                  <p className="text-xs" style={{ color: '#9a918a' }}>{agente.proximaPadrao}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .hagent[data-state="waiting"] { opacity: 0.4; }
        .hagent[data-state="active"]  { background: #1a1338 !important; border-color: #a855f7 !important; opacity: 1; }
        .hagent[data-state="done"]    { opacity: 0.85; }
        .hagent[data-state="active"] .hava  { box-shadow: 0 0 20px rgba(168,85,247,.5); }
        .hagent[data-state="waiting"] .hstatus { background: #1d1442; color: #6b5f9a; padding: 4px 10px; border-radius: 20px; }
        .hagent[data-state="active"]  .hstatus { background: rgba(168,85,247,.22); color: #c9a0ff; padding: 4px 10px; border-radius: 20px; }
        .hagent[data-state="done"]    .hstatus { background: rgba(34,197,94,.15); color: #4ade80; padding: 4px 10px; border-radius: 20px; }
        .hconn[data-lit="false"] { background: #2a2150; }
        .hconn[data-lit="true"]  { background: linear-gradient(#a855f7,#d4a843); }
        .hfinal[data-show="false"] { opacity: 0; pointer-events: none; }
        .hfinal[data-show="true"]  { opacity: 1; transition: opacity .5s; }
        .hspinner { display: inline-block; width: 11px; height: 11px; border: 2px solid rgba(201,160,255,.3); border-top-color: #c9a0ff; border-radius: 50%; animation: hspin .7s linear infinite; vertical-align: middle; margin-right: 3px; }
        @keyframes hspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
