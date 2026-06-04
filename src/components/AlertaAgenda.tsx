'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { Compromisso } from '@/lib/types'
import { fmtHora } from '@/lib/dateUtils'

interface Props {
  eventosHoje: Compromisso[]
  pendentes: Compromisso[]
}

function tempoRestante(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'agora'
  const min = Math.floor(diff / 60000)
  if (min < 60) return `em ${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `em ${h}h ${m}min` : `em ${h}h`
}

function fmtDia(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function AlertaAgenda({ eventosHoje, pendentes }: Props) {
  const [, setTick] = useState(0)
  const router = useRouter()

  // Atualiza o countdown a cada minuto
  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1)
      router.refresh()
    }, 60000)
    return () => clearInterval(id)
  }, [router])

  // Captura agora uma vez para que filter e map usem o mesmo instante
  const agora = Date.now()
  const proximos = eventosHoje.filter(ev => {
    const diff = new Date(ev.data_hora).getTime() - agora
    return ev.status === 'Agendado' && diff > 0 && diff <= 2 * 60 * 60 * 1000
  })

  if (proximos.length === 0 && pendentes.length === 0) return null

  return (
    <div className="mb-5 space-y-2">

      {/* Pendentes de dias anteriores */}
      {pendentes.length > 0 && (
        <a href="/agenda"
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
          <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: '#ffedd5' }}>
            <AlertTriangle size={16} style={{ color: '#ea580c' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#9a3412' }}>
              {pendentes.length} compromisso{pendentes.length > 1 ? 's' : ''} pendente{pendentes.length > 1 ? 's' : ''} de dias anteriores
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#c2410c' }}>
              {pendentes.map(ev => ev.titulo).join(', ')}
            </p>
          </div>
          <ChevronRight size={16} style={{ color: '#ea580c' }} className="shrink-0" />
        </a>
      )}

      {/* Próximos nas próximas 2 horas */}
      {proximos.map(ev => {
        const diff = new Date(ev.data_hora).getTime() - agora
        const urgente = diff <= 30 * 60 * 1000
        return (
          <a key={ev.id} href="/agenda"
            className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-opacity hover:opacity-90"
            style={{
              backgroundColor: urgente ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${urgente ? '#fca5a5' : '#86efac'}`,
            }}>
            <div className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: urgente ? '#fee2e2' : '#dcfce7' }}>
              {urgente
                ? <Bell size={16} style={{ color: '#dc2626' }} />
                : <Clock size={16} style={{ color: '#16a34a' }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: urgente ? '#991b1b' : '#14532d' }}>
                {ev.titulo}
              </p>
              <p className="text-xs mt-0.5" style={{ color: urgente ? '#dc2626' : '#16a34a' }}>
                {fmtHora(ev.data_hora)} · {tempoRestante(ev.data_hora)}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: urgente ? '#dc2626' : '#16a34a' }} className="shrink-0" />
          </a>
        )
      })}

    </div>
  )
}
