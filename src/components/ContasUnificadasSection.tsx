'use client'

import { useState, useMemo } from 'react'
import { Pencil, Trash2, Plus, X, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react'
import { Conta, ContaInsert, CnpjRecebimento, CategoriaDespesa, DespesaFixaInsert } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function currentMonth() {
  const d = new Date()
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ultimo = new Date(ano, d.getMonth() + 1, 0).getDate()
  return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${String(ultimo).padStart(2, '0')}` }
}

function isOverdue(vencimento: string, status: string) {
  return status === 'Pendente' && vencimento.split('T')[0] < todayStr()
}

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1 + months, d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, vencimento, onClick }: { status: Conta['status']; vencimento: string; onClick: () => void }) {
  const overdue = isOverdue(vencimento, status)
  const label = overdue ? 'Vencido' : status
  const style = overdue
    ? { backgroundColor: '#fee2e2', color: '#b91c1c' }
    : status === 'Pago' || status === 'Recebido'
      ? { backgroundColor: '#dcfce7', color: '#15803d' }
      : { backgroundColor: '#fef9c3', color: '#a16207' }
  return (
    <button onClick={onClick}
      className="px-2 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
      style={style}>
      {label}
    </button>
  )
}

// ─── ContaModal ───────────────────────────────────────────────────────────────

interface ContaModalProps {
  tipo: 'receber' | 'pagar'
  editando?: Conta
  cnpjs: CnpjRecebimento[]
  categorias: CategoriaDespesa[]
  onClose: () => void
  onSalvo: () => void
}

function ContaModal({ tipo, editando, cnpjs, categorias, onClose, onSalvo }: ContaModalProps) {
  const supabase = createClient()

  const [descricao, setDescricao] = useState(editando?.descricao ?? '')
  const [tipoLancamento, setTipoLancamento] = useState<'unica' | 'parcelada' | 'recorrente'>(
    editando?.tipo_lancamento ?? 'unica'
  )
  const [valor, setValor] = useState(editando ? String(editando.valor) : '')
  const [vencimento, setVencimento] = useState(editando?.vencimento ?? '')
  const [numParcelas, setNumParcelas] = useState('2')
  const [diaMes, setDiaMes] = useState(editando?.vencimento ? String(Number(editando.vencimento.split('-')[2])) : '5')
  const [categoriaId, setCategoriaId] = useState(editando?.categoria ?? '')
  const [empresa, setEmpresa] = useState(editando?.empresa ?? '')
  const [status, setStatus] = useState<Conta['status']>(editando?.status ?? 'Pendente')
  const [observacoes, setObservacoes] = useState(editando?.observacoes ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function handleCategoria(nome: string) {
    setCategoriaId(nome)
    if (!editando) {
      const cat = categorias.find(c => c.nome === nome)
      if (cat) setTipoLancamento(cat.tipo_padrao)
    }
  }

  async function handleSalvar() {
    if (!descricao.trim()) { setErro('Descrição é obrigatória.'); return }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro('Valor inválido.'); return }
    if (!vencimento) { setErro('Vencimento é obrigatório.'); return }
    if (tipoLancamento === 'parcelada') {
      const n = Number(numParcelas)
      if (!n || n < 2 || n > 120) { setErro('Nº de parcelas deve ser entre 2 e 120.'); return }
    }
    if (tipoLancamento === 'recorrente') {
      const d = Number(diaMes)
      if (!d || d < 1 || d > 28) { setErro('Dia do mês deve ser entre 1 e 28.'); return }
    }

    setSalvando(true); setErro(null)

    if (editando) {
      const { error } = await supabase.from('contas').update({
        descricao: descricao.trim(),
        valor: Number(valor),
        vencimento,
        status,
        empresa: empresa || null,
        categoria: categoriaId || null,
        observacoes: observacoes.trim() || null,
      }).eq('id', editando.id)

      if (editando.tipo_lancamento === 'recorrente' && editando.despesa_fixa_id) {
        await supabase.from('despesas_fixas').update({
          valor: Number(valor),
          dia_vencimento: Number(diaMes),
          nome: descricao.trim(),
          empresa: empresa || null,
          categoria: categoriaId || null,
        }).eq('id', editando.despesa_fixa_id)
      }

      setSalvando(false)
      if (error) { setErro(error.message); return }
      onSalvo(); onClose()
      return
    }

    if (tipoLancamento === 'unica') {
      const { error } = await supabase.from('contas').insert({
        tipo,
        descricao: descricao.trim(),
        valor: Number(valor),
        vencimento,
        status: 'Pendente',
        empresa: empresa || null,
        categoria: categoriaId || null,
        observacoes: observacoes.trim() || null,
        despesa_fixa_id: null,
        tipo_lancamento: 'unica',
        grupo_id: null,
        parcela_numero: null,
        total_parcelas: null,
      } as ContaInsert)
      setSalvando(false)
      if (error) { setErro(error.message); return }
    }

    if (tipoLancamento === 'parcelada') {
      const n = Number(numParcelas)
      const grupoId = crypto.randomUUID()
      const parcelas: ContaInsert[] = Array.from({ length: n }, (_, i) => ({
        tipo,
        descricao: `${descricao.trim()} — ${i + 1}/${n}`,
        valor: Number(valor),
        vencimento: addMonths(vencimento, i),
        status: 'Pendente',
        empresa: empresa || null,
        categoria: categoriaId || null,
        observacoes: observacoes.trim() || null,
        despesa_fixa_id: null,
        tipo_lancamento: 'parcelada',
        grupo_id: grupoId,
        parcela_numero: i + 1,
        total_parcelas: n,
      }))
      const { error } = await supabase.from('contas').insert(parcelas)
      setSalvando(false)
      if (error) { setErro(error.message); return }
    }

    if (tipoLancamento === 'recorrente') {
      const dia = String(Number(diaMes)).padStart(2, '0')
      const [y, m] = vencimento.split('-')
      const vencimentoFormatado = `${y}-${m}-${dia}`

      const { data: dfData, error: dfError } = await supabase
        .from('despesas_fixas')
        .insert({
          nome: descricao.trim(),
          valor: Number(valor),
          dia_vencimento: Number(diaMes),
          categoria: categoriaId || 'Outros',
          empresa: empresa || null,
          ativo: true,
        } as DespesaFixaInsert)
        .select()
        .single()

      if (dfError) { setSalvando(false); setErro(dfError.message); return }

      const { error: contaError } = await supabase.from('contas').insert({
        tipo,
        descricao: descricao.trim(),
        valor: Number(valor),
        vencimento: vencimentoFormatado,
        status: 'Pendente',
        empresa: empresa || null,
        categoria: categoriaId || null,
        observacoes: observacoes.trim() || null,
        despesa_fixa_id: dfData.id,
        tipo_lancamento: 'recorrente',
        grupo_id: null,
        parcela_numero: null,
        total_parcelas: null,
      } as ContaInsert)

      setSalvando(false)
      if (contaError) { setErro(contaError.message); return }
    }

    onSalvo(); onClose()
  }

  const statusOpcoes: Conta['status'][] = tipo === 'receber' ? ['Pendente', 'Recebido'] : ['Pendente', 'Pago']
  const categoriaAtiva = categorias.filter(c => c.ativo)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
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
              style={{ borderColor: '#e8e4dd' }}
              placeholder="Ex: Aluguel escritório" />
          </div>

          {!editando && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={tipoLancamento} onChange={e => setTipoLancamento(e.target.value as typeof tipoLancamento)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }}>
                <option value="unica">📄 Conta única</option>
                <option value="parcelada">📋 Parcelada</option>
                <option value="recorrente">🔁 Recorrente (todo mês)</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {tipoLancamento === 'parcelada' ? 'Valor por parcela (R$) *' : tipoLancamento === 'recorrente' ? 'Valor mensal (R$) *' : 'Valor (R$) *'}
              </label>
              <input type="number" value={valor} onChange={e => setValor(e.target.value)}
                min="0" step="0.01"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }} placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {tipoLancamento === 'recorrente' ? 'Mês de início *' : 'Vencimento *'}
              </label>
              <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }} />
            </div>
          </div>

          {tipoLancamento === 'parcelada' && !editando && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <label className="block text-xs font-medium text-blue-700 mb-1">Nº de parcelas</label>
              <input type="number" value={numParcelas} onChange={e => setNumParcelas(e.target.value)}
                min="2" max="120"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
                style={{ borderColor: '#bfdbfe' }} />
              {Number(numParcelas) >= 2 && vencimento && (
                <p className="text-xs text-blue-600 mt-1.5">
                  Cria {numParcelas} lançamentos: {formatDate(vencimento)} até {formatDate(addMonths(vencimento, Number(numParcelas) - 1))}
                </p>
              )}
            </div>
          )}

          {tipoLancamento === 'recorrente' && !editando && (
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
              <label className="block text-xs font-medium text-purple-700 mb-1">Dia do vencimento (1–28)</label>
              <input type="number" value={diaMes} onChange={e => setDiaMes(e.target.value)}
                min="1" max="28"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
                style={{ borderColor: '#e9d5ff' }} />
              <p className="text-xs text-purple-600 mt-1.5">Gera um novo lançamento automaticamente todo mês neste dia.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
            <select value={categoriaId} onChange={e => handleCategoria(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: '#e8e4dd' }}>
              <option value="">Sem categoria</option>
              {categoriaAtiva.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
            <select value={empresa} onChange={e => setEmpresa(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: '#e8e4dd' }}>
              <option value="">Selecionar...</option>
              {cnpjs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>

          {editando && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Conta['status'])}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }}>
                {statusOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
              rows={2}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ borderColor: '#e8e4dd' }} placeholder="Opcional" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50"
            style={{ borderColor: '#e8e4dd' }}>
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

// ─── ContasSubTab ─────────────────────────────────────────────────────────────

interface ContasSubTabProps {
  tipo: 'pagar' | 'receber'
  contas: Conta[]
  cnpjs: CnpjRecebimento[]
  categorias: CategoriaDespesa[]
  onAtualizar: () => void
}

function ContasSubTab({ tipo, contas, cnpjs, categorias, onAtualizar }: ContasSubTabProps) {
  const supabase = createClient()
  const mv = useMemo(currentMonth, [])
  const today = todayStr()

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Conta | undefined>()
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Pendente' | 'Pago' | 'Recebido' | 'Vencido'>('Todos')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [dataInicio, setDataInicio] = useState(mv.inicio)
  const [dataFim, setDataFim] = useState(mv.fim)

  const filtersActive = filtroStatus !== 'Todos' || !!filtroCategoria || !!filtroEmpresa ||
    dataInicio !== mv.inicio || dataFim !== mv.fim

  function limpar() {
    setFiltroStatus('Todos'); setFiltroCategoria(''); setFiltroEmpresa('')
    setDataInicio(mv.inicio); setDataFim(mv.fim)
  }

  const filtered = useMemo(() => {
    return contas.filter(c => {
      if (filtroCategoria && c.categoria !== filtroCategoria) return false
      if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
      if (dataInicio && c.vencimento < dataInicio) return false
      if (dataFim && c.vencimento > dataFim) return false
      if (filtroStatus === 'Vencido') return c.status === 'Pendente' && c.vencimento.split('T')[0] < today
      if (filtroStatus !== 'Todos') return c.status === filtroStatus
      return true
    }).sort((a, b) => a.vencimento.localeCompare(b.vencimento))
  }, [contas, filtroStatus, filtroCategoria, filtroEmpresa, dataInicio, dataFim, today])

  const totalPendente = contas.filter(c => c.status === 'Pendente').reduce((s, c) => s + c.valor, 0)
  const categoriasUnicas = useMemo(() => [...new Set(contas.map(c => c.categoria).filter(Boolean) as string[])].sort(), [contas])
  const empresasUnicas = useMemo(() => [...new Set(contas.map(c => c.empresa).filter(Boolean) as string[])].sort(), [contas])

  async function toggleStatus(conta: Conta) {
    const novoStatus: Conta['status'] = conta.tipo === 'receber'
      ? (conta.status === 'Recebido' ? 'Pendente' : 'Recebido')
      : (conta.status === 'Pago' ? 'Pendente' : 'Pago')
    await supabase.from('contas').update({ status: novoStatus }).eq('id', conta.id)
    onAtualizar()
  }

  async function handleDelete(conta: Conta) {
    if (!confirm(`Excluir "${conta.descricao}"?`)) return
    await supabase.from('contas').delete().eq('id', conta.id)
    onAtualizar()
  }

  function abrirModal(c?: Conta) { setEditando(c); setModalAberto(true) }

  function exportarExcel() {
    const rows = filtered.map(c => ({
      Descrição: c.descricao,
      Tipo: c.tipo_lancamento,
      Categoria: c.categoria ?? '—',
      Valor: c.valor,
      Vencimento: c.vencimento,
      Status: isOverdue(c.vencimento, c.status) ? 'Vencido' : c.status,
      Empresa: c.empresa ?? '—',
    }))
    exportExcel(`contas_${tipo}`, rows)
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
    exportPDF(
      tipo === 'pagar' ? 'Contas a Pagar' : 'Contas a Receber',
      `contas_${tipo}`,
      ['Descrição', 'Categoria', 'Valor', 'Vencimento', 'Status', 'Empresa'],
      rows
    )
  }

  const statusOpcoes = tipo === 'pagar'
    ? ['Todos', 'Pendente', 'Pago', 'Vencido']
    : ['Todos', 'Pendente', 'Recebido', 'Vencido']

  return (
    <>
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3"
        style={{ borderBottom: '1px solid #f0ece6' }}>
        <p className="text-xs" style={{ color: '#b89a6a' }}>
          Total pendente: <span className="font-semibold">{formatBRL(totalPendente)}</span>
        </p>
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

      <div className="px-5 py-3 flex flex-wrap items-end gap-3"
        style={{ borderBottom: '1px solid #f0ece6', backgroundColor: '#fdfcfb' }}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Status</label>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)}
            className="border rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none"
            style={{ borderColor: '#e8e4dd' }}>
            {statusOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Categoria</label>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none"
            style={{ borderColor: '#e8e4dd' }}>
            <option value="">Todas</option>
            {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Empresa</label>
          <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none"
            style={{ borderColor: '#e8e4dd' }}>
            <option value="">Todas</option>
            {empresasUnicas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">De</label>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            style={{ borderColor: '#e8e4dd' }} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Até</label>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            style={{ borderColor: '#e8e4dd' }} />
        </div>

        {filtersActive && (
          <button onClick={limpar}
            className="flex items-center gap-1 border rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 self-end"
            style={{ borderColor: '#e8e4dd' }}>
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm" style={{ color: '#9ca3af' }}>
          Nenhuma conta encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide"
                style={{ backgroundColor: '#f9f8f6', color: '#6b7280' }}>
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
                  <tr key={conta.id} className="hover:bg-gray-50 transition-colors"
                    style={overdue ? { backgroundColor: '#fff8f8' } : undefined}>
                    <td className="px-4 py-3" style={{ color: overdue ? '#b91c1c' : '#1f2937' }}>
                      <div className="font-medium">{conta.descricao}</div>
                      {conta.tipo_lancamento === 'recorrente' && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <RefreshCw size={10} style={{ color: '#7c3aed' }} />
                          <span className="text-xs" style={{ color: '#7c3aed' }}>Recorrente</span>
                        </div>
                      )}
                      {conta.tipo_lancamento === 'parcelada' && conta.parcela_numero && (
                        <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                          {conta.parcela_numero}/{conta.total_parcelas}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{conta.categoria ?? '—'}</td>
                    <td className="px-4 py-3 font-medium"
                      style={{ color: tipo === 'receber' ? '#15803d' : '#2d1f4e' }}>
                      {formatBRL(conta.valor)}
                    </td>
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

      {modalAberto && (
        <ContaModal
          tipo={tipo}
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

// ─── ContasUnificadasSection (export) ────────────────────────────────────────

interface Props {
  contas: Conta[]
  cnpjs: CnpjRecebimento[]
  categorias: CategoriaDespesa[]
  onAtualizar: () => void
}

export default function ContasUnificadasSection({ contas, cnpjs, categorias, onAtualizar }: Props) {
  const [aba, setAba] = useState<'pagar' | 'receber'>('pagar')
  const pagar = useMemo(() => contas.filter(c => c.tipo === 'pagar'), [contas])
  const receber = useMemo(() => contas.filter(c => c.tipo === 'receber'), [contas])

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
      <div className="px-5 pt-4" style={{ borderBottom: '1px solid #e8e4dd' }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: '#2d1f4e' }}>Contas</h3>
        <div className="flex gap-0">
          {(['pagar', 'receber'] as const).map(t => (
            <button key={t} onClick={() => setAba(t)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: aba === t ? '#2d1f4e' : '#9ca3af',
                borderBottom: aba === t ? '2px solid #2d1f4e' : '2px solid transparent',
                marginBottom: '-1px',
              }}>
              {t === 'pagar' ? 'A Pagar' : 'A Receber'}
            </button>
          ))}
        </div>
      </div>

      {aba === 'pagar' ? (
        <ContasSubTab
          key="pagar"
          tipo="pagar"
          contas={pagar}
          cnpjs={cnpjs}
          categorias={categorias}
          onAtualizar={onAtualizar}
        />
      ) : (
        <ContasSubTab
          key="receber"
          tipo="receber"
          contas={receber}
          cnpjs={cnpjs}
          categorias={categorias}
          onAtualizar={onAtualizar}
        />
      )}
    </div>
  )
}
