'use client'

import { Compromisso, TIPO_COR } from '@/lib/types'

interface Props {
  eventos: Compromisso[]
  mes: Date
  feriados: Record<string, string>
  onDiaClick: (data: string) => void
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function isHoje(y: number, m: number, d: number) {
  const h = new Date()
  return h.getFullYear() === y && h.getMonth() === m && h.getDate() === d
}

export default function AgendaMes({ eventos, mes, feriados, onDiaClick }: Props) {
  const ano = mes.getFullYear()
  const mesNum = mes.getMonth()

  const primeiroDia = new Date(ano, mesNum, 1)
  const ultimoDia = new Date(ano, mesNum + 1, 0)
  const iniciaSemana = primeiroDia.getDay()

  const celulas: (Date | null)[] = [
    ...Array(iniciaSemana).fill(null),
    ...Array.from({ length: ultimoDia.getDate() }, (_, i) => new Date(ano, mesNum, i + 1)),
  ]
  while (celulas.length % 7 !== 0) celulas.push(null)

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e4dd' }}>
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e8e4dd' }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center py-2 text-xs font-semibold" style={{ color: '#9a918a' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7">
        {celulas.map((dia, idx) => {
          if (!dia) {
            return (
              <div key={idx} className="min-h-[80px] border-b border-r" style={{ borderColor: '#f0ece6', backgroundColor: '#faf8f5' }} />
            )
          }

          const dateStr = isoDate(dia)
          const hoje = isHoje(ano, mesNum, dia.getDate())
          const feriadoNome = feriados[dateStr]
          const evsDia = eventos.filter(ev => isoDate(new Date(ev.data_hora)) === dateStr)

          return (
            <button key={idx}
              onClick={() => onDiaClick(dateStr)}
              className="min-h-[80px] border-b border-r p-1.5 text-left hover:opacity-80 transition-opacity"
              style={{ borderColor: '#f0ece6' }}>
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold mb-1`}
                style={{
                  backgroundColor: hoje ? '#2d1f4e' : 'transparent',
                  color: hoje ? '#ffffff' : '#5a4e3c',
                }}>
                {dia.getDate()}
              </span>
              <div className="space-y-0.5">
                {feriadoNome && (
                  <div className="text-xs px-1 py-0.5 rounded truncate font-medium"
                    style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
                    🎉 {feriadoNome}
                  </div>
                )}
                {evsDia.slice(0, feriadoNome ? 1 : 2).map(ev => {
                  const cor = TIPO_COR[ev.tipo] ?? '#6b7280'
                  return (
                    <div key={ev.id}
                      className="text-xs px-1.5 py-0.5 rounded-md truncate font-medium"
                      style={{ backgroundColor: `${cor}18`, color: cor }}>
                      {ev.titulo}
                    </div>
                  )
                })}
                {evsDia.length > (feriadoNome ? 1 : 2) && (
                  <div className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                    style={{ backgroundColor: '#f0ece6', color: '#9a918a' }}>
                    +{evsDia.length - (feriadoNome ? 1 : 2)}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
