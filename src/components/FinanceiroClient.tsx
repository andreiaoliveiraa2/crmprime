'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Venda, Comissao, Conta, RegraComissao, CnpjRecebimento, DespesaFixa } from '@/lib/types'
import ProducaoTab from './ProducaoTab'
import ComissoesTab from './ComissoesTab'
import ContasTab from './ContasTab'
import RelatoriosTab from './RelatoriosTab'

type Aba = 'producao' | 'comissoes' | 'contas' | 'relatorios'

interface Props {
  vendas: Venda[]
  comissoes: Comissao[]
  contas: Conta[]
  regras: RegraComissao[]
  cnpjs: CnpjRecebimento[]
  operadoras: { id: string; nome: string }[]
  despesasFixas: DespesaFixa[]
  categorias: string[]
}

const ABAS: { id: Aba; label: string }[] = [
  { id: 'producao', label: 'Produção' },
  { id: 'comissoes', label: 'Comissões' },
  { id: 'contas', label: 'Contas' },
  { id: 'relatorios', label: 'Relatórios' },
]

export default function FinanceiroClient({ vendas, comissoes, contas, regras, cnpjs, operadoras, despesasFixas, categorias }: Props) {
  const [aba, setAba] = useState<Aba>('producao')
  const router = useRouter()

  function reload() {
    router.refresh()
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>
          Financeiro
        </h1>
        <p className="text-sm mt-1" style={{ color: '#b89a6a' }}>
          A2 Prime Corretora de Seguros
        </p>
      </div>

      {/* Tab Bar */}
      <div className="overflow-x-auto mb-6">
        <div className="flex border-b border-gray-200 min-w-max">
          {ABAS.map((item) => {
            const active = aba === item.id
            return (
              <button
                key={item.id}
                onClick={() => setAba(item.id)}
                className="px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap focus:outline-none"
                style={{
                  color: active ? '#2d1f4e' : undefined,
                  fontWeight: active ? 600 : undefined,
                  borderBottom: active ? '2px solid #b89a6a' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                <span className={active ? '' : 'text-gray-400 hover:text-[#2d1f4e]'}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {aba === 'producao' && (
        <ProducaoTab
          vendas={vendas}
          comissoes={comissoes}
          contas={contas}
          cnpjs={cnpjs}
        />
      )}
      {aba === 'comissoes' && (
        <ComissoesTab
          comissoes={comissoes}
          vendas={vendas}
          regras={regras}
          onAtualizar={reload}
          cnpjs={cnpjs}
        />
      )}
      {aba === 'contas' && (
        <ContasTab contas={contas} onAtualizar={reload} cnpjs={cnpjs} despesasFixas={despesasFixas} categorias={categorias} />
      )}
      {aba === 'relatorios' && (
        <RelatoriosTab vendas={vendas} comissoes={comissoes} contas={contas} cnpjs={cnpjs} operadoras={operadoras} />
      )}

    </div>
  )
}
