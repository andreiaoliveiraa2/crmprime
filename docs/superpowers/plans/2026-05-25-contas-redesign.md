# Redesign da Aba Contas — Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir ContasPagarSection + ContasReceberSection + DespesasFixasSection por uma seção unificada com sub-abas A Pagar / A Receber, suporte a tipos Única/Parcelada/Recorrente no formulário, e gestão de categorias com tipo_padrao nas Configurações.

**Architecture:** A `ContasUnificadasSection` (novo arquivo) substitui as 3 seções antigas no ContasTab. O `ContaModal` é reescrito com campo Tipo e lógica de criação por tipo. A `CategoriasDespesaSection` ganha campo `tipo_padrao`. Uma migration adiciona as colunas necessárias.

**Tech Stack:** Next.js 14+, React, TypeScript, Supabase, Tailwind CSS, lucide-react, xlsx, jspdf

---

## Mapa de Arquivos

| Arquivo | Ação | O que muda |
|---|---|---|
| `supabase/migrations/20260525_contas_redesign.sql` | Criar | Colunas novas em contas e categorias_despesa |
| `src/lib/types.ts` | Modificar | Adicionar campos em Conta e CategoriaDespesa |
| `src/components/CategoriasDespesaSection.tsx` | Modificar | Campo tipo_padrao no modal e listagem |
| `src/components/ContasUnificadasSection.tsx` | Criar | Sub-abas A Pagar/A Receber, filtros, tabela, export |
| `src/components/ContasTab.tsx` | Modificar | Remover seções antigas, importar ContasUnificadasSection, atualizar props |
| `src/app/(protected)/configuracoes/page.tsx` | Modificar | Passar CategoriaDespesa[] completo (já faz isso) |

---

## Task 1: Migration — Novas colunas no banco

**Files:**
- Create: `supabase/migrations/20260525_contas_redesign.sql`

- [ ] **Criar o arquivo de migration**

```sql
-- contas: suporte a tipos de lançamento e agrupamento de parcelas
alter table contas
  add column if not exists tipo_lancamento text not null default 'unica'
    check (tipo_lancamento in ('unica', 'parcelada', 'recorrente')),
  add column if not exists grupo_id       uuid,
  add column if not exists parcela_numero integer,
  add column if not exists total_parcelas integer;

-- categorias_despesa: tipo padrão por categoria
alter table categorias_despesa
  add column if not exists tipo_padrao text not null default 'unica'
    check (tipo_padrao in ('unica', 'recorrente'));

-- Atualizar tipo_padrao das categorias padrão
update categorias_despesa set tipo_padrao = 'recorrente'
  where nome in ('Aluguel','Internet','Telefone','Contador','Sistema','Salário');

update categorias_despesa set tipo_padrao = 'unica'
  where nome in ('Imposto','Outros');

-- contas geradas por despesas_fixas existentes marcadas como recorrente
update contas set tipo_lancamento = 'recorrente'
  where despesa_fixa_id is not null;
```

- [ ] **Aplicar a migration no Supabase**

No terminal do projeto:
```bash
npx supabase db push
```
Ou no painel do Supabase: SQL Editor → cole o conteúdo e execute.

- [ ] **Verificar no Supabase** que as colunas apareceram em `contas` e `categorias_despesa`.

- [ ] **Commit**
```bash
git add supabase/migrations/20260525_contas_redesign.sql
git commit -m "feat: migration contas redesign - tipo_lancamento, grupo_id, tipo_padrao"
```

---

## Task 2: Atualizar tipos TypeScript

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Atualizar interface `Conta`** — adicionar os 4 campos novos:

Em `src/lib/types.ts`, localizar a interface `Conta` (linha ~295) e substituir por:

```typescript
export interface Conta {
  id: string
  tipo: 'receber' | 'pagar'
  descricao: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Recebido' | 'Pago'
  observacoes: string | null
  empresa: string | null
  categoria: string | null
  despesa_fixa_id: string | null
  tipo_lancamento: 'unica' | 'parcelada' | 'recorrente'
  grupo_id: string | null
  parcela_numero: number | null
  total_parcelas: number | null
  criado_em: string
}
export type ContaInsert = Omit<Conta, 'id' | 'criado_em'>
```

- [ ] **Atualizar interface `CategoriaDespesa`** — adicionar `tipo_padrao`:

Localizar a interface `CategoriaDespesa` (linha ~312) e substituir por:

```typescript
export interface CategoriaDespesa {
  id: string
  nome: string
  ativo: boolean
  tipo_padrao: 'unica' | 'recorrente'
  criado_em: string
}
```

- [ ] **Verificar que o TypeScript não quebrou** — rodar:
```bash
npx tsc --noEmit
```
Ignorar erros sobre campos faltando nos lugares onde `categorias` ainda é `string[]` — serão corrigidos nas tasks seguintes.

- [ ] **Commit**
```bash
git add src/lib/types.ts
git commit -m "feat: adiciona tipo_lancamento/grupo_id em Conta e tipo_padrao em CategoriaDespesa"
```

---

## Task 3: Atualizar CategoriasDespesaSection com tipo_padrao

**Files:**
- Modify: `src/components/CategoriasDespesaSection.tsx`

- [ ] **Reescrever o componente** com o campo tipo_padrao no modal e na listagem:

```typescript
'use client'

import { useState } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CategoriaDespesa } from '@/lib/types'

interface Props {
  categorias: CategoriaDespesa[]
}

export default function CategoriasDespesaSection({ categorias }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [editando, setEditando] = useState<CategoriaDespesa | null>(null)
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [tipoPadrao, setTipoPadrao] = useState<'unica' | 'recorrente'>('unica')
  const [ativo, setAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function abrirNovo() {
    setNome(''); setTipoPadrao('unica'); setAtivo(true); setEditando(null); setCriando(true); setErro('')
  }

  function abrirEditar(c: CategoriaDespesa) {
    setNome(c.nome); setTipoPadrao(c.tipo_padrao); setAtivo(c.ativo); setEditando(c); setCriando(false); setErro('')
  }

  function fechar() {
    setCriando(false); setEditando(null); setErro('')
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true); setErro('')

    if (editando) {
      const { error } = await supabase
        .from('categorias_despesa')
        .update({ nome: nome.trim(), ativo, tipo_padrao: tipoPadrao })
        .eq('id', editando.id)
      if (error) { setErro('Erro: ' + error.message); setSalvando(false); return }
    } else {
      const { error } = await supabase
        .from('categorias_despesa')
        .insert({ nome: nome.trim(), ativo, tipo_padrao: tipoPadrao })
      if (error) { setErro('Erro: ' + error.message); setSalvando(false); return }
    }

    setSalvando(false)
    fechar()
    router.refresh()
  }

  const modalAberto = criando || !!editando

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e4dd' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>
            Categorias de Despesas
          </h3>
          <p className="text-sm mt-0.5" style={{ color: '#7a7065' }}>
            Categorias disponíveis no cadastro de contas. O tipo padrão pré-seleciona o campo Tipo no formulário.
          </p>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Plus size={13} /> Nova categoria
        </button>
      </div>

      <div className="space-y-2">
        {categorias.length === 0 && (
          <p className="text-sm" style={{ color: '#9a918a' }}>Nenhuma categoria cadastrada.</p>
        )}
        {categorias.map(c => (
          <div key={c.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#f9f7f4', border: '1px solid #e8e4dd' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: c.ativo ? '#2d1f4e' : '#9ca3af' }}>
                {c.nome}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#9a918a' }}>
                {c.tipo_padrao === 'recorrente' ? '🔁 Recorrente' : '📄 Única'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: c.ativo ? '#dcfce7' : '#f3f4f6',
                  color: c.ativo ? '#15803d' : '#6b7280',
                }}>
                {c.ativo ? 'Ativa' : 'Inativa'}
              </span>
              <button onClick={() => abrirEditar(c)}
                className="p-1.5 rounded-lg hover:bg-white transition-colors"
                style={{ color: '#9a918a' }}>
                <Pencil size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e8e4dd' }}>
              <h3 className="text-base font-bold" style={{ color: '#2d1f4e' }}>
                {editando ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={fechar} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} style={{ color: '#9a918a' }} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: '#e8e4dd' }}
                  placeholder="Ex: Aluguel, Contador, Retirada de Sócio..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Tipo padrão</label>
                <div className="flex gap-3">
                  {(['unica', 'recorrente'] as const).map(v => (
                    <button key={v} type="button"
                      onClick={() => setTipoPadrao(v)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                      style={{
                        borderColor: tipoPadrao === v ? '#2d1f4e' : '#e8e4dd',
                        backgroundColor: tipoPadrao === v ? '#2d1f4e' : '#ffffff',
                        color: tipoPadrao === v ? '#ffffff' : '#5a4e3c',
                      }}>
                      {v === 'unica' ? '📄 Única' : '🔁 Recorrente'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Status</label>
                <div className="flex gap-3">
                  {(['Ativa', 'Inativa'] as const).map(v => (
                    <button key={v} type="button"
                      onClick={() => setAtivo(v === 'Ativa')}
                      className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                      style={{
                        borderColor: (v === 'Ativa') === ativo ? '#2d1f4e' : '#e8e4dd',
                        backgroundColor: (v === 'Ativa') === ativo ? '#2d1f4e' : '#ffffff',
                        color: (v === 'Ativa') === ativo ? '#ffffff' : '#5a4e3c',
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {erro && <p className="text-sm" style={{ color: '#b5455a' }}>{erro}</p>}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#e8e4dd' }}>
              <button onClick={fechar} disabled={salvando}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80"
                style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Verificar no navegador** — ir em Configurações, abrir uma categoria, confirmar que o campo "Tipo padrão" aparece com os botões Única/Recorrente.

- [ ] **Commit**
```bash
git add src/components/CategoriasDespesaSection.tsx
git commit -m "feat: adiciona tipo_padrao nas categorias de despesas"
```

---

## Task 4: Criar ContasUnificadasSection

**Files:**
- Create: `src/components/ContasUnificadasSection.tsx`

Este componente substitui ContasPagarSection + ContasReceberSection + DespesasFixasSection.

- [ ] **Criar o arquivo** `src/components/ContasUnificadasSection.tsx`:

```typescript
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

  // Auto-sugerir tipo ao selecionar categoria
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
      // Edição: sempre atualiza só este lançamento
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
        // Atualiza também a despesa_fixa subjacente (valor + dia)
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

    // Criação nova
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
      const dia = Number(diaMes).toString().padStart(2, '0')
      const [y, m] = vencimento.split('-')
      const vencimentoFormatado = `${y}-${m}-${dia}`

      // Cria a despesa_fixa (template recorrente)
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

      // Gera o lançamento do mês do vencimento informado
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

// ─── ContasTab interno (A Pagar ou A Receber) ─────────────────────────────────

interface ContasTabProps {
  tipo: 'pagar' | 'receber'
  contas: Conta[]
  cnpjs: CnpjRecebimento[]
  categorias: CategoriaDespesa[]
  onAtualizar: () => void
}

function ContasSubTab({ tipo, contas, cnpjs, categorias, onAtualizar }: ContasTabProps) {
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
      {/* Cabeçalho */}
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

      {/* Filtros */}
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

      {/* Tabela */}
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
      {/* Header com título e sub-abas */}
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
```

- [ ] **Commit**
```bash
git add src/components/ContasUnificadasSection.tsx
git commit -m "feat: cria ContasUnificadasSection com sub-abas, modal Tipo e export"
```

---

## Task 5: Atualizar ContasTab — remover seções antigas e wiring

**Files:**
- Modify: `src/components/ContasTab.tsx`

- [ ] **No topo do arquivo**, substituir o import e a interface Props:

Remover a linha:
```typescript
import { Conta, ContaInsert, CnpjRecebimento, DespesaFixa, DespesaFixaInsert, DespesaCategoria, Comissao, Venda } from '@/lib/types'
```
Substituir por:
```typescript
import { Conta, CnpjRecebimento, DespesaFixa, Comissao, Venda, CategoriaDespesa } from '@/lib/types'
import ContasUnificadasSection from '@/components/ContasUnificadasSection'
```

- [ ] **Atualizar a interface Props** — trocar `categorias: string[]` por `categorias: CategoriaDespesa[]`:

```typescript
interface Props {
  contas: Conta[]
  comissoes: Comissao[]
  vendas: Venda[]
  onAtualizar: () => void
  cnpjs: CnpjRecebimento[]
  despesasFixas: DespesaFixa[]
  categorias: CategoriaDespesa[]
}
```

- [ ] **No final do arquivo**, no componente `ContasTab` (função default export), substituir as seções antigas pelo novo componente:

Localizar o bloco do `return` do `ContasTab` (começa com `<div className="space-y-6">`).

Substituir a seção que contém `DespesasFixasSection`, `ContasPagarSection`, `ContasReceberSection` por `ContasUnificadasSection`:

```typescript
export default function ContasTab({ contas, comissoes, vendas, onAtualizar, cnpjs, despesasFixas, categorias }: Props) {
  return (
    <div className="space-y-6">
      <SummaryCards contas={contas} comissoes={comissoes} />

      <ComissoesVendedoresSection
        comissoes={comissoes}
        vendas={vendas}
        onAtualizar={onAtualizar}
      />

      <ComissoesAReceberSection
        comissoes={comissoes}
        vendas={vendas}
        onAtualizar={onAtualizar}
      />

      <ContasUnificadasSection
        contas={contas}
        cnpjs={cnpjs}
        categorias={categorias}
        onAtualizar={onAtualizar}
      />
    </div>
  )
}
```

- [ ] **Remover os componentes que não são mais usados** de dentro de `ContasTab.tsx`:
  - Remover a função `DespesasFixasSection` e seu modal `DespesaFixaModal`
  - Remover a função `ContasPagarSection`
  - Remover a função `ContasReceberSection`
  - Remover a função `ContaModal` (foi para ContasUnificadasSection)
  - Remover a função `StatusBadge` (foi para ContasUnificadasSection)
  - Remover as funções `exportExcel` e `exportPDF` (foram para ContasUnificadasSection)
  - **Manter**: `SummaryCards`, `ComissoesVendedoresSection`, `ComissoesAReceberSection`
  - **Manter os helpers**: `formatBRL`, `formatDate`, `todayStr`, `currentMonthPrefix`, `isOverdue` — ainda são usados pelas seções de comissões e SummaryCards que ficam no arquivo

- [ ] **Verificar TypeScript**:
```bash
npx tsc --noEmit
```

- [ ] **Commit**
```bash
git add src/components/ContasTab.tsx
git commit -m "feat: substitui seções antigas de contas por ContasUnificadasSection"
```

---

## Task 6: Atualizar a página do Financeiro e FinanceiroClient

**Files:**
- Modify: `src/app/(protected)/financeiro/page.tsx`
- Modify: `src/components/FinanceiroClient.tsx` (localizar prop `categorias`)

- [ ] **Em `financeiro/page.tsx`**, remover o `.map(c => c.nome)` na linha que passa categorias ao componente:

Localizar:
```typescript
categorias={((categoriasRaw ?? []) as CategoriaDespesa[]).map(c => c.nome)}
```
Substituir por:
```typescript
categorias={(categoriasRaw ?? []) as CategoriaDespesa[]}
```

- [ ] **Na mesma página**, atualizar a geração automática mensal de despesas_fixas para incluir `tipo_lancamento`:

Localizar o objeto `novasContas` (dentro de `despesasParaGerar.map`) e adicionar o campo:
```typescript
const novasContas = despesasParaGerar.map((d: DespesaFixa) => ({
  tipo: 'pagar' as const,
  descricao: d.nome,
  valor: d.valor,
  vencimento: `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(Math.min(d.dia_vencimento, ultimoDia)).padStart(2, '0')}`,
  status: 'Pendente',
  empresa: d.empresa,
  categoria: d.categoria,
  despesa_fixa_id: d.id,
  tipo_lancamento: 'recorrente' as const,
}))
```

- [ ] **Em `src/components/FinanceiroClient.tsx`**, localizar onde `categorias` é declarado nas props e mudar de `string[]` para `CategoriaDespesa[]`. Importar o tipo se necessário:
```typescript
import { ..., CategoriaDespesa } from '@/lib/types'
// e na interface de Props:
categorias: CategoriaDespesa[]
```

- [ ] **Verificar TypeScript**:
```bash
npx tsc --noEmit
```

- [ ] **Testar no navegador** — abrir Financeiro → aba Contas:
  - Confirmar que as duas sub-abas aparecem (A Pagar / A Receber)
  - Clicar em Adicionar em A Pagar → confirmar que aparece o campo Tipo
  - Escolher "Parcelada" → confirmar que aparece o campo Nº de parcelas com preview de datas
  - Escolher "Recorrente" → confirmar que aparece o campo Dia do mês
  - Escolher uma categoria com tipo_padrao='recorrente' → confirmar que o Tipo muda automaticamente
  - Criar uma conta única e verificar que aparece na lista
  - Criar uma conta parcelada (3x) e verificar que aparecem 3 linhas com "1/3", "2/3", "3/3"
  - Testar filtros (Status, Categoria, De/Até)
  - Testar Excel e PDF

- [ ] **Commit**
```bash
git add src/app/(protected)/financeiro/page.tsx
git commit -m "feat: passa CategoriaDespesa[] completo para ContasTab"
```

---

## Task 7: Teste final de regressão

- [ ] Abrir **Configurações** → verificar que Categorias agora mostra o tipo (🔁 Recorrente / 📄 Única)
- [ ] Editar uma categoria existente → confirmar que salva tipo_padrao corretamente
- [ ] Voltar ao **Financeiro → Contas → A Pagar** → verificar que contas antigas (geradas de despesas_fixas) aparecem com badge "Recorrente"
- [ ] Verificar que **comissões** (seções acima das contas) continuam funcionando normalmente
- [ ] Verificar que o **SummaryCards** no topo ainda mostra os totais corretos

- [ ] **Commit final**
```bash
git add -A
git commit -m "feat: redesign aba Contas - lista unificada, Única/Parcelada/Recorrente, categorias com tipo_padrao"
```
