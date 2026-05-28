'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOperadoras } from '@/lib/useOperadoras'

interface Props {
  onClose: () => void
  onSalvo: () => void
  vendedores: string[]
}

interface ClienteSugestao {
  id: string
  nome: string
  operadora: string | null
  valor_plano: number | null
  vendedor: string | null
}

interface CnpjOpcao { id: string; nome: string }

export default function RegistrarVendaModal({ onClose, onSalvo, vendedores }: Props) {
  const supabase = createClient()
  const operadoras = useOperadoras()

  // Form state
  const [clienteNome, setClienteNome] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [operadora, setOperadora] = useState('')
  const [valorPlano, setValorPlano] = useState('')
  const [vendedor, setVendedor] = useState('')
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0])
  const [dataVencimento, setDataVencimento] = useState('')

  // Client search state
  const [sugestoes, setSugestoes] = useState<ClienteSugestao[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Save state
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // CNPJ de recebimento state
  const latestOperadoraRef = useRef('')

  const [cnpjRecebimentoId, setCnpjRecebimentoId]     = useState('')
  const [cnpjRecebimentoNome, setCnpjRecebimentoNome] = useState('')
  const [cnpjsParaOperadora, setCnpjsParaOperadora]   = useState<CnpjOpcao[]>([])
  const [carregandoCnpjs, setCarregandoCnpjs]         = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search clients on name change
  async function handleClienteChange(value: string) {
    setClienteNome(value)
    setClienteId(null)
    if (value.length >= 2) {
      setBuscandoCliente(true)
      const { data } = await supabase
        .from('clientes')
        .select('id, nome, operadora, valor_plano, vendedor')
        .ilike('nome', `%${value}%`)
        .limit(8)
      setSugestoes(data ?? [])
      setDropdownAberto(true)
      setBuscandoCliente(false)
    } else {
      setSugestoes([])
      setDropdownAberto(false)
    }
  }

  function selecionarCliente(c: ClienteSugestao) {
    setClienteNome(c.nome)
    setClienteId(c.id)
    if (c.operadora) setOperadora(c.operadora)
    if (c.operadora) carregarCnpjs(c.operadora)
    if (c.valor_plano) setValorPlano(String(c.valor_plano))
    if (c.vendedor) setVendedor(c.vendedor)
    setSugestoes([])
    setDropdownAberto(false)
  }

  async function carregarCnpjs(op: string) {
    latestOperadoraRef.current = op
    setCarregandoCnpjs(true)
    setCnpjRecebimentoId('')
    setCnpjRecebimentoNome('')
    setCnpjsParaOperadora([])

    const { data: regras } = await supabase
      .from('regras_comissao')
      .select('cnpj_recebimento_id')
      .eq('operadora', op)
      .eq('ativo', true)
      .not('cnpj_recebimento_id', 'is', null)

    const cnpjIds = [...new Set((regras ?? []).map((r: { cnpj_recebimento_id: string }) => r.cnpj_recebimento_id).filter(Boolean))]

    if (cnpjIds.length === 0) {
      if (latestOperadoraRef.current === op) setCarregandoCnpjs(false)
      return
    }

    const { data: cnpjs } = await supabase
      .from('cnpjs_recebimento')
      .select('id, nome')
      .in('id', cnpjIds)
      .eq('status', 'Ativo')
      .order('nome')

    // Bail if newer operadora selected during this fetch
    if (latestOperadoraRef.current !== op) {
      setCarregandoCnpjs(false)
      return
    }

    const lista = (cnpjs ?? []) as CnpjOpcao[]
    setCnpjsParaOperadora(lista)

    if (lista.length === 1) {
      setCnpjRecebimentoId(lista[0].id)
      setCnpjRecebimentoNome(lista[0].nome)
    }

    setCarregandoCnpjs(false)
  }

  async function handleSalvar() {
    setErro(null)

    // Validation
    if (!clienteNome.trim()) { setErro('Informe o nome do cliente.'); return }
    if (!operadora) { setErro('Selecione a operadora.'); return }
    if (!cnpjRecebimentoId) { setErro('Selecione o CNPJ de recebimento.'); return }
    if (!valorPlano || isNaN(Number(valorPlano)) || Number(valorPlano) <= 0) { setErro('Informe um valor de plano válido.'); return }
    if (!vendedor) { setErro('Selecione o vendedor.'); return }
    if (!dataVenda) { setErro('Informe a data da venda.'); return }

    setSalvando(true)

    try {
      // 1. Insert venda
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: clienteId,
          cliente_nome: clienteNome.trim(),
          operadora,
          empresa: cnpjRecebimentoNome,
          cnpj_recebimento_id: cnpjRecebimentoId,
          valor_plano: Number(valorPlano),
          vendedor,
          data_venda: dataVenda,
          data_vencimento: dataVencimento || null,
          status: 'Ativo',
          origem: 'manual',
        })
        .select()
        .single()

      if (vendaError || !vendaData) {
        setErro('Erro ao salvar venda: ' + (vendaError?.message ?? 'Tente novamente.'))
        setSalvando(false)
        return
      }

      const vendaId = vendaData.id
      const valorNum = Number(valorPlano)

      // 2. Check for commission rule
      const { data: regra } = await supabase
        .from('regras_comissao')
        .select('id, percentual_total, num_parcelas, percentual_vitalicio, desconta_imposto, percentual_imposto, adesao_direta')
        .eq('operadora', operadora)
        .eq('cnpj_recebimento_id', cnpjRecebimentoId)
        .eq('ativo', true)
        .maybeSingle()

      if (regra) {
        // Split empresa/vendedor por parcela
        const { data: parcelas } = await supabase
          .from('parcelas_regra')
          .select('numero_parcela, percentual_empresa, percentual_vendedor')
          .eq('regra_id', regra.id)
          .order('numero_parcela')
        const parcelasArr = parcelas ?? []

        if (parcelasArr.length === 0) {
          setErro(`A operadora "${operadora}" não tem distribuição de parcelas configurada. Abra a operadora em Gestão → Operadoras e salve novamente.`)
          setSalvando(false)
          return
        }

        const comissoesParaInserir: {
          venda_id: string
          tipo: 'parcela' | 'vitalicio'
          numero_parcela: number | null
          valor_bruto: number
          valor_empresa: number
          valor_vendedor: number
          status_empresa: 'Pendente' | 'Direto'
          status_vendedor: 'Pendente'
          data_prevista: string
          data_recebida_empresa: null
          data_recebida_vendedor: null
          empresa: string
        }[] = []

        function quintoDialUtilMesSeguinte(dataBase: string): string {
          const [y, m] = dataBase.split('-').map(Number)
          const nextYear = m === 12 ? y + 1 : y
          const nextMonth = m === 12 ? 1 : m + 1
          let diasUteis = 0
          let dia = 1
          while (diasUteis < 5) {
            const dow = new Date(nextYear, nextMonth - 1, dia).getDay()
            if (dow !== 0 && dow !== 6) diasUteis++
            if (diasUteis < 5) dia++
          }
          return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
        }

        const baseDate = dataVencimento || dataVenda

        // Gerar parcelas
        for (let i = 1; i <= regra.num_parcelas; i++) {
          const valorBruto = valorNum * (regra.percentual_total / 100) / regra.num_parcelas
          const parcelaRegra = parcelasArr.find(p => p.numero_parcela === i)
          const pctVendedor = parcelaRegra?.percentual_vendedor ?? 50

          let valorEmpresa: number
          let statusEmpresa: 'Pendente' | 'Direto'
          let dataPrevista: string

          if (regra.adesao_direta && i === 1) {
            valorEmpresa = 0
            statusEmpresa = 'Direto'
            dataPrevista = baseDate
          } else if (regra.adesao_direta) {
            valorEmpresa = valorBruto * (1 - pctVendedor / 100)
            statusEmpresa = 'Pendente'
            const [y, m] = baseDate.split('-').map(Number)
            const mesParc = new Date(y, m - 1 + (i - 1), 1)
            const mesStr = `${mesParc.getFullYear()}-${String(mesParc.getMonth() + 1).padStart(2, '0')}-01`
            dataPrevista = quintoDialUtilMesSeguinte(mesStr)
          } else {
            const pctEmpresa = parcelaRegra?.percentual_empresa ?? 50
            valorEmpresa = valorBruto * (pctEmpresa / 100)
            statusEmpresa = 'Pendente'
            const dataPrev = new Date(baseDate)
            dataPrev.setMonth(dataPrev.getMonth() + (i - 1))
            dataPrevista = dataPrev.toISOString().split('T')[0]
          }

          // Adesão direta P1: operadora paga 100% ao vendedor, nada passa pela corretora
          let valorVendedorParcela = (regra.adesao_direta && i === 1)
            ? valorBruto
            : valorBruto * (pctVendedor / 100)
          if (regra.desconta_imposto && regra.percentual_imposto > 0 && valorVendedorParcela > 0) {
            valorVendedorParcela = valorVendedorParcela * (1 - regra.percentual_imposto / 100)
          }

          comissoesParaInserir.push({
            venda_id: vendaId,
            tipo: 'parcela',
            numero_parcela: i,
            valor_bruto: valorBruto,
            valor_empresa: valorEmpresa,
            valor_vendedor: valorVendedorParcela,
            status_empresa: statusEmpresa,
            status_vendedor: 'Pendente',
            data_prevista: dataPrevista,
            data_recebida_empresa: null,
            data_recebida_vendedor: null,
            empresa: cnpjRecebimentoNome,
          })
        }

        // Vitalício é sempre da corretora (não do vendedor)
        if (regra.percentual_vitalicio > 0) {
          const valorBrutoVitalicio = valorNum * (regra.percentual_vitalicio / 100)
          let dataPrevistaVit: string
          if (regra.adesao_direta) {
            const [y, m] = baseDate.split('-').map(Number)
            const mesVit = new Date(y, m - 1 + regra.num_parcelas, 1)
            const mesStr = `${mesVit.getFullYear()}-${String(mesVit.getMonth() + 1).padStart(2, '0')}-01`
            dataPrevistaVit = quintoDialUtilMesSeguinte(mesStr)
          } else {
            const [bY, bM, bD] = baseDate.split('-').map(Number)
            const totalM = (bM - 1) + regra.num_parcelas
            const tY = bY + Math.floor(totalM / 12)
            const tM = ((totalM % 12) + 12) % 12
            const lastD = new Date(tY, tM + 1, 0).getDate()
            dataPrevistaVit = `${tY}-${String(tM + 1).padStart(2, '0')}-${String(Math.min(bD, lastD)).padStart(2, '0')}`
          }

          comissoesParaInserir.push({
            venda_id: vendaId,
            tipo: 'vitalicio',
            numero_parcela: null,
            valor_bruto: valorBrutoVitalicio,
            valor_empresa: valorBrutoVitalicio,
            valor_vendedor: 0,
            status_empresa: 'Pendente',
            status_vendedor: 'Pendente',
            data_prevista: dataPrevistaVit,
            data_recebida_empresa: null,
            data_recebida_vendedor: null,
            empresa: cnpjRecebimentoNome,
          })
        }

        // Insert all commissions
        const { error: comErr } = await supabase
          .from('comissoes')
          .insert(comissoesParaInserir)

        if (comErr) {
          console.error('Erro ao inserir comissões:', comErr.message)
          setErro('Venda salva, mas erro ao registrar comissões: ' + comErr.message)
          setSalvando(false)
          return
        }
      }

      onSalvo()
    } catch (e) {
      setErro('Erro inesperado. Tente novamente.')
      console.error(e)
    } finally {
      setSalvando(false)
    }
  }

  const inputCls = 'w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2'
  const inputStyle = { borderColor: '#e8e4dd' }
  const labelCls = 'block text-sm font-medium mb-1.5'
  const labelStyle = { color: '#5a4e3c' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e8e4dd' }}>
          <h2 className="text-lg font-bold" style={{ color: '#2d1f4e' }}>Registrar Venda</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: '#9a918a' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Cliente */}
          <div>
            <label className={labelCls} style={labelStyle}>Cliente</label>
            <div className="relative" ref={dropdownRef}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9a918a' }} />
              <input
                type="text"
                placeholder="Nome do cliente..."
                value={clienteNome}
                onChange={e => handleClienteChange(e.target.value)}
                className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2"
                style={inputStyle}
                autoComplete="off"
              />
              {buscandoCliente && (
                <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Buscando...</p>
              )}
              {dropdownAberto && sugestoes.length > 0 && (
                <div
                  className="absolute z-10 left-0 right-0 bg-white border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto"
                  style={{ borderColor: '#e8e4dd' }}
                >
                  {sugestoes.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                      style={{ color: '#2d1f4e' }}
                      onClick={() => selecionarCliente(c)}
                    >
                      {c.nome}
                    </button>
                  ))}
                </div>
              )}
              {dropdownAberto && clienteNome.length >= 2 && sugestoes.length === 0 && !buscandoCliente && (
                <div
                  className="absolute z-10 left-0 right-0 bg-white border rounded-xl shadow-lg mt-1 px-4 py-2.5"
                  style={{ borderColor: '#e8e4dd' }}
                >
                  <p className="text-sm" style={{ color: '#9a918a' }}>Nenhum cliente encontrado. Será salvo como texto livre.</p>
                </div>
              )}
            </div>
            {clienteId && (
              <p className="text-xs mt-1" style={{ color: '#15803d' }}>Cliente vinculado ao cadastro.</p>
            )}
          </div>

          {/* Operadora */}
          <div>
            <label className={labelCls} style={labelStyle}>Operadora <span style={{ color: '#b91c1c' }}>*</span></label>
            <select
              value={operadora}
              onChange={e => {
                setOperadora(e.target.value)
                if (e.target.value) carregarCnpjs(e.target.value)
                else { setCnpjsParaOperadora([]); setCnpjRecebimentoId(''); setCnpjRecebimentoNome('') }
              }}
              className={inputCls}
              style={{ ...inputStyle, color: operadora ? '#1a1a1a' : '#9a918a' }}
            >
              <option value="">Selecione a operadora</option>
              {operadoras.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* CNPJ de Recebimento */}
          {operadora && (
            <div>
              <label className={labelCls} style={labelStyle}>CNPJ de Recebimento <span style={{ color: '#b91c1c' }}>*</span></label>
              {carregandoCnpjs ? (
                <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Carregando...</p>
              ) : cnpjsParaOperadora.length === 0 ? (
                <div className="rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                  Esta operadora não tem regras cadastradas. Configure em Gestão → Operadoras.
                </div>
              ) : (
                <select
                  value={cnpjRecebimentoId}
                  onChange={e => {
                    setCnpjRecebimentoId(e.target.value)
                    setCnpjRecebimentoNome(cnpjsParaOperadora.find(c => c.id === e.target.value)?.nome ?? '')
                  }}
                  className={inputCls}
                  style={{ ...inputStyle, color: cnpjRecebimentoId ? '#1a1a1a' : '#9a918a' }}
                >
                  <option value="">Selecione o CNPJ de recebimento</option>
                  {cnpjsParaOperadora.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Valor do Plano */}
          <div>
            <label className={labelCls} style={labelStyle}>Valor do Plano (R$) <span style={{ color: '#b91c1c' }}>*</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valorPlano}
              onChange={e => setValorPlano(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Vendedor */}
          <div>
            <label className={labelCls} style={labelStyle}>Vendedor <span style={{ color: '#b91c1c' }}>*</span></label>
            <select
              value={vendedor}
              onChange={e => setVendedor(e.target.value)}
              className={inputCls}
              style={{ ...inputStyle, color: vendedor ? '#1a1a1a' : '#9a918a' }}
            >
              <option value="">Selecione o vendedor</option>
              {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Data da Venda */}
          <div>
            <label className={labelCls} style={labelStyle}>Data da Venda <span style={{ color: '#b91c1c' }}>*</span></label>
            <input
              type="date"
              value={dataVenda}
              onChange={e => setDataVenda(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Vencimento do Boleto */}
          <div>
            <label className={labelCls} style={labelStyle}>Vencimento do Boleto</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={e => setDataVencimento(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {erro && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
              {erro}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#e8e4dd' }}>
          <button
            onClick={onClose}
            disabled={salvando}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
          >
            {salvando ? 'Salvando...' : 'Salvar Venda'}
          </button>
        </div>
      </div>
    </div>
  )
}
