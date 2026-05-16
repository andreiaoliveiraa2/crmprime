export type Etapa = 'Lead' | 'Contato' | 'Proposta' | 'Fechado' | 'Perdido'

export const ETAPAS: Etapa[] = ['Lead', 'Contato', 'Proposta', 'Fechado', 'Perdido']

export interface Cliente {
  id: string
  nome: string
  contato: string | null
  data: string | null
  etapa: Etapa
  criado_em: string
}

export type ClienteInsert = Omit<Cliente, 'id' | 'criado_em'>
