'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Operadora, RegraComissao, RepasseNivel, EMPRESAS, NIVEIS_VENDEDOR } from '@/lib/types'

interface Props {
  operadora?: Operadora
  regra?: RegraComissao
  repasseNiveis?: RepasseNivel[]
}

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }
const sectionTitleCls = 'text-sm font-bold mb-4 pb-2 border-b'
const sectionTitleStyle = { color: '#2d1f4e', borderColor: '#e8e4dd' }

export default function OperadoraForm({ operadora, regra, repasseNiveis = [] }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const editando = !!operadora

  // Seção 1 — Dados da Operadora
  const [nome, setNome]               = useState(operadora?.nome ?? '')
  const [cnpj, setCnpj]               = useState(operadora?.cnpj ?? '')
  const [telefone, setTelefone]       = useState(operadora?.telefone ?? '')
  const [emailGestor, setEmailGestor] = useState(operadora?.email_gestor ?? '')
  const [site, setSite]               = useState(operadora?.site ?? '')
  const [empresa, setEmpresa]         = useState(operadora?.empresa ?? '')
  const [observacoes, setObservacoes] = useState(operadora?.observacoes ?? '')
  const [ativo, setAtivo]             = useState(operadora?.ativo ?? true)

  // Seção 2 — Regras de Comissão
  const [percentualTotal, setPercentualTotal]         = useState(regra?.percentual_total?.toString() ?? '')
  const [numParcelas, setNumParcelas]                 = useState(regra?.num_parcelas?.toString() ?? '12')
  const [descontaImposto, setDescontaImposto]         = useState(regra?.desconta_imposto ?? false)
  const [percentualImposto, setPercentualImposto]     = useState(regra?.percentual_imposto?.toString() ?? '')
  const [temVitalicio, setTemVitalicio]               = useState((regra?.percentual_vitalicio ?? 0) > 0)
  const [percentualVitalicio, setPercentualVitalicio] = useState(regra?.percentual_vitalicio?.toString() ?? '')

  // Seção 3 — Repasse por Nível
  const getRepasse = (nivel: string) =>
    repasseNiveis.find(r => r.nivel === nivel)?.percentual?.toString() ?? ''

  const [nivelIniciante, setNivelIniciante]   = useState(getRepasse('Iniciante'))
  const [nivelExperiente, setNivelExperiente] = useState(getRepasse('Experiente'))
  const [nivelVip, setNivelVip]               = useState(getRepasse('VIP'))

  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  const toggleBtn = (active: boolean, setValue: (v: boolean) => void, labelSim = 'Sim', labelNao = 'Não') => (
    <div className="flex gap-3 mt-1 max-w-xs">
      {([true, false] as const).map(v => (
        <button key={String(v)} type="button" onClick={() => setValue(v)}
          className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
          style={{
            borderColor: active === v ? '#2d1f4e' : '#e8e4dd',
            backgroundColor: active === v ? '#2d1f4e' : '#ffffff',
            color: active === v ? '#ffffff' : '#5a4e3c',
          }}>
          {v ? labelSim : labelNao}
        </button>
      ))}
    </div>
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }

    setLoading(true)

    // 1. Salvar operadora
    let opId = operadora?.id
    if (editando && opId) {
      const { error } = await supabase.from('operadoras').update({
        nome: nome.trim(), cnpj: cnpj.trim() || null, telefone: telefone.trim() || null,
        email_gestor: emailGestor.trim() || null, site: site.trim() || null,
        empresa: empresa || null, observacoes: observacoes.trim() || null, ativo,
      }).eq('id', opId)
      if (error) { setErro('Erro ao salvar operadora: ' + error.message); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('operadoras').insert({
        nome: nome.trim(), cnpj: cnpj.trim() || null, telefone: telefone.trim() || null,
        email_gestor: emailGestor.trim() || null, site: site.trim() || null,
        empresa: empresa || null, observacoes: observacoes.trim() || null, ativo,
      }).select().single()
      if (error || !data) { setErro('Erro ao criar operadora: ' + (error?.message ?? '')); setLoading(false); return }
      opId = data.id
    }

    // 2. Salvar regra de comissão
    const pctTotal    = parseFloat(percentualTotal) || 0
    const nParcelas   = parseInt(numParcelas, 10) || 1
    const pctImposto  = parseFloat(percentualImposto) || 0
    const pctVitalicio = temVitalicio ? (parseFloat(percentualVitalicio) || 0) : 0

    let regraId = regra?.id
    if (regraId) {
      await supabase.from('regras_comissao').update({
        operadora: nome.trim(),
        percentual_total: pctTotal, num_parcelas: nParcelas,
        desconta_imposto: descontaImposto, percentual_imposto: pctImposto,
        percentual_vitalicio: pctVitalicio, ativo,
      }).eq('id', regraId)
    } else {
      const { data: rd, error: re } = await supabase.from('regras_comissao').insert({
        operadora: nome.trim(),
        percentual_total: pctTotal, num_parcelas: nParcelas,
        desconta_imposto: descontaImposto, percentual_imposto: pctImposto,
        percentual_vitalicio: pctVitalicio, ativo,
      }).select().single()
      if (re || !rd) {
        setErro('Operadora salva, mas erro na regra: ' + (re?.message ?? ''))
        setLoading(false)
        return
      }
      regraId = rd.id
    }

    // 3. Salvar repasse por nível
    if (regraId) {
      await supabase.from('repasse_grupo_vendedor').delete().eq('regra_id', regraId)
      await supabase.from('repasse_grupo_vendedor').insert([
        { regra_id: regraId, nivel: 'Iniciante',  percentual: parseFloat(nivelIniciante)  || 0 },
        { regra_id: regraId, nivel: 'Experiente', percentual: parseFloat(nivelExperiente) || 0 },
        { regra_id: regraId, nivel: 'VIP',        percentual: parseFloat(nivelVip)        || 0 },
      ])
    }

    setLoading(false)
    router.push('/gestao/operadoras')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">

      {/* ── Dados da Operadora ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h3 className={sectionTitleCls} style={sectionTitleStyle}>Dados da Operadora</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Nome <span style={{ color: '#b5455a' }}>*</span></label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Ex: Unimed" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>CNPJ</label>
            <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Telefone / WhatsApp</label>
            <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>E-mail do Gestor</label>
            <input type="email" value={emailGestor} onChange={e => setEmailGestor(e.target.value)}
              placeholder="gestor@operadora.com" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Site</label>
            <input type="text" value={site} onChange={e => setSite(e.target.value)}
              placeholder="www.operadora.com.br" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Empresa</label>
            <select value={empresa} onChange={e => setEmpresa(e.target.value)}
              className={inputCls} style={{ ...inputStyle, color: empresa ? '#1a1a1a' : '#9a918a' }}>
              <option value="">Selecione...</option>
              {EMPRESAS.map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Status</label>
            <div className="flex gap-3 mt-1">
              {([true, false] as const).map(v => (
                <button key={String(v)} type="button" onClick={() => setAtivo(v)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                  style={{
                    borderColor: ativo === v ? '#2d1f4e' : '#e8e4dd',
                    backgroundColor: ativo === v ? '#2d1f4e' : '#ffffff',
                    color: ativo === v ? '#ffffff' : '#5a4e3c',
                  }}>
                  {v ? 'Ativa' : 'Inativa'}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Observações / Material de apoio</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
              rows={3} placeholder="Links, documentos, observações sobre esta operadora..."
              className={`${inputCls} resize-none`} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* ── Regras de Comissão ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h3 className={sectionTitleCls} style={sectionTitleStyle}>Regras de Comissão</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={labelCls} style={labelStyle}>% Total pago pela operadora</label>
            <input type="number" step="0.01" min="0" value={percentualTotal}
              onChange={e => setPercentualTotal(e.target.value)}
              placeholder="Ex: 300" className={inputCls} style={inputStyle} />
            <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Soma de todas as parcelas como % do valor do plano</p>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Número de Parcelas</label>
            <input type="number" step="1" min="1" max="60" value={numParcelas}
              onChange={e => setNumParcelas(e.target.value)}
              placeholder="Ex: 3" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Tem Vitalício?</label>
            {toggleBtn(temVitalicio, setTemVitalicio)}
          </div>

          {temVitalicio && (
            <div>
              <label className={labelCls} style={labelStyle}>% Vitalício (mensal, só empresa)</label>
              <input type="number" step="0.01" min="0" max="100" value={percentualVitalicio}
                onChange={e => setPercentualVitalicio(e.target.value)}
                placeholder="Ex: 2" className={inputCls} style={inputStyle} />
            </div>
          )}
        </div>
      </div>

      {/* ── Repasse por Nível do Vendedor ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h3 className={sectionTitleCls} style={sectionTitleStyle}>Repasse por Nível do Vendedor</h3>
        <p className="text-xs mb-4" style={{ color: '#9a918a' }}>
          % de cada parcela que vai para o vendedor. A corretora fica com o restante.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(NIVEIS_VENDEDOR as readonly string[]).map(nivel => {
            const val    = nivel === 'Iniciante' ? nivelIniciante : nivel === 'Experiente' ? nivelExperiente : nivelVip
            const setVal = nivel === 'Iniciante' ? setNivelIniciante : nivel === 'Experiente' ? setNivelExperiente : setNivelVip
            return (
              <div key={nivel}>
                <label className={labelCls} style={labelStyle}>{nivel}</label>
                <div className="relative">
                  <input type="number" step="0.01" min="0" max="100" value={val}
                    onChange={e => setVal(e.target.value)}
                    placeholder="0" className={inputCls} style={{ ...inputStyle, paddingRight: '2rem' }} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                    style={{ color: '#9a918a' }}>%</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Imposto sobre o repasse da corretora */}
        <div className="mt-5 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4" style={{ borderColor: '#e8e4dd' }}>
          <div>
            <label className={labelCls} style={labelStyle}>Desconta Imposto da Corretora?</label>
            <p className="text-xs mb-2" style={{ color: '#9a918a' }}>Incide só sobre o repasse da corretora, não do vendedor.</p>
            {toggleBtn(descontaImposto, setDescontaImposto)}
          </div>

          {descontaImposto && (
            <div>
              <label className={labelCls} style={labelStyle}>% do Imposto</label>
              <input type="number" step="0.01" min="0" max="100" value={percentualImposto}
                onChange={e => setPercentualImposto(e.target.value)}
                placeholder="Ex: 13.5" className={inputCls} style={inputStyle} />
            </div>
          )}
        </div>
      </div>

      {erro && <p className="text-sm font-medium" style={{ color: '#b5455a' }}>{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          {loading ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Operadora'}
        </button>
        <button type="button" onClick={() => router.push('/gestao/operadoras')}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
          style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
