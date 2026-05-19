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
  vendedor: string | null
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

export type TipoCompromisso = string
export type StatusCompromisso = 'Agendado' | 'Concluído' | 'Cancelado'

export const STATUS_COMPROMISSO: StatusCompromisso[] = ['Agendado', 'Concluído', 'Cancelado']

export const TIPO_COR: Record<string, string> = {
  'Consultas Médicas': '#039be5',
  'Coworking':         '#7986cb',
  'Criar Conteúdo':    '#8e24aa',
  'Fazenda Aluguel':   '#d50000',
  'Reunião':           '#7c4d2e',
}

export interface TipoAgenda {
  id: string
  nome: string
  cor: string
  criado_em: string
}

export const STATUS_COR: Record<StatusCompromisso, { bg: string; text: string }> = {
  'Agendado':  { bg: '#dbeafe', text: '#1d4ed8' },
  'Concluído': { bg: '#dcfce7', text: '#15803d' },
  'Cancelado': { bg: '#fee2e2', text: '#b91c1c' },
}

export interface Compromisso {
  id: string
  titulo: string
  data_hora: string
  tipo: string
  status: StatusCompromisso
  observacoes: string | null
  criado_em: string
}

export type CompromissoInsert = Omit<Compromisso, 'id' | 'criado_em'>
