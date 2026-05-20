'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onClose: () => void
  onSalvo: () => void
  operadoras: string[]
  vendedores: string[]
}

interface ClienteSugestao {
  id: string
  nome: string
  operadora: string | null
  valor_plano: number | null
  vendedor: string | null
}

export default function RegistrarVendaModal({ onClose, onSalvo, operadoras, vendedores }: Props) {
  const supabase = createClient()

  // Form state
  const [clienteNome, setClienteNome] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [operadora, setOperadora] = useState('')
  const [valorPlano, setValorPlano] = useState('')
  const [vendedor, setVendedor] = useState('')
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0])

  // Client search state
  const [sugestoes, setSugestoes] = useState<ClienteSugestao[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Save state
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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
    if (c.valor_plano) setValorPlano(String(c.valor_plano))
    if (c.vendedor) setVendedor(c.vendedor)
    setSugestoes([])
    setDropdownAberto(false)
  }

  async function handleSalvar() {
    setErro(null)

    // Validation
    if (!clienteNome.trim()) { setErro('Informe o nome do cliente.'); return }
    if (!operadora) { setErro('Selecione a operadora.'); return }
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
          valor_plano: Number(valorPlano),
          vendedor,
          data_venda: dataVenda,
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
        .select('id, percentual_total, num_parcelas, percentual_vitalicio')
        .eq('operadora', operadora)
        .eq('ativo', true)
        .maybeSingle()

      if (regra) {
        // 3. Load parcelas_regra
        const { data: parcelas } = await supabase
          .from('parcelas_regra')
          .select('numero_parcela, percentual_empresa, percentual_vendedor')
          .eq('regra_id', regra.id)
          .order('numero_parcela')

        const parcelasArr = parcelas ?? []

        const comissoesParaInserir: {
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
        }[] = []

        // Generate parcela commissions
        for (let i = 1; i <= regra.num_parcelas; i++) {
          const parcelaRegra = parcelasArr.find(p => p.numero_parcela === i)
          const pctEmpresa = parcelaRegra?.percentual_empresa ?? 50
          const pctVendedor = parcelaRegra?.percentual_vendedor ?? 50
          const valorBruto = valorNum * (regra.percentual_total / 100) / regra.num_parcelas

          // data_prevista = data_venda + (i - 1) months (first parcel on sale date)
          const dataPrev = new Date(dataVenda)
          dataPrev.setMonth(dataPrev.getMonth() + (i - 1))

          comissoesParaInserir.push({
            venda_id: vendaId,
            tipo: 'parcela',
            numero_parcela: i,
            valor_bruto: valorBruto,
            valor_empresa: valorBruto * (pctEmpresa / 100),
            valor_vendedor: valorBruto * (pctVendedor / 100),
            status_empresa: 'Pendente',
            status_vendedor: 'Pendente',
            data_prevista: dataPrev.toISOString().split('T')[0],
            data_recebida_empresa: null,
            data_recebida_vendedor: null,
          })
        }

        // Generate vitalício commission
        const valorBrutoVitalicio = valorNum * (regra.percentual_vitalicio / 100)
        const ultimaParcela = parcelasArr[parcelasArr.length - 1]
        const pctEmpresaVit = ultimaParcela?.percentual_empresa ?? 50
        const pctVendedorVit = ultimaParcela?.percentual_vendedor ?? 50

        // vitalício starts after last parcela
        const dataVit = new Date(dataVenda)
        dataVit.setMonth(dataVit.getMonth() + regra.num_parcelas)

        comissoesParaInserir.push({
          venda_id: vendaId,
          tipo: 'vitalicio',
          numero_parcela: null,
          valor_bruto: valorBrutoVitalicio,
          valor_empresa: valorBrutoVitalicio * (pctEmpresaVit / 100),
          valor_vendedor: valorBrutoVitalicio * (pctVendedorVit / 100),
          status_empresa: 'Pendente',
          status_vendedor: 'Pendente',
          data_prevista: dataVit.toISOString().split('T')[0],
          data_recebida_empresa: null,
          data_recebida_vendedor: null,
        })

        // Insert all commissions
        const { error: comErr } = await supabase
          .from('comissoes')
          .insert(comissoesParaInserir)

        if (comErr) {
          // Don't fail the whole operation — venda was saved, just warn
          console.error('Erro ao inserir comissões:', comErr.message)
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
              onChange={e => setOperadora(e.target.value)}
              className={inputCls}
              style={{ ...inputStyle, color: operadora ? '#1a1a1a' : '#9a918a' }}
            >
              <option value="">Selecione a operadora</option>
              {operadoras.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

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
