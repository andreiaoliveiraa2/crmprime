'use client'

import { Compromisso, STATUS_COR } from '@/lib/types'
import { Pencil } from 'lucide-react'

interface Props {
  eventos: Compromisso[]
  feriado?: string
  tiposCores: Record<string, string>
  onEditar: (e: Compromisso) => void
}

function fmt(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function isUrgente(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return diff > 0 && diff < 60 * 60 * 1000
}

export default function AgendaDia({ eventos, feriado, tiposCores, onEditar }: Props) {
  const ordenados = [...eventos].sort((a, b) =>
    new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
  )

  return (
    <div className="space-y-2">

      {/* Banner de feriado nacional */}
      {feriado && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>
          🎉 Feriado Nacional — {feriado}
        </div>
      )}

      {ordenados.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#e8e4dd' }}>
          <p className="text-sm" style={{ color: '#9a918a' }}>Nenhum compromisso para este dia.</p>
        </div>
      ) : ordenados.map(ev => {
        const cor = tiposCores[ev.tipo] ?? '#6b7280'
        const sc = STATUS_COR[ev.status]
        const urgente = isUrgente(ev.data_hora)
        return (
          <div key={ev.id}
            className="bg-white rounded-2xl border flex gap-4 p-4 items-start"
            style={{
              borderColor: urgente ? '#fca5a5' : '#e8e4dd',
              boxShadow: urgente ? '0 0 0 2px #fca5a540' : undefined,
            }}>
            <div className="shrink-0 text-center w-14">
              <p className="text-lg font-bold" style={{ color: '#2d1f4e' }}>{fmt(ev.data_hora)}</p>
              {urgente && (
                <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>em breve</span>
              )}
            </div>
            <div className="w-1 rounded-full self-stretch shrink-0" style={{ backgroundColor: cor }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>{ev.titulo}</p>
                <button onClick={() => onEditar(ev)}
                  className="shrink-0 p-1 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ color: '#b89a6a' }}>
                  <Pencil size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: cor, color: '#ffffff' }}>
                  {ev.tipo}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: sc.bg, color: sc.text }}>
                  {ev.status}
                </span>
              </div>
              {ev.observacoes && (
                <p className="text-xs mt-1.5" style={{ color: '#9a918a' }}>{ev.observacoes}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
