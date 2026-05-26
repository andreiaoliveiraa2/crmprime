'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cliente, ClienteInsert, Lead, TIPOS_PLANO, STATUS_CLIENTE } from '@/lib/types'
import { useOperadoras } from '@/lib/useOperadoras'
import DocumentosCliente from './DocumentosCliente'

interface Props {
  cliente?: Cliente
  vendedorAtual?: { id: string; nome: string } | null
  leadPrefill?: Lead | null
}

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }
const sectionTitleCls = 'text-sm font-bold mb-4 pb-2 border-b'
const sectionTitleStyle = { color: '#2d1f4e', borderColor: '#e8e4dd' }

export default function ClienteFormPosVenda({ cliente, vendedorAtual, leadPrefill }: Props) {
  // Dados Pessoais
  const [nome, setNome]                   = useState(cliente?.nome ?? leadPrefill?.nome ?? '')
  const [cpf, setCpf]                     = useState(cliente?.cpf ?? '')
  const [dataNascimento, setDataNasc]     = useState(cliente?.data_nascimento ?? '')
  const [contato, setContato]             = useState(cliente?.contato ?? leadPrefill?.telefone ?? '')
  const [email, setEmail]                 = useState(cliente?.email ?? '')
  const [endereco, setEndereco]           = useState(cliente?.endereco ?? '')
  // Dados do Plano
  const [operadora, setOperadora]         = useState(cliente?.operadora ?? leadPrefill?.operadora ?? '')
  const [administradora, setAdministradora] = useState(cliente?.administradora ?? '')
  const [tipo_plano, setTipoPlano]        = useState(cliente?.tipo_plano ?? leadPrefill?.tipo_plano ?? '')
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
  const [vendedor, setVendedor]                     = useState(cliente?.vendedor ?? vendedorAtual?.nome ?? leadPrefill?.vendedor ?? '')
  const [corretoraResponsavel, setCorretoraResponsavel] = useState(cliente?.corretora_responsavel ?? '')
  const [observacoes, setObservacoes]               = useState(cliente?.observacoes ?? leadPrefill?.observacoes ?? '')

  const operadorasLista = useOperadoras()
  const [vendedoresLista, setVendedoresLista] = useState<{ id: string; nome: string }[]>([])
  const [erro, setErro]   = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const editando = !!cliente

  useEffect(() => {
    setTipoAcomodacao('')
  }, [tipo_plano])

  useEffect(() => {
    supabase
      .from('vendedores')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        if (data) setVendedoresLista(data as { id: string; nome: string }[])
      })
  }, [])

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

  async function gerarComissoes(vendaId: string, dataVendaFinal: string, payloadLocal: ClienteInsert, empresa: string | null) {
    if (!payloadLocal.operadora || !payloadLocal.valor_plano) return

    const { data: regra } = await supabase
      .from('regras_comissao')
      .select('id, percentual_total, num_parcelas, percentual_vitalicio, desconta_imposto, percentual_imposto, adesao_direta')
      .eq('operadora', payloadLocal.operadora)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!regra) return

    // Buscar split empresa/pool por parcela
    const { data: parcelas } = await supabase
      .from('parcelas_regra')
      .select('numero_parcela, percentual_empresa')
      .eq('regra_id', regra.id)
      .order('numero_parcela')
    const parcelasArr = parcelas ?? []

    // Descobrir o nível do vendedor e o % de repasse total configurado
    let nivelVendedor: string | null = null
    if (payloadLocal.vendedor) {
      const { data: vd } = await supabase
        .from('vendedores')
        .select('nivel')
        .eq('nome', payloadLocal.vendedor)
        .maybeSingle()
      nivelVendedor = vd?.nivel ?? null
    }

    let totalRepasse = 0
    if (nivelVendedor && regra) {
      const { data: rp } = await supabase
        .from('repasse_grupo_vendedor')
        .select('percentual')
        .eq('regra_id', regra.id)
        .eq('nivel', nivelVendedor)
        .maybeSingle()
      totalRepasse = Number(rp?.percentual ?? 0)
    }

    const comissoes: object[] = []

    const baseDate = payloadLocal.data_vencimento_plano || dataVendaFinal

    for (let i = 1; i <= regra.num_parcelas; i++) {
      const valorBruto = payloadLocal.valor_plano * (regra.percentual_total / 100) / regra.num_parcelas
      const repasseDestaParcela = Math.max(0, Math.min(100, totalRepasse - (i - 1) * 100))

      let valorEmpresa: number
      let statusEmpresa: 'Pendente' | 'Direto'
      let dataPrevista: string

      if (regra.adesao_direta && i === 1) {
        // Adesão odonto: direto ao vendedor, não passa pela corretora
        valorEmpresa = 0
        statusEmpresa = 'Direto'
        dataPrevista = baseDate
      } else if (regra.adesao_direta) {
        // Parcelas 2+ odonto: empresa recebe o que o vendedor não pega; data = 5º dia útil do mês seguinte
        valorEmpresa = valorBruto * (1 - repasseDestaParcela / 100)
        statusEmpresa = 'Pendente'
        const [y, m] = baseDate.split('-').map(Number)
        const mesParc = new Date(y, m - 1 + (i - 1), 1)
        const mesStr = `${mesParc.getFullYear()}-${String(mesParc.getMonth() + 1).padStart(2, '0')}-01`
        dataPrevista = quintoDialUtilMesSeguinte(mesStr)
      } else {
        // Regra normal
        const parcelaRegra = parcelasArr.find(p => p.numero_parcela === i)
        const pctEmpresa = parcelaRegra?.percentual_empresa ?? 50
        valorEmpresa = valorBruto * (pctEmpresa / 100)
        statusEmpresa = 'Pendente'
        const d = new Date(baseDate)
        d.setMonth(d.getMonth() + (i - 1))
        dataPrevista = d.toISOString().split('T')[0]
      }

      let valorVendedor = valorBruto * (repasseDestaParcela / 100)
      if (regra.desconta_imposto && regra.percentual_imposto > 0 && valorVendedor > 0) {
        valorVendedor = valorVendedor * (1 - regra.percentual_imposto / 100)
      }

      comissoes.push({
        venda_id: vendaId, tipo: 'parcela', numero_parcela: i,
        valor_bruto: valorBruto,
        valor_empresa: valorEmpresa,
        valor_vendedor: valorVendedor,
        status_empresa: statusEmpresa, status_vendedor: 'Pendente',
        data_prevista: dataPrevista,
        data_recebida_empresa: null, data_recebida_vendedor: null,
        empresa,
      })
    }

    if (regra.percentual_vitalicio > 0) {
      const valorBruto      = payloadLocal.valor_plano * (regra.percentual_vitalicio / 100)
      const valorEmpresaVit = valorBruto

      let dataPrevistaVit: string
      if (regra.adesao_direta) {
        const [y, m] = baseDate.split('-').map(Number)
        const mesVit = new Date(y, m - 1 + regra.num_parcelas, 1)
        const mesStr = `${mesVit.getFullYear()}-${String(mesVit.getMonth() + 1).padStart(2, '0')}-01`
        dataPrevistaVit = quintoDialUtilMesSeguinte(mesStr)
      } else {
        const d = new Date(baseDate)
        d.setMonth(d.getMonth() + regra.num_parcelas)
        dataPrevistaVit = d.toISOString().split('T')[0]
      }
      comissoes.push({
        venda_id: vendaId, tipo: 'vitalicio', numero_parcela: null,
        valor_bruto: valorBruto,
        valor_empresa: valorEmpresaVit,
        valor_vendedor: 0,
        status_empresa: 'Pendente', status_vendedor: 'Pendente',
        data_prevista: dataPrevistaVit,
        data_recebida_empresa: null, data_recebida_vendedor: null,
        empresa,
      })
    }

    await supabase.from('comissoes').delete().eq('venda_id', vendaId)
    if (comissoes.length > 0) await supabase.from('comissoes').insert(comissoes)
  }

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
      valor_plano:       valor_plano ? Number(valor_plano.replace(/\./g, '').replace(',', '.')) : null,
      numero_contrato:   numeroContrato.trim() || null,
      data_venda:        dataVenda || null,
      data_implantacao:  dataImplantacao || null,
      status:            status as Cliente['status'],
      vendedor:          vendedor || null,
      vendedor_id:       cliente?.vendedor_id ?? vendedorAtual?.id ?? leadPrefill?.vendedor_id ?? (vendedoresLista.find(v => v.nome === vendedor)?.id ?? null),
      comissao:          null,
      observacoes:       observacoes.trim() || null,
      lead_id:           cliente?.lead_id ?? leadPrefill?.id ?? null,
      // Dados do Plano — novos
      data_inicio_plano:       dataInicioPlano || null,
      data_vencimento_plano:   dataVencimentoPlano || null,
      coparticipacao:          coparticipacao || null,
      tipo_acomodacao:         tipoAcomodacao.trim() || null,
      abrangencia:             abrangencia.trim() || null,
      carencia:                carencia || null,
      // Dados Comerciais
      forma_pagamento:               null,
      dia_vencimento_boleto:         null,
      corretora_responsavel:         corretoraResponsavel.trim() || null,
      percentual_comissao_corretora: null,
      percentual_comissao_vendedor:  null,
      tem_vitalicio:                 null,
      percentual_vitalicio:          null,
    }

    if (editando) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)
      if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }

      const empresa = corretoraResponsavel.trim() || null

      if (status === 'Cancelado') {
        await supabase
          .from('vendas')
          .update({ status: 'Cancelado' })
          .eq('cliente_id', cliente.id)
          .eq('origem', 'cliente')
      } else if (status === 'Ativo' && payload.valor_plano && payload.operadora) {
        const { data: vendaExistente } = await supabase
          .from('vendas')
          .select('id')
          .eq('cliente_id', cliente.id)
          .eq('status', 'Ativo')
          .order('criado_em', { ascending: false })
          .limit(1)
          .maybeSingle()

        let vendaId: string | null = null
        if (vendaExistente) {
          await supabase.from('vendas').update({
            cliente_nome: payload.nome,
            operadora: payload.operadora,
            valor_plano: payload.valor_plano,
            vendedor: payload.vendedor ?? '',
            data_venda: payload.data_venda ?? new Date().toISOString().split('T')[0],
            data_vencimento: payload.data_vencimento_plano ?? null,
            status: 'Ativo',
            empresa,
          }).eq('id', vendaExistente.id)
          vendaId = vendaExistente.id
        } else {
          const { data: novaVendaUpdate } = await supabase.from('vendas').insert({
            cliente_id: cliente.id,
            cliente_nome: payload.nome,
            operadora: payload.operadora,
            valor_plano: payload.valor_plano,
            vendedor: payload.vendedor ?? '',
            data_venda: payload.data_venda ?? new Date().toISOString().split('T')[0],
            data_vencimento: payload.data_vencimento_plano ?? null,
            status: 'Ativo',
            origem: 'cliente',
            empresa,
          }).select('id').single()
          vendaId = novaVendaUpdate?.id ?? null
        }
        if (vendaId) {
          const dvFinal = payload.data_venda ?? new Date().toISOString().split('T')[0]
          await gerarComissoes(vendaId, dvFinal, payload, empresa)
        }
      }
    } else {
      const { data: novoCliente, error } = await supabase.from('clientes').insert(payload).select().single()
      if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }

      const empresa = corretoraResponsavel.trim() || null

      if (novoCliente && status === 'Ativo' && payload.valor_plano && payload.operadora) {
        const { data: novaVenda, error: vendaErr } = await supabase.from('vendas').insert({
          cliente_id: novoCliente.id,
          cliente_nome: payload.nome,
          operadora: payload.operadora,
          valor_plano: payload.valor_plano,
          vendedor: payload.vendedor ?? '',
          data_venda: payload.data_venda ?? new Date().toISOString().split('T')[0],
          data_vencimento: payload.data_vencimento_plano ?? null,
          status: 'Ativo',
          origem: 'cliente',
          empresa,
        }).select('id').single()
        if (vendaErr) {
          console.error('Erro ao criar venda:', vendaErr)
          setErro(`Aviso: cliente salvo, mas erro ao registrar no Financeiro: ${vendaErr.message}`)
          setLoading(false)
          return
        }
        if (novaVenda) {
          const dvFinal = payload.data_venda ?? new Date().toISOString().split('T')[0]
          await gerarComissoes(novaVenda.id, dvFinal, payload, empresa)
        }
      }

      if (leadPrefill?.id) {
        await supabase.from('leads').delete().eq('id', leadPrefill.id)
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
            <label className={labelCls} style={labelStyle}>Vencimento do Boleto</label>
            <input type="date" value={dataVencimentoPlano} onChange={e => setDataVencimentoPlano(e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>

          {/* Tipo de Acomodação + Abrangência */}
          <div>
            <label className={labelCls} style={labelStyle}>Tipo de Acomodação</label>
            {tipo_plano === 'Odonto' ? (
              <select value={tipoAcomodacao} onChange={e => setTipoAcomodacao(e.target.value)}
                className={inputCls} style={{ ...inputStyle, color: tipoAcomodacao ? '#1a1a1a' : '#9a918a' }}>
                <option value="">Selecione...</option>
                <option value="Clínico">Clínico</option>
                <option value="Ortodôntico">Ortodôntico</option>
              </select>
            ) : (
              <select value={tipoAcomodacao} onChange={e => setTipoAcomodacao(e.target.value)}
                className={inputCls} style={{ ...inputStyle, color: tipoAcomodacao ? '#1a1a1a' : '#9a918a' }}>
                <option value="">Selecione...</option>
                <option value="Ambulatorial">Ambulatorial</option>
                <option value="Enfermaria">Enfermaria</option>
                <option value="Apartamento">Apartamento</option>
                <option value="UTI">UTI</option>
              </select>
            )}
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Abrangência</label>
            <select value={abrangencia} onChange={e => setAbrangencia(e.target.value)}
              className={inputCls} style={{ ...inputStyle, color: abrangencia ? '#1a1a1a' : '#9a918a' }}>
              <option value="">Selecione...</option>
              <option value="Municipal">Municipal</option>
              <option value="Estadual">Estadual</option>
              <option value="Nacional">Nacional</option>
            </select>
          </div>

          {/* Coparticipação + Carência (toggles Sim/Não) */}
          <div>
            <label className={labelCls} style={labelStyle}>Coparticipação</label>
            <div className="flex gap-3 mt-1">
              {([true, false] as const).map(v => (
                <button key={String(v)} type="button"
                  onClick={() => setCoparticipacao(v)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                  style={{
                    borderColor: coparticipacao === v ? '#2d1f4e' : '#e8e4dd',
                    backgroundColor: coparticipacao === v ? '#2d1f4e' : '#ffffff',
                    color: coparticipacao === v ? '#ffffff' : '#5a4e3c',
                  }}>
                  {v ? 'Sim' : 'Não'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Carência</label>
            <div className="flex gap-3 mt-1">
              {([true, false] as const).map(v => (
                <button key={String(v)} type="button"
                  onClick={() => setCarencia(v)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                  style={{
                    borderColor: carencia === v ? '#2d1f4e' : '#e8e4dd',
                    backgroundColor: carencia === v ? '#2d1f4e' : '#ffffff',
                    color: carencia === v ? '#ffffff' : '#5a4e3c',
                  }}>
                  {v ? 'Sim' : 'Não'}
                </button>
              ))}
            </div>
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
            <select
              value={vendedor}
              onChange={e => setVendedor(e.target.value)}
              className={inputCls}
              style={{ ...inputStyle, color: vendedor ? '#1a1a1a' : '#9a918a' }}
              disabled={!!vendedorAtual && !editando}
            >
              <option value="">Selecione o vendedor...</option>
              {vendedorAtual && !editando
                ? <option value={vendedorAtual.nome}>{vendedorAtual.nome}</option>
                : vendedoresLista.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)
              }
            </select>
          </div>

          {/* Corretora Responsável */}
          <div>
            <label className={labelCls} style={labelStyle}>Corretora Responsável</label>
            <select value={corretoraResponsavel} onChange={e => setCorretoraResponsavel(e.target.value)}
              className={inputCls} style={{ ...inputStyle, color: corretoraResponsavel ? '#1a1a1a' : '#9a918a' }}>
              <option value="">Selecione...</option>
              <option value="A2 Prime">A2 Prime</option>
              <option value="A2 Corretora">A2 Corretora</option>
              <option value="MEI Alessandro">MEI Alessandro</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cf-observacoes" className={labelCls} style={labelStyle}>Observações</label>
            <textarea id="cf-observacoes" value={observacoes} onChange={e => setObservacoes(e.target.value)}
              rows={3} placeholder="Informações adicionais..."
              className={`${inputCls} resize-none`} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* ── Documentos (somente ao editar) ── */}
      {editando && cliente?.id && (
        <DocumentosCliente clienteId={cliente.id} />
      )}

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
