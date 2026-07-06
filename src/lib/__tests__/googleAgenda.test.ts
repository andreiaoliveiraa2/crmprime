import { parseIcs } from '../googleAgenda'

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:evt-1@google.com
SUMMARY:Reunião cliente João
DTSTART:20260706T140000Z
DTEND:20260706T150000Z
LOCATION:Escritório
END:VEVENT
END:VCALENDAR`

test('extrai evento dentro do período', () => {
  const eventos = parseIcs(ICS, new Date('2026-07-06T00:00:00Z'), new Date('2026-07-06T23:59:59Z'))
  expect(eventos).toHaveLength(1)
  expect(eventos[0].titulo).toBe('Reunião cliente João')
  expect(eventos[0].local).toBe('Escritório')
  expect(eventos[0].id).toBe('google-evt-1@google.com')
})

test('ignora evento fora do período', () => {
  const eventos = parseIcs(ICS, new Date('2026-07-10T00:00:00Z'), new Date('2026-07-11T00:00:00Z'))
  expect(eventos).toHaveLength(0)
})
