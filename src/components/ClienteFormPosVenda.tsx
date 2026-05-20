'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cliente, ClienteInsert, TIPOS_PLANO, STATUS_CLIENTE } from '@/lib/types'
import { useOperadoras } from '@/lib/useOperadoras'

interface Props {
  cliente?: Cliente
}

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }
const sectionTitleCls = 'text-sm font-bold mb-4 pb-2 border-b'
const sectionTitleStyle = { color: '#2d1f4e', borderColor: '#e8e4dd' }

export default function ClienteFormPosVenda({ cliente }: Props) {
  // Dados Pessoais
  const [nome, setNome]                   = useState(cliente?.nome ?? '')
  const [cpf, setCpf]                     = useState(cliente?.cpf ?? '')
  const [dataNascimento, setDataNasc]     = useState(cliente?.data_nascimento ?? '')
  const [contato, setContato]             = useState(cliente?.contato ?? '')
  const [email, setEmail]                 = useState(cliente?.email ?? '')
  const [endereco, setEndereco]           = useState(cliente?.endereco ?? '')
  // Dados do Plano
  const [operadora, setOperadora]         = useState(cliente?.operadora ?? '')
  const [administradora, setAdministradora] = useState(cliente?.administradora ?? '')
  const [tipo_plano, setTipoPlano]        = useState(cliente?.tipo_plano ?? '')
  const [qtdVidas, setQtdVidas]           = useState(cliente?.quantidade_vidas?.toString() ?? '')
  const [valor_plano, setValorPlano]      = useState(cliente?.valor_plano?.toString() ?? '')
  const [numeroContrato, setNumContrato]  = useState(cliente?.numero_contrato ?? '')
  const [dataVenda, setDataVenda]         = useState(cliente?.data_venda ?? '')
  const [dataImplantacao, setDataImpl]    = useState(cliente?.data_implantacao ?? '')
  const [status, setStatus]              = useState<'Ativo' | 'Inativo' | 'Cancelado'>(cliente?.status ?? 'Ativo')
  // Dados do Plano — campos novos
  const [dataInicioPlano, setDataInicioPlano]         = useState(cliente?.data_inicio_plano ?? '')
  const [dataVencimentoPlano, setDataVencimentoPlano] = useState(cliente?.data_vencimento_plano ?? '')
  const [coparticipacao, setCoparticipacao]           = useState(cliente?.coparticipacao ?? false)
  const [tipoAcomodacao, setTipoAcomodacao]           = useState(cliente?.tipo_acomodacao ?? '')
  const [abrangencia, setAbrangencia]                 = useState(cliente?.abrangencia ?? '')
  const [carencia, setCarencia]                       = useState(cliente?.carencia ?? false)
  // Dados Comerciais
  const [vendedor, setVendedor]           = useState(cliente?.vendedor ?? '')
  const [comissao, setComissao]           = useState(cliente?.comissao?.toString() ?? '')
  const [observacoes, setObservacoes]     = useState(cliente?.observacoes ?? '')
  // Dados Comerciais — campos novos
  const [formaPagamento, setFormaPagamento]                         = useState(cliente?.forma_pagamento ?? '')
  const [diaVencimentoBoleto, setDiaVencimentoBoleto]               = useState(cliente?.dia_vencimento_boleto?.toString() ?? '')
  const [corretoraResponsavel, setCorretoraResponsavel]             = useState(cliente?.corretora_responsavel ?? '')
  const [percentualComissaoCorretora, setPercentualComissaoCorretora] = useState(cliente?.percentual_comissao_corretora?.toString() ?? '')
  const [percentualComissaoVendedor, setPercentualComissaoVendedor]   = useState(cliente?.percentual_comissao_vendedor?.toString() ?? '')
  const [temVitalicio, setTemVitalicio]                             = useState(cliente?.tem_vitalicio ?? false)
  const [percentualVitalicio, setPercentualVitalicio]               = useState(cliente?.percentual_vitalicio?.toString() ?? '')

  const operadorasLista = useOperadoras()
  const [vendedoresLista, setVendedoresLista] = useState<string[]>([])
  const [erro, setErro]   = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const editando = !!cliente

  useEffect(() => {
    supabase
      .from('vendedores')
      .select('nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        if (data) setVendedoresLista(data.map((v: { nome: string }) => v.nome))
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }

    setLoading(true)

    const payload: ClienteInsert = {
      nome:              nome.trim(),
      cpf:               cpf.trim() || null,
      data_nascimento:   dataNascimento || null,
      contato:           contato.trim() || null,
      email:             email.trim() || null,
      endereco:          endereco.trim() || null,
      operadora:         operadora.trim() || null,
      administradora:    administradora.trim() || null,
      tipo_plano:        tipo_plano || null,
      quantidade_vidas:  qtdVidas ? Number(qtdVidas) : null,
      valor_plano:       valor_plano ? Number(valor_plano.replace(',', '.')) : null,
      numero_contrato:   numeroContrato.trim() || null,
      data_venda:        dataVenda || null,
      data_implantacao:  dataImplantacao || null,
      status:            status as Cliente['status'],
      vendedor:          vendedor || null,
      comissao:          comissao ? Number(comissao.replace(',', '.')) : null,
      observacoes:       observacoes.trim() || null,
      lead_id:           cliente?.lead_id ?? null,
      // Dados do Plano — novos
      data_inicio_plano:       dataInicioPlano || null,
      data_vencimento_plano:   dataVencimentoPlano || null,
      coparticipacao:          coparticipacao || null,
      tipo_acomodacao:         tipoAcomodacao.trim() || null,
      abrangencia:             abrangencia.trim() || null,
      carencia:                carencia || null,
      // Dados Comerciais — novos
      forma_pagamento:                 formaPagamento.trim() || null,
      dia_vencimento_boleto:           diaVencimentoBoleto ? Number(diaVencimentoBoleto) : null,
      corretora_responsavel:           corretoraResponsavel.trim() || null,
      percentual_comissao_corretora:   percentualComissaoCorretora ? Number(percentualComissaoCorretora.replace(',', '.')) : null,
      percentual_comissao_vendedor:    percentualComissaoVendedor ? Number(percentualComissaoVendedor.replace(',', '.')) : null,
      tem_vitalicio:                   temVitalicio || null,
      percentual_vitalicio:            percentualVitalicio ? Number(percentualVitalicio.replace(',', '.')) : null,
    }

    if (editando) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)
      if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }

      if (payload.valor_plano && payload.operadora) {
        const { data: vendaExistente } = await supabase
          .from('vendas')
          .select('id')
          .eq('cliente_id', cliente.id)
          .eq('origem', 'cliente')
          .maybeSingle()
        if (vendaExistente) {
          await supabase.from('vendas').update({
            cliente_nome: payload.nome,
            operadora: payload.operadora,
            valor_plano: payload.valor_plano,
            vendedor: payload.vendedor ?? '',
            data_venda: payload.data_venda ?? new Date().toISOString().split('T')[0],
          }).eq('id', vendaExistente.id)
        } else {
          await supabase.from('vendas').insert({
            cliente_id: cliente.id,
            cliente_nome: payload.nome,
            operadora: payload.operadora,
            valor_plano: payload.valor_plano,
            vendedor: payload.vendedor ?? '',
            data_venda: payload.data_venda ?? new Date().toISOString().split('T')[0],
            status: 'Ativo',
            origem: 'cliente',
          })
        }
      }
    } else {
      const { data: novoCliente, error } = await supabase.from('clientes').insert(payload).select().single()
      if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }

      if (novoCliente && payload.valor_plano && payload.operadora) {
        await supabase.from('vendas').insert({
          cliente_id: novoCliente.id,
          cliente_nome: payload.nome,
          operadora: payload.operadora,
          valor_plano: payload.valor_plano,
          vendedor: payload.vendedor ?? '',
          data_venda: payload.data_venda ?? new Date().toISOString().split('T')[0],
          status: 'Ativo',
          origem: 'cliente',
        })
      }
    }

    setLoading(false)
    router.push('/clientes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">

      {/* ── Dados Pessoais ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h3 className={sectionTitleCls} style={sectionTitleStyle}>Dados Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2">
            <label htmlFor="cf-nome" className={labelCls} style={labelStyle}>Nome Completo <span style={{ color: '#b5455a' }}>*</span></label>
            <input id="cf-nome" type="text" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Nome completo do cliente"
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>CPF</label>
            <input type="text" value={cpf} onChange={e => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Data de Nascimento</label>
            <input type="date" value={dataNascimento} onChange={e => setDataNasc(e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label htmlFor="cf-contato" className={labelCls} style={labelStyle}>Telefone / WhatsApp</label>
            <input id="cf-contato" type="text" value={contato} onChange={e => setContato(e.target.value)}
              placeholder="(00) 00000-0000"
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label htmlFor="cf-email" className={labelCls} style={labelStyle}>E-mail</label>
            <input id="cf-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className={inputCls} style={inputStyle} />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Endereço</label>
            <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
              className={inputCls} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* ── Dados do Plano ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h3 className={sectionTitleCls} style={sectionTitleStyle}>Dados do Plano</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={labelCls} style={labelStyle}>Operadora</label>
            <select value={operadora} onChange={e => setOperadora(e.target.value)}
              className={inputCls} style={{ ...inputStyle, color: operadora ? '#1a1a1a' : '#9a918a' }}>
              <option value="">Selecione a operadora...</option>
              {operadorasLista.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Administradora</label>
            <input type="text" value={administradora} onChange={e => setAdministradora(e.target.value)}
              placeholder="Nome da administradora"
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label htmlFor="cf-tipo_plano" className={labelCls} style={labelStyle}>Tipo de Plano</label>
            <select id="cf-tipo_plano" value={tipo_plano} onChange={e => setTipoPlano(e.target.value)}
              className={inputCls} style={{ ...inputStyle, color: tipo_plano ? '#1a1a1a' : '#9a918a' }}>
              <option value="">Selecione...</option>
              {TIPOS_PLANO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Quantidade de Vidas</label>
            <input type="number" min="1" value={qtdVidas} onChange={e => setQtdVidas(e.target.value)}
              placeholder="1"
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label htmlFor="cf-valor_plano" className={labelCls} style={labelStyle}>Valor do Plano (R$)</label>
            <input id="cf-valor_plano" type="text" value={valor_plano} onChange={e => setValorPlano(e.target.value)}
              placeholder="0,00"
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Número do Contrato</label>
            <input type="text" value={numeroContrato} onChange={e => setNumContrato(e.target.value)}
              placeholder="Nº do contrato"
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Data da Venda</label>
            <input type="date" value={dataVenda} onChange={e => setDataVenda(e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Data de Implantação</label>
            <input type="date" value={dataImplantacao} onChange={e => setDataImpl(e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'Ativo' | 'Inativo' | 'Cancelado')}
              className={inputCls} style={inputStyle}>
              {STATUS_CLIENTE.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Dados Comerciais ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h3 className={sectionTitleCls} style={sectionTitleStyle}>Dados Comerciais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={labelCls} style={labelStyle}>Vendedor</label>
            <select value={vendedor} onChange={e => setVendedor(e.target.value)}
              className={inputCls} style={{ ...inputStyle, color: vendedor ? '#1a1a1a' : '#9a918a' }}>
              <option value="">Selecione o vendedor...</option>
              {vendedoresLista.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Comissão (R$)</label>
            <input type="text" value={comissao} onChange={e => setComissao(e.target.value)}
              placeholder="0,00"
              className={inputCls} style={inputStyle} />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cf-observacoes" className={labelCls} style={labelStyle}>Observações</label>
            <textarea id="cf-observacoes" value={observacoes} onChange={e => setObservacoes(e.target.value)}
              rows={3} placeholder="Informações adicionais..."
              className={`${inputCls} resize-none`} style={inputStyle} />
          </div>
        </div>
      </div>

      {erro && <p className="text-sm font-medium" style={{ color: '#b5455a' }}>{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          {loading ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Cliente'}
        </button>
        <button type="button" onClick={() => router.push('/clientes')}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
          style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
