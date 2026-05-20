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
  // Dados do Plano — novos
  data_inicio_plano: string | null
  data_vencimento_plano: string | null
  coparticipacao: boolean | null
  tipo_acomodacao: string | null
  abrangencia: string | null
  carencia: boolean | null
  // Dados Comerciais — novos
  forma_pagamento: string | null
  dia_vencimento_boleto: number | null
  corretora_responsavel: string | null
  percentual_comissao_corretora: number | null
  percentual_comissao_vendedor: number | null
  tem_vitalicio: boolean | null
  percentual_vitalicio: number | null
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

// Financeiro Module Types
export interface Venda {
  id: string
  cliente_id: string | null
  cliente_nome: string
  operadora: string
  valor_plano: number
  vendedor: string
  data_venda: string
  status: 'Ativo' | 'Cancelado'
  origem: 'cliente' | 'manual'
  criado_em: string
}
export type VendaInsert = Omit<Venda, 'id' | 'criado_em'>

export interface RegraComissao {
  id: string
  operadora: string
  percentual_total: number
  num_parcelas: number
  percentual_vitalicio: number
  ativo: boolean
  criado_em: string
}
export type RegraComissaoInsert = Omit<RegraComissao, 'id' | 'criado_em'>

export interface ParcelaRegra {
  id: string
  regra_id: string
  numero_parcela: number
  percentual_empresa: number
  percentual_vendedor: number
}
export type ParcelaRegraInsert = Omit<ParcelaRegra, 'id'>

export interface Comissao {
  id: string
  venda_id: string
  tipo: 'parcela' | 'vitalicio'
  numero_parcela: number | null
  valor_bruto: number
  valor_empresa: number
  valor_vendedor: number
  status_empresa: 'Pendente' | 'Recebido'
  status_vendedor: 'Pendente' | 'Recebido'
  data_prevista: string
  data_recebida_empresa: string | null
  data_recebida_vendedor: string | null
  criado_em: string
}

export interface Conta {
  id: string
  tipo: 'receber' | 'pagar'
  descricao: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Recebido' | 'Pago'
  observacoes: string | null
  criado_em: string
}
export type ContaInsert = Omit<Conta, 'id' | 'criado_em'>

export interface MapeamentoImportacao {
  id: string
  operadora: string
  mapeamento: Record<string, string>
  atualizado_em: string
}

export interface ImportacaoComissao {
  id: string
  operadora: string
  nome_arquivo: string
  total_registros: number
  total_valor: number
  erros_count: number
  erros_detalhe: unknown[]
  criado_em: string
}

export interface DocumentoCliente {
  id: string
  cliente_id: string
  tipo: 'Contrato' | 'Proposta' | 'RG' | 'CNH' | 'Outro'
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number | null
  criado_em: string
}
