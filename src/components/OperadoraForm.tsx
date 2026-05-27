// src/components/OperadoraForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Operadora, CnpjRecebimento, RegraComCnpj } from '@/lib/types'

interface ParcelaTab {
  percentual_empresa: string
  percentual_vendedor: string
}

interface CnpjTab {
  key: string
  cnpjId: string
  cnpjNome: string
  regraId: string | undefined
  percentualTotal: string
  numParcelas: string
  descontaImposto: boolean
  percentualImposto: string
  adesaoDireta: boolean
  temVitalicio: boolean
  percentualVitalicio: string
  parcelas: ParcelaTab[]
}

function buildParcelas(n: number, existing: ParcelaTab[]): ParcelaTab[] {
  return Array.from({ length: n }, (_, i) => existing[i] ?? { percentual_empresa: '50', percentual_vendedor: '50' })
}

interface Props {
  operadora?: Operadora
  cnpjsDisponiveis: CnpjRecebimento[]
  regrasExistentes?: RegraComCnpj[]
}

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }
const sectionTitleCls = 'text-sm font-bold mb-4 pb-2 border-b'
const sectionTitleStyle = { color: '#2d1f4e', borderColor: '#e8e4dd' }

function regraParaTab(r: RegraComCnpj): CnpjTab {
  const n = r.num_parcelas ?? 1
  const existingParcelas = (r.parcelas_regra ?? [])
    .sort((a, b) => a.numero_parcela - b.numero_parcela)
    .map(p => ({ percentual_empresa: String(p.percentual_empresa), percentual_vendedor: String(p.percentual_vendedor) }))
  return {
    key: r.cnpjId,
    cnpjId: r.cnpjId,
    cnpjNome: r.cnpjNome,
    regraId: r.id,
    percentualTotal: r.percentual_total?.toString() ?? '',
    numParcelas: r.num_parcelas?.toString() ?? '12',
    descontaImposto: r.desconta_imposto ?? false,
    percentualImposto: r.percentual_imposto?.toString() ?? '',
    adesaoDireta: r.adesao_direta ?? false,
    temVitalicio: (r.percentual_vitalicio ?? 0) > 0,
    percentualVitalicio: r.percentual_vitalicio?.toString() ?? '',
    parcelas: buildParcelas(n, existingParcelas),
  }
}

export default function OperadoraForm({ operadora, cnpjsDisponiveis, regrasExistentes = [] }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const editando = !!operadora

  // Seção 1 — Dados da Operadora (sem "empresa")
  const [nome, setNome]               = useState(operadora?.nome ?? '')
  const [cnpj, setCnpj]               = useState(operadora?.cnpj ?? '')
  const [telefone, setTelefone]       = useState(operadora?.telefone ?? '')
  const [emailGestor, setEmailGestor] = useState(operadora?.email_gestor ?? '')
  const [site, setSite]               = useState(operadora?.site ?? '')
  const [observacoes, setObservacoes] = useState(operadora?.observacoes ?? '')
  const [ativo, setAtivo]             = useState(operadora?.ativo ?? true)

  // Seção 2 — Abas por CNPJ
  const [tabs, setTabs]                   = useState<CnpjTab[]>(() => regrasExistentes.map(regraParaTab))
  const [abaAtiva, setAbaAtiva]           = useState(0)
  const [removedRegraIds, setRemovedRegraIds] = useState<string[]>([])
  const [showAddCnpj, setShowAddCnpj]     = useState(false)
  const [cnpjParaAdicionar, setCnpjParaAdicionar] = useState('')

  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  const cnpjsDisponiiveisParaAdicionar = cnpjsDisponiveis.filter(
    c => !tabs.some(t => t.cnpjId === c.id)
  )

  function updateTab(index: number, partial: Partial<CnpjTab>) {
    setTabs(prev => prev.map((t, i) => {
      if (i !== index) return t
      const updated = { ...t, ...partial }
      if (partial.numParcelas !== undefined) {
        const n = parseInt(partial.numParcelas, 10)
        if (!isNaN(n) && n >= 1 && n <= 60) {
          updated.parcelas = buildParcelas(n, t.parcelas)
        }
      }
      return updated
    }))
  }

  async function handleRemoveTab(index: number) {
    const tab = tabs[index]
    if (tab.regraId) {
      const { count } = await supabase
        .from('vendas')
        .select('id', { count: 'exact', head: true })
        .eq('cnpj_recebimento_id', tab.cnpjId)
      if ((count ?? 0) > 0) {
        setErro(`Existem vendas registradas com "${tab.cnpjNome}". Impossível remover este vínculo.`)
        return
      }
      setRemovedRegraIds(prev => [...prev, tab.regraId!])
    }
    const newLength = tabs.length - 1
    setTabs(prev => prev.filter((_, i) => i !== index))
    setAbaAtiva(prev => Math.min(prev, Math.max(0, newLength - 1)))
    setErro('')
  }

  function handleAddCnpj() {
    if (!cnpjParaAdicionar) return
    const cnpj = cnpjsDisponiveis.find(c => c.id === cnpjParaAdicionar)
    if (!cnpj) return
    const novaTab: CnpjTab = {
      key: cnpj.id,
      cnpjId: cnpj.id,
      cnpjNome: cnpj.nome,
      regraId: undefined,
      percentualTotal: '',
      numParcelas: '3',
      descontaImposto: false,
      percentualImposto: '',
      adesaoDireta: false,
      temVitalicio: false,
      percentualVitalicio: '',
      parcelas: buildParcelas(3, []),
    }
    setTabs(prev => [...prev, novaTab])
    setAbaAtiva(tabs.length)
    setShowAddCnpj(false)
    setCnpjParaAdicionar('')
  }

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

    // 1. Salvar operadora (sem campo empresa)
    let opId = operadora?.id
    if (editando && opId) {
      const { error } = await supabase.from('operadoras').update({
        nome: nome.trim(), cnpj: cnpj.trim() || null, telefone: telefone.trim() || null,
        email_gestor: emailGestor.trim() || null, site: site.trim() || null,
        observacoes: observacoes.trim() || null, ativo,
      }).eq('id', opId)
      if (error) { setErro('Erro ao salvar operadora: ' + error.message); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('operadoras').insert({
        nome: nome.trim(), cnpj: cnpj.trim() || null, telefone: telefone.trim() || null,
        email_gestor: emailGestor.trim() || null, site: site.trim() || null,
        observacoes: observacoes.trim() || null, ativo,
      }).select().single()
      if (error || !data) { setErro('Erro ao criar operadora: ' + (error?.message ?? '')); setLoading(false); return }
      opId = data.id
    }

    // 2. Salvar cada aba (uma regra por CNPJ)
    for (const tab of tabs) {
      const pctTotal     = parseFloat(tab.percentualTotal) || 0
      const nParcelas    = parseInt(tab.numParcelas, 10) || 1
      const pctImposto   = parseFloat(tab.percentualImposto) || 0
      const pctVitalicio = tab.temVitalicio ? (parseFloat(tab.percentualVitalicio) || 0) : 0

      let regraId = tab.regraId

      if (regraId) {
        const { error: updateRegraError } = await supabase.from('regras_comissao').update({
          operadora: nome.trim(),
          percentual_total: pctTotal, num_parcelas: nParcelas,
          desconta_imposto: tab.descontaImposto, percentual_imposto: pctImposto,
          adesao_direta: tab.adesaoDireta,
          percentual_vitalicio: pctVitalicio, ativo,
          cnpj_recebimento_id: tab.cnpjId,
        }).eq('id', regraId)
        if (updateRegraError) {
          setErro(`Erro ao atualizar regra para ${tab.cnpjNome}: ` + updateRegraError.message)
          setLoading(false)
          return
        }
      } else {
        const { data: rd, error: re } = await supabase.from('regras_comissao').insert({
          operadora: nome.trim(),
          percentual_total: pctTotal, num_parcelas: nParcelas,
          desconta_imposto: tab.descontaImposto, percentual_imposto: pctImposto,
          adesao_direta: tab.adesaoDireta,
          percentual_vitalicio: pctVitalicio, ativo,
          cnpj_recebimento_id: tab.cnpjId,
        }).select().single()
        if (re || !rd) {
          setErro(`Erro ao salvar regra para ${tab.cnpjNome}: ` + (re?.message ?? ''))
          setLoading(false)
          return
        }
        regraId = rd.id
      }

      // Salvar distribuição por parcela
      if (regraId) {
        await supabase.from('parcelas_regra').delete().eq('regra_id', regraId)
        await supabase.from('parcelas_regra').insert(
          tab.parcelas.map((p, i) => ({
            regra_id: regraId,
            numero_parcela: i + 1,
            percentual_empresa: parseFloat(p.percentual_empresa) || 0,
            percentual_vendedor: parseFloat(p.percentual_vendedor) || 0,
          }))
        )
      }
    }

    // 3. Deletar regras removidas
    for (const regraId of removedRegraIds) {
      await supabase.from('parcelas_regra').delete().eq('regra_id', regraId)
      await supabase.from('regras_comissao').delete().eq('id', regraId)
    }

    setLoading(false)
    router.push('/gestao/operadoras')
    router.refresh()
  }

  const tab = tabs[abaAtiva]

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
            <label className={labelCls} style={labelStyle}>CNPJ da Operadora</label>
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

      {/* ── Regras de Comissão por CNPJ ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: '#e8e4dd' }}>
          <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Regras de Comissão por CNPJ</h3>
          {cnpjsDisponiiveisParaAdicionar.length > 0 && (
            <button type="button" onClick={() => setShowAddCnpj(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#f0ece6', color: '#2d1f4e' }}>
              <Plus size={12} /> Adicionar CNPJ
            </button>
          )}
        </div>

        {showAddCnpj && (
          <div className="mb-4 flex gap-2">
            <select value={cnpjParaAdicionar} onChange={e => setCnpjParaAdicionar(e.target.value)}
              className={inputCls} style={{ ...inputStyle, flex: 1 }}>
              <option value="">Selecione o CNPJ...</option>
              {cnpjsDisponiiveisParaAdicionar.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <button type="button" onClick={handleAddCnpj} disabled={!cnpjParaAdicionar}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
              Confirmar
            </button>
          </div>
        )}

        {tabs.length === 0 && (
          <p className="text-sm" style={{ color: '#9a918a' }}>
            Nenhum CNPJ vinculado. Clique em &quot;Adicionar CNPJ&quot; para configurar regras de comissão.
          </p>
        )}

        {tabs.length > 0 && (
          <>
            <div className="flex gap-1 mb-5 border-b" style={{ borderColor: '#e8e4dd' }}>
              {tabs.map((t, i) => (
                <button key={t.key} type="button" onClick={() => setAbaAtiva(i)}
                  className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative"
                  style={{
                    backgroundColor: abaAtiva === i ? '#ffffff' : 'transparent',
                    color: abaAtiva === i ? '#2d1f4e' : '#9a918a',
                    borderBottom: abaAtiva === i ? '2px solid #2d1f4e' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}>
                  {t.cnpjNome}
                </button>
              ))}
            </div>

            {tab && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={labelStyle}>% Total pago pela operadora</label>
                    <input type="number" step="0.01" min="0"
                      value={tab.percentualTotal}
                      onChange={e => updateTab(abaAtiva, { percentualTotal: e.target.value })}
                      placeholder="Ex: 300" className={inputCls} style={inputStyle} />
                    <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Soma de todas as parcelas como % do valor do plano</p>
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Número de Parcelas</label>
                    <input type="number" step="1" min="1" max="60"
                      value={tab.numParcelas}
                      onChange={e => updateTab(abaAtiva, { numParcelas: e.target.value })}
                      className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Tem Vitalício?</label>
                    {toggleBtn(tab.temVitalicio, v => updateTab(abaAtiva, { temVitalicio: v }))}
                  </div>
                  {tab.temVitalicio && (
                    <div>
                      <label className={labelCls} style={labelStyle}>% Vitalício (mensal, só empresa)</label>
                      <input type="number" step="0.01" min="0" max="100"
                        value={tab.percentualVitalicio}
                        onChange={e => updateTab(abaAtiva, { percentualVitalicio: e.target.value })}
                        placeholder="Ex: 2" className={inputCls} style={inputStyle} />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t" style={{ borderColor: '#e8e4dd' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#2d1f4e' }}>Distribuição por Parcela</p>
                  <p className="text-xs mb-3" style={{ color: '#9a918a' }}>
                    Como cada parcela é dividida entre empresa e vendedor. A soma deve ser 100%.
                  </p>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: '#f4f1ec' }}>
                          <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#5a4e3c' }}>Parcela</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#5a4e3c' }}>% Empresa</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#5a4e3c' }}>% Vendedor</th>
                          <th className="px-3 py-2 text-xs font-semibold" style={{ color: '#5a4e3c' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tab.parcelas.map((p, i) => {
                          const emp = parseFloat(p.percentual_empresa) || 0
                          const vend = parseFloat(p.percentual_vendedor) || 0
                          const warn = Math.abs(emp + vend - 100) > 0.01
                          return (
                            <tr key={i} className="border-t" style={{ borderColor: '#f0ece6' }}>
                              <td className="px-3 py-2 font-medium" style={{ color: '#2d1f4e' }}>
                                {i === 0 ? 'Adesão' : `Parcela ${i + 1}`}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number" step="0.01" min="0" max="100"
                                  value={p.percentual_empresa}
                                  onChange={e => {
                                    const newP = [...tab.parcelas]
                                    newP[i] = { ...p, percentual_empresa: e.target.value }
                                    updateTab(abaAtiva, { parcelas: newP })
                                  }}
                                  className="border rounded-lg px-2 py-1 text-sm w-20 focus:outline-none"
                                  style={{ borderColor: warn ? '#fbbf24' : '#e8e4dd' }}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number" step="0.01" min="0" max="100"
                                  value={p.percentual_vendedor}
                                  onChange={e => {
                                    const newP = [...tab.parcelas]
                                    newP[i] = { ...p, percentual_vendedor: e.target.value }
                                    updateTab(abaAtiva, { parcelas: newP })
                                  }}
                                  className="border rounded-lg px-2 py-1 text-sm w-20 focus:outline-none"
                                  style={{ borderColor: warn ? '#fbbf24' : '#e8e4dd' }}
                                />
                              </td>
                              <td className="px-3 py-2 text-xs" style={{ color: warn ? '#92400e' : '#9ca3af' }}>
                                {warn ? '≠ 100%' : '= 100%'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4" style={{ borderColor: '#e8e4dd' }}>
                  <div>
                    <label className={labelCls} style={labelStyle}>Desconta Imposto do Vendedor?</label>
                    <p className="text-xs mb-2" style={{ color: '#9a918a' }}>Desconta o imposto do valor repassado ao vendedor.</p>
                    {toggleBtn(tab.descontaImposto, v => updateTab(abaAtiva, { descontaImposto: v }))}
                  </div>
                  {tab.descontaImposto && (
                    <div>
                      <label className={labelCls} style={labelStyle}>% do Imposto</label>
                      <input type="number" step="0.01" min="0" max="100"
                        value={tab.percentualImposto}
                        onChange={e => updateTab(abaAtiva, { percentualImposto: e.target.value })}
                        placeholder="Ex: 11" className={inputCls} style={inputStyle} />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t" style={{ borderColor: '#e8e4dd' }}>
                  <label className={labelCls} style={labelStyle}>Adesão direto ao vendedor?</label>
                  <p className="text-xs mb-2" style={{ color: '#9a918a' }}>Adesão é paga pelo cliente diretamente ao vendedor — não passa pela corretora. Parcelas seguintes entram pelo 5º dia útil do mês seguinte.</p>
                  {toggleBtn(tab.adesaoDireta, v => updateTab(abaAtiva, { adesaoDireta: v }))}
                </div>

                <div className="pt-2">
                  <button type="button" onClick={() => handleRemoveTab(abaAtiva)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ color: '#b5455a', backgroundColor: '#fee2e2' }}>
                    <X size={12} /> Remover vínculo com {tab.cnpjNome}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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
