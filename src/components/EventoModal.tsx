'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Compromisso, CompromissoInsert, TipoAgenda,
  STATUS_COMPROMISSO, STATUS_COR,
} from '@/lib/types'
import { X, Calendar, Plus } from 'lucide-react'

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

const PALETTE = ['#b89a6a','#c2410c','#be185d','#0891b2','#9333ea','#0d9488','#dc2626','#6b7280']

function toLocalDateTimeInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventoModal({ evento, dataInicial, onClose, onSalvo }: Props) {
  const [titulo, setTitulo]     = useState(evento?.titulo ?? '')
  const [dataHora, setDataHora] = useState(
    evento ? toLocalDateTimeInput(evento.data_hora)
    : dataInicial ? `${dataInicial}T09:00` : ''
  )
  const [tipo, setTipo]         = useState(evento?.tipo ?? '')
  const [status, setStatus]     = useState<Compromisso['status']>(evento?.status ?? 'Agendado')
  const [observacoes, setObs]   = useState(evento?.observacoes ?? '')
  const [tipos, setTipos]       = useState<TipoAgenda[]>([])
  const [novoTipo, setNovoTipo] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [erro, setErro]         = useState('')

  const supabase = createClient()

  async function carregarTipos() {
    const { data } = await supabase.from('tipos_agenda').select('*').order('nome')
    if (data) {
      setTipos(data)
      if (!evento?.tipo && data.length > 0) setTipo(data[0].nome)
    }
  }

  useEffect(() => { carregarTipos() }, [])

  async function handleAdicionarTipo() {
    const nome = novoTipo.trim()
    if (!nome) return
    setAdicionando(true)
    const cor = PALETTE[tipos.length % PALETTE.length]
    const { error } = await supabase.from('tipos_agenda').insert({ nome, cor })
    if (!error) {
      setNovoTipo('')
      await carregarTipos()
      setTipo(nome)
    }
    setAdicionando(false)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setErro('Informe o título.'); return }
    if (!dataHora)       { setErro('Informe a data e horário.'); return }
    if (!tipo)           { setErro('Selecione um tipo.'); return }
    setLoading(true)
    setErro('')

    const payload: CompromissoInsert = {
      titulo:     titulo.trim(),
      data_hora:  new Date(dataHora).toISOString(),
      tipo,
      status,
      observacoes: observacoes.trim() || null,
    }

    try {
      if (evento) {
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

  const corAtual = tipos.find(t => t.nome === tipo)?.cor ?? '#6b7280'

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
              {evento ? 'Editar Compromisso' : 'Novo Compromisso'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="p-5 space-y-4"
          style={{ backgroundColor: '#f4f1ec' }}>

          <div>
            <label className={labelCls} style={labelStyle}>
              Título <span style={{ color: '#b5455a' }}>*</span>
            </label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Reunião com parceiro..."
              className={inputCls} style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>
                Data e Horário <span style={{ color: '#b5455a' }}>*</span>
              </label>
              <input type="datetime-local" value={dataHora}
                onChange={e => setDataHora(e.target.value)}
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

          {/* Tipo — chips dinâmicos */}
          <div>
            <label className={labelCls} style={labelStyle}>Tipo</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tipos.map(t => (
                <button key={t.nome} type="button" onClick={() => setTipo(t.nome)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: tipo === t.nome ? t.cor : `${t.cor}15`,
                    color:           tipo === t.nome ? '#ffffff' : t.cor,
                    border:          `1px solid ${t.cor}40`,
                  }}>
                  {t.nome}
                </button>
              ))}
            </div>

            {/* Adicionar novo tipo */}
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={novoTipo}
                onChange={e => setNovoTipo(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdicionarTipo() }}}
                placeholder="Novo tipo personalizado..."
                className="flex-1 border rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }}
              />
              <button
                type="button"
                onClick={handleAdicionarTipo}
                disabled={adicionando || !novoTipo.trim()}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
              >
                <Plus size={12} /> Adicionar
              </button>
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
              {loading ? 'Salvando...' : evento ? 'Salvar' : 'Criar Compromisso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
