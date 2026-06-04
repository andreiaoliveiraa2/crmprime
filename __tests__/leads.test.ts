import { diasParado, isParado } from '@/lib/leads'
import { Lead } from '@/lib/types'

function makeLead(daysAgo: number, overrides: Partial<Lead> = {}): Lead {
  const date = new Date(Date.now() - daysAgo * 86_400_000).toISOString()
  return {
    id: '1',
    nome: 'Test',
    telefone: null,
    tipo_plano: null,
    operadora: null,
    responsavel: null,
    origem: null,
    o_que_procura: null,
    observacoes: null,
    vendedor: null,
    vendedor_id: null,
    etapa: 'Novo Lead',
    criado_em: date,
    atualizado_em: date,
    ...overrides,
  }
}

describe('diasParado', () => {
  it('retorna dias desde atualizado_em', () => {
    expect(diasParado(makeLead(7))).toBe(7)
  })

  it('usa criado_em como fallback quando atualizado_em está ausente', () => {
    const lead = { ...makeLead(4), atualizado_em: undefined as unknown as string }
    expect(diasParado(lead)).toBe(4)
  })
})

describe('isParado', () => {
  it('retorna true quando >= 5 dias e etapa ativa', () => {
    expect(isParado(makeLead(5))).toBe(true)
    expect(isParado(makeLead(10))).toBe(true)
  })

  it('retorna false quando < 5 dias', () => {
    expect(isParado(makeLead(4))).toBe(false)
    expect(isParado(makeLead(0))).toBe(false)
  })

  it('retorna false para etapa Vendido', () => {
    expect(isParado(makeLead(10, { etapa: 'Vendido' }))).toBe(false)
  })

  it('retorna false para etapa Perdido', () => {
    expect(isParado(makeLead(10, { etapa: 'Perdido' }))).toBe(false)
  })
})
