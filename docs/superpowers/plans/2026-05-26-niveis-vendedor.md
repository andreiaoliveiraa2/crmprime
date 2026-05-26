# Níveis de Vendedor — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar tela em Configurações para gerenciar níveis de vendedor (Iniciante, Experiente, VIP), com dados vindos do banco em vez de constante hardcoded.

**Architecture:** Nova tabela `niveis_vendedor` no Supabase → componente `NiveisVendedorSection` seguindo o mesmo padrão de `CategoriasDespesaSection` → todos os componentes que usam `NIVEIS_VENDEDOR` recebem `niveis: NivelVendedor[]` como prop dos seus server components pai.

**Tech Stack:** Next.js 16, Supabase, TypeScript, Tailwind CSS, lucide-react

---

## Arquivos

| Ação | Arquivo |
|---|---|
| Criar | `supabase/migrations/20260526_niveis_vendedor.sql` |
| Criar | `src/components/NiveisVendedorSection.tsx` |
| Modificar | `src/lib/types.ts` |
| Modificar | `src/app/(protected)/configuracoes/page.tsx` |
| Modificar | `src/app/(protected)/gestao/page.tsx` |
| Modificar | `src/app/(protected)/gestao/novo/page.tsx` |
| Modificar | `src/app/(protected)/gestao/[id]/editar/page.tsx` |
| Modificar | `src/app/(protected)/gestao/operadoras/nova/page.tsx` |
| Modificar | `src/app/(protected)/gestao/operadoras/[id]/page.tsx` |
| Modificar | `src/components/GestaoClient.tsx` |
| Modificar | `src/components/VendedorForm.tsx` |
| Modificar | `src/components/OperadoraForm.tsx` |

---

## Task 1: Migration — tabela niveis_vendedor

**Files:**
- Create: `supabase/migrations/20260526_niveis_vendedor.sql`

- [ ] **Criar arquivo de migration**

```sql
create table if not exists niveis_vendedor (
  id   uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true
);

insert into niveis_vendedor (nome) values
  ('Iniciante'),
  ('Experiente'),
  ('VIP');
```

- [ ] **Aplicar migration**

```bash
npx supabase db push
```

Resultado esperado: tabela criada com 3 linhas.

- [ ] **Commit**

```bash
git add supabase/migrations/20260526_niveis_vendedor.sql
git commit -m "feat: migration tabela niveis_vendedor"
```

---

## Task 2: Tipo NivelVendedor em types.ts

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Adicionar interface NivelVendedor e remover NIVEIS_VENDEDOR**

Em `src/lib/types.ts`, substituir a linha:

```ts
export const NIVEIS_VENDEDOR = ['Iniciante', 'Experiente', 'VIP'] as const
```

Por:

```ts
export interface NivelVendedor {
  id: string
  nome: string
  ativo: boolean
}
```

- [ ] **Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: adiciona tipo NivelVendedor, remove constante NIVEIS_VENDEDOR"
```

---

## Task 3: Componente NiveisVendedorSection

**Files:**
- Create: `src/components/NiveisVendedorSection.tsx`

- [ ] **Criar componente** (mesmo padrão de CategoriasDespesaSection, só nome + ativo/inativo):

```tsx
'use client'

import { useState } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NivelVendedor } from '@/lib/types'

interface Props {
  niveis: NivelVendedor[]
}

export default function NiveisVendedorSection({ niveis }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [editando, setEditando] = useState<NivelVendedor | null>(null)
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function abrirNovo() {
    setNome(''); setAtivo(true); setEditando(null); setCriando(true); setErro('')
  }

  function abrirEditar(n: NivelVendedor) {
    setNome(n.nome); setAtivo(n.ativo); setEditando(n); setCriando(false); setErro('')
  }

  function fechar() {
    setCriando(false); setEditando(null); setErro('')
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true); setErro('')

    if (editando) {
      const { error } = await supabase
        .from('niveis_vendedor')
        .update({ nome: nome.trim(), ativo })
        .eq('id', editando.id)
      if (error) { setErro('Erro: ' + error.message); setSalvando(false); return }
    } else {
      const { error } = await supabase
        .from('niveis_vendedor')
        .insert({ nome: nome.trim(), ativo })
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
            Níveis de Vendedor
          </h3>
          <p className="text-sm mt-0.5" style={{ color: '#7a7065' }}>
            Níveis usados no cadastro de vendedores e nas regras de repasse por operadora.
          </p>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Plus size={13} /> Novo nível
        </button>
      </div>

      <div className="space-y-2">
        {niveis.length === 0 && (
          <p className="text-sm" style={{ color: '#9a918a' }}>Nenhum nível cadastrado.</p>
        )}
        {niveis.map(n => (
          <div key={n.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#f9f7f4', border: '1px solid #e8e4dd' }}>
            <p className="text-sm font-medium" style={{ color: n.ativo ? '#2d1f4e' : '#9ca3af' }}>
              {n.nome}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: n.ativo ? '#dcfce7' : '#f3f4f6',
                  color: n.ativo ? '#15803d' : '#6b7280',
                }}>
                {n.ativo ? 'Ativo' : 'Inativo'}
              </span>
              <button onClick={() => abrirEditar(n)}
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
                {editando ? 'Editar Nível' : 'Novo Nível'}
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
                  placeholder="Ex: Iniciante, Sênior, VIP..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Status</label>
                <div className="flex gap-3">
                  {(['Ativo', 'Inativo'] as const).map(v => (
                    <button key={v} type="button"
                      onClick={() => setAtivo(v === 'Ativo')}
                      className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                      style={{
                        borderColor: (v === 'Ativo') === ativo ? '#2d1f4e' : '#e8e4dd',
                        backgroundColor: (v === 'Ativo') === ativo ? '#2d1f4e' : '#ffffff',
                        color: (v === 'Ativo') === ativo ? '#ffffff' : '#5a4e3c',
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

- [ ] **Commit**

```bash
git add src/components/NiveisVendedorSection.tsx
git commit -m "feat: componente NiveisVendedorSection"
```

---

## Task 4: Configurações — query + seção

**Files:**
- Modify: `src/app/(protected)/configuracoes/page.tsx`

- [ ] **Adicionar import NivelVendedor e NiveisVendedorSection**

No topo do arquivo, adicionar nos imports existentes:

```ts
import NiveisVendedorSection from '@/components/NiveisVendedorSection'
import { CnpjRecebimento, CategoriaDespesa, NivelVendedor } from '@/lib/types'
```

- [ ] **Adicionar query de niveis no Promise.all**

Substituir:
```ts
const [
  { data: { user } },
  { data: cnpjsRaw },
  { data: categoriasRaw },
] = await Promise.all([
  supabase.auth.getUser(),
  supabase.from('cnpjs_recebimento').select('*').order('nome'),
  supabase.from('categorias_despesa').select('*').order('nome'),
])

const cnpjs = (cnpjsRaw ?? []) as CnpjRecebimento[]
const categorias = (categoriasRaw ?? []) as CategoriaDespesa[]
```

Por:
```ts
const [
  { data: { user } },
  { data: cnpjsRaw },
  { data: categoriasRaw },
  { data: niveisRaw },
] = await Promise.all([
  supabase.auth.getUser(),
  supabase.from('cnpjs_recebimento').select('*').order('nome'),
  supabase.from('categorias_despesa').select('*').order('nome'),
  supabase.from('niveis_vendedor').select('*').order('nome'),
])

const cnpjs = (cnpjsRaw ?? []) as CnpjRecebimento[]
const categorias = (categoriasRaw ?? []) as CategoriaDespesa[]
const niveis = (niveisRaw ?? []) as NivelVendedor[]
```

- [ ] **Adicionar seção no JSX após CategoriasDespesaSection**

```tsx
{/* Níveis de Vendedor */}
<NiveisVendedorSection niveis={niveis} />
```

- [ ] **Commit**

```bash
git add src/app/(protected)/configuracoes/page.tsx
git commit -m "feat: adiciona seção Níveis de Vendedor em Configurações"
```

---

## Task 5: GestaoClient — niveis dinâmicos

**Files:**
- Modify: `src/components/GestaoClient.tsx`

- [ ] **Atualizar import e Props**

Substituir:
```ts
import { Vendedor, TIPOS_VENDEDOR, NIVEIS_VENDEDOR } from '@/lib/types'

interface Props {
  vendedores: Vendedor[]
}
```

Por:
```ts
import { Vendedor, TIPOS_VENDEDOR, NivelVendedor } from '@/lib/types'

interface Props {
  vendedores: Vendedor[]
  niveis: NivelVendedor[]
}
```

- [ ] **Atualizar assinatura da função e filtro de nível**

Substituir:
```ts
export default function GestaoClient({ vendedores: inicial }: Props) {
```

Por:
```ts
export default function GestaoClient({ vendedores: inicial, niveis }: Props) {
```

- [ ] **Substituir NIVEIS_VENDEDOR no select de filtro**

Substituir:
```tsx
{NIVEIS_VENDEDOR.map(n => <option key={n}>{n}</option>)}
```

Por:
```tsx
{niveis.map(n => <option key={n.id} value={n.nome}>{n.nome}</option>)}
```

- [ ] **Commit**

```bash
git add src/components/GestaoClient.tsx
git commit -m "feat: GestaoClient usa niveis dinâmicos do banco"
```

---

## Task 6: gestao/page.tsx — busca niveis

**Files:**
- Modify: `src/app/(protected)/gestao/page.tsx`

- [ ] **Adicionar import e query**

Substituir o arquivo inteiro por:
```tsx
import { createClient } from '@/lib/supabase/server'
import GestaoClient from '@/components/GestaoClient'
import Link from 'next/link'
import { NivelVendedor } from '@/lib/types'

export default async function GestaoPage() {
  const supabase = await createClient()
  const [{ data: vendedores }, { data: niveisRaw }] = await Promise.all([
    supabase.from('vendedores').select('*').order('nome'),
    supabase.from('niveis_vendedor').select('*').order('nome'),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: 'rgba(184,154,106,0.12)', color: '#2d1f4e', borderLeft: '3px solid #b89a6a', paddingLeft: '10px' }}>
          Vendedores
        </span>
        <Link href="/gestao/operadoras"
          className="text-sm font-medium px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ color: '#7a7065' }}>
          Operadoras →
        </Link>
      </div>
      <GestaoClient
        vendedores={vendedores ?? []}
        niveis={(niveisRaw ?? []) as NivelVendedor[]}
      />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/(protected)/gestao/page.tsx
git commit -m "feat: gestao/page busca e passa niveis para GestaoClient"
```

---

## Task 7: VendedorForm — niveis dinâmicos

**Files:**
- Modify: `src/components/VendedorForm.tsx`

- [ ] **Atualizar import e Props**

Localizar no topo do arquivo a linha que importa `NIVEIS_VENDEDOR`:
```ts
import {
  ...
  NIVEIS_VENDEDOR,
} from '@/lib/types'
```
Substituir `NIVEIS_VENDEDOR` por `NivelVendedor` no import.

- [ ] **Adicionar niveis na interface Props**

Localizar a interface Props do VendedorForm e adicionar `niveis`:
```ts
interface Props {
  vendedor?: Vendedor
  niveis: NivelVendedor[]
}
```

- [ ] **Atualizar assinatura da função**

Substituir:
```ts
export default function VendedorForm({ vendedor }: Props) {
```
Por:
```ts
export default function VendedorForm({ vendedor, niveis }: Props) {
```

- [ ] **Substituir NIVEIS_VENDEDOR no select de nível**

Localizar no JSX:
```tsx
{NIVEIS_VENDEDOR.map(n => <option key={n}>{n}</option>)}
```
Substituir por:
```tsx
{niveis.map(n => <option key={n.id} value={n.nome}>{n.nome}</option>)}
```

- [ ] **Commit**

```bash
git add src/components/VendedorForm.tsx
git commit -m "feat: VendedorForm usa niveis dinâmicos do banco"
```

---

## Task 8: Pages de novo/editar vendedor — passa niveis

**Files:**
- Modify: `src/app/(protected)/gestao/novo/page.tsx`
- Modify: `src/app/(protected)/gestao/[id]/editar/page.tsx`

- [ ] **Atualizar gestao/novo/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import VendedorForm from '@/components/VendedorForm'
import { NivelVendedor } from '@/lib/types'

export default async function NovoVendedorPage() {
  const supabase = await createClient()
  const { data: niveisRaw } = await supabase
    .from('niveis_vendedor')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Novo Vendedor</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
          Cadastre um vendedor ou corretor
        </p>
      </div>
      <VendedorForm niveis={(niveisRaw ?? []) as NivelVendedor[]} />
    </div>
  )
}
```

- [ ] **Atualizar gestao/[id]/editar/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import VendedorForm from '@/components/VendedorForm'
import { NivelVendedor } from '@/lib/types'

export default async function EditarVendedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: vendedor }, { data: niveisRaw }] = await Promise.all([
    supabase.from('vendedores').select('*').eq('id', id).single(),
    supabase.from('niveis_vendedor').select('*').eq('ativo', true).order('nome'),
  ])

  if (!vendedor) notFound()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Editar Vendedor</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>{vendedor.nome}</p>
      </div>
      <VendedorForm vendedor={vendedor} niveis={(niveisRaw ?? []) as NivelVendedor[]} />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/(protected)/gestao/novo/page.tsx src/app/(protected)/gestao/[id]/editar/page.tsx
git commit -m "feat: pages de vendedor buscam e passam niveis"
```

---

## Task 9: OperadoraForm — repasse dinâmico por nível

**Files:**
- Modify: `src/components/OperadoraForm.tsx`

- [ ] **Atualizar import**

Substituir `NIVEIS_VENDEDOR` por `NivelVendedor` no import de `@/lib/types`.

- [ ] **Atualizar CnpjTab — substituir campos fixos por Record**

Substituir no tipo `CnpjTab`:
```ts
  nivelIniciante: string
  nivelExperiente: string
  nivelVip: string
```
Por:
```ts
  repassePorNivel: Record<string, string>
```

- [ ] **Adicionar niveis em Props**

```ts
interface Props {
  operadora?: Operadora
  cnpjsDisponiveis: CnpjRecebimento[]
  regrasExistentes?: RegraComCnpj[]
  niveis: NivelVendedor[]
}
```

- [ ] **Atualizar regraParaTab para usar repassePorNivel**

Substituir a função `regraParaTab`:
```ts
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
    repassePorNivel: Object.fromEntries(
      r.repasse.map(rp => [rp.nivel, rp.percentual?.toString() ?? ''])
    ),
  }
}
```

- [ ] **Atualizar assinatura do componente**

```ts
export default function OperadoraForm({ operadora, cnpjsDisponiveis, regrasExistentes = [], niveis }: Props) {
```

- [ ] **Atualizar a função de salvar repasse**

Substituir o bloco de insert de repasse:
```ts
await supabase.from('repasse_grupo_vendedor').insert([
  { regra_id: regraId, nivel: 'Iniciante',  percentual: parseFloat(tab.nivelIniciante)  || 0 },
  { regra_id: regraId, nivel: 'Experiente', percentual: parseFloat(tab.nivelExperiente) || 0 },
  { regra_id: regraId, nivel: 'VIP',        percentual: parseFloat(tab.nivelVip)        || 0 },
])
```

Por:
```ts
await supabase.from('repasse_grupo_vendedor').insert(
  niveis.map(n => ({
    regra_id: regraId,
    nivel: n.nome,
    percentual: parseFloat(tab.repassePorNivel[n.nome] ?? '0') || 0,
  }))
)
```

- [ ] **Atualizar render dos campos de repasse no JSX**

Substituir o bloco:
```tsx
{(NIVEIS_VENDEDOR as readonly string[]).map(nivel => {
  const key = nivel === 'Iniciante' ? 'nivelIniciante' : nivel === 'Experiente' ? 'nivelExperiente' : 'nivelVip'
  return (
    <div key={nivel}>
      <label className={labelCls} style={labelStyle}>{nivel}</label>
      <div className="relative">
        <input type="number" step="0.01" min="0" max={tab.percentualTotal || undefined}
          value={tab[key as keyof CnpjTab] as string}
          onChange={e => updateTab(abaAtiva, { [key]: e.target.value })}
          placeholder="0" className={inputCls} style={{ ...inputStyle, paddingRight: '2rem' }} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
          style={{ color: '#9a918a' }}>%</span>
      </div>
    </div>
  )
})}
```

Por:
```tsx
{niveis.filter(n => n.ativo).map(n => (
  <div key={n.id}>
    <label className={labelCls} style={labelStyle}>{n.nome}</label>
    <div className="relative">
      <input type="number" step="0.01" min="0" max={tab.percentualTotal || undefined}
        value={tab.repassePorNivel[n.nome] ?? ''}
        onChange={e => updateTab(abaAtiva, {
          repassePorNivel: { ...tab.repassePorNivel, [n.nome]: e.target.value }
        })}
        placeholder="0" className={inputCls} style={{ ...inputStyle, paddingRight: '2rem' }} />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
        style={{ color: '#9a918a' }}>%</span>
    </div>
  </div>
))}
```

- [ ] **Commit**

```bash
git add src/components/OperadoraForm.tsx
git commit -m "feat: OperadoraForm usa niveis dinâmicos para repasse"
```

---

## Task 10: Pages de operadora — passa niveis

**Files:**
- Modify: `src/app/(protected)/gestao/operadoras/nova/page.tsx`
- Modify: `src/app/(protected)/gestao/operadoras/[id]/page.tsx`

- [ ] **Atualizar gestao/operadoras/nova/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import OperadoraForm from '@/components/OperadoraForm'
import Link from 'next/link'
import { CnpjRecebimento, NivelVendedor } from '@/lib/types'

export default async function NovaOperadoraPage() {
  const supabase = await createClient()
  const [{ data: cnpjsRaw }, { data: niveisRaw }] = await Promise.all([
    supabase.from('cnpjs_recebimento').select('*').eq('status', 'Ativo').order('nome'),
    supabase.from('niveis_vendedor').select('*').eq('ativo', true).order('nome'),
  ])

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
      <OperadoraForm
        cnpjsDisponiveis={(cnpjsRaw ?? []) as CnpjRecebimento[]}
        niveis={(niveisRaw ?? []) as NivelVendedor[]}
      />
    </div>
  )
}
```

- [ ] **Atualizar gestao/operadoras/[id]/page.tsx — adicionar query de niveis**

Após a linha `const cnpjsDisponiveis = ...`, adicionar no `Promise.all` a query de niveis:

Substituir:
```ts
const [{ data: repasseTodos }, { data: cnpjsRaw }] = await Promise.all([
  regraIds.length > 0
    ? supabase.from('repasse_grupo_vendedor').select('*').in('regra_id', regraIds)
    : Promise.resolve({ data: [] }),
  supabase.from('cnpjs_recebimento').select('*').eq('status', 'Ativo').order('nome'),
])

const cnpjsDisponiveis = (cnpjsRaw ?? []) as CnpjRecebimento[]
```

Por:
```ts
const [{ data: repasseTodos }, { data: cnpjsRaw }, { data: niveisRaw }] = await Promise.all([
  regraIds.length > 0
    ? supabase.from('repasse_grupo_vendedor').select('*').in('regra_id', regraIds)
    : Promise.resolve({ data: [] }),
  supabase.from('cnpjs_recebimento').select('*').eq('status', 'Ativo').order('nome'),
  supabase.from('niveis_vendedor').select('*').eq('ativo', true).order('nome'),
])

const cnpjsDisponiveis = (cnpjsRaw ?? []) as CnpjRecebimento[]
```

E atualizar o import no topo do arquivo:
```ts
import { CnpjRecebimento, RegraComCnpj, NivelVendedor } from '@/lib/types'
```

E passar `niveis` para o `OperadoraForm`:
```tsx
<OperadoraForm
  operadora={operadora}
  cnpjsDisponiveis={cnpjsDisponiveis}
  regrasExistentes={regrasExistentes}
  niveis={(niveisRaw ?? []) as NivelVendedor[]}
/>
```

- [ ] **Commit**

```bash
git add src/app/(protected)/gestao/operadoras/nova/page.tsx src/app/(protected)/gestao/operadoras/[id]/page.tsx
git commit -m "feat: pages de operadora buscam e passam niveis"
```

---

## Task 11: Verificação final

- [ ] **Verificar build sem erros de TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: sem erros.

- [ ] **Abrir Configurações no browser e testar**
  - Seção "Níveis de Vendedor" aparece com Iniciante, Experiente, VIP
  - Clicar lápis → modal abre com nome e toggle Ativo/Inativo
  - Criar novo nível → aparece na lista
  - Desativar nível → badge muda para Inativo

- [ ] **Testar formulário de vendedor**
  - Gestão → Novo Vendedor → select Nível mostra níveis do banco

- [ ] **Testar formulário de operadora**
  - Gestão → Operadoras → Editar → campos de repasse por nível aparecem dinamicamente
