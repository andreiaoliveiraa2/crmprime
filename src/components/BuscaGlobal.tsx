'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LeadResult    { id: string; nome: string | null; telefone: string | null }
interface ClienteResult { id: string; nome: string; contato: string | null; cpf: string | null }

export default function BuscaGlobal() {
  const [aberto, setAberto]     = useState(false)
  const [termo, setTermo]       = useState('')
  const [leads, setLeads]       = useState<LeadResult[]>([])
  const [clientes, setClientes] = useState<ClienteResult[]>([])
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!aberto) return
    async function carregar() {
      const [{ data: l }, { data: c }] = await Promise.all([
        supabase.from('leads').select('id, nome, telefone'),
        supabase.from('clientes').select('id, nome, contato, cpf'),
      ])
      setLeads((l ?? []) as LeadResult[])
      setClientes((c ?? []) as ClienteResult[])
    }
    carregar()
  }, [aberto])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') fechar() }
    if (aberto) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [aberto])

  function fechar() { setAberto(false); setTermo('') }
  function navegar(href: string) { router.push(href); fechar() }

  const match = (s: string | null) =>
    (s ?? '').toLowerCase().includes(termo.toLowerCase())

  const ativo         = termo.length >= 2
  const leadsMatch    = ativo ? leads.filter(l => match(l.nome) || match(l.telefone)).slice(0, 5) : []
  const clientesMatch = ativo ? clientes.filter(c => match(c.nome) || match(c.contato) || match(c.cpf)).slice(0, 5) : []
  const semResultados = ativo && leadsMatch.length === 0 && clientesMatch.length === 0

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        aria-label="Buscar"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-150"
        style={{ color: 'rgba(255,255,255,0.55)', borderLeft: '3px solid transparent', paddingLeft: '12px' }}
      >
        <Search size={17} />
        <span className="flex-1 text-left">Buscar</span>
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={fechar}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #f0ece6' }}>
              <Search size={16} style={{ color: '#9a918a' }} className="shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar leads e clientes..."
                value={termo}
                onChange={e => setTermo(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: '#1a1a1a' }}
              />
            </div>

            {ativo && (
              <div className="max-h-80 overflow-y-auto py-2">
                {semResultados && (
                  <p className="text-sm text-center py-6" style={{ color: '#9a918a' }}>
                    Nenhum resultado para &ldquo;{termo}&rdquo;
                  </p>
                )}

                {leadsMatch.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold px-4 py-1.5" style={{ color: '#2d1f4e' }}>
                      LEADS ({leadsMatch.length})
                    </p>
                    {leadsMatch.map(l => (
                      <button key={l.id} onClick={() => navegar(`/crm/${l.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50">
                        <Users size={14} style={{ color: '#2d1f4e' }} className="shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>{l.nome}</p>
                          {l.telefone && <p className="text-xs" style={{ color: '#9a918a' }}>{l.telefone}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {clientesMatch.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold px-4 py-1.5" style={{ color: '#15803d' }}>
                      CLIENTES ({clientesMatch.length})
                    </p>
                    {clientesMatch.map(c => (
                      <button key={c.id} onClick={() => navegar(`/clientes/${c.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50">
                        <UserCheck size={14} style={{ color: '#15803d' }} className="shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>{c.nome}</p>
                          <p className="text-xs" style={{ color: '#9a918a' }}>
                            {[c.contato, c.cpf].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
