'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ArrowLeft, Trash2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOperadoras } from '@/lib/useOperadoras'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ClienteImportado {
  nome: string
  cpf: string | null
  numero_contrato: string | null
  proposta: string | null
  tipo_plano: string | null
  valor_plano: number | null
  vitalicio_valor_estimado: number | null
  data_inicio_plano: string | null
  operadora: string
  _key: string
  _erro?: string
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseBRL(val: string): number | null {
  if (!val || val.trim() === '') return null
  const num = parseFloat(val.replace(/\./g, '').replace(',', '.').trim())
  return isNaN(num) ? null : num
}

function extrairNomeCpf(segurado: string): { nome: string; cpf: string | null } {
  const parts = segurado.trim().split(/\s+/)
  const ultimo = parts[parts.length - 1]
  // CPF: 11 dígitos numéricos (às vezes vem colado no final do nome)
  if (/^\d{11}$/.test(ultimo) && ultimo !== '00000000000') {
    return { nome: parts.slice(0, -1).join(' '), cpf: ultimo }
  }
  return { nome: segurado.trim(), cpf: null }
}

function parseRelatorio(texto: string, operadora: string): ClienteImportado[] {
  const linhas = texto.trim().split('\n').filter(l => l.trim())
  if (linhas.length < 2) return []

  const headers = linhas[0].split('\t').map(h => h.trim().toLowerCase())

  const idx = (nome: string) => headers.indexOf(nome)
  const iSegurado   = idx('segurado')
  const iContrato   = idx('contrato')
  const iProposta   = idx('proposta')
  const iPremio     = idx('valorpremiototal')
  const iRemun      = idx('valorremuneracao')
  const iProduto    = idx('produto')
  const iDataIni    = idx('datainivigrencia') !== -1 ? idx('datainivigrencia') : idx('datainivigencia')

  if (iSegurado === -1) return []

  const vistos = new Set<string>()

  return linhas.slice(1).map((linha, i) => {
    const cols = linha.split('\t')
    const segurado = cols[iSegurado]?.trim() ?? ''
    if (!segurado) return null

    const { nome, cpf } = extrairNomeCpf(segurado)
    const contrato  = iContrato  !== -1 ? (cols[iContrato]?.trim()  || null) : null
    const proposta  = iProposta  !== -1 ? (cols[iProposta]?.trim()  || null) : null
    const key = contrato ?? `${nome}-${i}`

    // Deduplica por contrato
    if (vistos.has(key)) return null
    vistos.add(key)

    const valorPlano  = iPremio !== -1  ? parseBRL(cols[iPremio]?.trim() ?? '')  : null
    const valorRemun  = iRemun  !== -1  ? parseBRL(cols[iRemun]?.trim()  ?? '')  : null
    const tipoPLano   = iProduto !== -1 ? (cols[iProduto]?.trim() || null)       : null
    const dataIni     = iDataIni !== -1 ? (cols[iDataIni]?.trim() || null)       : null

    return {
      nome,
      cpf,
      numero_contrato: contrato,
      proposta,
      tipo_plano: tipoPLano,
      valor_plano: valorPlano,
      vitalicio_valor_estimado: valorRemun,
      data_inicio_plano: dataIni,
      operadora,
      _key: key,
    } as ClienteImportado
  }).filter(Boolean) as ClienteImportado[]
}

// ─── Componente ───────────────────────────────────────────────────────────────

const inputCls  = 'w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200'
const inputStyle = { borderColor: '#e8e4dd', color: '#1a1a1a' }

export default function ImportarVitalicioClient() {
  const router = useRouter()
  const supabase = createClient()
  const operadoras = useOperadoras()

  const [etapa, setEtapa]           = useState<1 | 2 | 3>(1)
  const [operadora, setOperadora]   = useState('')
  const [texto, setTexto]           = useState('')
  const [clientes, setClientes]     = useState<ClienteImportado[]>([])
  const [salvando, setSalvando]     = useState(false)
  const [importados, setImportados] = useState(0)
  const [erro, setErro]             = useState('')

  const totalValor = useMemo(() =>
    clientes.reduce((s, c) => s + (c.vitalicio_valor_estimado ?? 0), 0), [clientes])

  function handleParsear() {
    setErro('')
    if (!operadora) { setErro('Selecione a operadora.'); return }
    if (!texto.trim()) { setErro('Cole o conteúdo do relatório.'); return }
    const parsed = parseRelatorio(texto, operadora)
    if (parsed.length === 0) { setErro('Nenhum cliente encontrado. Verifique se copiou o cabeçalho junto.'); return }
    setClientes(parsed)
    setEtapa(2)
  }

  function remover(key: string) {
    setClientes(prev => prev.filter(c => c._key !== key))
  }

  async function handleImportar() {
    setSalvando(true)
    setErro('')

    // Busca contratos e CPFs já existentes para não duplicar
    const contratos = clientes.map(c => c.numero_contrato).filter(Boolean) as string[]
    const cpfsSemContrato = clientes.filter(c => !c.numero_contrato && c.cpf).map(c => c.cpf!)

    const [{ data: jaExistemContrato }, { data: jaExistemCpf }] = await Promise.all([
      contratos.length > 0
        ? supabase.from('clientes').select('numero_contrato').in('numero_contrato', contratos)
        : { data: [] },
      cpfsSemContrato.length > 0
        ? supabase.from('clientes').select('cpf').in('cpf', cpfsSemContrato)
        : { data: [] },
    ])
    const contratosDuplicados = new Set((jaExistemContrato ?? []).map((c: { numero_contrato: string }) => c.numero_contrato))
    const cpfsDuplicados = new Set((jaExistemCpf ?? []).map((c: { cpf: string }) => c.cpf))

    const paraInserir = clientes.filter(c => {
      if (c.numero_contrato) return !contratosDuplicados.has(c.numero_contrato)
      if (c.cpf) return !cpfsDuplicados.has(c.cpf)
      return true // sem identificador único — inserido sem verificação de duplicata
    })
    const pulados = clientes.length - paraInserir.length
    const semIdentificador = paraInserir.filter(c => !c.numero_contrato && !c.cpf).length

    if (paraInserir.length === 0) {
      setErro(`Todos os ${clientes.length} clientes já existem no sistema (verificado por contrato e CPF).`)
      setSalvando(false)
      return
    }

    const payload = paraInserir.map(c => ({
      nome:                      c.nome,
      cpf:                       c.cpf,
      numero_contrato:           c.numero_contrato,
      tipo_plano:                c.tipo_plano,
      valor_plano:               c.valor_plano,
      operadora:                 c.operadora,
      data_inicio_plano:         c.data_inicio_plano,
      fase_cliente:              'vitalicio' as const,
      vitalicio_valor_estimado:  c.vitalicio_valor_estimado,
      vitalicio_dia_previsto:    null,
      vitalicio_inicio:          new Date().toISOString().split('T')[0],
      status:                    'Ativo' as const,
      // campos obrigatórios com default
      contato:                   null, email: null,
      data_nascimento:           null, endereco: null, administradora: null,
      quantidade_vidas:          null, data_venda: null, data_implantacao: null,
      data_vencimento_plano:     null, coparticipacao: null,
      tipo_acomodacao:           null, abrangencia: null, carencia: null,
      forma_pagamento:           null, dia_vencimento_boleto: null,
      corretora_responsavel:     null, percentual_comissao_corretora: null,
      percentual_comissao_vendedor: null, tem_vitalicio: null,
      percentual_vitalicio:      null, vendedor: null, vendedor_id: null,
      comissao:                  null, observacoes: c.proposta ? `Proposta: ${c.proposta}` : null, lead_id: null,
    }))

    const { error } = await supabase.from('clientes').insert(payload)
    if (error) { setErro('Erro ao importar: ' + error.message); setSalvando(false); return }

    setImportados(paraInserir.length)
    const avisos: string[] = []
    if (pulados > 0) avisos.push(`${pulados} cliente(s) já existiam e foram pulados.`)
    if (semIdentificador > 0) avisos.push(`${semIdentificador} cliente(s) sem contrato nem CPF foram importados sem verificação de duplicata.`)
    if (avisos.length > 0) setErro(avisos.join(' '))
    setEtapa(3)
    setSalvando(false)
  }

  function formatBRL(v: number) {
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/clientes')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          style={{ color: '#2d1f4e' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Importar Carteira Vitalícia</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
            Cole o relatório da operadora para importar clientes em lote
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: 'Relatório' },
          { n: 2, label: 'Prévia' },
          { n: 3, label: 'Concluído' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px" style={{ backgroundColor: '#e8e4dd' }} />}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: etapa >= n ? '#2d1f4e' : '#f0ece6',
                  color: etapa >= n ? '#fff' : '#9a918a',
                }}>
                {n}
              </div>
              <span className="text-xs font-medium hidden sm:block"
                style={{ color: etapa >= n ? '#2d1f4e' : '#9a918a' }}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── ETAPA 1 ── */}
      {etapa === 1 && (
        <div className="bg-white rounded-2xl p-6 space-y-5" style={{ border: '1px solid #e8e4dd' }}>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#9a918a' }}>
              Operadora
            </label>
            <select value={operadora} onChange={e => setOperadora(e.target.value)}
              className={inputCls} style={{ ...inputStyle, color: operadora ? '#1a1a1a' : '#9a918a' }}>
              <option value="">Selecione a operadora...</option>
              {operadoras.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#9a918a' }}>
              Relatório (copie do Excel e cole aqui)
            </label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={12}
              placeholder={'Cole aqui o conteúdo copiado do Excel.\nIncluindo a linha de cabeçalho (data, situacao, produto, segurado, contrato...).'}
              className={`${inputCls} resize-none font-mono text-xs`}
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: '#9a918a' }}>
              Selecione tudo no Excel (Ctrl+A), copie (Ctrl+C) e cole aqui (Ctrl+V)
            </p>
          </div>

          {erro && <p className="text-sm font-medium" style={{ color: '#b91c1c' }}>{erro}</p>}

          <button onClick={handleParsear}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2d1f4e', color: '#fff' }}>
            <Upload size={15} />
            Processar Relatório
          </button>
        </div>
      )}

      {/* ── ETAPA 2 ── */}
      {etapa === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>
                  {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}
                  {' '}<span style={{ color: '#9a918a' }}>· {operadora}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#9a918a' }}>
                  Total vitalício estimado: <span className="font-semibold" style={{ color: '#15803d' }}>{formatBRL(totalValor)}/mês</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEtapa(1)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80"
                  style={{ border: '1px solid #e8e4dd', color: '#9a918a' }}>
                  Voltar
                </button>
                <button onClick={handleImportar} disabled={salvando || clientes.length === 0}
                  className="px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ backgroundColor: '#2d1f4e', color: '#fff' }}>
                  {salvando ? 'Importando...' : `Importar ${clientes.length} clientes`}
                </button>
              </div>
            </div>
          </div>

          {erro && <p className="text-sm font-medium px-1" style={{ color: '#b91c1c' }}>{erro}</p>}

          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0ece6', backgroundColor: '#faf8f5' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>CPF</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Contrato</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Proposta</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Vigência</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Plano</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Valor Plano</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Vitalício/mês</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c._key} style={{ borderBottom: '1px solid #f0ece6' }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: '#2d1f4e' }}>{c.nome}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#9a918a' }}>{c.cpf ?? '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#9a918a' }}>{c.numero_contrato ?? '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#9a918a' }}>{c.proposta ?? '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#9a918a' }}>{c.data_inicio_plano ?? '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#9a918a' }}>{c.tipo_plano ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#2d1f4e' }}>
                        {c.valor_plano ? formatBRL(c.valor_plano) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: '#15803d' }}>
                        {c.vitalicio_valor_estimado ? formatBRL(c.vitalicio_valor_estimado) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => remover(c._key)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remover da lista">
                          <Trash2 size={13} style={{ color: '#b91c1c' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ETAPA 3 ── */}
      {etapa === 3 && (
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center space-y-4"
          style={{ border: '1px solid #e8e4dd' }}>
          <CheckCircle size={48} style={{ color: '#15803d' }} />
          <div>
            <p className="text-xl font-bold" style={{ color: '#2d1f4e' }}>
              {importados} cliente{importados !== 1 ? 's' : ''} importado{importados !== 1 ? 's' : ''}!
            </p>
            <p className="text-sm mt-1" style={{ color: '#9a918a' }}>
              Todos cadastrados como vitalícios — operadora {operadora}
            </p>
            {erro && <p className="text-xs mt-2" style={{ color: '#b89a6a' }}>{erro}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setEtapa(1); setTexto(''); setClientes([]); setErro('') }}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80"
              style={{ border: '1px solid #e8e4dd', color: '#9a918a' }}>
              Importar outra operadora
            </button>
            <button onClick={() => router.push('/clientes')}
              className="px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
              style={{ backgroundColor: '#2d1f4e', color: '#fff' }}>
              Ver Clientes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
