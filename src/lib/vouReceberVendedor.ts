export interface ResumoVouReceber {
  totalReceber: number
  esteMes: number
  porOperadora: { operadora: string; valor: number }[]
}

interface LinhaComissao {
  valor_vendedor: number
  status_vendedor: string
  data_prevista: string   // 'YYYY-MM-DD'
  operadora: string
}

export function resumoVouReceberVendedor(comissoes: LinhaComissao[], mesRef: Date): ResumoVouReceber {
  const pendentes = comissoes.filter(c => c.status_vendedor === 'Pendente')
  const ano = mesRef.getFullYear()
  const mes = mesRef.getMonth() // 0..11

  const totalReceber = pendentes.reduce((s, c) => s + c.valor_vendedor, 0)

  const esteMes = pendentes.reduce((s, c) => {
    const [y, m] = c.data_prevista.split('-').map(Number)
    return (y === ano && m - 1 === mes) ? s + c.valor_vendedor : s
  }, 0)

  const porOpMap = new Map<string, number>()
  for (const c of pendentes) {
    const op = c.operadora || 'Sem operadora'
    porOpMap.set(op, (porOpMap.get(op) ?? 0) + c.valor_vendedor)
  }
  const porOperadora = [...porOpMap.entries()]
    .map(([operadora, valor]) => ({ operadora, valor }))
    .sort((a, b) => b.valor - a.valor)

  return { totalReceber, esteMes, porOperadora }
}
