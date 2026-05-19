export type EtapaLead =
  | 'Novo Lead'
  | 'Contato Feito'
  | 'Cotação'
  | 'Negociação'
  | 'Vendido'
  | 'Perdido'

export const ETAPAS_LEAD: EtapaLead[] = [
  'Novo Lead',
  'Contato Feito',
  'Cotação',
  'Negociação',
  'Vendido',
  'Perdido',
]

export const TIPOS_PLANO = [
  'Saúde',
  'Odonto',
  'Vida',
  'Auto',
  'Residencial',
  'Empresarial',
  'Outro',
] as const

export const TIPOS_PLANO_LEAD = [
  'Individual',
  'Familiar',
  'Empresarial',
  'Odontológico',
] as const

export const ORIGENS_LEAD = [
  'Instagram',
  'Indicação',
  'WhatsApp',
  'Site',
  'Outro',
] as const

export interface Lead {
  id: string
  nome: string | null
  telefone: string | null
  tipo_plano: string | null
  operadora: string | null
  responsavel: string | null
  origem: string | null
  o_que_procura: string | null
  observacoes: string | null
  etapa: EtapaLead
  criado_em: string
}

export type LeadInsert = Omit<Lead, 'id' | 'criado_em'> & { criado_em?: string | null }

export interface Cliente {
  id: string
  nome: string
  contato: string | null
  email: string | null
  tipo_plano: string | null
  operadora: string | null
  quantidade_vidas: number | null
  valor_plano: number | null
  observacoes: string | null
  lead_id: string | null
  criado_em: string
}

export type ClienteInsert = Omit<Cliente, 'id' | 'criado_em'>

export type StatusCompromisso = 'Agendado' | 'Pendente'

export interface Compromisso {
  id: string
  titulo: string
  data_hora: string
  observacao: string | null
  status: StatusCompromisso
  criado_em: string
}
