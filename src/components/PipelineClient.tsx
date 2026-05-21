'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Lead, EtapaLead, ETAPAS_LEAD } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import KanbanBoard from './KanbanBoard'
import LeadListView from './LeadListView'
import LeadExportModal from './LeadExportModal'
import Link from 'next/link'
import { LayoutGrid, List, Plus, Download } from 'lucide-react'

type Visao = 'kanban' | 'lista'

interface Props {
  leads: Lead[]
}

export default function PipelineClient({ leads: leadsIniciais }: Props) {
  const [leads, setLeads]               = useState(leadsIniciais)
  const [visao, setVisao]               = useState<Visao>('kanban')
  const [filtroEtapa, setFiltroEtapa]   = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim]       = useState('')
  const [exportando, setExportando]     = useState(false)
  const [vendedores, setVendedores]     = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('vendedores')
      .select('nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        if (data) setVendedores(data.map((v: { nome: string }) => v.nome))
      })
  }, [])

  const handleLeadMoved = useCallback((id: string, novaEtapa: EtapaLead) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, etapa: novaEtapa } : l))
  }, [])

  const leadsFiltrados = useMemo(() => {
    return leads.filter(l => {
      if (filtroEtapa    && l.etapa    !== filtroEtapa)    return false
      if (filtroVendedor && l.vendedor !== filtroVendedor) return false
      if (filtroInicio   && l.criado_em < new Date(filtroInicio).toISOString()) return false
      if (filtroFim) {
        const fim = new Date(filtroFim)
        fim.setDate(fim.getDate() + 1)
        if (l.criado_em >= fim.toISOString()) return false
      }
      return true
    })
  }, [leads, filtroEtapa, filtroVendedor, filtroInicio, filtroFim])

  const temFiltro = filtroEtapa || filtroVendedor || filtroInicio || filtroFim

  const selectCls = 'border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2'
  const selectStyle = (val: string) => ({ borderColor: '#e8e4dd', color: val ? '#1a1a1a' : '#9a918a' })

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>CRM</h1>
          <p className="text-sm mt-1" style={{ color: '#7a7065' }}>
            {visao === 'kanban'
              ? 'Funil de vendas — arraste para mover etapas'
              : `${leadsFiltrados.length} lead${leadsFiltrados.length !== 1 ? 's' : ''}${temFiltro ? ' (filtrado)' : ''}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Kanban / Lista */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
            <button
              onClick={() => setVisao('kanban')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: visao === 'kanban' ? '#2d1f4e' : '#ffffff',
                color: visao === 'kanban' ? '#ffffff' : '#5a4e3c',
              }}
            >
              <LayoutGrid size={15} />
              Kanban
            </button>
            <button
              onClick={() => setVisao('lista')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: visao === 'lista' ? '#2d1f4e' : '#ffffff',
                color: visao === 'lista' ? '#ffffff' : '#5a4e3c',
              }}
            >
              <List size={15} />
              Lista
            </button>
          </div>

          {/* Exportar */}
          <button
            onClick={() => setExportando(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ border: '1px solid #b89a6a', color: '#b89a6a', backgroundColor: '#ffffff' }}
          >
            <Download size={15} />
            Exportar
          </button>

          {/* Novo Lead */}
          <Link
            href="/crm/novo"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
          >
            <Plus size={15} />
            Novo Lead
          </Link>
        </div>
      </div>

      {/* Filtros — só na visão lista */}
      {visao === 'lista' && (
        <div
          className="flex flex-wrap items-center gap-3 mb-5 p-4 rounded-xl"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }}
        >
          {/* Etapa */}
          <select
            value={filtroEtapa}
            onChange={e => setFiltroEtapa(e.target.value)}
            className={selectCls}
            style={selectStyle(filtroEtapa)}
          >
            <option value="">Todas as etapas</option>
            {ETAPAS_LEAD.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {/* Vendedor — busca dinâmica da tabela vendedores */}
          <select
            value={filtroVendedor}
            onChange={e => setFiltroVendedor(e.target.value)}
            className={selectCls}
            style={selectStyle(filtroVendedor)}
          >
            <option value="">Todos os vendedores</option>
            {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          {/* Período */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filtroInicio}
              onChange={e => setFiltroInicio(e.target.value)}
              className={selectCls}
              style={{ borderColor: '#e8e4dd' }}
            />
            <span className="text-xs" style={{ color: '#9a918a' }}>até</span>
            <input
              type="date"
              value={filtroFim}
              onChange={e => setFiltroFim(e.target.value)}
              className={selectCls}
              style={{ borderColor: '#e8e4dd' }}
            />
          </div>

          {/* Limpar */}
          {temFiltro && (
            <button
              onClick={() => {
                setFiltroEtapa('')
                setFiltroVendedor('')
                setFiltroInicio('')
                setFiltroFim('')
              }}
              className="px-3 py-2 text-sm font-medium rounded-xl hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Conteúdo principal */}
      {visao === 'kanban'
        ? <KanbanBoard leads={leads} onLeadMoved={handleLeadMoved} />
        : <LeadListView leads={leadsFiltrados} />
      }

      {/* Modal exportação */}
      {exportando && (
        <LeadExportModal
          leads={leadsFiltrados}
          onClose={() => setExportando(false)}
        />
      )}
    </div>
  )
}
