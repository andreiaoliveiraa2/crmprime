import { resumoVouReceberVendedor } from '@/lib/vouReceberVendedor'

const mesRef = new Date(2026, 6, 15) // julho/2026

describe('resumoVouReceberVendedor', () => {
  it('soma só as pendentes; separa as deste mês; agrupa por operadora', () => {
    const r = resumoVouReceberVendedor([
      { valor_vendedor: 100, status_vendedor: 'Pendente', data_prevista: '2026-07-10', operadora: 'Amil' },
      { valor_vendedor: 50,  status_vendedor: 'Pendente', data_prevista: '2026-08-10', operadora: 'Amil' },
      { valor_vendedor: 30,  status_vendedor: 'Pendente', data_prevista: '2026-07-20', operadora: 'SulAmérica' },
      { valor_vendedor: 999, status_vendedor: 'Recebido', data_prevista: '2026-07-05', operadora: 'Amil' },
    ], mesRef)
    expect(r.totalReceber).toBe(180) // 100+50+30 (exclui recebida)
    expect(r.esteMes).toBe(130)      // 100 (jul) + 30 (jul)
    expect(r.porOperadora).toEqual([
      { operadora: 'Amil', valor: 150 },
      { operadora: 'SulAmérica', valor: 30 },
    ])
  })

  it('sem comissões pendentes retorna tudo zero', () => {
    const r = resumoVouReceberVendedor([
      { valor_vendedor: 200, status_vendedor: 'Recebido', data_prevista: '2026-07-01', operadora: 'Amil' },
    ], mesRef)
    expect(r.totalReceber).toBe(0)
    expect(r.esteMes).toBe(0)
    expect(r.porOperadora).toHaveLength(0)
  })
})
