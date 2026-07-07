import { calcularMetas } from '@/lib/calcularMetas'

describe('calcularMetas', () => {
  it('junta metas e vendido por operadora, calcula % e falta', () => {
    const r = calcularMetas(
      [{ operadora: 'SulAmérica', meta_valor: 5000 }, { operadora: 'Amil', meta_valor: 3000 }],
      [{ operadora: 'SulAmérica', vendido: 3200 }, { operadora: 'Amil', vendido: 1000 }],
      2,
    )
    expect(r.totalMeta).toBe(8000)
    expect(r.totalVendido).toBe(4200)
    expect(r.falta).toBe(3800)
    expect(r.pct).toBe(53) // round(4200/8000*100)
    expect(r.ritmoSemana).toBe(1900) // 3800 / 2
    const sul = r.linhas.find(l => l.operadora === 'SulAmérica')!
    expect(sul.pct).toBe(64) // round(3200/5000*100)
    expect(sul.falta).toBe(1800)
  })

  it('inclui operadora que teve venda mesmo sem meta (pct 0, falta 0)', () => {
    const r = calcularMetas(
      [{ operadora: 'Amil', meta_valor: 3000 }],
      [{ operadora: 'Bradesco', vendido: 500 }],
      1,
    )
    const brad = r.linhas.find(l => l.operadora === 'Bradesco')!
    expect(brad.meta).toBe(0)
    expect(brad.pct).toBe(0)
    expect(brad.falta).toBe(0)
    expect(r.totalMeta).toBe(3000)
    expect(r.totalVendido).toBe(500)
  })

  it('falta nunca é negativa quando vendeu acima da meta', () => {
    const r = calcularMetas(
      [{ operadora: 'Amil', meta_valor: 1000 }],
      [{ operadora: 'Amil', vendido: 1500 }],
      3,
    )
    expect(r.falta).toBe(0)
    expect(r.ritmoSemana).toBe(0)
    expect(r.linhas[0].falta).toBe(0)
    expect(r.linhas[0].pct).toBe(150)
  })

  it('sem metas nem vendas retorna vazio zerado', () => {
    const r = calcularMetas([], [], 4)
    expect(r.linhas).toHaveLength(0)
    expect(r.totalMeta).toBe(0)
    expect(r.pct).toBe(0)
  })
})
