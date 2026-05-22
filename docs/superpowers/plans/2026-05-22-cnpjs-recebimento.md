# CNPJs de Recebimento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o array hardcoded `EMPRESAS` por um cadastro dinâmico de CNPJs de recebimento, permitir que cada operadora tenha regras por CNPJ e tornar o CNPJ de recebimento um campo obrigatório na venda.

**Architecture:** Abordagem aditiva — nova tabela `cnpjs_recebimento` + coluna `cnpj_recebimento_id` em `regras_comissao` e `vendas` (nullable, backward compat). Colunas `empresa` (texto) existentes permanecem para registros antigos. Constante `EMPRESAS` removida; substituída por dados dinâmicos do banco via hook `useCnpjsRecebimento`. `OperadoraForm` ganha abas por CNPJ para regras de comissão.

**Tech Stack:** Next.js 15 (App Router, Server Components), Supabase (PostgreSQL + JS client), TypeScript, Tailwind CSS inline styles.

---

## Mapa de Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/migrations/20260522_cnpjs_recebimento.sql` | Criar |
| `src/lib/types.ts` | Modificar |
| `src/lib/useCnpjsRecebimento.ts` | Criar |
| `src/components/CnpjRecebimentoSection.tsx` | Criar |
| `src/app/(protected)/configuracoes/page.tsx` | Modificar |
| `src/components/OperadoraForm.tsx` | Reescrever |
| `src/app/(protected)/gestao/operadoras/nova/page.tsx` | Modificar |
| `src/app/(protected)/gestao/operadoras/[id]/page.tsx` | Modificar |
| `src/app/(protected)/gestao/operadoras/page.tsx` | Modificar |
| `src/components/RegistrarVendaModal.tsx` | Modificar |
| `src/components/FinanceiroClient.tsx` | Modificar |
| `src/components/ProducaoTab.tsx` | Modificar |
| `src/components/ComissoesTab.tsx` | Modificar |
| `src/components/ContasTab.tsx` | Modificar |
| `src/components/RelatoriosTab.tsx` | Modificar |
| `src/app/(protected)/financeiro/page.tsx` | Modificar |

---

## Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/20260522_cnpjs_recebimento.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260522_cnpjs_recebimento.sql

-- 1. Tabela de CNPJs de Recebimento
CREATE TABLE IF NOT EXISTS cnpjs_recebimento (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  razao_social text,
  cnpj         text,
  banco        text,
  agencia      text,
  conta        text,
  tipo_conta   text,
  pix          text,
  status       text NOT NULL DEFAULT 'Ativo',
  criado_em    timestamptz NOT NULL DEFAULT now()
);

-- 2. Dados iniciais — os 3 CNPJs existentes
INSERT INTO cnpjs_recebimento (nome) VALUES
  ('A2 Prime'),
  ('A2 Corretora'),
  ('MEI')
ON CONFLICT DO NOTHING;

-- 3. Adicionar cnpj_recebimento_id em regras_comissao
ALTER TABLE regras_comissao
  ADD COLUMN IF NOT EXISTS cnpj_recebimento_id uuid REFERENCES cnpjs_recebimento(id);

-- 4. Adicionar cnpj_recebimento_id em vendas
ALTER TABLE vendas
  ADD COLUMN IF NOT EXISTS cnpj_recebimento_id uuid REFERENCES cnpjs_recebimento(id);
```

- [ ] **Step 2: Executar no Supabase**

Abrir o Supabase Dashboard → SQL Editor → colar o conteúdo do arquivo acima → Run.

Verificar que a tabela `cnpjs_recebimento` foi criada e tem 3 linhas:
```sql
SELECT * FROM cnpjs_recebimento;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260522_cnpjs_recebimento.sql
git commit -m "feat: migration — tabela cnpjs_recebimento e colunas FK em regras_comissao e vendas"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Substituir EMPRESAS/Empresa e adicionar CnpjRecebimento e RegraComCnpj**

Em `src/lib/types.ts`, substituir o bloco:
```typescript
export const EMPRESAS = ['A2 Prime', 'A2 Corretora', 'MEI Alessandro'] as const
export type Empresa = typeof EMPRESAS[number]
```
por:
```typescript
export interface CnpjRecebimento {
  id: string
  nome: string
  razao_social: string | null
  cnpj: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  tipo_conta: string | null
  pix: string | null
  status: string
  criado_em: string
}
export type CnpjRecebimentoInsert = Omit<CnpjRecebimento, 'id' | 'criado_em'>

// Usado pelo OperadoraForm para representar uma regra já vinculada a um CNPJ
export interface RegraComCnpj {
  id: string
  cnpjId: string
  cnpjNome: string
  percentual_total: number
  num_parcelas: number
  percentual_vitalicio: number
  desconta_imposto: boolean
  percentual_imposto: number
  ativo: boolean
  repasse: { nivel: string; percentual: number }[]
}
```

- [ ] **Step 2: Atualizar RegraComissao — adicionar cnpj_recebimento_id**

Localizar a interface `RegraComissao` e adicionar a linha:
```typescript
export interface RegraComissao {
  id: string
  operadora: string
  percentual_total: number
  num_parcelas: number
  percentual_vitalicio: number
  desconta_imposto: boolean
  percentual_imposto: boolean
  ativo: boolean
  criado_em: string
  cnpj_recebimento_id: string | null   // ← adicionar
}
```

- [ ] **Step 3: Atualizar Venda — adicionar cnpj_recebimento_id**

Localizar a interface `Venda` e adicionar:
```typescript
export interface Venda {
  id: string
  cliente_id: string | null
  cliente_nome: string
  operadora: string
  valor_plano: number
  vendedor: string
  data_venda: string
  status: 'Ativo' | 'Cancelado'
  origem: 'cliente' | 'manual'
  empresa: string | null
  cnpj_recebimento_id: string | null   // ← adicionar
  criado_em: string
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: erros de compilação nos arquivos que ainda importam `EMPRESAS` (os próximos tasks irão resolvê-los). Erros aceitáveis agora; não deve haver erros nos tipos recém-definidos.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: types — CnpjRecebimento, RegraComCnpj; remove EMPRESAS; adiciona cnpj_recebimento_id em RegraComissao e Venda"
```

---

## Task 3: Hook useCnpjsRecebimento

**Files:**
- Create: `src/lib/useCnpjsRecebimento.ts`

- [ ] **Step 1: Criar o hook**

```typescript
// src/lib/useCnpjsRecebimento.ts
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CnpjRecebimento } from '@/lib/types'

export function useCnpjsRecebimento() {
  const [cnpjs, setCnpjs] = useState<CnpjRecebimento[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('cnpjs_recebimento')
      .select('*')
      .eq('status', 'Ativo')
      .order('nome')
      .then(({ data }) => {
        if (data) setCnpjs(data as CnpjRecebimento[])
      })
  }, [])

  return cnpjs
}
```

- [ ] **Step 2: Verificar**

```bash
npx tsc --noEmit
```

Esperado: sem erros novos neste arquivo.

- [ ] **Step 3: Commit**

```bash
git add src/lib/useCnpjsRecebimento.ts
git commit -m "feat: hook useCnpjsRecebimento — lista CNPJs ativos do banco"
```

---

## Task 4: CnpjRecebimentoSection — Componente de Configurações

**Files:**
- Create: `src/components/CnpjRecebimentoSection.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// src/components/CnpjRecebimentoSection.tsx
'use client'

import { useState } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CnpjRecebimento, CnpjRecebimentoInsert } from '@/lib/types'

interface Props {
  cnpjs: CnpjRecebimento[]
  onAtualizar: () => void
}

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }

const EMPTY: CnpjRecebimentoInsert = {
  nome: '', razao_social: null, cnpj: null, banco: null,
  agencia: null, conta: null, tipo_conta: null, pix: null, status: 'Ativo',
}

export default function CnpjRecebimentoSection({ cnpjs, onAtualizar }: Props) {
  const supabase = createClient()
  const [editando, setEditando] = useState<CnpjRecebimento | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<CnpjRecebimentoInsert>(EMPTY)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function abrirNovo() {
    setForm(EMPTY)
    setEditando(null)
    setCriando(true)
    setErro('')
  }

  function abrirEditar(c: CnpjRecebimento) {
    setForm({
      nome: c.nome, razao_social: c.razao_social, cnpj: c.cnpj,
      banco: c.banco, agencia: c.agencia, conta: c.conta,
      tipo_conta: c.tipo_conta, pix: c.pix, status: c.status,
    })
    setEditando(c)
    setCriando(false)
    setErro('')
  }

  function fechar() {
    setCriando(false)
    setEditando(null)
    setErro('')
  }

  function set(field: keyof CnpjRecebimentoInsert, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value || null }))
  }

  async function salvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true)
    setErro('')

    if (editando) {
      const { error } = await supabase
        .from('cnpjs_recebimento')
        .update({ ...form, nome: form.nome.trim() })
        .eq('id', editando.id)
      if (error) { setErro('Erro: ' + error.message); setSalvando(false); return }
    } else {
      const { error } = await supabase
        .from('cnpjs_recebimento')
        .insert({ ...form, nome: form.nome.trim() })
      if (error) { setErro('Erro: ' + error.message); setSalvando(false); return }
    }

    setSalvando(false)
    fechar()
    onAtualizar()
  }

  const modalAberto = criando || !!editando

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e4dd' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>
            CNPJs / Contas de Recebimento
          </h3>
          <p className="text-sm mt-0.5" style={{ color: '#7a7065' }}>
            CNPJs usados para recebimento de comissões.
          </p>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Plus size={13} /> Adicionar CNPJ
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {cnpjs.length === 0 && (
          <p className="text-sm" style={{ color: '#9a918a' }}>Nenhum CNPJ cadastrado.</p>
        )}
        {cnpjs.map(c => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#f9f7f4', border: '1px solid #e8e4dd' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>{c.nome}</p>
              {c.cnpj && <p className="text-xs mt-0.5" style={{ color: '#7a7065' }}>CNPJ: {c.cnpj}</p>}
              {c.banco && <p className="text-xs" style={{ color: '#7a7065' }}>{c.banco} — Ag {c.agencia} / {c.conta}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: c.status === 'Ativo' ? '#dcfce7' : '#fee2e2',
                  color: c.status === 'Ativo' ? '#15803d' : '#b91c1c',
                }}>
                {c.status}
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

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e8e4dd' }}>
              <h3 className="text-base font-bold" style={{ color: '#2d1f4e' }}>
                {editando ? 'Editar CNPJ' : 'Novo CNPJ'}
              </h3>
              <button onClick={fechar} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} style={{ color: '#9a918a' }} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className={labelCls} style={labelStyle}>Nome *</label>
                <input className={inputCls} style={inputStyle} value={form.nome}
                  onChange={e => set('nome', e.target.value)} placeholder="Ex: A2 Prime" />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Razão Social</label>
                <input className={inputCls} style={inputStyle} value={form.razao_social ?? ''}
                  onChange={e => set('razao_social', e.target.value)} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>CNPJ</label>
                <input className={inputCls} style={inputStyle} value={form.cnpj ?? ''}
                  onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={labelStyle}>Banco</label>
                  <input className={inputCls} style={inputStyle} value={form.banco ?? ''}
                    onChange={e => set('banco', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Agência</label>
                  <input className={inputCls} style={inputStyle} value={form.agencia ?? ''}
                    onChange={e => set('agencia', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={labelStyle}>Conta</label>
                  <input className={inputCls} style={inputStyle} value={form.conta ?? ''}
                    onChange={e => set('conta', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Tipo</label>
                  <select className={inputCls} style={inputStyle} value={form.tipo_conta ?? ''}
                    onChange={e => set('tipo_conta', e.target.value)}>
                    <option value="">—</option>
                    <option value="Corrente">Corrente</option>
                    <option value="Poupança">Poupança</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>PIX</label>
                <input className={inputCls} style={inputStyle} value={form.pix ?? ''}
                  onChange={e => set('pix', e.target.value)} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Status</label>
                <div className="flex gap-3 mt-1">
                  {(['Ativo', 'Inativo'] as const).map(v => (
                    <button key={v} type="button" onClick={() => set('status', v)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                      style={{
                        borderColor: form.status === v ? '#2d1f4e' : '#e8e4dd',
                        backgroundColor: form.status === v ? '#2d1f4e' : '#ffffff',
                        color: form.status === v ? '#ffffff' : '#5a4e3c',
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
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
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

- [ ] **Step 2: Verificar**

```bash
npx tsc --noEmit
```

Esperado: sem erros neste arquivo.

- [ ] **Step 3: Commit**

```bash
git add src/components/CnpjRecebimentoSection.tsx
git commit -m "feat: CnpjRecebimentoSection — lista e CRUD de CNPJs de recebimento"
```

---

## Task 5: Configurações — Adicionar Seção de CNPJs

**Files:**
- Modify: `src/app/(protected)/configuracoes/page.tsx`

- [ ] **Step 1: Converter para Server Component com fetch e adicionar CnpjRecebimentoSection**

Substituir o conteúdo completo do arquivo:

```typescript
// src/app/(protected)/configuracoes/page.tsx
import { createClient } from '@/lib/supabase/server'
import AlterarSenhaForm from '@/components/AlterarSenhaForm'
import CnpjRecebimentoSection from '@/components/CnpjRecebimentoSection'
import { CnpjRecebimento } from '@/lib/types'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const [
    { data: { user } },
    { data: cnpjsRaw },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('cnpjs_recebimento').select('*').order('nome'),
  ])

  const cnpjs = (cnpjsRaw ?? []) as CnpjRecebimento[]

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Configurações</h1>
        <p className="text-sm mt-1" style={{ color: '#7a7065' }}>Dados da conta e cadastros do sistema</p>
      </div>

      <div className="space-y-6 max-w-lg">
        {/* Perfil */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e4dd' }}>
          <h3 className="text-base font-semibold mb-5" style={{ color: '#2d1f4e' }}>Perfil</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9a918a' }}>E-mail</label>
              <p className="text-sm px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#f4f1ec', color: '#2d1f4e', border: '1px solid #e8e4dd' }}>
                {user?.email ?? '—'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9a918a' }}>Conta criada em</label>
              <p className="text-sm px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#f4f1ec', color: '#2d1f4e', border: '1px solid #e8e4dd' }}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Operadoras */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e4dd' }}>
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

        {/* CNPJs de Recebimento */}
        <CnpjRecebimentoSection cnpjs={cnpjs} onAtualizar={() => {}} />

        {/* Alterar senha */}
        <AlterarSenhaForm />
      </div>
    </div>
  )
}
```

Nota: `onAtualizar={() => {}}` — em Server Components, o refresh acontece via `router.refresh()` interno ao CnpjRecebimentoSection. Como a página é Server Component e o componente de seção é Client, o `onAtualizar` pode chamar `router.refresh()`. Atualizar o `CnpjRecebimentoSection` para chamar `router.refresh()` em vez de `onAtualizar`:

No `CnpjRecebimentoSection.tsx`, adicionar no topo das imports:
```typescript
import { useRouter } from 'next/navigation'
```

No componente, adicionar:
```typescript
const router = useRouter()
```

E substituir todas as chamadas `onAtualizar()` por `router.refresh()`. Remover também a prop `onAtualizar` da interface Props e do componente:

```typescript
// Props simplificadas
interface Props {
  cnpjs: CnpjRecebimento[]
}

export default function CnpjRecebimentoSection({ cnpjs }: Props) {
  const router = useRouter()
  // ...
  // No lugar de onAtualizar():
  router.refresh()
  fechar()
```

E na `configuracoes/page.tsx`:
```tsx
<CnpjRecebimentoSection cnpjs={cnpjs} />
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Testar no browser**

Iniciar servidor: `npm run dev`

Acessar `/configuracoes`. Verificar:
- Seção "CNPJs / Contas de Recebimento" aparece
- Os 3 CNPJs (A2 Prime, A2 Corretora, MEI) são listados
- Botão "Adicionar CNPJ" abre modal
- Editar um CNPJ funciona (adicionar banco, por exemplo)
- Após salvar, lista atualiza

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/configuracoes/page.tsx src/components/CnpjRecebimentoSection.tsx
git commit -m "feat: configurações — seção CNPJs / Contas de Recebimento com CRUD"
```

---

## Task 6: OperadoraForm — Abas por CNPJ

**Files:**
- Rewrite: `src/components/OperadoraForm.tsx`
- Modify: `src/app/(protected)/gestao/operadoras/nova/page.tsx`
- Modify: `src/app/(protected)/gestao/operadoras/[id]/page.tsx`

### Parte A — Atualizar as páginas (data loading)

- [ ] **Step 1: Atualizar `nova/page.tsx`**

```typescript
// src/app/(protected)/gestao/operadoras/nova/page.tsx
import { createClient } from '@/lib/supabase/server'
import OperadoraForm from '@/components/OperadoraForm'
import Link from 'next/link'
import { CnpjRecebimento } from '@/lib/types'

export default async function NovaOperadoraPage() {
  const supabase = await createClient()
  const { data: cnpjsRaw } = await supabase
    .from('cnpjs_recebimento')
    .select('*')
    .eq('status', 'Ativo')
    .order('nome')

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
      <OperadoraForm cnpjsDisponiveis={(cnpjsRaw ?? []) as CnpjRecebimento[]} />
    </div>
  )
}
```

- [ ] **Step 2: Atualizar `[id]/page.tsx`**

```typescript
// src/app/(protected)/gestao/operadoras/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OperadoraForm from '@/components/OperadoraForm'
import Link from 'next/link'
import { CnpjRecebimento, RegraComCnpj } from '@/lib/types'

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

  // Carregar todas as regras desta operadora que têm CNPJ vinculado
  const { data: regrasRaw } = await supabase
    .from('regras_comissao')
    .select('*')
    .eq('operadora', operadora.nome)
    .not('cnpj_recebimento_id', 'is', null)

  const regraIds = (regrasRaw ?? []).map((r: { id: string }) => r.id)

  // Carregar repassos de todas essas regras em paralelo
  const [{ data: repasseTodos }, { data: cnpjsRaw }] = await Promise.all([
    regraIds.length > 0
      ? supabase.from('repasse_grupo_vendedor').select('*').in('regra_id', regraIds)
      : Promise.resolve({ data: [] }),
    supabase.from('cnpjs_recebimento').select('*').eq('status', 'Ativo').order('nome'),
  ])

  const cnpjsDisponiveis = (cnpjsRaw ?? []) as CnpjRecebimento[]

  const regrasExistentes: RegraComCnpj[] = (regrasRaw ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    cnpjId: r.cnpj_recebimento_id as string,
    cnpjNome: cnpjsDisponiveis.find(c => c.id === r.cnpj_recebimento_id)?.nome ?? '',
    percentual_total: (r.percentual_total as number) ?? 0,
    num_parcelas: (r.num_parcelas as number) ?? 1,
    percentual_vitalicio: (r.percentual_vitalicio as number) ?? 0,
    desconta_imposto: (r.desconta_imposto as boolean) ?? false,
    percentual_imposto: (r.percentual_imposto as number) ?? 0,
    ativo: (r.ativo as boolean) ?? true,
    repasse: ((repasseTodos ?? []) as Array<{ regra_id: string; nivel: string; percentual: number }>)
      .filter(rp => rp.regra_id === r.id)
      .map(rp => ({ nivel: rp.nivel, percentual: rp.percentual })),
  }))

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
        cnpjsDisponiveis={cnpjsDisponiveis}
        regrasExistentes={regrasExistentes}
      />
    </div>
  )
}
```

### Parte B — Reescrever OperadoraForm

- [ ] **Step 3: Reescrever `OperadoraForm.tsx` completo**

```typescript
// src/components/OperadoraForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Operadora, CnpjRecebimento, RegraComCnpj, NIVEIS_VENDEDOR } from '@/lib/types'

interface CnpjTab {
  key: string
  cnpjId: string
  cnpjNome: string
  regraId: string | undefined
  percentualTotal: string
  numParcelas: string
  descontaImposto: boolean
  percentualImposto: string
  temVitalicio: boolean
  percentualVitalicio: string
  nivelIniciante: string
  nivelExperiente: string
  nivelVip: string
}

interface Props {
  operadora?: Operadora
  cnpjsDisponiveis: CnpjRecebimento[]
  regrasExistentes?: RegraComCnpj[]
}

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }
const sectionTitleCls = 'text-sm font-bold mb-4 pb-2 border-b'
const sectionTitleStyle = { color: '#2d1f4e', borderColor: '#e8e4dd' }

function regraParaTab(r: RegraComCnpj): CnpjTab {
  return {
    key: r.cnpjId,
    cnpjId: r.cnpjId,
    cnpjNome: r.cnpjNome,
    regraId: r.id,
    percentualTotal: r.percentual_total?.toString() ?? '',
    numParcelas: r.num_parcelas?.toString() ?? '12',
    descontaImposto: r.desconta_imposto ?? false,
    percentualImposto: r.percentual_imposto?.toString() ?? '',
    temVitalicio: (r.percentual_vitalicio ?? 0) > 0,
    percentualVitalicio: r.percentual_vitalicio?.toString() ?? '',
    nivelIniciante: r.repasse.find(rp => rp.nivel === 'Iniciante')?.percentual?.toString() ?? '',
    nivelExperiente: r.repasse.find(rp => rp.nivel === 'Experiente')?.percentual?.toString() ?? '',
    nivelVip: r.repasse.find(rp => rp.nivel === 'VIP')?.percentual?.toString() ?? '',
  }
}

export default function OperadoraForm({ operadora, cnpjsDisponiveis, regrasExistentes = [] }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const editando = !!operadora

  // Seção 1 — Dados da Operadora
  const [nome, setNome]               = useState(operadora?.nome ?? '')
  const [cnpj, setCnpj]               = useState(operadora?.cnpj ?? '')
  const [telefone, setTelefone]       = useState(operadora?.telefone ?? '')
  const [emailGestor, setEmailGestor] = useState(operadora?.email_gestor ?? '')
  const [site, setSite]               = useState(operadora?.site ?? '')
  const [observacoes, setObservacoes] = useState(operadora?.observacoes ?? '')
  const [ativo, setAtivo]             = useState(operadora?.ativo ?? true)

  // Seção 2 — Abas por CNPJ
  const [tabs, setTabs]                   = useState<CnpjTab[]>(() => regrasExistentes.map(regraParaTab))
  const [abaAtiva, setAbaAtiva]           = useState(0)
  const [removedRegraIds, setRemovedRegraIds] = useState<string[]>([])
  const [showAddCnpj, setShowAddCnpj]     = useState(false)
  const [cnpjParaAdicionar, setCnpjParaAdicionar] = useState('')

  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  // CNPJs ainda não adicionados como aba
  const cnpjsDisponiiveisParaAdicionar = cnpjsDisponiveis.filter(
    c => !tabs.some(t => t.cnpjId === c.id)
  )

  function updateTab(index: number, partial: Partial<CnpjTab>) {
    setTabs(prev => prev.map((t, i) => i === index ? { ...t, ...partial } : t))
  }

  async function handleRemoveTab(index: number) {
    const tab = tabs[index]
    if (tab.regraId) {
      // Verificar se há vendas com esta combinação
      const { count } = await supabase
        .from('vendas')
        .select('id', { count: 'exact', head: true })
        .eq('cnpj_recebimento_id', tab.cnpjId)
      if ((count ?? 0) > 0) {
        setErro(`Existem vendas registradas com "${tab.cnpjNome}". Impossível remover este vínculo.`)
        return
      }
      setRemovedRegraIds(prev => [...prev, tab.regraId!])
    }
    setTabs(prev => prev.filter((_, i) => i !== index))
    setAbaAtiva(prev => Math.min(prev, Math.max(0, tabs.length - 2)))
    setErro('')
  }

  function handleAddCnpj() {
    if (!cnpjParaAdicionar) return
    const cnpj = cnpjsDisponiveis.find(c => c.id === cnpjParaAdicionar)
    if (!cnpj) return
    const novaTab: CnpjTab = {
      key: cnpj.id,
      cnpjId: cnpj.id,
      cnpjNome: cnpj.nome,
      regraId: undefined,
      percentualTotal: '',
      numParcelas: '12',
      descontaImposto: false,
      percentualImposto: '',
      temVitalicio: false,
      percentualVitalicio: '',
      nivelIniciante: '',
      nivelExperiente: '',
      nivelVip: '',
    }
    setTabs(prev => [...prev, novaTab])
    setAbaAtiva(tabs.length)
    setShowAddCnpj(false)
    setCnpjParaAdicionar('')
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
        observacoes: observacoes.trim() || null, ativo,
      }).eq('id', opId)
      if (error) { setErro('Erro ao salvar operadora: ' + error.message); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('operadoras').insert({
        nome: nome.trim(), cnpj: cnpj.trim() || null, telefone: telefone.trim() || null,
        email_gestor: emailGestor.trim() || null, site: site.trim() || null,
        observacoes: observacoes.trim() || null, ativo,
      }).select().single()
      if (error || !data) { setErro('Erro ao criar operadora: ' + (error?.message ?? '')); setLoading(false); return }
      opId = data.id
    }

    // 2. Salvar cada aba (uma regra por CNPJ)
    for (const tab of tabs) {
      const pctTotal     = parseFloat(tab.percentualTotal) || 0
      const nParcelas    = parseInt(tab.numParcelas, 10) || 1
      const pctImposto   = parseFloat(tab.percentualImposto) || 0
      const pctVitalicio = tab.temVitalicio ? (parseFloat(tab.percentualVitalicio) || 0) : 0

      let regraId = tab.regraId

      if (regraId) {
        await supabase.from('regras_comissao').update({
          operadora: nome.trim(),
          percentual_total: pctTotal, num_parcelas: nParcelas,
          desconta_imposto: tab.descontaImposto, percentual_imposto: pctImposto,
          percentual_vitalicio: pctVitalicio, ativo,
          cnpj_recebimento_id: tab.cnpjId,
        }).eq('id', regraId)
      } else {
        const { data: rd, error: re } = await supabase.from('regras_comissao').insert({
          operadora: nome.trim(),
          percentual_total: pctTotal, num_parcelas: nParcelas,
          desconta_imposto: tab.descontaImposto, percentual_imposto: pctImposto,
          percentual_vitalicio: pctVitalicio, ativo,
          cnpj_recebimento_id: tab.cnpjId,
        }).select().single()
        if (re || !rd) {
          setErro(`Erro ao salvar regra para ${tab.cnpjNome}: ` + (re?.message ?? ''))
          setLoading(false)
          return
        }
        regraId = rd.id
      }

      // Salvar repasse por nível
      if (regraId) {
        await supabase.from('repasse_grupo_vendedor').delete().eq('regra_id', regraId)
        await supabase.from('repasse_grupo_vendedor').insert([
          { regra_id: regraId, nivel: 'Iniciante',  percentual: parseFloat(tab.nivelIniciante)  || 0 },
          { regra_id: regraId, nivel: 'Experiente', percentual: parseFloat(tab.nivelExperiente) || 0 },
          { regra_id: regraId, nivel: 'VIP',        percentual: parseFloat(tab.nivelVip)        || 0 },
        ])
      }
    }

    // 3. Deletar regras removidas
    for (const regraId of removedRegraIds) {
      await supabase.from('repasse_grupo_vendedor').delete().eq('regra_id', regraId)
      await supabase.from('regras_comissao').delete().eq('id', regraId)
    }

    setLoading(false)
    router.push('/gestao/operadoras')
    router.refresh()
  }

  const tab = tabs[abaAtiva]

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
            <label className={labelCls} style={labelStyle}>CNPJ da Operadora</label>
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

      {/* ── Regras de Comissão por CNPJ ── */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: '#e8e4dd' }}>
          <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Regras de Comissão por CNPJ</h3>
          {cnpjsDisponiiveisParaAdicionar.length > 0 && (
            <button type="button" onClick={() => setShowAddCnpj(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#f0ece6', color: '#2d1f4e' }}>
              <Plus size={12} /> Adicionar CNPJ
            </button>
          )}
        </div>

        {/* Select para adicionar CNPJ */}
        {showAddCnpj && (
          <div className="mb-4 flex gap-2">
            <select value={cnpjParaAdicionar} onChange={e => setCnpjParaAdicionar(e.target.value)}
              className={inputCls} style={{ ...inputStyle, flex: 1 }}>
              <option value="">Selecione o CNPJ...</option>
              {cnpjsDisponiiveisParaAdicionar.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <button type="button" onClick={handleAddCnpj} disabled={!cnpjParaAdicionar}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
              Confirmar
            </button>
          </div>
        )}

        {tabs.length === 0 && (
          <p className="text-sm" style={{ color: '#9a918a' }}>
            Nenhum CNPJ vinculado. Clique em "Adicionar CNPJ" para configurar regras de comissão.
          </p>
        )}

        {tabs.length > 0 && (
          <>
            {/* Abas */}
            <div className="flex gap-1 mb-5 border-b" style={{ borderColor: '#e8e4dd' }}>
              {tabs.map((t, i) => (
                <button key={t.key} type="button" onClick={() => setAbaAtiva(i)}
                  className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative"
                  style={{
                    backgroundColor: abaAtiva === i ? '#ffffff' : 'transparent',
                    color: abaAtiva === i ? '#2d1f4e' : '#9a918a',
                    borderBottom: abaAtiva === i ? '2px solid #2d1f4e' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}>
                  {t.cnpjNome}
                </button>
              ))}
            </div>

            {/* Conteúdo da aba ativa */}
            {tab && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={labelStyle}>% Total pago pela operadora</label>
                    <input type="number" step="0.01" min="0"
                      value={tab.percentualTotal}
                      onChange={e => updateTab(abaAtiva, { percentualTotal: e.target.value })}
                      placeholder="Ex: 300" className={inputCls} style={inputStyle} />
                    <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Soma de todas as parcelas como % do valor do plano</p>
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Número de Parcelas</label>
                    <input type="number" step="1" min="1" max="60"
                      value={tab.numParcelas}
                      onChange={e => updateTab(abaAtiva, { numParcelas: e.target.value })}
                      className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Tem Vitalício?</label>
                    {toggleBtn(tab.temVitalicio, v => updateTab(abaAtiva, { temVitalicio: v }))}
                  </div>
                  {tab.temVitalicio && (
                    <div>
                      <label className={labelCls} style={labelStyle}>% Vitalício (mensal, só empresa)</label>
                      <input type="number" step="0.01" min="0" max="100"
                        value={tab.percentualVitalicio}
                        onChange={e => updateTab(abaAtiva, { percentualVitalicio: e.target.value })}
                        placeholder="Ex: 2" className={inputCls} style={inputStyle} />
                    </div>
                  )}
                </div>

                {/* Repasse por nível */}
                <div className="pt-4 border-t" style={{ borderColor: '#e8e4dd' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#2d1f4e' }}>Repasse por Nível do Vendedor</p>
                  <p className="text-xs mb-3" style={{ color: '#9a918a' }}>
                    % de cada parcela que vai para o vendedor. A corretora fica com o restante.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {(NIVEIS_VENDEDOR as readonly string[]).map(nivel => {
                      const key = nivel === 'Iniciante' ? 'nivelIniciante' : nivel === 'Experiente' ? 'nivelExperiente' : 'nivelVip'
                      return (
                        <div key={nivel}>
                          <label className={labelCls} style={labelStyle}>{nivel}</label>
                          <div className="relative">
                            <input type="number" step="0.01" min="0" max="100"
                              value={tab[key as keyof CnpjTab] as string}
                              onChange={e => updateTab(abaAtiva, { [key]: e.target.value })}
                              placeholder="0" className={inputCls} style={{ ...inputStyle, paddingRight: '2rem' }} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                              style={{ color: '#9a918a' }}>%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Imposto */}
                <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4" style={{ borderColor: '#e8e4dd' }}>
                  <div>
                    <label className={labelCls} style={labelStyle}>Desconta Imposto da Corretora?</label>
                    <p className="text-xs mb-2" style={{ color: '#9a918a' }}>Incide só sobre o repasse da corretora, não do vendedor.</p>
                    {toggleBtn(tab.descontaImposto, v => updateTab(abaAtiva, { descontaImposto: v }))}
                  </div>
                  {tab.descontaImposto && (
                    <div>
                      <label className={labelCls} style={labelStyle}>% do Imposto</label>
                      <input type="number" step="0.01" min="0" max="100"
                        value={tab.percentualImposto}
                        onChange={e => updateTab(abaAtiva, { percentualImposto: e.target.value })}
                        placeholder="Ex: 13.5" className={inputCls} style={inputStyle} />
                    </div>
                  )}
                </div>

                {/* Remover vínculo */}
                <div className="pt-2">
                  <button type="button" onClick={() => handleRemoveTab(abaAtiva)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ color: '#b5455a', backgroundColor: '#fee2e2' }}>
                    <X size={12} /> Remover vínculo com {tab.cnpjNome}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Testar no browser**

Acessar `/gestao/operadoras/nova`:
- Formulário aparece sem campo "Empresa"
- Seção "Regras de Comissão por CNPJ" mostra botão "+ Adicionar CNPJ"
- Clicar no botão mostra select com A2 Prime / A2 Corretora / MEI
- Adicionar "A2 Prime" → aba aparece com campos de regras
- Adicionar "A2 Corretora" → segunda aba aparece
- Clicar nas abas alterna o conteúdo
- Salvar operadora → redireciona para `/gestao/operadoras`
- Editar operadora recém-criada → abas com as regras salvas aparecem

- [ ] **Step 6: Commit**

```bash
git add src/components/OperadoraForm.tsx src/app/(protected)/gestao/operadoras/nova/page.tsx src/app/(protected)/gestao/operadoras/[id]/page.tsx
git commit -m "feat: OperadoraForm — abas por CNPJ de recebimento para regras de comissão"
```

---

## Task 7: Lista de Operadoras — Tags de CNPJ

**Files:**
- Modify: `src/app/(protected)/gestao/operadoras/page.tsx`

- [ ] **Step 1: Buscar regras com cnpj_recebimento_id e exibir tags nos cards**

Substituir o conteúdo completo do arquivo:

```typescript
// src/app/(protected)/gestao/operadoras/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function OperadorasPage() {
  const supabase = await createClient()

  const [
    { data: operadoras },
    { data: regrasComCnpj },
    { data: cnpjs },
  ] = await Promise.all([
    supabase.from('operadoras').select('*').order('nome'),
    supabase.from('regras_comissao')
      .select('operadora, cnpj_recebimento_id')
      .not('cnpj_recebimento_id', 'is', null),
    supabase.from('cnpjs_recebimento').select('id, nome'),
  ])

  // Mapear: nome operadora → array de nomes de CNPJ
  const cnpjMap = new Map((cnpjs ?? []).map(c => [c.id, c.nome]))
  const tagsMap = new Map<string, string[]>()
  for (const r of regrasComCnpj ?? []) {
    const cnpjNome = cnpjMap.get(r.cnpj_recebimento_id ?? '') ?? ''
    if (!cnpjNome) continue
    const lista = tagsMap.get(r.operadora) ?? []
    if (!lista.includes(cnpjNome)) lista.push(cnpjNome)
    tagsMap.set(r.operadora, lista)
  }

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
        {(operadoras ?? []).map(op => {
          const tags = tagsMap.get(op.nome) ?? []
          return (
            <div key={op.id} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-bold" style={{ color: '#2d1f4e' }}>{op.nome}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2"
                  style={{
                    backgroundColor: op.ativo ? '#dcfce7' : '#fee2e2',
                    color: op.ativo ? '#15803d' : '#b91c1c',
                  }}>
                  {op.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              {/* Tags de CNPJ */}
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: '#ede9f8', color: '#2d1f4e' }}>
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs mb-2" style={{ color: '#9a918a' }}>Sem regras</p>
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
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar e testar**

```bash
npx tsc --noEmit
```

Acessar `/gestao/operadoras`: cards das operadoras mostram tags roxas com os CNPJs vinculados. Operadoras sem regras mostram "Sem regras".

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/gestao/operadoras/page.tsx
git commit -m "feat: lista de operadoras — tags dos CNPJs de recebimento vinculados"
```

---

## Task 8: RegistrarVendaModal — Campo CNPJ de Recebimento

**Files:**
- Modify: `src/components/RegistrarVendaModal.tsx`

- [ ] **Step 1: Adicionar state para CNPJs e lógica de carregamento**

No início do componente, após as declarações de estado existentes (linha ~33), adicionar:

```typescript
interface CnpjOpcao { id: string; nome: string }

const [cnpjRecebimentoId, setCnpjRecebimentoId]     = useState('')
const [cnpjRecebimentoNome, setCnpjRecebimentoNome] = useState('')
const [cnpjsParaOperadora, setCnpjsParaOperadora]   = useState<CnpjOpcao[]>([])
const [carregandoCnpjs, setCarregandoCnpjs]         = useState(false)
```

- [ ] **Step 2: Adicionar função `carregarCnpjs`**

Após a função `selecionarCliente`, adicionar:

```typescript
async function carregarCnpjs(op: string) {
  setCarregandoCnpjs(true)
  setCnpjRecebimentoId('')
  setCnpjRecebimentoNome('')
  setCnpjsParaOperadora([])

  const { data: regras } = await supabase
    .from('regras_comissao')
    .select('cnpj_recebimento_id')
    .eq('operadora', op)
    .eq('ativo', true)
    .not('cnpj_recebimento_id', 'is', null)

  const cnpjIds = [...new Set((regras ?? []).map((r: { cnpj_recebimento_id: string }) => r.cnpj_recebimento_id).filter(Boolean))]

  if (cnpjIds.length === 0) {
    setCarregandoCnpjs(false)
    return
  }

  const { data: cnpjs } = await supabase
    .from('cnpjs_recebimento')
    .select('id, nome')
    .in('id', cnpjIds)
    .eq('status', 'Ativo')
    .order('nome')

  const lista = (cnpjs ?? []) as CnpjOpcao[]
  setCnpjsParaOperadora(lista)

  if (lista.length === 1) {
    setCnpjRecebimentoId(lista[0].id)
    setCnpjRecebimentoNome(lista[0].nome)
  }

  setCarregandoCnpjs(false)
}
```

- [ ] **Step 3: Chamar `carregarCnpjs` ao mudar operadora e ao selecionar cliente**

Substituir o select de operadora para incluir a chamada:

```tsx
<select
  value={operadora}
  onChange={e => {
    setOperadora(e.target.value)
    if (e.target.value) carregarCnpjs(e.target.value)
    else { setCnpjsParaOperadora([]); setCnpjRecebimentoId(''); setCnpjRecebimentoNome('') }
  }}
  className={inputCls}
  style={{ ...inputStyle, color: operadora ? '#1a1a1a' : '#9a918a' }}
>
```

Na função `selecionarCliente`, adicionar após `setOperadora(c.operadora)`:
```typescript
if (c.operadora) carregarCnpjs(c.operadora)
```

- [ ] **Step 4: Adicionar campo CNPJ no JSX**

Após o bloco de Operadora e antes do bloco de Valor do Plano, inserir:

```tsx
{/* CNPJ de Recebimento */}
{operadora && (
  <div>
    <label className={labelCls} style={labelStyle}>CNPJ de Recebimento <span style={{ color: '#b91c1c' }}>*</span></label>
    {carregandoCnpjs ? (
      <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Carregando...</p>
    ) : cnpjsParaOperadora.length === 0 ? (
      <div className="rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
        Esta operadora não tem regras cadastradas. Configure em Gestão → Operadoras.
      </div>
    ) : (
      <select
        value={cnpjRecebimentoId}
        onChange={e => {
          setCnpjRecebimentoId(e.target.value)
          setCnpjRecebimentoNome(cnpjsParaOperadora.find(c => c.id === e.target.value)?.nome ?? '')
        }}
        className={inputCls}
        style={{ ...inputStyle, color: cnpjRecebimentoId ? '#1a1a1a' : '#9a918a' }}
      >
        <option value="">Selecione o CNPJ de recebimento</option>
        {cnpjsParaOperadora.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
    )}
  </div>
)}
```

- [ ] **Step 5: Adicionar validação e atualizar `handleSalvar`**

Na função `handleSalvar`, após a validação de operadora, adicionar:
```typescript
if (!cnpjRecebimentoId) { setErro('Selecione o CNPJ de recebimento.'); return }
```

Substituir o insert de venda para incluir os novos campos:
```typescript
const { data: vendaData, error: vendaError } = await supabase
  .from('vendas')
  .insert({
    cliente_id: clienteId,
    cliente_nome: clienteNome.trim(),
    operadora,
    valor_plano: Number(valorPlano),
    vendedor,
    data_venda: dataVenda,
    status: 'Ativo',
    origem: 'manual',
    empresa: cnpjRecebimentoNome,
    cnpj_recebimento_id: cnpjRecebimentoId,
  })
  .select()
  .single()
```

Na busca da regra de comissão (logo abaixo), adicionar filtro por CNPJ:
```typescript
const { data: regra } = await supabase
  .from('regras_comissao')
  .select('id, percentual_total, num_parcelas, percentual_vitalicio')
  .eq('operadora', operadora)
  .eq('cnpj_recebimento_id', cnpjRecebimentoId)
  .eq('ativo', true)
  .maybeSingle()
```

No insert de comissões (`comissoesParaInserir.push({...})`), adicionar `empresa: cnpjRecebimentoNome` a cada objeto inserido. Localizar as duas ocorrências de `comissoesParaInserir.push` e adicionar a propriedade:

Para as parcelas:
```typescript
comissoesParaInserir.push({
  venda_id: vendaId,
  tipo: 'parcela',
  numero_parcela: i,
  valor_bruto: valorBruto,
  valor_empresa: valorBruto * (pctEmpresa / 100),
  valor_vendedor: valorBruto * (pctVendedor / 100),
  status_empresa: 'Pendente',
  status_vendedor: 'Pendente',
  data_prevista: dataPrev.toISOString().split('T')[0],
  data_recebida_empresa: null,
  data_recebida_vendedor: null,
  empresa: cnpjRecebimentoNome,   // ← adicionar
})
```

Para o vitalício:
```typescript
comissoesParaInserir.push({
  venda_id: vendaId,
  tipo: 'vitalicio',
  numero_parcela: null,
  valor_bruto: valorBrutoVitalicio,
  valor_empresa: valorBrutoVitalicio * (pctEmpresaVit / 100),
  valor_vendedor: valorBrutoVitalicio * (pctVendedorVit / 100),
  status_empresa: 'Pendente',
  status_vendedor: 'Pendente',
  data_prevista: dataVit.toISOString().split('T')[0],
  data_recebida_empresa: null,
  data_recebida_vendedor: null,
  empresa: cnpjRecebimentoNome,   // ← adicionar
})
```

- [ ] **Step 6: Verificar o tipo da interface `comissoesParaInserir`**

O array `comissoesParaInserir` tem uma tipagem explícita inline. Adicionar `empresa: string` ao tipo:

```typescript
const comissoesParaInserir: {
  venda_id: string
  tipo: 'parcela' | 'vitalicio'
  numero_parcela: number | null
  valor_bruto: number
  valor_empresa: number
  valor_vendedor: number
  status_empresa: 'Pendente'
  status_vendedor: 'Pendente'
  data_prevista: string
  data_recebida_empresa: null
  data_recebida_vendedor: null
  empresa: string   // ← adicionar
}[] = []
```

- [ ] **Step 7: Verificar e testar**

```bash
npx tsc --noEmit
```

Abrir Financeiro → botão "Registrar Venda":
- Selecionar operadora que tem regras com CNPJ → campo CNPJ aparece
- Operadora com 1 CNPJ: auto-seleciona
- Operadora com 2 CNPJs: dropdown com opções
- Operadora sem regras: aviso amarelo
- Salvar sem CNPJ: erro de validação
- Salvar completo: venda criada com `cnpj_recebimento_id` e `empresa` preenchidos

- [ ] **Step 8: Commit**

```bash
git add src/components/RegistrarVendaModal.tsx
git commit -m "feat: RegistrarVendaModal — campo CNPJ de recebimento obrigatório na venda"
```

---

## Task 9: Financial Tabs — Filtro Empresa Dinâmico

**Files:**
- Modify: `src/app/(protected)/financeiro/page.tsx`
- Modify: `src/components/FinanceiroClient.tsx`
- Modify: `src/components/ProducaoTab.tsx`
- Modify: `src/components/ComissoesTab.tsx`
- Modify: `src/components/ContasTab.tsx`
- Modify: `src/components/RelatoriosTab.tsx`

### Parte A — Carregar CNPJs no servidor

- [ ] **Step 1: Atualizar `financeiro/page.tsx`**

```typescript
// src/app/(protected)/financeiro/page.tsx
import { createClient } from '@/lib/supabase/server'
import FinanceiroClient from '@/components/FinanceiroClient'
import { CnpjRecebimento } from '@/lib/types'

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const [
    { data: vendas },
    { data: comissoes },
    { data: contas },
    { data: regras },
    { data: cnpjsRaw },
  ] = await Promise.all([
    supabase.from('vendas').select('*').order('criado_em', { ascending: false }).limit(100),
    supabase.from('comissoes').select('*').order('criado_em', { ascending: false }).limit(200),
    supabase.from('contas').select('*').order('vencimento', { ascending: true }),
    supabase.from('regras_comissao').select('*'),
    supabase.from('cnpjs_recebimento').select('*').order('nome'),
  ])

  return (
    <div className="p-6 md:p-8">
      <FinanceiroClient
        vendas={vendas ?? []}
        comissoes={comissoes ?? []}
        contas={contas ?? []}
        regras={regras ?? []}
        cnpjs={(cnpjsRaw ?? []) as CnpjRecebimento[]}
      />
    </div>
  )
}
```

### Parte B — Atualizar FinanceiroClient

- [ ] **Step 2: Adicionar `cnpjs` às props do `FinanceiroClient`**

No arquivo `src/components/FinanceiroClient.tsx`, atualizar as imports e a interface Props:

```typescript
import { Venda, Comissao, Conta, RegraComissao, CnpjRecebimento } from '@/lib/types'
```

Atualizar a interface Props:
```typescript
interface Props {
  vendas: Venda[]
  comissoes: Comissao[]
  contas: Conta[]
  regras: RegraComissao[]
  cnpjs: CnpjRecebimento[]
}
```

Atualizar a desestruturação do componente:
```typescript
export default function FinanceiroClient({ vendas, comissoes, contas, regras, cnpjs }: Props) {
```

Passar `cnpjs` para cada Tab no JSX. Localizar os componentes filhos e adicionar a prop:
```tsx
{aba === 'producao'   && <ProducaoTab  vendas={vendas} comissoes={comissoes} contas={contas} cnpjs={cnpjs} />}
{aba === 'comissoes'  && <ComissoesTab comissoes={comissoes} vendas={vendas} regras={regras} onAtualizar={reload} cnpjs={cnpjs} />}
{aba === 'contas'     && <ContasTab    contas={contas} onAtualizar={reload} cnpjs={cnpjs} />}
{aba === 'relatorios' && <RelatoriosTab vendas={vendas} comissoes={comissoes} contas={contas} cnpjs={cnpjs} />}
```

### Parte C — Atualizar os 4 tabs

- [ ] **Step 3: Atualizar `ProducaoTab.tsx`**

Substituir:
```typescript
import { Venda, Comissao, Conta, EMPRESAS } from '@/lib/types'
```
por:
```typescript
import { Venda, Comissao, Conta, CnpjRecebimento } from '@/lib/types'
```

Atualizar Props:
```typescript
interface Props {
  vendas: Venda[]
  comissoes: Comissao[]
  contas: Conta[]
  cnpjs: CnpjRecebimento[]
}
export default function ProducaoTab({ vendas, comissoes, contas, cnpjs }: Props) {
```

Substituir o select de empresa no JSX:
```tsx
{/* Antes: {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)} */}
{cnpjs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
```

- [ ] **Step 4: Atualizar `ComissoesTab.tsx`**

Substituir:
```typescript
import { Comissao, Venda, RegraComissao, EMPRESAS } from '@/lib/types'
```
por:
```typescript
import { Comissao, Venda, RegraComissao, CnpjRecebimento } from '@/lib/types'
```

Atualizar Props:
```typescript
interface Props {
  comissoes: Comissao[]
  vendas: Venda[]
  regras: RegraComissao[]
  onAtualizar: () => void
  cnpjs: CnpjRecebimento[]
}
export default function ComissoesTab({ comissoes, vendas, regras, onAtualizar, cnpjs }: Props) {
```

Substituir o select de empresa:
```tsx
{cnpjs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
```

- [ ] **Step 5: Atualizar `ContasTab.tsx`**

Substituir:
```typescript
import { Conta, ContaInsert, EMPRESAS } from '@/lib/types'
```
por:
```typescript
import { Conta, ContaInsert, CnpjRecebimento } from '@/lib/types'
```

Atualizar Props:
```typescript
interface Props {
  contas: Conta[]
  onAtualizar: () => void
  cnpjs: CnpjRecebimento[]
}
export default function ContasTab({ contas, onAtualizar, cnpjs }: Props) {
```

`ContasTab` usa `EMPRESAS` em dois lugares:
1. No modal de criação/edição: campo "Empresa *"
2. No filtro

Substituir **ambas** as ocorrências de:
```tsx
{EMPRESAS.map(emp => <option key={emp} value={emp}>{emp}</option>)}
```
por:
```tsx
{cnpjs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
```

- [ ] **Step 6: Atualizar `RelatoriosTab.tsx`**

Substituir:
```typescript
import { Venda, Comissao, Conta, EMPRESAS } from '@/lib/types'
```
por:
```typescript
import { Venda, Comissao, Conta, CnpjRecebimento } from '@/lib/types'
```

Atualizar Props:
```typescript
interface Props {
  vendas: Venda[]
  comissoes: Comissao[]
  contas: Conta[]
  cnpjs: CnpjRecebimento[]
}
export default function RelatoriosTab({ vendas, comissoes, contas, cnpjs }: Props) {
```

Substituir o select de empresa:
```tsx
{cnpjs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
```

- [ ] **Step 7: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 8: Testar no browser**

Acessar `/financeiro`:
- Filtro "Empresa" em todos os tabs mostra os CNPJs do banco (A2 Prime, A2 Corretora, MEI) em vez do array hardcoded
- Filtrar por "A2 Prime": mostra apenas registros desse CNPJ
- Filtrar por "Todas": mostra todos
- ContasTab: criar nova conta → campo "Empresa" mostra CNPJs do banco

- [ ] **Step 9: Commit final**

```bash
git add src/app/(protected)/financeiro/page.tsx src/components/FinanceiroClient.tsx src/components/ProducaoTab.tsx src/components/ComissoesTab.tsx src/components/ContasTab.tsx src/components/RelatoriosTab.tsx
git commit -m "feat: financeiro — filtro por empresa dinâmico via cnpjs_recebimento"
```

---

## Self-Review

**Cobertura do spec:**

| Requisito | Task |
|---|---|
| Tabela `cnpjs_recebimento` com campos completos | Task 1 |
| Seed com 3 CNPJs existentes | Task 1 |
| `cnpj_recebimento_id` em `regras_comissao` e `vendas` | Task 1 |
| Tipo `CnpjRecebimento` e `RegraComCnpj`; remover `EMPRESAS` | Task 2 |
| Hook `useCnpjsRecebimento` | Task 3 |
| Configurações — seção CNPJs com CRUD | Tasks 4 e 5 |
| CNPJs inativos: não aparecem em Registrar Venda | Task 8 — `eq('status', 'Ativo')` na query |
| OperadoraForm — remover campo Empresa; abas por CNPJ | Task 6 |
| Listagem de operadoras — tags de CNPJ | Task 7 |
| Registrar Venda — campo CNPJ obrigatório | Task 8 |
| Auto-select se 1 CNPJ disponível | Task 8 |
| Aviso se operadora sem regras | Task 8 |
| Regra de comissão buscada por (operadora + cnpj) | Task 8 |
| `comissoes.empresa` e `vendas.empresa` populados | Task 8 |
| Filtros financeiros dinâmicos (4 tabs) | Task 9 |
| Vendedor não vê CNPJ | Sem mudanças necessárias — área do vendedor não tem esses campos |
