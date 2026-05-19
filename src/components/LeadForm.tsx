'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadInsert, TIPOS_PLANO_LEAD, ORIGENS_LEAD } from '@/lib/types'

interface Props {
  lead?: Lead
}

const inputCls = `w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow`
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

export default function LeadForm({ lead }: Props) {
  const [nome, setNome] = useState(lead?.nome ?? '')
  const [telefone, setTelefone] = useState(lead?.telefone ?? '')
  const [origem, setOrigem] = useState(lead?.origem ?? '')
  const [oQueProcura, setOQueProcura] = useState(lead?.o_que_procura ?? '')
  const [tipo_plano, setTipoPlano] = useState(lead?.tipo_plano ?? '')
  const [operadora, setOperadora] = useState(lead?.operadora ?? '')
  const [responsavel, setResponsavel] = useState(lead?.responsavel ?? '')
  const [observacoes, setObservacoes] = useState(lead?.observacoes ?? '')
  const [dataEntrada, setDataEntrada] = useState(
    lead?.criado_em ? lead.criado_em.slice(0, 10) : hoje()
  )
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const editando = !!lead

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!telefone.trim() && !nome.trim()) {
      setErro('Informe pelo menos o nome ou o telefone.')
      return
    }

    setLoading(true)

    const payload: LeadInsert = {
      nome: nome.trim() || null,
      telefone: telefone.trim() || null,
      origem: origem || null,
      o_que_procura: oQueProcura.trim() || null,
      tipo_plano: tipo_plano || null,
      operadora: operadora.trim() || null,
      responsavel: responsavel.trim() || null,
      observacoes: observacoes.trim() || null,
      etapa: lead?.etapa ?? 'Novo Lead',
      criado_em: dataEntrada ? new Date(dataEntrada).toISOString() : undefined,
    }

    if (editando) {
      const { error } = await supabase.from('leads').update(payload).eq('id', lead.id)
      if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }
    } else {
      const { error } = await supabase.from('leads').insert(payload)
      if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }
    }

    setLoading(false)
    router.push('/crm')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Nome */}
        <div>
          <label htmlFor="nome" className={labelCls} style={labelStyle}>Nome</label>
          <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Nome do cliente"
            className={inputCls} style={inputStyle} />
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="telefone" className={labelCls} style={labelStyle}>Telefone / WhatsApp</label>
          <input id="telefone" type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
            placeholder="(00) 00000-0000"
            className={inputCls} style={inputStyle} />
        </div>

        {/* Origem */}
        <div>
          <label htmlFor="origem" className={labelCls} style={labelStyle}>Origem do Lead</label>
          <select id="origem" value={origem} onChange={e => setOrigem(e.target.value)}
            className={inputCls} style={{ ...inputStyle, color: origem ? '#1a1a1a' : '#9a918a' }}>
            <option value="">Selecione a origem...</option>
            {ORIGENS_LEAD.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Tipo de Plano */}
        <div>
          <label htmlFor="tipo_plano" className={labelCls} style={labelStyle}>Tipo de Plano</label>
          <select id="tipo_plano" value={tipo_plano} onChange={e => setTipoPlano(e.target.value)}
            className={inputCls} style={{ ...inputStyle, color: tipo_plano ? '#1a1a1a' : '#9a918a' }}>
            <option value="">Selecione o tipo...</option>
            {TIPOS_PLANO_LEAD.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Operadora */}
        <div>
          <label htmlFor="operadora" className={labelCls} style={labelStyle}>Operadora de Interesse</label>
          <input id="operadora" type="text" value={operadora} onChange={e => setOperadora(e.target.value)}
            placeholder="Ex: Unimed, Bradesco, Amil..."
            className={inputCls} style={inputStyle} />
        </div>

        {/* Responsável */}
        <div>
          <label htmlFor="responsavel" className={labelCls} style={labelStyle}>Responsável pelo Atendimento</label>
          <input id="responsavel" type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)}
            placeholder="Nome do responsável"
            className={inputCls} style={inputStyle} />
        </div>

        {/* O que procura — ocupa largura total */}
        <div className="md:col-span-2">
          <label htmlFor="o_que_procura" className={labelCls} style={labelStyle}>O que o cliente procura</label>
          <input id="o_que_procura" type="text" value={oQueProcura} onChange={e => setOQueProcura(e.target.value)}
            placeholder="Descreva o que o cliente está buscando..."
            className={inputCls} style={inputStyle} />
        </div>

        {/* Observações — ocupa largura total */}
        <div className="md:col-span-2">
          <label htmlFor="observacoes" className={labelCls} style={labelStyle}>Observações</label>
          <textarea id="observacoes" value={observacoes} onChange={e => setObservacoes(e.target.value)}
            rows={3} placeholder="Informações adicionais..."
            className={`${inputCls} resize-none`} style={inputStyle} />
        </div>

        {/* Data de Entrada */}
        <div>
          <label htmlFor="data_entrada" className={labelCls} style={labelStyle}>Data de Entrada</label>
          <input id="data_entrada" type="date" value={dataEntrada} onChange={e => setDataEntrada(e.target.value)}
            className={inputCls} style={inputStyle} />
        </div>

      </div>

      {erro && (
        <p className="mt-4 text-sm font-medium" style={{ color: '#b5455a' }}>{erro}</p>
      )}

      <div className="flex gap-3 mt-6">
        <button
          type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
        >
          {loading ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Lead'}
        </button>
        <button
          type="button" onClick={() => router.push('/crm')}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
