import { calcularComissoes } from '@/lib/calcularComissoes'

const base = {
  vendaId: 'venda-1',
  valorPlano: 1000,
  dataVenda: '2026-05-20',
  operadora: 'Amil',
}

describe('calcularComissoes', () => {
  it('usa percentuais do cliente quando fornecidos', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: 30,
      percentualVendedor: 10,
      temVitalicio: false,
      percentualVitalicio: null,
    })
    expect(result).not.toBeNull()
    expect(result!.parcelas).toHaveLength(1)
    expect(result!.parcelas[0].valor_empresa).toBeCloseTo(300)
    expect(result!.parcelas[0].valor_vendedor).toBeCloseTo(100)
    expect(result!.parcelas[0].valor_bruto).toBeCloseTo(400)
    expect(result!.parcelas[0].tipo).toBe('parcela')
    expect(result!.vitalicios).toHaveLength(0)
  })

  it('retorna null quando sem percentuais (fallback para regras)', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: null,
      percentualVendedor: null,
      temVitalicio: false,
      percentualVitalicio: null,
    })
    expect(result).toBeNull()
  })

  it('gera vitalício quando temVitalicio=true e percentualVitalicio>0', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: 30,
      percentualVendedor: 10,
      temVitalicio: true,
      percentualVitalicio: 2,
    })
    expect(result).not.toBeNull()
    expect(result!.vitalicios).toHaveLength(1)
    expect(result!.vitalicios[0].valor_bruto).toBeCloseTo(20)
    // Split proporcional: corretora=30, vendedor=10 → empresa=75%, vendedor=25%
    expect(result!.vitalicios[0].valor_empresa).toBeCloseTo(15)
    expect(result!.vitalicios[0].valor_vendedor).toBeCloseTo(5)
  })

  it('vitalício sem percentuais de split fica 100% empresa', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: null,
      percentualVendedor: null,
      temVitalicio: true,
      percentualVitalicio: 2,
    })
    expect(result).not.toBeNull()
    expect(result!.parcelas).toHaveLength(0)
    expect(result!.vitalicios[0].valor_empresa).toBeCloseTo(20)
    expect(result!.vitalicios[0].valor_vendedor).toBeCloseTo(0)
  })

  it('ignora vitalício se percentualVitalicio é 0', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: 30,
      percentualVendedor: 10,
      temVitalicio: true,
      percentualVitalicio: 0,
    })
    expect(result!.vitalicios).toHaveLength(0)
  })
})
