'use client'

import { Compromisso, TIPO_COR } from '@/lib/types'

interface Props {
  eventos: Compromisso[]
  semanaInicio: Date
  feriados: Record<string, string>
  onEditar: (e: Compromisso) => void
  onDiaClick: (data: string) => void
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function fmt(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function isHoje(d: Date) {
  const h = new Date()
  return d.getDate() === h.getDate() && d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear()
}

export default function AgendaSemana({ eventos, semanaInicio, feriados, onEditar, onDiaClick }: Props) {
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semanaInicio)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <div className="grid grid-cols-7 gap-2">
      {dias.map((dia, idx) => {
        const dateStr = isoDate(dia)
        const hoje = isHoje(dia)
        const feriadoNome = feriados[dateStr]
        const evsDia = eventos
          .filter(ev => isoDate(new Date(ev.data_hora)) === dateStr)
          .sort((a, b) => a.data_hora.localeCompare(b.data_hora))

        return (
          <div key={idx} className="min-h-[160px]">
            <button
              onClick={() => onDiaClick(dateStr)}
              className="w-full text-center py-2 rounded-xl mb-2 transition-colors hover:opacity-80"
              style={{
                backgroundColor: hoje ? '#2d1f4e' : '#f4f1ec',
                color: hoje ? '#ffffff' : '#5a4e3c',
              }}>
              <p className="text-xs font-semibold">{DIAS[dia.getDay()]}</p>
              <p className="text-lg font-bold">{dia.getDate()}</p>
            </button>

            {feriadoNome && (
              <div className="text-xs px-1.5 py-0.5 rounded-md mb-1 truncate font-medium"
                style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
                🎉 {feriadoNome}
              </div>
            )}

            <div className="space-y-1">
              {evsDia.slice(0, 3).map(ev => {
                const cor = TIPO_COR[ev.tipo] ?? '#6b7280'
                return (
                  <button key={ev.id} onClick={() => onEditar(ev)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${cor}18`, color: cor, border: `1px solid ${cor}30` }}>
                    <span className="font-semibold">{fmt(ev.data_hora)}</span> {ev.titulo}
                  </button>
                )
              })}
              {evsDia.length > 3 && (
                <button onClick={() => onDiaClick(dateStr)}
                  className="w-full text-center text-xs py-1 rounded-lg hover:opacity-80"
                  style={{ color: '#9a918a', backgroundColor: '#f0ece6' }}>
                  +{evsDia.length - 3} mais
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
