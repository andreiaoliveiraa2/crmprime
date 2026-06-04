import { Lead } from '@/lib/types'

export function diasParado(lead: Lead): number {
  const ref = lead.atualizado_em ?? lead.criado_em
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000)
}

export function isParado(lead: Lead): boolean {
  return diasParado(lead) >= 5
    && lead.etapa !== 'Vendido'
    && lead.etapa !== 'Perdido'
}
