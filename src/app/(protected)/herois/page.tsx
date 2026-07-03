'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

const HEROIS = [
  { nome: 'Batman',           papel: 'O Briefer',    role: 'Analisa o pedido e monta o briefing',     img: '/herois/batman.png' },
  { nome: 'Mulher Maravilha', papel: 'A Criadora',   role: 'Escreve copy, gancho e legenda',           img: '/herois/mulher-maravilha.png' },
  { nome: 'Aranha',           papel: 'O Revisor',    role: 'Revisa erros, qualidade e consistência',   img: '/herois/aranha.png' },
  { nome: 'Flash',            papel: 'O Entregador', role: 'Formata, organiza e prepara pra envio',    img: '/herois/flash.png' },
  { nome: 'Capitão América',  papel: 'O Analista',   role: 'Puxa dados, monta relatórios e análises',  img: '/herois/capitao.png' },
]

export default function HeroisPage() {
  const agentsRef = useRef<HTMLDivElement[]>([])
  const connsRef  = useRef<HTMLDivElement[]>([])
  const finalRef  = useRef<HTMLDivElement>(null)

  function reset() {
    agentsRef.current.forEach(a => {
      a.dataset.state = 'waiting'
      const s = a.querySelector<HTMLSpanElement>('.status')
      if (s) s.innerHTML = 'aguardando'
    })
    connsRef.current.forEach(c => { c.dataset.lit = 'false' })
    if (finalRef.current) finalRef.current.dataset.show = 'false'
  }

  function run() {
    reset()
    let i = 0
    function step() {
      if (i > 0) {
        const prev = agentsRef.current[i - 1]
        if (prev) { prev.dataset.state = 'done'; const s = prev.querySelector<HTMLSpanElement>('.status'); if (s) s.innerHTML = '✓ feito' }
        const conn = connsRef.current[i - 1]
        if (conn) conn.dataset.lit = 'true'
      }
      if (i < HEROIS.length) {
        const a = agentsRef.current[i]
        if (a) {
          a.dataset.state = 'active'
          const s = a.querySelector<HTMLSpanElement>('.status')
          if (s) s.innerHTML = '<span class="spinner"></span> trabalhando'
        }
        i++
        setTimeout(step, 1400)
      } else {
        if (finalRef.current) finalRef.current.dataset.show = 'true'
      }
    }
    step()
  }

  useEffect(() => {
    setTimeout(run, 400)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center p-8" style={{ backgroundColor: '#0d0a1f', fontFamily: 'Manrope, sans-serif', color: '#e8e4f5' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-extrabold mb-1">
            Seus{' '}
            <span style={{ background: 'linear-gradient(90deg,#c9a0ff,#d4a843)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              5 super-heróis
            </span>{' '}
            trabalhando
          </h1>
          <p style={{ color: '#7d70ad', fontSize: 13 }}>Você pede uma vez. Eles fazem em sequência. Você só revisa.</p>
        </div>

        {/* Pedido */}
        <div className="flex items-center gap-3 rounded-2xl px-5 py-3 mb-6 text-sm" style={{ background: '#15102e', border: '1px solid #2a2150' }}>
          <span style={{ color: '#d4a843', fontSize: 18 }}>💬</span>
          <span>Você pediu: <b style={{ color: '#fff' }}>"cria um carrossel sobre carência"</b></span>
        </div>

        {/* Pipeline */}
        <div className="flex flex-col">
          {HEROIS.map((h, i) => (
            <div key={h.nome}>
              <div
                ref={el => { if (el) agentsRef.current[i] = el }}
                data-state="waiting"
                className="heroi-agent flex items-center gap-4 p-4 rounded-2xl transition-all duration-400"
                style={{ border: '1px solid transparent' }}
              >
                <div className="heroi-ava rounded-2xl overflow-hidden shrink-0" style={{ width: 64, height: 64, background: '#1d1442', position: 'relative' }}>
                  <Image src={h.img} alt={h.nome} fill style={{ objectFit: 'cover' }} />
                </div>
                <div className="flex-1">
                  <div className="font-bold" style={{ fontSize: 16 }}>
                    {h.nome} <small style={{ fontWeight: 500, color: '#8a7fb5', fontSize: 12, marginLeft: 6 }}>{h.papel}</small>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#9a8fc0', marginTop: 2 }}>{h.role}</div>
                </div>
                <span className="status font-bold rounded-full px-3 py-1 text-xs whitespace-nowrap" />
              </div>
              {i < HEROIS.length - 1 && (
                <div
                  ref={el => { if (el) connsRef.current[i] = el }}
                  data-lit="false"
                  className="heroi-conn"
                  style={{ width: 2, height: 14, marginLeft: 42 }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Final */}
        <div ref={finalRef} data-show="false" className="heroi-final mt-6 text-center transition-opacity duration-500">
          <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,rgba(168,85,247,.15),rgba(212,168,67,.12))', border: '1px solid #a855f7' }}>
            <div className="font-extrabold text-white" style={{ fontSize: 17 }}>✅ Carrossel pronto!</div>
            <div style={{ fontSize: 13, color: '#bda9e8', marginTop: 5 }}>Arte + copy + gancho + legenda — é só revisar e postar.</div>
          </div>
          <button
            onClick={run}
            className="mt-4 font-semibold rounded-full px-5 py-2 text-sm transition-all hover:opacity-80"
            style={{ background: '#1d1442', border: '1px solid #2a2150', color: '#c9a0ff' }}
          >
            ▶ Ver de novo
          </button>
        </div>
      </div>

      <style jsx>{`
        .heroi-agent[data-state="waiting"] { opacity: 0.4; }
        .heroi-agent[data-state="active"]  { background: #1a1338; border-color: #a855f7 !important; opacity: 1; }
        .heroi-agent[data-state="done"]    { opacity: 0.85; }
        .heroi-agent[data-state="active"] .heroi-ava  { background: linear-gradient(135deg,#a855f7,#d4a843) !important; box-shadow: 0 0 24px rgba(168,85,247,.5); }
        .heroi-agent[data-state="done"] .heroi-ava    { background: rgba(34,197,94,.18) !important; }
        .heroi-agent[data-state="waiting"] .status    { background: #1d1442; color: #6b5f9a; padding: 5px 13px; border-radius: 20px; }
        .heroi-agent[data-state="active"]  .status    { background: rgba(168,85,247,.22); color: #c9a0ff; padding: 5px 13px; border-radius: 20px; }
        .heroi-agent[data-state="done"]    .status    { background: rgba(34,197,94,.15); color: #4ade80; padding: 5px 13px; border-radius: 20px; }
        .heroi-conn[data-lit="false"] { background: #2a2150; }
        .heroi-conn[data-lit="true"]  { background: linear-gradient(#a855f7,#d4a843); }
        .heroi-final[data-show="false"] { opacity: 0; pointer-events: none; }
        .heroi-final[data-show="true"]  { opacity: 1; }
        .spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(201,160,255,.3); border-top-color: #c9a0ff; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; margin-right: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
