export interface MetaLinha {
  operadora: string
  meta: number
  vendido: number
  pct: number   // inteiro 0..N
  falta: number
}

export interface ResumoMeta {
  totalMeta: number
  totalVendido: number
  pct: number
  falta: number
  ritmoSemana: number
  linhas: MetaLinha[]
}

function pctDe(vendido: number, meta: number): number {
  return meta > 0 ? Math.round((vendido / meta) * 100) : 0
}

export function calcularMetas(
  metas: { operadora: string; meta_valor: number }[],
  vendido: { operadora: string; vendido: number }[],
  semanasRestantes: number,
): ResumoMeta {
  const metaPorOp = new Map<string, number>()
  for (const m of metas) metaPorOp.set(m.operadora, (metaPorOp.get(m.operadora) ?? 0) + m.meta_valor)

  const vendidoPorOp = new Map<string, number>()
  for (const v of vendido) vendidoPorOp.set(v.operadora, (vendidoPorOp.get(v.operadora) ?? 0) + v.vendido)

  const operadoras = new Set<string>([...metaPorOp.keys(), ...vendidoPorOp.keys()])

  const linhas: MetaLinha[] = [...operadoras].map(operadora => {
    const meta = metaPorOp.get(operadora) ?? 0
    const vend = vendidoPorOp.get(operadora) ?? 0
    return { operadora, meta, vendido: vend, pct: pctDe(vend, meta), falta: Math.max(0, meta - vend) }
  }).sort((a, b) => (b.meta - a.meta) || (b.vendido - a.vendido))

  const totalMeta = linhas.reduce((s, l) => s + l.meta, 0)
  const totalVendido = linhas.reduce((s, l) => s + l.vendido, 0)
  const falta = Math.max(0, totalMeta - totalVendido)
  const ritmoSemana = semanasRestantes > 0 ? Math.round(falta / semanasRestantes) : falta

  return { totalMeta, totalVendido, pct: pctDe(totalVendido, totalMeta), falta, ritmoSemana, linhas }
}
