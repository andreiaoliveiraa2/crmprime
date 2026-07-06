import * as ical from 'node-ical'
import { createAdminClient } from '@/lib/supabase/admin'

export type EventoGoogle = {
  id: string
  titulo: string
  data_hora: string   // ISO
  data_fim: string | null
  diaInteiro: boolean
  local: string | null
}

// Parse puro do texto iCalendar -> eventos dentro do período [inicio, fim].
// Eventos recorrentes: por ora só a ocorrência base (expandir é feature futura — YAGNI).
export function parseIcs(ics: string, inicio: Date, fim: Date): EventoGoogle[] {
  const data = ical.sync.parseICS(ics)
  const out: EventoGoogle[] = []
  for (const k of Object.keys(data)) {
    const ev = data[k] as ical.VEvent
    if (!ev || ev.type !== 'VEVENT' || !ev.start) continue
    const start = new Date(ev.start as unknown as Date)
    if (isNaN(start.getTime()) || start < inicio || start > fim) continue
    out.push({
      id: 'google-' + (ev.uid || k),
      titulo: String(ev.summary ?? '(sem título)'),
      data_hora: start.toISOString(),
      data_fim: ev.end ? new Date(ev.end as unknown as Date).toISOString() : null,
      diaInteiro: (ev.datetype as unknown as string) === 'date',
      local: ev.location ? String(ev.location) : null,
    })
  }
  return out.sort((a, b) => a.data_hora.localeCompare(b.data_hora))
}

// Lê a URL secreta salva em `integracoes`, busca o feed e devolve os eventos do período.
// Nunca lança: em qualquer erro (sem URL, rede, parse) retorna [] pra não quebrar a tela.
export async function getEventosGoogleAgenda(inicio: Date, fim: Date): Promise<EventoGoogle[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('integracoes')
      .select('valor, ativo')
      .eq('chave', 'google_ical_url')
      .maybeSingle()
    if (!data?.ativo || !data.valor) return []
    const url = String(data.valor).replace(/^webcal:\/\//i, 'https://')
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return []
    return parseIcs(await res.text(), inicio, fim)
  } catch (e) {
    console.error('[googleAgenda] falha ao ler feed:', e)
    return []
  }
}
