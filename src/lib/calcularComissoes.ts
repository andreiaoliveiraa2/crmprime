export interface ComissaoParaInserir {
  venda_id: string
  tipo: 'parcela' | 'vitalicio'
  numero_parcela: number | null
  valor_bruto: number
  valor_empresa: number
  valor_vendedor: number
  status_empresa: 'Pendente'
  status_vendedor: 'Pendente'
  data_prevista: string
  data_recebida_empresa: null
  data_recebida_vendedor: null
}

interface Params {
  vendaId: string
  valorPlano: number
  dataVenda: string
  operadora: string
  percentualCorretora: number | null
  percentualVendedor: number | null
  temVitalicio: boolean | null
  percentualVitalicio: number | null
}

interface Resultado {
  parcelas: ComissaoParaInserir[]
  vitalicios: ComissaoParaInserir[]
}

function addMonth(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + n)
  return d.toISOString().split('T')[0]
}

export function calcularComissoes(params: Params): Resultado | null {
  const {
    vendaId, valorPlano, dataVenda,
    percentualCorretora, percentualVendedor,
    temVitalicio, percentualVitalicio,
  } = params

  const pctCorretora = percentualCorretora ?? 0
  const pctVendedor = percentualVendedor ?? 0
  const temPercentuais = pctCorretora > 0 || pctVendedor > 0
  const temVit = temVitalicio === true && percentualVitalicio != null && percentualVitalicio > 0

  if (!temPercentuais && !temVit) return null

  const parcelas: ComissaoParaInserir[] = []
  const vitalicios: ComissaoParaInserir[] = []

  if (temPercentuais) {
    const valorEmpresa = valorPlano * (pctCorretora / 100)
    const valorVendedor = valorPlano * (pctVendedor / 100)
    parcelas.push({
      venda_id: vendaId,
      tipo: 'parcela',
      numero_parcela: 1,
      valor_bruto: valorEmpresa + valorVendedor,
      valor_empresa: valorEmpresa,
      valor_vendedor: valorVendedor,
      status_empresa: 'Pendente',
      status_vendedor: 'Pendente',
      data_prevista: dataVenda,
      data_recebida_empresa: null,
      data_recebida_vendedor: null,
    })
  }

  if (temVit) {
    const valorBruto = valorPlano * (percentualVitalicio! / 100)
    const totalSplit = pctCorretora + pctVendedor
    const valorEmpresa = totalSplit > 0 ? valorBruto * (pctCorretora / totalSplit) : valorBruto
    const valorVendedor = totalSplit > 0 ? valorBruto * (pctVendedor / totalSplit) : 0
    vitalicios.push({
      venda_id: vendaId,
      tipo: 'vitalicio',
      numero_parcela: null,
      valor_bruto: valorBruto,
      valor_empresa: valorEmpresa,
      valor_vendedor: valorVendedor,
      status_empresa: 'Pendente',
      status_vendedor: 'Pendente',
      data_prevista: addMonth(dataVenda, 1),
      data_recebida_empresa: null,
      data_recebida_vendedor: null,
    })
  }

  return { parcelas, vitalicios }
}
