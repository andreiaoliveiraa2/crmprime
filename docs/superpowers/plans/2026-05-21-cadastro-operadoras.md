# Cadastro Completo de Operadoras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o cadastro simples de operadoras por um formulário completo com dados da empresa, regras de comissão e repasse por nível de vendedor; atualizar o cálculo automático de comissões para usar essas regras.

**Architecture:** Novas páginas em `/gestao/operadoras` (lista + form). Novo componente `OperadoraForm` cuida de três seções (dados, regras, repasse). A função `gerarComissoes` em `ClienteFormPosVenda` passa a usar `repasse_grupo_vendedor` e ignora `parcelas_regra`.

**Tech Stack:** Next.js 15 App Router, Supabase (client + server), TypeScript, Tailwind + estilos inline do projeto.

---

## File Map

| Ação | Arquivo |
|---|---|
| Criar | `supabase/migrations/20260521_operadoras_completo.sql` |
| Modificar | `src/lib/types.ts` |
| Criar | `src/components/OperadoraForm.tsx` |
| Criar | `src/app/(protected)/gestao/operadoras/page.tsx` |
| Criar | `src/app/(protected)/gestao/operadoras/nova/page.tsx` |
| Criar | `src/app/(protected)/gestao/operadoras/[id]/page.tsx` |
| Modificar | `src/app/(protected)/configuracoes/page.tsx` |
| Modificar | `src/app/(protected)/gestao/page.tsx` |
| Modificar | `src/components/ClienteFormPosVenda.tsx` |
| Modificar | `src/components/ComissoesTab.tsx` |

---

## Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/20260521_operadoras_completo.sql`

- [ ] **Criar o arquivo de migration**

```sql
-- supabase/migrations/20260521_operadoras_completo.sql

-- 1. Enriquecer tabela operadoras
ALTER TABLE operadoras
  ADD COLUMN IF NOT EXISTS cnpj         text,
  ADD COLUMN IF NOT EXISTS telefone     text,
  ADD COLUMN IF NOT EXISTS email_gestor text,
  ADD COLUMN IF NOT EXISTS site         text,
  ADD COLUMN IF NOT EXISTS empresa      text,
  ADD COLUMN IF NOT EXISTS observacoes  text;

-- 2. Enriquecer regras_comissao
ALTER TABLE regras_comissao
  ADD COLUMN IF NOT EXISTS desconta_imposto   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS percentual_imposto numeric  DEFAULT 0;

-- 3. Nova tabela de repasse por nível de vendedor
CREATE TABLE IF NOT EXISTS repasse_grupo_vendedor (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regra_id   uuid NOT NULL REFERENCES regras_comissao(id) ON DELETE CASCADE,
  nivel      text NOT NULL,
  percentual numeric NOT NULL DEFAULT 0,
  UNIQUE(regra_id, nivel)
);
```

- [ ] **Aplicar via Supabase MCP**

Usar a ferramenta Supabase MCP para executar o SQL acima. Se não disponível, executar diretamente no painel do Supabase (SQL Editor).

- [ ] **Commit**

```bash
git add supabase/migrations/20260521_operadoras_completo.sql
git commit -m "feat: migration — operadoras completo, repasse_grupo_vendedor"
```

---

## Task 2: Atualizar tipos TypeScript

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Substituir a interface `Operadora` e adicionar `RegraComissao` e `RepasseNivel`**

Localizar (linha ~101) e substituir:

```typescript
export interface Operadora {
  id: string
  nome: string
  ativo: boolean
  criado_em: string
}

export type OperadoraInsert = Omit<Operadora, 'id' | 'criado_em'>
```

Por:

```typescript
export interface Operadora {
  id: string
  nome: string
  ativo: boolean
  criado_em: string
  cnpj: string | null
  telefone: string | null
  email_gestor: string | null
  site: string | null
  empresa: string | null
  observacoes: string | null
}

export type OperadoraInsert = Omit<Operadora, 'id' | 'criado_em'>
```

Localizar (linha ~211) e substituir `RegraComissao`:

```typescript
export interface RegraComissao {
  id: string
  operadora: string
  percentual_total: number
  num_parcelas: number
  percentual_vitalicio: number
  desconta_imposto: boolean
  percentual_imposto: number
  ativo: boolean
  criado_em: string
}
export type RegraComissaoInsert = Omit<RegraComissao, 'id' | 'criado_em'>
```

Adicionar após `ParcelaRegra` (linha ~229):

```typescript
export interface RepasseNivel {
  id: string
  regra_id: string
  nivel: string
  percentual: number
}
export type RepasseNivelInsert = Omit<RepasseNivel, 'id'>
```

- [ ] **Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: types — Operadora completa, RegraComissao com imposto, RepasseNivel"
```

---

## Task 3: Criar componente OperadoraForm

**Files:**
- Create: `src/components/OperadoraForm.tsx`

- [ ] **Criar o arquivo**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Operadora, RegraComissao, RepasseNivel, EMPRESAS, NIVEIS_VENDEDOR } from '@/lib/types'

interface Props {
  operadora?: Operadora
  regra?: RegraComissao
  repasseNiveis?: RepasseNivel[]
}

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }
const sectionTitleCls = 'text-sm font-bold mb-4 pb-2 border-b'
const sectionTitleStyle = { color: '#2d1f4e', borderColor: '#e8e4dd' }

export default function OperadoraForm({ operadora, regra, repasseNiveis = [] }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const editando = !!operadora

  // Seção 1 — Dados da Operadora
  const [nome, setNome]               = useState(operadora?.nome ?? '')
  const [cnpj, setCnpj]               = useState(operadora?.cnpj ?? '')
  const [telefone, setTelefone]       = useState(operadora?.telefone ?? '')
  const [emailGestor, setEmailGestor] = useState(operadora?.email_gestor ?? '')
  const [site, setSite]               = useState(operadora?.site ?? '')
  const [empresa, setEmpresa]         = useState(operadora?.empresa ?? '')
  const [observacoes, setObservacoes] = useState(operadora?.observacoes ?? '')
  const [ativo, setAtivo]             = useState(operadora?.ativo ?? true)

  // Seção 2 — Regras de Comissão
  const [percentualTotal, setPercentualTotal]         = useState(regra?.percentual_total?.toString() ?? '')
  const [numParcelas, setNumParcelas]                 = useState(regra?.num_parcelas?.toString() ?? '12')
  const [descontaImposto, setDescontaImposto]         = useState(regra?.desconta_imposto ?? false)
  const [percentualImposto, setPercentualImposto]     = useState(regra?.percentual_imposto?.toString() ?? '')
  const [temVitalicio, setTemVitalicio]               = useState((regra?.percentual_vitalicio ?? 0) > 0)
  const [percentualVitalicio, setPercentualVitalicio] = useState(regra?.percentual_vitalicio?.toString() ?? '')

  // Seção 3 — Repasse por Nível
  const getRepasse = (nivel: string) =>
    repasseNiveis.find(r => r.nivel === nivel)?.percentual?.toString() ?? ''

  const [nivelIniciante, setNivelIniciante] = useState(getRepasse('Iniciante'))
  const [nivelExperiente, setNivelExperiente] = useState(getRepasse('Experiente'))
  const [nivelVip, setNivelVip]             = useState(getRepasse('VIP'))

  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }

    setLoading(true)

    // 1. Salvar operadora
    let opId = operadora?.id
    if (editando && opId) {
      const { error } = await supabase.from('operadoras').update({
        nome: nome.trim(), cnpj: cnpj.trim() || null, telefone: telefone.trim() || null,
        email_gestor: emailGestor.trim() || null, site: site.trim() || null,
        empresa: empresa || null, observacoes: observacoes.trim() || null, ativo,
      }).eq('id', opId)
      if (error) { setErro('Erro ao salvar operadora: ' + error.message); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('operadoras').insert({
        nome: nome.trim(), cnpj: cnpj.trim() || null, telefone: telefone.trim() || null,
        email_gestor: emailGestor.trim() || null, site: site.trim() || null,
        empresa: empresa || null, observacoes: observacoes.trim() || null, ativo,
      }).select().single()
      if (error || !data) { setErro('Erro ao criar operadora: ' + (error?.message ?? '')); setLoading(false); return }
      opId = data.id
    }

    // 2. Salvar regra de comissão
    const pctTotal = parseFloat(percentualTotal) || 0
    const nParcelas = parseInt(numParcelas, 10) || 1
    const pctImposto = parseFloat(percentualImposto) || 0
    const pctVitalicio = temVitalicio ? (parseFloat(percentualVitalicio) || 0) : 0

    let regraId = regra?.id
    if (regraId) {
      await supabase.from('regras_comissao').update({
        operadora: nome.trim(),
        percentual_total: pctTotal, num_parcelas: nParcelas,
        desconta_imposto: descontaImposto, percentual_imposto: pctImposto,
        percentual_vitalicio: pctVitalicio, ativo,
      }).eq('id', regraId)
    } else {
      const { data: rd, error: re } = await supabase.from('regras_comissao').insert({
        operadora: nome.trim(),
        percentual_total: pctTotal, num_parcelas: nParcelas,
        desconta_imposto: descontaImposto, percentual_imposto: pctImposto,
        percentual_vitalicio: pctVitalicio, ativo,
      }).select().single()
      if (re || !rd) { setErro('Operadora salva, mas erro na regra: ' + (re?.message ?? '')); setLoading(false); return }
      regraId = rd.id
    }

    // 3. Salvar repasse por nível
    if (regraId) {
      await supabase.from('repasse_grupo_vendedor').delete().eq('regra_id', regraId)
      const niveis = [
        { regra_id: regraId, nivel: 'Iniciante',  percentual: parseFloat(nivelIniciante)  || 0 },
        { regra_id: regraId, nivel: 'Experiente', percentual: parseFloat(nivelExperiente) || 0 },
        { regra_id: regraId, nivel: 'VIP',        percentual: parseFloat(nivelVip)        || 0 },
      ]
      await supabase.from('repasse_grupo_vendedor').insert(niveis)
    }

    setLoading(false)
    router.push('/gestao/operadoras')
    router.refresh()
  }

  const toggleBtn = (active: boolean, setValue: (v: boolean) => void, labelSim = 'Sim', labelNao = 'Não') => (
    <div className="flex gap-3 mt-1 max-w-xs">
      {([true, false] as const).map(v => (
        <button key={String(v)} type="button" onClick={() => setValue(v)}
          className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
          style={{
            borderColor: active === v ? '#2d1f4e' : '#e8e4dd',
            backgroundColor: active === v ? '#2d1f4e' : '#ffffff',
            color: active === v ? '#ffffff' : '#5a4e3c',
          }}>
          {v ? labelSim : labelNao}
        </button>
      ))}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">

      {/* ── Dados da Operadora ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h3 className={sectionTitleCls} style={sectionTitleStyle}>Dados da Operadora</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Nome <span style={{ color: '#b5455a' }}>*</span></label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Ex: Unimed" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>CNPJ</label>
            <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Telefone / WhatsApp</label>
            <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>E-mail do Gestor</label>
            <input type="email" value={emailGestor} onChange={e => setEmailGestor(e.target.value)}
              placeholder="gestor@operadora.com" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Site</label>
            <input type="text" value={site} onChange={e => setSite(e.target.value)}
              placeholder="www.operadora.com.br" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Empresa</label>
            <select value={empresa} onChange={e => setEmpresa(e.target.value)}
              className={inputCls} style={{ ...inputStyle, color: empresa ? '#1a1a1a' : '#9a918a' }}>
              <option value="">Selecione...</option>
              {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Status</label>
            <div className="flex gap-3 mt-1">
              {([true, false] as const).map(v => (
                <button key={String(v)} type="button" onClick={() => setAtivo(v)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                  style={{
                    borderColor: ativo === v ? '#2d1f4e' : '#e8e4dd',
                    backgroundColor: ativo === v ? '#2d1f4e' : '#ffffff',
                    color: ativo === v ? '#ffffff' : '#5a4e3c',
                  }}>
                  {v ? 'Ativa' : 'Inativa'}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Observações / Material de apoio</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
              rows={3} placeholder="Links, documentos, observações sobre esta operadora..."
              className={`${inputCls} resize-none`} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* ── Regras de Comissão ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h3 className={sectionTitleCls} style={sectionTitleStyle}>Regras de Comissão</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={labelCls} style={labelStyle}>% Total pago pela operadora</label>
            <input type="number" step="0.01" min="0" value={percentualTotal}
              onChange={e => setPercentualTotal(e.target.value)}
              placeholder="Ex: 300" className={inputCls} style={inputStyle} />
            <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Soma de todas as parcelas como % do valor do plano</p>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Número de Parcelas</label>
            <input type="number" step="1" min="1" max="60" value={numParcelas}
              onChange={e => setNumParcelas(e.target.value)}
              placeholder="Ex: 3" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Desconta Imposto?</label>
            {toggleBtn(descontaImposto, setDescontaImposto)}
          </div>

          {descontaImposto && (
            <div>
              <label className={labelCls} style={labelStyle}>% do Imposto</label>
              <input type="number" step="0.01" min="0" max="100" value={percentualImposto}
                onChange={e => setPercentualImposto(e.target.value)}
                placeholder="Ex: 13.5" className={inputCls} style={inputStyle} />
            </div>
          )}

          <div>
            <label className={labelCls} style={labelStyle}>Tem Vitalício?</label>
            {toggleBtn(temVitalicio, setTemVitalicio)}
          </div>

          {temVitalicio && (
            <div>
              <label className={labelCls} style={labelStyle}>% Vitalício (mensal, só empresa)</label>
              <input type="number" step="0.01" min="0" max="100" value={percentualVitalicio}
                onChange={e => setPercentualVitalicio(e.target.value)}
                placeholder="Ex: 2" className={inputCls} style={inputStyle} />
            </div>
          )}
        </div>
      </div>

      {/* ── Repasse por Nível do Vendedor ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <h3 className={sectionTitleCls} style={sectionTitleStyle}>Repasse por Nível do Vendedor</h3>
        <p className="text-xs mb-4" style={{ color: '#9a918a' }}>
          % de cada parcela que vai para o vendedor, de acordo com o nível dele.
          A empresa fica com o restante.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NIVEIS_VENDEDOR.map(nivel => {
            const val = nivel === 'Iniciante' ? nivelIniciante : nivel === 'Experiente' ? nivelExperiente : nivelVip
            const setVal = nivel === 'Iniciante' ? setNivelIniciante : nivel === 'Experiente' ? setNivelExperiente : setNivelVip
            return (
              <div key={nivel}>
                <label className={labelCls} style={labelStyle}>{nivel}</label>
                <div className="relative">
                  <input type="number" step="0.01" min="0" max="100" value={val}
                    onChange={e => setVal(e.target.value)}
                    placeholder="0" className={inputCls} style={inputStyle} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9a918a' }}>%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {erro && <p className="text-sm font-medium" style={{ color: '#b5455a' }}>{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          {loading ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Operadora'}
        </button>
        <button type="button" onClick={() => router.push('/gestao/operadoras')}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
          style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/OperadoraForm.tsx
git commit -m "feat: OperadoraForm — dados, regras de comissão e repasse por nível"
```

---

## Task 4: Página de lista de Operadoras

**Files:**
- Create: `src/app/(protected)/gestao/operadoras/page.tsx`

- [ ] **Criar o arquivo**

```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function OperadorasPage() {
  const supabase = await createClient()
  const { data: operadoras } = await supabase
    .from('operadoras')
    .select('*')
    .order('nome')

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Operadoras</h1>
          <p className="text-sm mt-1" style={{ color: '#7a7065' }}>
            Cadastros e regras de comissão por operadora
          </p>
        </div>
        <Link href="/gestao/operadoras/nova"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Plus size={15} /> Nova Operadora
        </Link>
      </div>

      {(!operadoras || operadoras.length === 0) && (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #e8e4dd' }}>
          <p className="text-sm" style={{ color: '#9a918a' }}>Nenhuma operadora cadastrada.</p>
          <Link href="/gestao/operadoras/nova"
            className="inline-block mt-4 px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
            Cadastrar primeira operadora
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(operadoras ?? []).map(op => (
          <div key={op.id} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-bold" style={{ color: '#2d1f4e' }}>{op.nome}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: op.ativo ? '#dcfce7' : '#fee2e2',
                  color: op.ativo ? '#15803d' : '#b91c1c',
                }}>
                {op.ativo ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            {op.empresa && (
              <p className="text-xs mb-1" style={{ color: '#9a918a' }}>{op.empresa}</p>
            )}
            {op.telefone && (
              <p className="text-xs mb-1" style={{ color: '#7a7065' }}>{op.telefone}</p>
            )}
            {op.email_gestor && (
              <p className="text-xs mb-3 truncate" style={{ color: '#7a7065' }}>{op.email_gestor}</p>
            )}
            <Link href={`/gestao/operadoras/${op.id}`}
              className="inline-block mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#f0ece6', color: '#2d1f4e' }}>
              Editar
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/\(protected\)/gestao/operadoras/page.tsx
git commit -m "feat: /gestao/operadoras — lista de operadoras"
```

---

## Task 5: Página Nova Operadora

**Files:**
- Create: `src/app/(protected)/gestao/operadoras/nova/page.tsx`

- [ ] **Criar o arquivo**

```tsx
import OperadoraForm from '@/components/OperadoraForm'
import Link from 'next/link'

export default function NovaOperadoraPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/gestao/operadoras"
          className="text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: '#9a918a' }}>
          ← Voltar para Operadoras
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2d1f4e' }}>Nova Operadora</h1>
      </div>
      <OperadoraForm />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/\(protected\)/gestao/operadoras/nova/page.tsx
git commit -m "feat: /gestao/operadoras/nova — página de cadastro"
```

---

## Task 6: Página de Edição de Operadora

**Files:**
- Create: `src/app/(protected)/gestao/operadoras/[id]/page.tsx`

- [ ] **Criar o arquivo**

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OperadoraForm from '@/components/OperadoraForm'
import Link from 'next/link'

export default async function EditarOperadoraPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: operadora } = await supabase
    .from('operadoras')
    .select('*')
    .eq('id', id)
    .single()

  if (!operadora) notFound()

  const { data: regra } = await supabase
    .from('regras_comissao')
    .select('*')
    .eq('operadora', operadora.nome)
    .maybeSingle()

  const { data: repasseNiveis } = regra
    ? await supabase.from('repasse_grupo_vendedor').select('*').eq('regra_id', regra.id)
    : { data: [] }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/gestao/operadoras"
          className="text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: '#9a918a' }}>
          ← Voltar para Operadoras
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2d1f4e' }}>
          {operadora.nome}
        </h1>
      </div>
      <OperadoraForm
        operadora={operadora}
        regra={regra ?? undefined}
        repasseNiveis={repasseNiveis ?? []}
      />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/\(protected\)/gestao/operadoras/\[id\]/page.tsx
git commit -m "feat: /gestao/operadoras/[id] — página de edição"
```

---

## Task 7: Configurações — remover OperadorasSection

**Files:**
- Modify: `src/app/(protected)/configuracoes/page.tsx`

- [ ] **Remover import e uso de OperadorasSection**

Remover a linha:
```typescript
import OperadorasSection from '@/components/OperadorasSection'
```

Remover o bloco:
```tsx
{/* Operadoras */}
<OperadorasSection />
```

Substituir por um link para a nova seção:
```tsx
{/* Operadoras */}
<div className="bg-white rounded-2xl border p-6 max-w-lg" style={{ borderColor: '#e8e4dd' }}>
  <h3 className="text-base font-semibold mb-2" style={{ color: '#2d1f4e' }}>Operadoras</h3>
  <p className="text-sm mb-4" style={{ color: '#7a7065' }}>
    Cadastre e configure operadoras, regras de comissão e repasse por nível.
  </p>
  <a href="/gestao/operadoras"
    className="inline-block px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
    style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
    Gerenciar Operadoras
  </a>
</div>
```

- [ ] **Commit**

```bash
git add src/app/\(protected\)/configuracoes/page.tsx
git commit -m "refactor: configuracoes — substituir OperadorasSection por link para /gestao/operadoras"
```

---

## Task 8: Gestão — adicionar link para Operadoras

**Files:**
- Modify: `src/app/(protected)/gestao/page.tsx`

- [ ] **Adicionar tabs Vendedores / Operadoras no topo da página**

Substituir o conteúdo do arquivo por:

```tsx
import { createClient } from '@/lib/supabase/server'
import GestaoClient from '@/components/GestaoClient'
import Link from 'next/link'

export default async function GestaoPage() {
  const supabase = await createClient()
  const { data: vendedores } = await supabase
    .from('vendedores')
    .select('*')
    .order('nome')

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: 'rgba(184,154,106,0.12)', color: '#2d1f4e', borderLeft: '3px solid #b89a6a' }}>
          Vendedores
        </span>
        <Link href="/gestao/operadoras"
          className="text-sm font-medium px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ color: '#7a7065' }}>
          Operadoras →
        </Link>
      </div>
      <GestaoClient vendedores={vendedores ?? []} />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/\(protected\)/gestao/page.tsx
git commit -m "feat: gestao — link rápido para /gestao/operadoras"
```

---

## Task 9: Atualizar gerarComissoes em ClienteFormPosVenda

**Files:**
- Modify: `src/components/ClienteFormPosVenda.tsx`

- [ ] **Substituir a função `gerarComissoes` inteira**

Localizar `async function gerarComissoes(` e substituir toda a função por:

```typescript
async function gerarComissoes(vendaId: string, dataVendaFinal: string, payloadLocal: ClienteInsert, empresa: string | null) {
  if (!payloadLocal.operadora || !payloadLocal.valor_plano) return

  const { data: regra } = await supabase
    .from('regras_comissao')
    .select('id, percentual_total, num_parcelas, percentual_vitalicio, desconta_imposto, percentual_imposto')
    .eq('operadora', payloadLocal.operadora)
    .eq('ativo', true)
    .maybeSingle()

  if (!regra) return

  let nivelPct = 0
  if (payloadLocal.vendedor) {
    const { data: vend } = await supabase
      .from('vendedores')
      .select('nivel')
      .eq('nome', payloadLocal.vendedor)
      .maybeSingle()

    if (vend?.nivel) {
      const { data: rep } = await supabase
        .from('repasse_grupo_vendedor')
        .select('percentual')
        .eq('regra_id', regra.id)
        .eq('nivel', vend.nivel)
        .maybeSingle()
      nivelPct = rep?.percentual ?? 0
    }
  }

  const comissoes: object[] = []

  for (let i = 1; i <= regra.num_parcelas; i++) {
    const valorBruto = payloadLocal.valor_plano * (regra.percentual_total / 100) / regra.num_parcelas
    const valorVendedor = valorBruto * (nivelPct / 100)
    let valorEmpresa = valorBruto - valorVendedor

    if (regra.desconta_imposto && regra.percentual_imposto > 0) {
      valorEmpresa = valorEmpresa * (1 - regra.percentual_imposto / 100)
    }

    const d = new Date(dataVendaFinal)
    d.setMonth(d.getMonth() + (i - 1))

    comissoes.push({
      venda_id: vendaId, tipo: 'parcela', numero_parcela: i,
      valor_bruto: valorBruto,
      valor_empresa: valorEmpresa,
      valor_vendedor: valorVendedor,
      status_empresa: 'Pendente', status_vendedor: 'Pendente',
      data_prevista: d.toISOString().split('T')[0],
      data_recebida_empresa: null, data_recebida_vendedor: null,
      empresa,
    })
  }

  if (regra.percentual_vitalicio > 0) {
    const valorBruto = payloadLocal.valor_plano * (regra.percentual_vitalicio / 100)
    const d = new Date(dataVendaFinal)
    d.setMonth(d.getMonth() + regra.num_parcelas)
    comissoes.push({
      venda_id: vendaId, tipo: 'vitalicio', numero_parcela: null,
      valor_bruto: valorBruto,
      valor_empresa: valorBruto,
      valor_vendedor: 0,
      status_empresa: 'Pendente', status_vendedor: 'Pendente',
      data_prevista: d.toISOString().split('T')[0],
      data_recebida_empresa: null, data_recebida_vendedor: null,
      empresa,
    })
  }

  await supabase.from('comissoes').delete().eq('venda_id', vendaId)
  if (comissoes.length > 0) await supabase.from('comissoes').insert(comissoes)
}
```

- [ ] **Commit**

```bash
git add src/components/ClienteFormPosVenda.tsx
git commit -m "feat: gerarComissoes — usa repasse_grupo_vendedor por nível, desconta imposto"
```

---

## Task 10: ComissoesTab — remover gerenciamento de regras

**Files:**
- Modify: `src/components/ComissoesTab.tsx`

- [ ] **Remover import RegraComissaoModal (linha 7)**

Remover:
```typescript
import RegraComissaoModal from './RegraComissaoModal'
```

- [ ] **Remover states de modal (linhas 50-51)**

Remover:
```typescript
const [modalAberto, setModalAberto] = useState(false)
const [regraEditando, setRegraEditando] = useState<(RegraComissao & { parcelas: ParcelaRegra[] }) | null>(null)
```

- [ ] **Remover funções deletarRegra e abrirEditarRegra (linhas ~152-165)**

Remover as funções `deletarRegra` e `abrirEditarRegra` inteiras.

- [ ] **Substituir botão Nova Regra e botões de ação nas regras por link para /gestao/operadoras**

Localizar o botão "Nova Regra" (texto "Nova Regra" ou similar na linha ~380) e substituir por:

```tsx
<a href="/gestao/operadoras"
  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
  style={{ backgroundColor: '#f0ece6', color: '#2d1f4e' }}>
  Gerenciar em Gestão →
</a>
```

Localizar os botões de editar (onClick `abrirEditarRegra`) e excluir (onClick `deletarRegra`) dentro da tabela de regras e removê-los completamente.

- [ ] **Remover o bloco do modal no JSX (linhas ~459-465)**

Remover:
```tsx
{modalAberto && (
  <RegraComissaoModal
    regraEditando={regraEditando ?? undefined}
    onClose={() => { setModalAberto(false); setRegraEditando(null) }}
    onSalvo={() => { setModalAberto(false); setRegraEditando(null); onAtualizar() }}
  />
)}
```

- [ ] **Remover ParcelaRegra do import de types se não for mais usado em outro lugar do arquivo**

Verificar se `ParcelaRegra` ainda é usado no arquivo. Se não, remover do import.

- [ ] **Verificar se TypeScript compila sem erros**

```bash
npx tsc --noEmit 2>&1 | grep "ComissoesTab\|OperadoraForm\|operadoras"
```

Expected: sem erros nestes arquivos.

- [ ] **Commit**

```bash
git add src/components/ComissoesTab.tsx
git commit -m "refactor: ComissoesTab — remover gerenciamento de regras, redirecionar para /gestao/operadoras"
```
