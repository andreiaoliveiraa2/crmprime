'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { salvarMetas } from '@/app/actions/metas'

interface Props {
  operadoras: string[]
  vendedorId: string | null       // null = meta da empresa
  mesRef: string                  // 'YYYY-MM-01'
  iniciais: Record<string, number>
}

export default function MetasEditor({ operadoras, vendedorId, mesRef, iniciais }: Props) {
  const router = useRouter()
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(operadoras.map(op => [op, iniciais[op] ? String(iniciais[op]) : ''])),
  )
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  const total = operadoras.reduce((s, op) => s + (parseFloat(valores[op]) || 0), 0)

  async function handleSalvar() {
    setSalvando(true); setOk(false)
    try {
      await salvarMetas(
        vendedorId,
        mesRef,
        operadoras.map(op => ({ operadora: op, meta_valor: parseFloat(valores[op]) || 0 })),
      )
      setOk(true)
      router.refresh()
    } catch {
      alert('Não consegui salvar as metas. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
      <div className="space-y-2">
        {operadoras.map(op => (
          <div key={op} className="flex items-center gap-3">
            <span className="text-sm w-32 shrink-0" style={{ color: '#5a4e3c' }}>{op}</span>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-xs" style={{ color: '#9a918a' }}>R$</span>
              <input
                type="number" min="0" step="0.01" inputMode="decimal"
                value={valores[op]}
                onChange={e => setValores(v => ({ ...v, [op]: e.target.value }))}
                placeholder="0,00"
                className="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid #f0ece6' }}>
        <span className="text-sm" style={{ color: '#5a4e3c' }}>
          Total do mês: <b style={{ color: '#2d1f4e' }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>
        </span>
        <div className="flex items-center gap-3">
          {ok && <span className="text-xs" style={{ color: '#15803d' }}>Salvo ✓</span>}
          <button onClick={handleSalvar} disabled={salvando}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: '#2d1f4e', color: '#fff' }}>
            {salvando ? 'Salvando...' : 'Salvar metas'}
          </button>
        </div>
      </div>
    </div>
  )
}
