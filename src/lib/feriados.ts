export interface Feriado {
  data: string // YYYY-MM-DD
  nome: string
}

function calcularPascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, month - 1, day)
}

function addDias(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function feriadosBrasileiros(ano: number): Feriado[] {
  const pascoa       = calcularPascoa(ano)
  const sextaSanta   = addDias(pascoa, -2)
  const carnaval2    = addDias(pascoa, -47)
  const carnaval1    = addDias(pascoa, -48)
  const corpusChristi = addDias(pascoa, 60)

  return [
    { data: `${ano}-01-01`, nome: 'Ano Novo' },
    { data: iso(carnaval1),   nome: 'Carnaval' },
    { data: iso(carnaval2),   nome: 'Carnaval' },
    { data: iso(sextaSanta),  nome: 'Sexta-feira Santa' },
    { data: iso(pascoa),      nome: 'Páscoa' },
    { data: `${ano}-04-21`,   nome: 'Tiradentes' },
    { data: `${ano}-05-01`,   nome: 'Dia do Trabalho' },
    { data: iso(corpusChristi), nome: 'Corpus Christi' },
    { data: `${ano}-09-07`,   nome: 'Independência' },
    { data: `${ano}-10-12`,   nome: 'N. S. Aparecida' },
    { data: `${ano}-11-02`,   nome: 'Finados' },
    { data: `${ano}-11-15`,   nome: 'República' },
    { data: `${ano}-11-20`,   nome: 'Consciência Negra' },
    { data: `${ano}-12-25`,   nome: 'Natal' },
  ]
}

// Retorna mapa { 'YYYY-MM-DD': 'Nome do Feriado' } para vários anos
export function feriadosMapa(anos: number[]): Record<string, string> {
  const mapa: Record<string, string> = {}
  for (const ano of anos) {
    for (const f of feriadosBrasileiros(ano)) {
      mapa[f.data] = f.nome
    }
  }
  return mapa
}
