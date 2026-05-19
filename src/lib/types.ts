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
  vendedor?: string | null
  etapa: EtapaLead
  criado_em: string
}

export interface Vendedor {
  id: string
  nome: string
  ativo: boolean
  criado_em: string
}

export interface Operadora {
  id: string
  nome: string
  ativo: boolean
  criado_em: string
}

export type OperadoraInsert = Omit<Operadora, 'id' | 'criado_em'>

export type LeadInsert = Omit<Lead, 'id' | 'criado_em'> & { criado_em?: string | null }
export type VendedorInsert = Omit<Vendedor, 'id' | 'criado_em'>

export type StatusCliente = 'Ativo' | 'Inativo' | 'Cancelado'
export const STATUS_CLIENTE: StatusCliente[] = ['Ativo', 'Inativo', 'Cancelado']

export interface Cliente {
  id: string
  nome: string
  cpf: string | null
  data_nascimento: string | null
  endereco: string | null
  contato: string | null
  email: string | null
  tipo_plano: string | null
  operadora: string | null
  administradora: string | null
  quantidade_vidas: number | null
  valor_plano: number | null
  numero_contrato: string | null
  data_venda: string | null
  data_implantacao: string | null
  status: StatusCliente
  vendedor: string | null
  comissao: number | null
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
