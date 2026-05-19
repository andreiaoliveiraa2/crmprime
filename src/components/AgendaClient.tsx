'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Compromisso } from '@/lib/types'
import AgendaDia from './AgendaDia'
import AgendaSemana from './AgendaSemana'
import AgendaMes from './AgendaMes'
import EventoModal from './EventoModal'
import { Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar } from 'lucide-react'

type Visao = 'dia' | 'semana' | 'mes'

interface Props {
  eventos: Compromisso[]
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function inicioSemana(d: Date) {
  const s = new Date(d)
  s.setDate(d.getDate() - d.getDay())
  s.setHours(0, 0, 0, 0)
  return s
}

function formatarTitulo(visao: Visao, data: Date) {
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  if (visao === 'dia') {
    const hoje = new Date()
    const ehHoje = isoDate(data) === isoDate(hoje)
    const amanha = new Date(hoje); amanha.setDate(hoje.getDate()+1)
    const ehAmanha = isoDate(data) === isoDate(amanha)
    if (ehHoje) return 'Hoje'
    if (ehAmanha) return 'Amanhã'
    return `${data.getDate()} de ${meses[data.getMonth()]}`
  }
  if (visao === 'semana') {
    const fim = new Date(data); fim.setDate(data.getDate() + 6)
    return `${data.getDate()} – ${fim.getDate()} de ${meses[data.getMonth()]} ${data.getFullYear()}`
  }
  return `${meses[data.getMonth()]} ${data.getFullYear()}`
}

export default function AgendaClient({ eventos: inicial }: Props) {
  const [visao, setVisao] = useState<Visao>('semana')
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d
  })
  const [modalAberto, setModalAberto] = useState(false)
  const [eventoEditando, setEventoEditando] = useState<Compromisso | undefined>()
  const [eventos, setEventos] = useState(inicial)

  const router = useRouter()

  const reload = useCallback(async () => {
    router.refresh()
  }, [router])

  function navegar(delta: number) {
    const nova = new Date(dataSelecionada)
    if (visao === 'dia') nova.setDate(nova.getDate() + delta)
    else if (visao === 'semana') nova.setDate(nova.getDate() + delta * 7)
    else nova.setMonth(nova.getMonth() + delta)
    setDataSelecionada(nova)
  }

  function irParaDia(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const nova = new Date(y, m-1, d)
    setDataSelecionada(nova)
    setVisao('dia')
  }

  function eventosFiltrados() {
    if (visao === 'dia') {
      const ds = isoDate(dataSelecionada)
      return eventos.filter(ev => ev.data_hora.startsWith(ds))
    }
    if (visao === 'semana') {
      const inicio = inicioSemana(dataSelecionada)
      const fim = new Date(inicio); fim.setDate(inicio.getDate() + 7)
      return eventos.filter(ev => {
        const d = new Date(ev.data_hora)
        return d >= inicio && d < fim
      })
    }
    // mes
    return eventos.filter(ev => {
      const d = new Date(ev.data_hora)
      return d.getMonth() === dataSelecionada.getMonth() && d.getFullYear() === dataSelecionada.getFullYear()
    })
  }

  const semanaIni = inicioSemana(dataSelecionada)

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Agenda</h1>
          <p className="text-sm mt-1" style={{ color: '#7a7065' }}>
            {formatarTitulo(visao, visao === 'semana' ? semanaIni : dataSelecionada)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navegação */}
          <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
            <button onClick={() => navegar(-1)}
              className="px-3 py-2 hover:bg-stone-50 transition-colors" style={{ color: '#5a4e3c' }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => { const d = new Date(); d.setHours(0,0,0,0); setDataSelecionada(d) }}
              className="px-3 py-2 text-xs font-semibold hover:bg-stone-50 transition-colors" style={{ color: '#5a4e3c' }}>
              Hoje
            </button>
            <button onClick={() => navegar(1)}
              className="px-3 py-2 hover:bg-stone-50 transition-colors" style={{ color: '#5a4e3c' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Toggle visão */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
            {([['dia', CalendarDays, 'Dia'], ['semana', CalendarRange, 'Semana'], ['mes', Calendar, 'Mês']] as const).map(([v, Icon, label]) => (
              <button key={v} onClick={() => setVisao(v)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: visao === v ? '#2d1f4e' : '#ffffff',
                  color: visao === v ? '#ffffff' : '#5a4e3c',
                }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Novo */}
          <button onClick={() => { setEventoEditando(undefined); setModalAberto(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
            <Plus size={15} /> Novo Compromisso
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {visao === 'dia' && (
        <AgendaDia
          eventos={eventosFiltrados()}
          onEditar={ev => { setEventoEditando(ev); setModalAberto(true) }}
        />
      )}
      {visao === 'semana' && (
        <AgendaSemana
          eventos={eventosFiltrados()}
          semanaInicio={semanaIni}
          onEditar={ev => { setEventoEditando(ev); setModalAberto(true) }}
          onDiaClick={irParaDia}
        />
      )}
      {visao === 'mes' && (
        <AgendaMes
          eventos={eventosFiltrados()}
          mes={dataSelecionada}
          onDiaClick={irParaDia}
        />
      )}

      {/* Modal */}
      {modalAberto && (
        <EventoModal
          evento={eventoEditando}
          dataInicial={isoDate(dataSelecionada)}
          onClose={() => setModalAberto(false)}
          onSalvo={reload}
        />
      )}
    </div>
  )
}
