import { createAdminClient } from '@/lib/supabase/admin'

export type EventoGoogle = {
  id: string
  titulo: string
  data_hora: string   // ISO
  data_fim: string | null
  diaInteiro: boolean
  local: string | null
}

type Raw = {
  uid?: string
  summary?: string
  location?: string
  start?: { date: Date; dateOnly: boolean }
  end?: { date: Date; dateOnly: boolean }
}

// iCalendar "unfolding": linhas continuadas começam com espaço ou tab.
function unfold(ics: string): string[] {
  const raw = ics.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const lines: string[] = []
  for (const l of raw) {
    if ((l.startsWith(' ') || l.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += l.slice(1)
    } else {
      lines.push(l)
    }
  }
  return lines
}

// "DTSTART;TZID=...:2026..." -> { name: 'DTSTART', value: '2026...' }
function prop(line: string): { name: string; value: string } {
  const idx = line.indexOf(':')
  if (idx === -1) return { name: '', value: '' }
  return { name: line.slice(0, idx).split(';')[0].toUpperCase(), value: line.slice(idx + 1) }
}

function parseDate(value: string): { date: Date; dateOnly: boolean } | null {
  const m = value.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  if (h === undefined) {
    // data sem hora = dia inteiro; fixa meio-dia local pra não escorregar de fuso
    return { date: new Date(Number(y), Number(mo) - 1, Number(d), 12, 0, 0), dateOnly: true }
  }
  if (z) return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), dateOnly: false }
  return { date: new Date(+y, +mo - 1, +d, +h, +mi, +s), dateOnly: false }
}

function unescape(v: string): string {
  return v.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim()
}

// Parser próprio (sem libs) do texto iCalendar → eventos dentro de [inicio, fim].
// Recorrência (RRULE) fora de escopo por ora (YAGNI).
export function parseIcs(ics: string, inicio: Date, fim: Date): EventoGoogle[] {
  const lines = unfold(ics)
  const out: EventoGoogle[] = []
  let cur: Raw | null = null
  for (const line of lines) {
    if (line.trim() === 'BEGIN:VEVENT') { cur = {}; continue }
    if (line.trim() === 'END:VEVENT') {
      if (cur?.start) {
        const start = cur.start.date
        if (!isNaN(start.getTime()) && start >= inicio && start <= fim) {
          out.push({
            id: 'google-' + (cur.uid || String(start.getTime())),
            titulo: cur.summary || '(sem título)',
            data_hora: start.toISOString(),
            data_fim: cur.end ? cur.end.date.toISOString() : null,
            diaInteiro: !!cur.start.dateOnly,
            local: cur.location || null,
          })
        }
      }
      cur = null
      continue
    }
    if (!cur) continue
    const { name, value } = prop(line)
    if (name === 'SUMMARY') cur.summary = unescape(value)
    else if (name === 'LOCATION') cur.location = unescape(value)
    else if (name === 'UID') cur.uid = value.trim()
    else if (name === 'DTSTART') { const p = parseDate(value); if (p) cur.start = p }
    else if (name === 'DTEND') { const p = parseDate(value); if (p) cur.end = p }
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
    // Pode ter VÁRIAS agendas (uma URL por linha/vírgula) — junta os eventos de todas.
    const urls = String(data.valor)
      .split(/[\n,;]+/).map(u => u.trim()).filter(Boolean)
      .map(u => u.replace(/^webcal:\/\//i, 'https://'))
    const listas = await Promise.all(urls.map(async url => {
      try {
        const res = await fetch(url, { next: { revalidate: 600 } })
        if (!res.ok) return []
        return parseIcs(await res.text(), inicio, fim)
      } catch { return [] }
    }))
    return listas.flat().sort((a, b) => a.data_hora.localeCompare(b.data_hora))
  } catch (e) {
    console.error('[googleAgenda] falha ao ler feed:', e)
    return []
  }
}
