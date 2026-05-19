'use client'

import Link from 'next/link'
import { Lead } from '@/lib/types'
import { Pencil } from 'lucide-react'

const etapaCor: Record<string, string> = {
  'Novo Lead':     '#6b7280',
  'Contato Feito': '#1d4ed8',
  'Cotação':       '#b89a6a',
  'Negociação':    '#c2410c',
  'Vendido':       '#15803d',
  'Perdido':       '#be185d',
}

interface Props {
  leads: Lead[]
}

export default function LeadListView({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#e8e4dd' }}>
        <p className="text-sm" style={{ color: '#9a918a' }}>Nenhum lead encontrado com os filtros atuais.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e4dd' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#2d1f4e' }}>
              {['Nome', 'Telefone', 'Tipo de Plano', 'Operadora', 'Etapa', 'Responsável', 'Data de Entrada', 'Ações'].map(col => (
                <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-white whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((l, i) => {
              const cor = etapaCor[l.etapa] ?? '#6b7280'
              return (
                <tr
                  key={l.id}
                  className="border-t"
                  style={{
                    backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf8f5',
                    borderColor: '#f0ece6',
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>
                    {l.nome ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>
                    {l.telefone ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>
                    {l.tipo_plano ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>
                    {l.operadora ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                      style={{ backgroundColor: `${cor}18`, color: cor }}
                    >
                      {l.etapa}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>
                    {l.responsavel ?? '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#5a4e3c' }}>
                    {l.criado_em ? new Date(l.criado_em).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/crm/${l.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: '#f0ece6', color: '#2d1f4e' }}
                    >
                      <Pencil size={11} />
                      Editar
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
