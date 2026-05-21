'use client'

import Link from 'next/link'
import { Vendedor, Venda, Comissao } from '@/lib/types'
import { Pencil, ArrowLeft } from 'lucide-react'

interface Props {
  vendedor: Vendedor
  vendas: Venda[]
  comissoes: Comissao[]
}

const cardCls = 'bg-white rounded-2xl p-6 mb-4'
const cardStyle = { border: '1px solid #e8e4dd' }
const sectionTitleCls = 'text-sm font-bold mb-4 pb-2 border-b'
const sectionTitleStyle = { color: '#2d1f4e', borderColor: '#e8e4dd' }

function Campo({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold" style={{ color: '#9a918a' }}>{label}</p>
      <p className="text-sm mt-0.5" style={{ color: '#1a1a1a' }}>{value ?? '—'}</p>
    </div>
  )
}

export default function FichaVendedor({ vendedor, vendas, comissoes }: Props) {
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const vendasMes          = vendas.filter(v => new Date(v.data_venda) >= inicioMes)
  const producaoMes        = vendasMes.reduce((acc, v) => acc + v.valor_plano, 0)
  const producaoTotal      = vendas.reduce((acc, v) => acc + v.valor_plano, 0)
  const comissoesPagas     = comissoes
    .filter(c => c.status_vendedor === 'Recebido')
    .reduce((acc, c) => acc + c.valor_vendedor, 0)
  const comissoesPendentes = comissoes
    .filter(c => c.status_vendedor === 'Pendente')
    .reduce((acc, c) => acc + c.valor_vendedor, 0)

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/gestao"
            className="p-2 rounded-xl hover:bg-white"
            style={{ border: '1px solid #e8e4dd' }}
          >
            <ArrowLeft size={16} style={{ color: '#2d1f4e' }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>
              {vendedor.nome}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {vendedor.tipo && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}
                >
                  {vendedor.tipo}
                </span>
              )}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={
                  vendedor.ativo
                    ? { backgroundColor: '#dcfce7', color: '#15803d' }
                    : { backgroundColor: '#fee2e2', color: '#b91c1c' }
                }
              >
                {vendedor.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/gestao/${vendedor.id}/editar`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#2d1f4e' }}
        >
          <Pencil size={14} />
          Editar
        </Link>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Produção do mês',    value: fmt(producaoMes) },
          { label: 'Produção total',      value: fmt(producaoTotal) },
          { label: 'Comissões pagas',     value: fmt(comissoesPagas) },
          { label: 'Comissões pendentes', value: fmt(comissoesPendentes) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid #e8e4dd' }}
          >
            <p className="text-xs font-semibold" style={{ color: '#9a918a' }}>{label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: '#2d1f4e' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Dados pessoais */}
      <div className={cardCls} style={cardStyle}>
        <p className={sectionTitleCls} style={sectionTitleStyle}>Dados Pessoais</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="CPF / CNPJ"         value={vendedor.cpf_cnpj} />
          <Campo label="RG"                 value={vendedor.rg} />
          <Campo label="Data de nascimento" value={vendedor.data_nascimento} />
          <Campo label="Sexo"               value={vendedor.sexo} />
          <Campo label="Telefone"           value={vendedor.telefone} />
          <Campo label="E-mail"             value={vendedor.email} />
          <Campo label="CEP"                value={vendedor.endereco_cep} />
          <Campo label="Logradouro"         value={vendedor.endereco_logradouro} />
          <Campo label="Número"             value={vendedor.endereco_numero} />
          <Campo label="Complemento"        value={vendedor.endereco_complemento} />
          <Campo label="Bairro"             value={vendedor.endereco_bairro} />
          <Campo label="Cidade"             value={vendedor.endereco_cidade} />
          <Campo label="Estado"             value={vendedor.endereco_estado} />
        </div>
      </div>

      {/* Dados profissionais */}
      <div className={cardCls} style={cardStyle}>
        <p className={sectionTitleCls} style={sectionTitleStyle}>Dados Profissionais</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="Tipo"             value={vendedor.tipo} />
          <Campo label="Corretora"        value={vendedor.corretora} />
          <Campo label="Nível"            value={vendedor.nivel} />
          <Campo label="Data de admissão" value={vendedor.data_admissao} />
          <Campo label="Data de demissão" value={vendedor.data_demissao} />
          <Campo label="SUSEP"            value={vendedor.susep} />
        </div>
      </div>

      {/* Bancário */}
      <div className={cardCls} style={cardStyle}>
        <p className={sectionTitleCls} style={sectionTitleStyle}>Informações Bancárias</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="Banco"         value={vendedor.banco} />
          <Campo label="Agência"       value={vendedor.agencia} />
          <Campo label="Conta"         value={vendedor.conta} />
          <Campo label="Tipo de conta" value={vendedor.tipo_conta} />
          <Campo label="PIX"           value={vendedor.pix} />
        </div>
      </div>

      {/* Observações */}
      {vendedor.observacoes && (
        <div className={cardCls} style={cardStyle}>
          <p className={sectionTitleCls} style={sectionTitleStyle}>Observações</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: '#4a4a4a' }}>
            {vendedor.observacoes}
          </p>
        </div>
      )}

      {/* Histórico de produção */}
      <div className={cardCls} style={cardStyle}>
        <p className={sectionTitleCls} style={sectionTitleStyle}>
          Histórico de Produção ({vendas.length} venda{vendas.length !== 1 ? 's' : ''})
        </p>
        {vendas.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: '#9a918a' }}>
            Nenhuma venda registada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e4dd' }}>
                  {['Cliente', 'Operadora', 'Valor', 'Data', 'Status'].map(h => (
                    <th
                      key={h}
                      className="text-left py-2 pr-4 font-semibold"
                      style={{ color: '#2d1f4e' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendas.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f4f1ec' }}>
                    <td className="py-2 pr-4" style={{ color: '#1a1a1a' }}>{v.cliente_nome}</td>
                    <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>{v.operadora}</td>
                    <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>{fmt(v.valor_plano)}</td>
                    <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>
                      {new Date(v.data_venda + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={
                          v.status === 'Ativo'
                            ? { backgroundColor: '#dcfce7', color: '#15803d' }
                            : { backgroundColor: '#fee2e2', color: '#b91c1c' }
                        }
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
