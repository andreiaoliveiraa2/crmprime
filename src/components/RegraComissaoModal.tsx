'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { RegraComissao, ParcelaRegra } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useOperadoras } from '@/lib/useOperadoras'

interface Props {
  onClose: () => void
  onSalvo: () => void
  regraEditando?: RegraComissao & { parcelas: ParcelaRegra[] }
}

interface ParcelaForm {
  numero_parcela: number
  percentual_empresa: string
  percentual_vendedor: string
}

function buildParcelaForms(n: number, existing: ParcelaRegra[]): ParcelaForm[] {
  return Array.from({ length: n }, (_, i) => {
    const num = i + 1
    const found = existing.find(p => p.numero_parcela === num)
    return {
      numero_parcela: num,
      percentual_empresa: found ? String(found.percentual_empresa) : '50',
      percentual_vendedor: found ? String(found.percentual_vendedor) : '50',
    }
  })
}

export default function RegraComissaoModal({ onClose, onSalvo, regraEditando }: Props) {
  const supabase = createClient()
  const operadoras = useOperadoras()
  const editando = !!regraEditando

  const [operadora, setOperadora] = useState(regraEditando?.operadora ?? '')
  const [percentualTotal, setPercentualTotal] = useState(regraEditando ? String(regraEditando.percentual_total) : '')
  const [numParcelas, setNumParcelas] = useState(regraEditando ? String(regraEditando.num_parcelas) : '12')
  const [percentualVitalicio, setPercentualVitalicio] = useState(regraEditando ? String(regraEditando.percentual_vitalicio) : '')
  const [ativo, setAtivo] = useState(regraEditando?.ativo ?? true)
  const [descontaImposto, setDescontaImposto] = useState(regraEditando?.desconta_imposto ?? false)
  const [percentualImposto, setPercentualImposto] = useState(regraEditando ? String(regraEditando.percentual_imposto ?? '') : '')
  const [parcelas, setParcelas] = useState<ParcelaForm[]>(() => {
    const n = regraEditando?.num_parcelas ?? 12
    return buildParcelaForms(n, regraEditando?.parcelas ?? [])
  })

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Regenerate parcela rows when numParcelas changes
  useEffect(() => {
    const n = parseInt(numParcelas, 10)
    if (!isNaN(n) && n >= 1 && n <= 24) {
      setParcelas(prev => buildParcelaForms(n, prev.map(p => ({
        id: '',
        regra_id: '',
        numero_parcela: p.numero_parcela,
        percentual_empresa: parseFloat(p.percentual_empresa) || 0,
        percentual_vendedor: parseFloat(p.percentual_vendedor) || 0,
      }))))
    }
  }, [numParcelas])

  function updateParcela(index: number, field: 'percentual_empresa' | 'percentual_vendedor', value: string) {
    setParcelas(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function parcelaWarning(p: ParcelaForm): boolean {
    const emp = parseFloat(p.percentual_empresa) || 0
    const vend = parseFloat(p.percentual_vendedor) || 0
    return Math.abs(emp + vend - 100) > 0.01
  }

  async function handleSalvar() {
    setErro(null)

    if (!operadora) { setErro('Selecione a operadora.'); return }
    const pctTotal = parseFloat(percentualTotal)
    if (isNaN(pctTotal) || pctTotal <= 0) { setErro('Informe um percentual total válido.'); return }
    const nParcelas = parseInt(numParcelas, 10)
    if (isNaN(nParcelas) || nParcelas < 1 || nParcelas > 24) { setErro('Número de parcelas deve ser entre 1 e 24.'); return }
    const pctVit = parseFloat(percentualVitalicio)
    if (isNaN(pctVit) || pctVit < 0) { setErro('Informe um percentual vitalício válido.'); return }

    setSalvando(true)
    try {
      let regraId: string

      if (editando && regraEditando) {
        // Update existing rule
        const { error } = await supabase
          .from('regras_comissao')
          .update({
            percentual_total: pctTotal,
            num_parcelas: nParcelas,
            percentual_vitalicio: pctVit,
            ativo,
            desconta_imposto: descontaImposto,
            percentual_imposto: descontaImposto ? (parseFloat(percentualImposto) || 0) : 0,
          })
          .eq('id', regraEditando.id)

        if (error) {
          setErro('Erro ao atualizar regra: ' + error.message)
          setSalvando(false)
          return
        }
        regraId = regraEditando.id
      } else {
        // Insert new rule
        const { data, error } = await supabase
          .from('regras_comissao')
          .insert({
            operadora,
            percentual_total: pctTotal,
            num_parcelas: nParcelas,
            percentual_vitalicio: pctVit,
            ativo,
            desconta_imposto: descontaImposto,
            percentual_imposto: descontaImposto ? (parseFloat(percentualImposto) || 0) : 0,
          })
          .select()
          .single()

        if (error || !data) {
          setErro('Erro ao criar regra: ' + (error?.message ?? 'Tente novamente.'))
          setSalvando(false)
          return
        }
        regraId = data.id
      }

      // Delete existing parcelas and re-insert
      await supabase.from('parcelas_regra').delete().eq('regra_id', regraId)

      const parcelasParaInserir = parcelas.map(p => ({
        regra_id: regraId,
        numero_parcela: p.numero_parcela,
        percentual_empresa: parseFloat(p.percentual_empresa) || 0,
        percentual_vendedor: parseFloat(p.percentual_vendedor) || 0,
      }))

      const { error: parcelasErr } = await supabase
        .from('parcelas_regra')
        .insert(parcelasParaInserir)

      if (parcelasErr) {
        setErro('Regra salva, mas erro ao salvar parcelas: ' + parcelasErr.message)
        setSalvando(false)
        return
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: '#e8e4dd' }}>
          <h2 className="text-lg font-bold" style={{ color: '#2d1f4e' }}>
            {editando ? 'Editar Regra' : 'Nova Regra'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: '#9a918a' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Operadora */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Operadora <span style={{ color: '#b91c1c' }}>*</span>
            </label>
            <select
              value={operadora}
              onChange={e => setOperadora(e.target.value)}
              className={inputCls}
              style={{ ...inputStyle, color: operadora ? '#1a1a1a' : '#9a918a' }}
              disabled={editando}
            >
              <option value="">Selecione a operadora</option>
              {operadoras.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {editando && (
              <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Operadora não pode ser alterada após criação.</p>
            )}
          </div>

          {/* Percentual Total */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Percentual Total (%) <span style={{ color: '#b91c1c' }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 300"
              value={percentualTotal}
              onChange={e => setPercentualTotal(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Soma de todas as parcelas como % do valor do plano.</p>
          </div>

          {/* Nº de Parcelas */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Nº de Parcelas <span style={{ color: '#b91c1c' }}>*</span>
            </label>
            <input
              type="number"
              step="1"
              min="1"
              max="24"
              value={numParcelas}
              onChange={e => setNumParcelas(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Parcelas table */}
          {parcelas.length > 0 && (
            <div>
              <p className={labelCls} style={labelStyle}>Distribuição por Parcela</p>
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
                    {parcelas.map((p, i) => {
                      const warn = parcelaWarning(p)
                      return (
                        <tr key={p.numero_parcela} className="border-t" style={{ borderColor: '#f0ece6' }}>
                          <td className="px-3 py-2 font-medium" style={{ color: '#2d1f4e' }}>{p.numero_parcela}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={p.percentual_empresa}
                              onChange={e => updateParcela(i, 'percentual_empresa', e.target.value)}
                              className="border rounded-lg px-2 py-1 text-sm w-20 focus:outline-none focus:ring-1"
                              style={{ borderColor: warn ? '#fbbf24' : '#e8e4dd' }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={p.percentual_vendedor}
                              onChange={e => updateParcela(i, 'percentual_vendedor', e.target.value)}
                              className="border rounded-lg px-2 py-1 text-sm w-20 focus:outline-none focus:ring-1"
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
              {parcelas.some(parcelaWarning) && (
                <p className="text-xs mt-1.5" style={{ color: '#92400e' }}>
                  Recomendado: % Empresa + % Vendedor = 100% por parcela.
                </p>
              )}
            </div>
          )}

          {/* % Vitalício */}
          <div>
            <label className={labelCls} style={labelStyle}>
              % Vitalício (mensal) <span style={{ color: '#b91c1c' }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 2"
              value={percentualVitalicio}
              onChange={e => setPercentualVitalicio(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Percentual mensal do valor do plano após as parcelas.</p>
          </div>

          {/* Desconto de Imposto */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                id="desconta-imposto-check"
                checked={descontaImposto}
                onChange={e => setDescontaImposto(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#2d1f4e' }}
              />
              <label htmlFor="desconta-imposto-check" className="text-sm font-medium" style={{ color: '#5a4e3c' }}>
                Descontar imposto do vendedor
              </label>
            </div>
            {descontaImposto && (
              <div>
                <label className={labelCls} style={labelStyle}>% Imposto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ex: 11"
                  value={percentualImposto}
                  onChange={e => setPercentualImposto(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Ativo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo-check"
              checked={ativo}
              onChange={e => setAtivo(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#2d1f4e' }}
            />
            <label htmlFor="ativo-check" className="text-sm font-medium" style={{ color: '#5a4e3c' }}>
              Regra ativa
            </label>
          </div>

          {/* Error */}
          {erro && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
              {erro}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: '#e8e4dd' }}>
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
            {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Regra'}
          </button>
        </div>
      </div>
    </div>
  )
}
