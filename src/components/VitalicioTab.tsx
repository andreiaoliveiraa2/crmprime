'use client'

import { useMemo } from 'react'
import { Repeat } from 'lucide-react'
import { Conta, CnpjRecebimento, CategoriaDespesa } from '@/lib/types'
import { ContasSubTab } from './ContasUnificadasSection'

interface Props {
  contas: Conta[]
  cnpjs: CnpjRecebimento[]
  categorias: CategoriaDespesa[]
  onAtualizar: () => void
}

// Aba Vitalício: replica a tela de "A Receber", filtrada só pros recebimentos
// da carteira vitalícia (contas a receber com categoria 'Vitalício'). Mesmo
// botão de dar baixa, mesmo total, mesmos filtros/exportação.
export default function VitalicioTab({ contas, cnpjs, categorias, onAtualizar }: Props) {
  const vitalicio = useMemo(
    () => contas.filter(c => c.tipo === 'receber' && c.categoria === 'Vitalício'),
    [contas]
  )

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #e8e4dd' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#fdf5e8' }}>
            <Repeat size={15} style={{ color: '#b89a6a' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#2d1f4e' }}>Vitalício</h3>
            <p className="text-xs mt-0.5" style={{ color: '#b89a6a' }}>
              Carteira vitalícia — recebimentos mensais recorrentes
            </p>
          </div>
        </div>
      </div>

      <ContasSubTab
        tipo="receber"
        contas={vitalicio}
        cnpjs={cnpjs}
        categorias={categorias}
        onAtualizar={onAtualizar}
      />
    </div>
  )
}
