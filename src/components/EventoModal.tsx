'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Compromisso, CompromissoInsert, TipoCompromisso,
  TIPOS_COMPROMISSO, STATUS_COMPROMISSO, TIPO_COR, STATUS_COR,
} from '@/lib/types'
import { X, Calendar } from 'lucide-react'

interface Props {
  evento?: Compromisso
  dataInicial?: string
  onClose: () => void
  onSalvo: () => void
}

const inputCls = 'w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }

function toLocalDateTimeInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventoModal({ evento, dataInicial, onClose, onSalvo }: Props) {
  const [titulo, setTitulo]         = useState(evento?.titulo ?? '')
  const [dataHora, setDataHora]     = useState(
    evento ? toLocalDateTimeInput(evento.data_hora)
    : dataInicial ? `${dataInicial}T09:00` : ''
  )
  const [tipo, setTipo]             = useState<TipoCompromisso>(evento?.tipo ?? 'Reunião')
  const [status, setStatus]         = useState<Compromisso['status']>(evento?.status ?? 'Agendado')
  const [leadId, setLeadId]         = useState(evento?.lead_id ?? '')
  const [clienteId, setClienteId]   = useState(evento?.cliente_id ?? '')
  const [observacoes, setObs]       = useState(evento?.observacoes ?? '')
  const [leads, setLeads]           = useState<{ id: string; nome: string | null; telefone: string | null }[]>([])
  const [clientes, setClientes]     = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading]       = useState(false)
  const [erro, setErro]             = useState('')

  const supabase = createClient()
  const editando = !!evento

  useEffect(() => {
    supabase.from('leads').select('id,nome,telefone').order('nome').then(({ data }) => {
      if (data) setLeads(data)
    })
    supabase.from('clientes').select('id,nome').order('nome').then(({ data }) => {
      if (data) setClientes(data)
    })
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setErro('Informe o título.'); return }
    if (!dataHora) { setErro('Informe a data e horário.'); return }
    setLoading(true)
    setErro('')

    const payload: CompromissoInsert = {
      titulo: titulo.trim(),
      data_hora: new Date(dataHora).toISOString(),
      tipo,
      status: status as Compromisso['status'],
      lead_id: leadId || null,
      cliente_id: clienteId || null,
      observacoes: observacoes.trim() || null,
    }

    try {
      if (editando) {
        const { error } = await supabase.from('agenda').update(payload).eq('id', evento.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('agenda').insert(payload)
        if (error) throw error
      }
      onSalvo()
      onClose()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const corTipo = TIPO_COR[tipo as keyof typeof TIPO_COR] ?? '#2d1f4e'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-white">

        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between"
          style={{ backgroundColor: '#2d1f4e' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(184,154,106,0.2)' }}>
              <Calendar size={16} style={{ color: '#b89a6a' }} />
            </div>
            <h2 className="text-base font-bold text-white">
              {editando ? 'Editar Compromisso' : 'Novo Compromisso'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSalvar} className="p-5 space-y-4"
          style={{ backgroundColor: '#f4f1ec' }}>

          <div>
            <label className={labelCls} style={labelStyle}>
              Título <span style={{ color: '#b5455a' }}>*</span>
            </label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Reunião com cliente..."
              className={inputCls} style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>
                Data e Horário <span style={{ color: '#b5455a' }}>*</span>
              </label>
              <input type="datetime-local" value={dataHora} onChange={e => setDataHora(e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Status</label>
              <select value={status}
                onChange={e => setStatus(e.target.value as Compromisso['status'])}
                className={inputCls} style={inputStyle}>
                {STATUS_COMPROMISSO.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Tipo</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_COMPROMISSO.map(t => {
                const cor = TIPO_COR[t]
                const ativo = tipo === t
                return (
                  <button key={t} type="button" onClick={() => setTipo(t)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: ativo ? cor : `${cor}15`,
                      color: ativo ? '#ffffff' : cor,
                      border: `1px solid ${cor}40`,
                    }}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>Lead relacionado</label>
              <select value={leadId} onChange={e => { setLeadId(e.target.value); if (e.target.value) setClienteId('') }}
                className={inputCls} style={{ ...inputStyle, color: leadId ? '#1a1a1a' : '#9a918a' }}>
                <option value="">Nenhum</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nome ?? l.telefone ?? 'Lead sem nome'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Cliente relacionado</label>
              <select value={clienteId} onChange={e => { setClienteId(e.target.value); if (e.target.value) setLeadId('') }}
                className={inputCls} style={{ ...inputStyle, color: clienteId ? '#1a1a1a' : '#9a918a' }}>
                <option value="">Nenhum</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Observações</label>
            <textarea value={observacoes} onChange={e => setObs(e.target.value)}
              rows={2} placeholder="Informações adicionais..."
              className={`${inputCls} resize-none`} style={inputStyle} />
          </div>

          {erro && <p className="text-sm font-medium" style={{ color: '#b5455a' }}>{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#e8e4dd', color: '#5a4e3c' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
              {loading ? 'Salvando...' : editando ? 'Salvar' : 'Criar Compromisso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
