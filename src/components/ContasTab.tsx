'use client'

import { useState, useMemo } from 'react'
import { Pencil, Trash2, Plus, X, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Clock, CalendarClock, UserCheck, Building2 } from 'lucide-react'
import { Conta, ContaInsert, CnpjRecebimento, DespesaFixa, DespesaFixaInsert, DespesaCategoria, Comissao, Venda } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  contas: Conta[]
  comissoes: Comissao[]
  vendas: Venda[]
  onAtualizar: () => void
  cnpjs: CnpjRecebimento[]
  despesasFixas: DespesaFixa[]
  categorias: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(s: string | null) {
  if (!s) return '—'
  const [y, m, d] = s.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function currentMonthPrefix() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function isOverdue(vencimento: string, status: string) {
  return status === 'Pendente' && vencimento.split('T')[0] < todayStr()
}

async function exportExcel(filename: string, rows: Record<string, string | number>[]) {
  const xlsx = await import('xlsx')
  const ws = xlsx.utils.json_to_sheet(rows)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, 'Contas')
  xlsx.writeFile(wb, `${filename}.xlsx`)
}

async function exportPDF(title: string, filename: string, headers: string[], rows: (string | number)[][]) {
  const { default: jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.setTextColor(45, 31, 78)
  doc.text(title, 14, 16)
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    headStyles: { fillColor: [45, 31, 78] as [number, number, number], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 248, 245] as [number, number, number] },
    styles: { fontSize: 9 },
  })
  doc.save(`${filename}.pdf`)
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ contas, comissoes }: { contas: Conta[]; comissoes: Comissao[] }) {
  const mes = currentMonthPrefix()
  const today = todayStr()

  const pagarMes = contas.filter(c => c.tipo === 'pagar' && c.vencimento.startsWith(mes))
  const comissoesMes = comissoes.filter(c => c.tipo === 'parcela' && c.status_vendedor === 'Pendente' && c.data_prevista?.startsWith(mes))
  const totalComissoesMes = comissoesMes.reduce((s, c) => s + (c.valor_vendedor ?? 0), 0)
  const totalPagar = pagarMes.reduce((s, c) => s + c.valor, 0) + totalComissoesMes
  const totalPago = pagarMes.filter(c => c.status === 'Pago').reduce((s, c) => s + c.valor, 0)
  const totalAtraso = contas
    .filter(c => c.tipo === 'pagar' && c.status === 'Pendente' && c.vencimento.split('T')[0] < today)
    .reduce((s, c) => s + c.valor, 0)

  const proxima = contas
    .filter(c => c.tipo === 'pagar' && c.status === 'Pendente' && c.vencimento.split('T')[0] >= today)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0]

  const totalReceberComissoes = comissoes
    .filter(c => c.status_empresa === 'Pendente' && c.data_prevista?.startsWith(mes))
    .reduce((s, c) => s + (c.valor_bruto ?? 0), 0)
  const totalReceberContas = contas
    .filter(c => c.tipo === 'receber' && c.status === 'Pendente' && c.vencimento.startsWith(mes))
    .reduce((s, c) => s + c.valor, 0)
  const totalReceber = totalReceberComissoes + totalReceberContas

  const cards = [
    {
      label: 'Total a pagar no mês',
      value: formatBRL(totalPagar),
      icon: Clock,
      cor: '#2d1f4e',
      bg: '#f0ecf8',
    },
    {
      label: 'Total já pago',
      value: formatBRL(totalPago),
      icon: CheckCircle2,
      cor: '#15803d',
      bg: '#dcfce7',
    },
    {
      label: 'Total em atraso',
      value: formatBRL(totalAtraso),
      icon: AlertCircle,
      cor: '#b91c1c',
      bg: '#fee2e2',
    },
    {
      label: 'Próximo vencimento',
      value: proxima ? formatDate(proxima.vencimento) : '—',
      icon: CalendarClock,
      cor: '#b89a6a',
      bg: '#fdf5e8',
    },
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, cor, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1px solid #e8e4dd' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg p-1.5" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color: cor }} />
              </div>
              <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: cor }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} style={{ color: '#15803d' }} />
          <span className="text-xs font-medium" style={{ color: '#15803d' }}>Total a receber no mês</span>
          <span className="text-xs" style={{ color: '#6b7280' }}>(comissões + contas)</span>
        </div>
        <span className="text-sm font-bold" style={{ color: '#15803d' }}>{formatBRL(totalReceber)}</span>
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, vencimento, onClick }: { status: string; vencimento: string; onClick?: () => void }) {
  const overdue = isOverdue(vencimento, status)
  let bg = '#fef3c7'; let color = '#92400e'; let label = status
  if (status === 'Pago') { bg = '#dcfce7'; color = '#15803d' }
  if (status === 'Recebido') { bg = '#dcfce7'; color = '#15803d' }
  if (overdue) { bg = '#fee2e2'; color = '#b91c1c'; label = 'Vencido' }

  return (
    <button
      onClick={onClick}
      title={onClick ? (status === 'Pago' ? 'Marcar como Pendente' : 'Marcar como Pago') : undefined}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${onClick ? 'cursor-pointer hover:opacity-75 transition-opacity' : 'cursor-default'}`}
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </button>
  )
}

// ─── DespesaFixa Modal ────────────────────────────────────────────────────────

interface DespesaModalProps {
  editando?: DespesaFixa
  cnpjs: CnpjRecebimento[]
  categorias: string[]
  onClose: () => void
  onSalvo: () => void
}

function DespesaFixaModal({ editando, cnpjs, categorias, onClose, onSalvo }: DespesaModalProps) {
  const supabase = createClient()
  const [nome, setNome] = useState(editando?.nome ?? '')
  const [valor, setValor] = useState(editando ? String(editando.valor) : '')
  const [dia, setDia] = useState(editando ? String(editando.dia_vencimento) : '')
  const [categoria, setCategoria] = useState<DespesaCategoria>(editando?.categoria ?? 'Outros')
  const [empresa, setEmpresa] = useState(editando?.empresa ?? '')
  const [ativo, setAtivo] = useState(editando?.ativo ?? true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSalvar() {
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro('Valor inválido.'); return }
    const diaNum = Number(dia)
    if (!dia || isNaN(diaNum) || diaNum < 1 || diaNum > 31) { setErro('Dia de vencimento inválido (1-31).'); return }

    setSalvando(true); setErro(null)

    const dados: DespesaFixaInsert = {
      nome: nome.trim(),
      valor: Number(valor),
      dia_vencimento: diaNum,
      categoria,
      empresa: empresa || null,
      ativo,
    }

    const res = editando
      ? await supabase.from('despesas_fixas').update(dados).eq('id', editando.id)
      : await supabase.from('despesas_fixas').insert(dados)

    setSalvando(false)
    if (res.error) { setErro(res.error.message); return }
    onSalvo(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>
            {editando ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {erro && <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
              placeholder="Ex: Aluguel do escritório" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$) *</label>
              <input type="number" value={valor} onChange={e => setValor(e.target.value)}
                min="0" step="0.01"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dia de vencimento *</label>
              <input type="number" value={dia} onChange={e => setDia(e.target.value)}
                min="1" max="31"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                placeholder="Ex: 10" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoria *</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2">
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
            <select value={empresa} onChange={e => setEmpresa(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2">
              <option value="">Selecionar...</option>
              {cnpjs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">Despesa ativa (gera conta todo mês)</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSalvar} disabled={salvando}
            className="flex-1 rounded-xl py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: '#2d1f4e' }}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Despesas Fixas Section ───────────────────────────────────────────────────

function DespesasFixasSection({ despesasFixas, contas, cnpjs, categorias, onAtualizar }: {
  despesasFixas: DespesaFixa[]
  contas: Conta[]
  cnpjs: CnpjRecebimento[]
  categorias: string[]
  onAtualizar: () => void
}) {
  const supabase = createClient()
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<DespesaFixa | undefined>()
  const mes = currentMonthPrefix()

  function contaDoMes(despesaId: string) {
    return contas.find(c => c.despesa_fixa_id === despesaId && c.vencimento.startsWith(mes))
  }

  async function handleDelete(d: DespesaFixa) {
    if (!confirm(`Excluir a despesa "${d.nome}"? As contas já geradas não serão removidas.`)) return
    await supabase.from('despesas_fixas').delete().eq('id', d.id)
    onAtualizar()
  }

  function abrirModal(d?: DespesaFixa) {
    setEditando(d)
    setModalAberto(true)
  }

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f0ece6' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#2d1f4e' }}>Despesas Fixas</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Geram automaticamente uma conta a pagar todo mês
            </p>
          </div>
          <button onClick={() => abrirModal()}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white hover:opacity-80"
            style={{ backgroundColor: '#2d1f4e' }}>
            <Plus size={13} /> Nova despesa
          </button>
        </div>

        {despesasFixas.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: '#9ca3af' }}>
            Nenhuma despesa fixa cadastrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#f9f8f6', color: '#6b7280' }}>
                  <th className="px-4 py-3 text-left font-medium">Nome</th>
                  <th className="px-4 py-3 text-left font-medium">Categoria</th>
                  <th className="px-4 py-3 text-left font-medium">Valor</th>
                  <th className="px-4 py-3 text-left font-medium">Dia</th>
                  <th className="px-4 py-3 text-left font-medium">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium">Este mês</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {despesasFixas.map(d => {
                  const conta = contaDoMes(d.id)
                  return (
                    <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${!d.ativo ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1f2937' }}>
                        {d.nome}
                        {!d.ativo && <span className="ml-2 text-xs text-gray-400">(inativa)</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{d.categoria}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>{formatBRL(d.valor)}</td>
                      <td className="px-4 py-3 text-gray-500">Dia {d.dia_vencimento}</td>
                      <td className="px-4 py-3 text-gray-500">{d.empresa ?? '—'}</td>
                      <td className="px-4 py-3">
                        {conta ? (
                          <StatusBadge status={conta.status} vencimento={conta.vencimento} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => abrirModal(d)} title="Editar"
                            className="text-gray-400 hover:text-[#2d1f4e] transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(d)} title="Excluir"
                            className="text-gray-400 hover:text-red-600 transition-colors">
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
        <DespesaFixaModal
          editando={editando}
          cnpjs={cnpjs}
          categorias={categorias}
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); onAtualizar() }}
        />
      )}
    </>
  )
}

// ─── Comissões Vendedores Section ────────────────────────────────────────────

function ComissoesVendedoresSection({ comissoes, vendas, onAtualizar }: {
  comissoes: Comissao[]
  vendas: Venda[]
  onAtualizar: () => void
}) {
  const supabase = createClient()
  const vendaMap = useMemo(() => new Map(vendas.map(v => [v.id, v])), [vendas])

  const mv = useMemo(() => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ultimo = new Date(ano, hoje.getMonth() + 1, 0).getDate()
    return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${String(ultimo).padStart(2, '0')}` }
  }, [])

  const pendentes = useMemo(() =>
    comissoes
      .filter(c =>
        c.tipo === 'parcela' &&
        c.status_vendedor === 'Pendente' &&
        (c.valor_vendedor ?? 0) > 0 &&
        c.data_prevista >= mv.inicio &&
        c.data_prevista <= mv.fim
      )
      .sort((a, b) => {
        if (a.venda_id !== b.venda_id) return a.venda_id.localeCompare(b.venda_id)
        return (a.numero_parcela ?? 0) - (b.numero_parcela ?? 0)
      }),
    [comissoes, mv]
  )

  const total = pendentes.reduce((s, c) => s + (c.valor_vendedor ?? 0), 0)

  async function marcarPago(c: Comissao) {
    await supabase.from('comissoes').update({
      status_vendedor: 'Recebido',
      data_recebida_vendedor: new Date().toISOString().split('T')[0],
    }).eq('id', c.id)
    onAtualizar()
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f0ece6' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#fce7f3' }}>
            <UserCheck size={15} style={{ color: '#be185d' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#2d1f4e' }}>Comissões a Pagar — Vendedores</h3>
            <p className="text-xs mt-0.5" style={{ color: '#b89a6a' }}>
              Total pendente: <span className="font-semibold">{formatBRL(total)}</span>
            </p>
          </div>
        </div>
      </div>

      {pendentes.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm" style={{ color: '#9ca3af' }}>
          Nenhuma comissão pendente para vendedores.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#f9f8f6', color: '#6b7280' }}>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Vendedor</th>
                <th className="px-4 py-3 text-left font-medium">Operadora</th>
                <th className="px-4 py-3 text-left font-medium">Parcela</th>
                <th className="px-4 py-3 text-left font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Vencimento</th>
                <th className="px-4 py-3 text-left font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendentes.map(c => {
                const venda = vendaMap.get(c.venda_id)
                const overdue = c.data_prevista && c.data_prevista < todayStr()
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors"
                    style={overdue ? { backgroundColor: '#fff8f8' } : undefined}>
                    <td className="px-4 py-3 font-medium" style={{ color: overdue ? '#b91c1c' : '#1f2937' }}>
                      {venda?.cliente_nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{venda?.vendedor ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{venda?.operadora ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">Parcela {c.numero_parcela}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#be185d' }}>
                      {formatBRL(c.valor_vendedor ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                        {formatDate(c.data_prevista)}
                      </span>
                      {overdue && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Vencido</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => marcarPago(c)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
                      >
                        Pagar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Conta Manual Modal ───────────────────────────────────────────────────────

interface ContaModalProps {
  tipo: 'receber' | 'pagar'
  editando?: Conta
  cnpjs: CnpjRecebimento[]
  categorias: string[]
  onClose: () => void
  onSalvo: () => void
}

function ContaModal({ tipo, editando, cnpjs, categorias, onClose, onSalvo }: ContaModalProps) {
  const supabase = createClient()
  const [descricao, setDescricao] = useState(editando?.descricao ?? '')
  const [valor, setValor] = useState(editando ? String(editando.valor) : '')
  const [vencimento, setVencimento] = useState(editando?.vencimento ?? '')
  const [status, setStatus] = useState<Conta['status']>(editando?.status ?? 'Pendente')
  const [empresa, setEmpresa] = useState(editando?.empresa ?? '')
  const [categoria, setCategoria] = useState(editando?.categoria ?? '')
  const [observacoes, setObservacoes] = useState(editando?.observacoes ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSalvar() {
    if (!descricao.trim()) { setErro('Descrição é obrigatória.'); return }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro('Valor inválido.'); return }
    if (!vencimento) { setErro('Vencimento é obrigatório.'); return }

    setSalvando(true); setErro(null)

    const dados: ContaInsert = {
      tipo,
      descricao: descricao.trim(),
      valor: Number(valor),
      vencimento,
      status,
      empresa: empresa || null,
      categoria: categoria || null,
      observacoes: observacoes.trim() || null,
      despesa_fixa_id: null,
    }

    const res = editando
      ? await supabase.from('contas').update(dados).eq('id', editando.id)
      : await supabase.from('contas').insert(dados)

    setSalvando(false)
    if (res.error) { setErro(res.error.message); return }
    onSalvo(); onClose()
  }

  const statusOpcoes: Conta['status'][] = tipo === 'receber' ? ['Pendente', 'Recebido'] : ['Pendente', 'Pago']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>
            {editando ? 'Editar Conta' : tipo === 'receber' ? 'Nova Conta a Receber' : 'Nova Conta a Pagar'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {erro && <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
            <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
              placeholder="Ex: Mensalidade cliente XYZ" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$) *</label>
              <input type="number" value={valor} onChange={e => setValor(e.target.value)}
                min="0" step="0.01"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2" placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vencimento *</label>
              <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2" />
            </div>
          </div>

          {tipo === 'pagar' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2">
                <option value="">Sem categoria</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
            <select value={empresa} onChange={e => setEmpresa(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2">
              <option value="">Selecionar...</option>
              {cnpjs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as Conta['status'])}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2">
              {statusOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
              rows={2} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
              placeholder="Opcional" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSalvar} disabled={salvando}
            className="flex-1 rounded-xl py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: '#2d1f4e' }}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Contas a Pagar Section ───────────────────────────────────────────────────

function ContasPagarSection({ contas, allContas, cnpjs, categorias, onAtualizar }: {
  contas: Conta[]
  allContas: Conta[]
  cnpjs: CnpjRecebimento[]
  categorias: string[]
  onAtualizar: () => void
}) {
  const supabase = createClient()
  const mv = useMemo(() => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ultimo = new Date(ano, hoje.getMonth() + 1, 0).getDate()
    return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${String(ultimo).padStart(2, '0')}` }
  }, [])
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Conta | undefined>()
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Pendente' | 'Pago' | 'Vencido'>('Todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [dataInicio, setDataInicio] = useState(mv.inicio)
  const [dataFim, setDataFim] = useState(mv.fim)
  const today = todayStr()

  const filtered = useMemo(() => {
    return contas.filter(c => {
      if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
      if (filtroCategoria && c.categoria !== filtroCategoria) return false
      if (dataInicio && c.vencimento < dataInicio) return false
      if (dataFim && c.vencimento > dataFim) return false
      if (filtroStatus === 'Vencido') return c.status === 'Pendente' && c.vencimento.split('T')[0] < today
      if (filtroStatus !== 'Todos') return c.status === filtroStatus
      return true
    })
  }, [contas, filtroStatus, filtroEmpresa, filtroCategoria, dataInicio, dataFim, today])

  const totalPendente = allContas.filter(c => c.status === 'Pendente').reduce((s, c) => s + c.valor, 0)
  const filtersActive = filtroStatus !== 'Todos' || !!filtroEmpresa || !!filtroCategoria ||
    dataInicio !== mv.inicio || dataFim !== mv.fim

  function limpar() {
    setFiltroStatus('Todos'); setFiltroEmpresa(''); setFiltroCategoria('')
    setDataInicio(mv.inicio); setDataFim(mv.fim)
  }

  async function toggleStatus(conta: Conta) {
    const novoStatus: Conta['status'] = conta.status === 'Pago' ? 'Pendente' : 'Pago'
    await supabase.from('contas').update({ status: novoStatus }).eq('id', conta.id)
    onAtualizar()
  }

  async function handleDelete(conta: Conta) {
    if (!confirm(`Excluir "${conta.descricao}"?`)) return
    await supabase.from('contas').delete().eq('id', conta.id)
    onAtualizar()
  }

  function abrirModal(c?: Conta) { setEditando(c); setModalAberto(true) }

  // Export
  function exportarExcel() {
    const rows = filtered.map(c => ({
      Descrição: c.descricao,
      Categoria: c.categoria ?? '—',
      Valor: c.valor,
      Vencimento: c.vencimento,
      Status: isOverdue(c.vencimento, c.status) ? 'Vencido' : c.status,
      Empresa: c.empresa ?? '—',
    }))
    exportExcel('contas_pagar', rows)
  }

  function exportarPDF() {
    const rows = filtered.map(c => [
      c.descricao,
      c.categoria ?? '—',
      formatBRL(c.valor),
      formatDate(c.vencimento),
      isOverdue(c.vencimento, c.status) ? 'Vencido' : c.status,
      c.empresa ?? '—',
    ])
    exportPDF('Contas a Pagar', 'contas_pagar', ['Descrição', 'Categoria', 'Valor', 'Vencimento', 'Status', 'Empresa'], rows)
  }

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid #f0ece6' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#2d1f4e' }}>Contas a Pagar</h3>
            <p className="text-xs mt-0.5" style={{ color: '#b89a6a' }}>
              Total pendente: <span className="font-semibold">{formatBRL(totalPendente)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportarExcel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: '#f4f1ec', color: '#2d1f4e', border: '1px solid #e8e4dd' }}>
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button onClick={exportarPDF}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: '#2d1f4e' }}>
              <FileText size={13} /> PDF
            </button>
            <button onClick={() => abrirModal()}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white hover:opacity-80"
              style={{ backgroundColor: '#b89a6a' }}>
              <Plus size={13} /> Adicionar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-5 py-3 flex flex-wrap items-end gap-3" style={{ borderBottom: '1px solid #f0ece6', backgroundColor: '#fdfcfb' }}>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Status</label>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)}
              className="border rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none" style={{ borderColor: '#e8e4dd' }}>
              <option value="Todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Empresa</label>
            <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none" style={{ borderColor: '#e8e4dd' }}>
              <option value="">Todas</option>
              {cnpjs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Categoria</label>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none" style={{ borderColor: '#e8e4dd' }}>
              <option value="">Todas</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">De</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={{ borderColor: '#e8e4dd' }} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Até</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={{ borderColor: '#e8e4dd' }} />
          </div>

          {filtersActive && (
            <button onClick={limpar}
              className="flex items-center gap-1 border rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 self-end"
              style={{ borderColor: '#e8e4dd' }}>
              <X size={12} /> Limpar
            </button>
          )}
        </div>

        {/* Tabela */}
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: '#9ca3af' }}>
            Nenhuma conta encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#f9f8f6', color: '#6b7280' }}>
                  <th className="px-4 py-3 text-left font-medium">Descrição</th>
                  <th className="px-4 py-3 text-left font-medium">Categoria</th>
                  <th className="px-4 py-3 text-left font-medium">Valor</th>
                  <th className="px-4 py-3 text-left font-medium">Vencimento</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(conta => {
                  const overdue = isOverdue(conta.vencimento, conta.status)
                  return (
                    <tr key={conta.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={overdue ? { backgroundColor: '#fff8f8' } : undefined}>
                      <td className="px-4 py-3 font-medium" style={{ color: overdue ? '#b91c1c' : '#1f2937' }}>
                        {conta.descricao}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{conta.categoria ?? '—'}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>{formatBRL(conta.valor)}</td>
                      <td className="px-4 py-3">
                        <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {formatDate(conta.vencimento)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={conta.status}
                          vencimento={conta.vencimento}
                          onClick={() => toggleStatus(conta)}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{conta.empresa ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => abrirModal(conta)} title="Editar"
                            className="text-gray-400 hover:text-[#2d1f4e] transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(conta)} title="Excluir"
                            className="text-gray-400 hover:text-red-600 transition-colors">
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
          tipo="pagar"
          editando={editando}
          cnpjs={cnpjs}
          categorias={categorias}
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); onAtualizar() }}
        />
      )}
    </>
  )
}

// ─── Comissões a Receber (Operadora) Section ─────────────────────────────────

function ComissoesAReceberSection({ comissoes, vendas, onAtualizar }: {
  comissoes: Comissao[]
  vendas: Venda[]
  onAtualizar: () => void
}) {
  const supabase = createClient()
  const vendaMap = useMemo(() => new Map(vendas.map(v => [v.id, v])), [vendas])

  const mv = useMemo(() => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ultimo = new Date(ano, hoje.getMonth() + 1, 0).getDate()
    return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${String(ultimo).padStart(2, '0')}` }
  }, [])

  const [dataInicio, setDataInicio] = useState(mv.inicio)
  const [dataFim, setDataFim] = useState(mv.fim)

  const temFiltro = dataInicio !== mv.inicio || dataFim !== mv.fim
  function limpar() { setDataInicio(mv.inicio); setDataFim(mv.fim) }

  const pendentes = useMemo(() =>
    comissoes
      .filter(c =>
        c.status_empresa === 'Pendente' &&
        c.data_prevista >= dataInicio &&
        c.data_prevista <= dataFim
      )
      .sort((a, b) => {
        if (a.venda_id !== b.venda_id) return a.venda_id.localeCompare(b.venda_id)
        if (a.tipo === 'parcela' && b.tipo === 'vitalicio') return -1
        if (a.tipo === 'vitalicio' && b.tipo === 'parcela') return 1
        return (a.numero_parcela ?? 999) - (b.numero_parcela ?? 999)
      }),
    [comissoes, dataInicio, dataFim]
  )

  const total = pendentes.reduce((s, c) => s + (c.valor_bruto ?? 0), 0)

  async function marcarRecebido(c: Comissao) {
    await supabase.from('comissoes').update({
      status_empresa: 'Recebido',
      data_recebida_empresa: new Date().toISOString().split('T')[0],
    }).eq('id', c.id)
    onAtualizar()
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #f0ece6' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#e0f2fe' }}>
              <Building2 size={15} style={{ color: '#0369a1' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#2d1f4e' }}>Comissões a Receber — Operadora</h3>
              <p className="text-xs mt-0.5" style={{ color: '#b89a6a' }}>
                Total no período: <span className="font-semibold">{formatBRL(total)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs" style={{ color: '#6b7280' }}>De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs" style={{ color: '#6b7280' }}>Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }}
              />
            </div>
            {temFiltro && (
              <button onClick={limpar} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-80" style={{ color: '#6b7280', border: '1px solid #e8e4dd' }}>
                <X size={11} /> Mês atual
              </button>
            )}
          </div>
        </div>
      </div>

      {pendentes.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm" style={{ color: '#9ca3af' }}>
          Nenhuma comissão pendente para o período selecionado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#f9f8f6', color: '#6b7280' }}>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Operadora</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Parcela</th>
                <th className="px-4 py-3 text-left font-medium">Valor Bruto</th>
                <th className="px-4 py-3 text-left font-medium">Data Prevista</th>
                <th className="px-4 py-3 text-left font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#f0ece6' }}>
              {pendentes.map(c => {
                const venda = vendaMap.get(c.venda_id)
                const overdue = c.data_prevista < new Date().toISOString().split('T')[0]
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>
                      {venda?.cliente_nome ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#6b7280' }}>
                      {venda?.operadora ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={c.tipo === 'parcela'
                          ? { backgroundColor: '#ede9f8', color: '#2d1f4e' }
                          : { backgroundColor: '#fef3c7', color: '#92400e' }}>
                        {c.tipo === 'parcela' ? 'Parcela' : 'Vitalício'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: '#6b7280' }}>
                      {c.numero_parcela ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#15803d' }}>
                      {formatBRL(c.valor_bruto ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                        {formatDate(c.data_prevista)}
                      </span>
                      {overdue && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Vencido</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => marcarRecebido(c)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#0369a1', color: '#ffffff' }}
                      >
                        Receber
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Contas a Receber Section ─────────────────────────────────────────────────

function ContasReceberSection({ contas, allContas, cnpjs, categorias, onAtualizar }: {
  contas: Conta[]
  allContas: Conta[]
  cnpjs: CnpjRecebimento[]
  categorias: string[]
  onAtualizar: () => void
}) {
  const supabase = createClient()
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Conta | undefined>()

  const totalPendente = allContas
    .filter(c => c.tipo === 'receber' && c.status === 'Pendente')
    .reduce((s, c) => s + c.valor, 0)

  async function toggleStatus(conta: Conta) {
    const novoStatus: Conta['status'] = conta.status === 'Recebido' ? 'Pendente' : 'Recebido'
    await supabase.from('contas').update({ status: novoStatus }).eq('id', conta.id)
    onAtualizar()
  }

  async function handleDelete(conta: Conta) {
    if (!confirm(`Excluir "${conta.descricao}"?`)) return
    await supabase.from('contas').delete().eq('id', conta.id)
    onAtualizar()
  }

  function abrirModal(c?: Conta) { setEditando(c); setModalAberto(true) }

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f0ece6' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#2d1f4e' }}>Contas a Receber</h3>
            <p className="text-xs mt-0.5" style={{ color: '#b89a6a' }}>
              Total pendente: <span className="font-semibold">{formatBRL(totalPendente)}</span>
            </p>
          </div>
          <button onClick={() => abrirModal()}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white hover:opacity-80"
            style={{ backgroundColor: '#2d1f4e' }}>
            <Plus size={13} /> Adicionar
          </button>
        </div>

        {contas.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: '#9ca3af' }}>
            Nenhuma conta encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#f9f8f6', color: '#6b7280' }}>
                  <th className="px-4 py-3 text-left font-medium">Descrição</th>
                  <th className="px-4 py-3 text-left font-medium">Valor</th>
                  <th className="px-4 py-3 text-left font-medium">Vencimento</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contas.map(conta => {
                  const overdue = isOverdue(conta.vencimento, conta.status)
                  return (
                    <tr key={conta.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{conta.descricao}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#15803d' }}>{formatBRL(conta.valor)}</td>
                      <td className="px-4 py-3">
                        <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {formatDate(conta.vencimento)}
                        </span>
                        {overdue && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Vencido</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={conta.status} vencimento={conta.vencimento} onClick={() => toggleStatus(conta)} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{conta.empresa ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => abrirModal(conta)} title="Editar"
                            className="text-gray-400 hover:text-[#2d1f4e] transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(conta)} title="Excluir"
                            className="text-gray-400 hover:text-red-600 transition-colors">
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
          tipo="receber"
          editando={editando}
          cnpjs={cnpjs}
          categorias={categorias}
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); onAtualizar() }}
        />
      )}
    </>
  )
}

// ─── ContasTab (main export) ──────────────────────────────────────────────────

export default function ContasTab({ contas, comissoes, vendas, onAtualizar, cnpjs, despesasFixas, categorias }: Props) {
  const pagar = contas.filter(c => c.tipo === 'pagar')
  const receber = contas.filter(c => c.tipo === 'receber')

  return (
    <div className="space-y-6">
      <SummaryCards contas={contas} comissoes={comissoes} />

      <DespesasFixasSection
        despesasFixas={despesasFixas}
        contas={contas}
        cnpjs={cnpjs}
        categorias={categorias}
        onAtualizar={onAtualizar}
      />

      <ComissoesVendedoresSection
        comissoes={comissoes}
        vendas={vendas}
        onAtualizar={onAtualizar}
      />

      <ContasPagarSection
        contas={pagar}
        allContas={pagar}
        cnpjs={cnpjs}
        categorias={categorias}
        onAtualizar={onAtualizar}
      />

      <ComissoesAReceberSection
        comissoes={comissoes}
        vendas={vendas}
        onAtualizar={onAtualizar}
      />

      <ContasReceberSection
        contas={receber}
        allContas={receber}
        cnpjs={cnpjs}
        categorias={categorias}
        onAtualizar={onAtualizar}
      />
    </div>
  )
}
