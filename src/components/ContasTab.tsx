'use client'

import { useState, useMemo } from 'react'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import { Conta, ContaInsert } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  contas: Conta[]
  onAtualizar: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T00:00:00')
  return d < today
}

// ─── ContaModal ───────────────────────────────────────────────────────────────

interface ModalProps {
  tipo: 'receber' | 'pagar'
  contaEditando?: Conta
  onClose: () => void
  onSalvo: () => void
}

function ContaModal({ tipo, contaEditando, onClose, onSalvo }: ModalProps) {
  const supabase = createClient()

  const statusOpcoes: Conta['status'][] =
    tipo === 'receber' ? ['Pendente', 'Recebido'] : ['Pendente', 'Pago']

  const [descricao, setDescricao] = useState(contaEditando?.descricao ?? '')
  const [valor, setValor] = useState(contaEditando ? String(contaEditando.valor) : '')
  const [vencimento, setVencimento] = useState(contaEditando?.vencimento ?? '')
  const [status, setStatus] = useState<Conta['status']>(
    contaEditando?.status ?? 'Pendente'
  )
  const [observacoes, setObservacoes] = useState(contaEditando?.observacoes ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSalvar() {
    if (!descricao.trim()) { setErro('Descrição é obrigatória.'); return }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro('Valor inválido.'); return }
    if (!vencimento) { setErro('Vencimento é obrigatório.'); return }

    setSalvando(true)
    setErro(null)

    const dados: ContaInsert = {
      tipo,
      descricao: descricao.trim(),
      valor: Number(valor),
      vencimento,
      status,
      observacoes: observacoes.trim() || null,
    }

    let dbErr
    if (contaEditando) {
      const res = await supabase.from('contas').update(dados).eq('id', contaEditando.id)
      dbErr = res.error
    } else {
      const res = await supabase.from('contas').insert(dados)
      dbErr = res.error
    }

    setSalvando(false)
    if (dbErr) { setErro(dbErr.message); return }
    onSalvo()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>
            {contaEditando ? 'Editar Conta' : tipo === 'receber' ? 'Nova Conta a Receber' : 'Nova Conta a Pagar'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {erro && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</div>
        )}

        <div className="space-y-4">
          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#b89a6a' } as React.CSSProperties}
              placeholder="Ex: Mensalidade cliente XYZ"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$) *</label>
            <input
              type="number"
              value={valor}
              onChange={e => setValor(e.target.value)}
              min="0"
              step="0.01"
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
              placeholder="0,00"
            />
          </div>

          {/* Vencimento */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vencimento *</label>
            <input
              type="date"
              value={vencimento}
              onChange={e => setVencimento(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Conta['status'])}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
            >
              {statusOpcoes.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={3}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 rounded-xl py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#2d1f4e' }}
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

interface BadgeProps {
  conta: Conta
  onClick: () => void
}

function StatusBadge({ conta, onClick }: BadgeProps) {
  const { status, tipo } = conta
  // For tipo=receber: Pendente ↔ Recebido
  // For tipo=pagar: Pendente ↔ Pago
  const isClickable =
    (tipo === 'receber' && (status === 'Pendente' || status === 'Recebido')) ||
    (tipo === 'pagar' && (status === 'Pendente' || status === 'Pago'))

  let bg = '#fef3c7'
  let text = '#92400e'
  if (status === 'Recebido') { bg = '#dcfce7'; text = '#15803d' }
  if (status === 'Pago') { bg = '#dbeafe'; text = '#1d4ed8' }

  const title =
    tipo === 'receber'
      ? status === 'Pendente' ? 'Clique para marcar como Recebido' : 'Clique para marcar como Pendente'
      : status === 'Pendente' ? 'Clique para marcar como Pago' : 'Clique para marcar como Pendente'

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      title={isClickable ? title : undefined}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-opacity ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {status}
    </button>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  tipo: 'receber' | 'pagar'
  contas: Conta[]
  allContas: Conta[]
  onAtualizar: () => void
  today: string
}

function ContasSection({ tipo, contas, allContas, onAtualizar, today }: SectionProps) {
  const supabase = createClient()
  const [modalAberto, setModalAberto] = useState(false)
  const [contaEditando, setContaEditando] = useState<Conta | undefined>(undefined)

  const label = tipo === 'receber' ? 'Receber' : 'Pagar'
  const totalPendente = allContas
    .filter(c => c.tipo === tipo && c.status === 'Pendente')
    .reduce((sum, c) => sum + c.valor, 0)

  async function toggleStatus(conta: Conta) {
    let novoStatus: Conta['status']
    if (tipo === 'receber') {
      novoStatus = conta.status === 'Pendente' ? 'Recebido' : 'Pendente'
    } else {
      novoStatus = conta.status === 'Pendente' ? 'Pago' : 'Pendente'
    }
    await supabase.from('contas').update({ status: novoStatus }).eq('id', conta.id)
    onAtualizar()
  }

  async function handleDelete(conta: Conta) {
    if (!confirm(`Excluir "${conta.descricao}"? Esta ação não pode ser desfeita.`)) return
    await supabase.from('contas').delete().eq('id', conta.id)
    onAtualizar()
  }

  function abrirModal(conta?: Conta) {
    setContaEditando(conta)
    setModalAberto(true)
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#2d1f4e' }}>
              Contas a {label}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#b89a6a' }}>
              Total Pendente: <span className="font-semibold">{formatBRL(totalPendente)}</span>
            </p>
          </div>
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#2d1f4e' }}
          >
            <Plus size={13} />
            Adicionar
          </button>
        </div>

        {/* Table */}
        {contas.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Nenhuma conta encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">Descrição</th>
                  <th className="px-4 py-3 text-left font-medium">Valor</th>
                  <th className="px-4 py-3 text-left font-medium">Vencimento</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contas.map(conta => {
                  const overdue = conta.status === 'Pendente' && isOverdue(conta.vencimento)
                  return (
                    <tr key={conta.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{conta.descricao}</td>
                      <td className="px-4 py-3 text-green-700 font-medium">{formatBRL(conta.valor)}</td>
                      <td className="px-4 py-3">
                        <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {formatDate(conta.vencimento)}
                        </span>
                        {overdue && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            Vencido
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge conta={conta} onClick={() => toggleStatus(conta)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirModal(conta)}
                            title="Editar"
                            className="text-gray-400 hover:text-[#2d1f4e] transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(conta)}
                            title="Excluir"
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <ContaModal
          tipo={tipo}
          contaEditando={contaEditando}
          onClose={() => setModalAberto(false)}
          onSalvo={() => {
            setModalAberto(false)
            onAtualizar()
          }}
        />
      )}
    </>
  )
}

// ─── ContasTab (main export) ──────────────────────────────────────────────────

export default function ContasTab({ contas, onAtualizar }: Props) {
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | Conta['status']>('Todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const filtersActive = filtroStatus !== 'Todos' || !!dataInicio || !!dataFim

  const filteredContas = useMemo(() => {
    return contas.filter(c => {
      if (filtroStatus !== 'Todos' && c.status !== filtroStatus) return false
      if (dataInicio && c.vencimento < dataInicio) return false
      if (dataFim && c.vencimento > dataFim) return false
      return true
    })
  }, [contas, filtroStatus, dataInicio, dataFim])

  const receber = filteredContas.filter(c => c.tipo === 'receber')
  const pagar = filteredContas.filter(c => c.tipo === 'pagar')

  function limparFiltros() {
    setFiltroStatus('Todos')
    setDataInicio('')
    setDataFim('')
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Status</label>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)}
              className="border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 min-w-[130px]"
            >
              <option value="Todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Recebido">Recebido</option>
              <option value="Pago">Pago</option>
            </select>
          </div>

          {/* Data início */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Vencimento — de</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          {/* Data fim */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Vencimento — até</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          {filtersActive && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-1.5 border rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <X size={14} />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Two sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContasSection
          tipo="receber"
          contas={receber}
          allContas={contas}
          onAtualizar={onAtualizar}
          today={today}
        />
        <ContasSection
          tipo="pagar"
          contas={pagar}
          allContas={contas}
          onAtualizar={onAtualizar}
          today={today}
        />
      </div>
    </div>
  )
}
