# Convite e Acesso de Vendedores — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que administradores convidem vendedores por e-mail para acessar o CRM, onde cada vendedor vê apenas seus próprios dados (clientes, leads, comissões).

**Architecture:** O fluxo usa `auth.admin.inviteUserByEmail` do Supabase para enviar o convite; após aceitar, o vendedor completa o perfil em `/completar-perfil`, que cria o registro `usuarios` vinculando `auth_user_id → vendedor_id`. As políticas RLS já existentes garantem isolamento de dados. Uma nova página `/minhas-comissoes` exibe as comissões do vendedor.

**Tech Stack:** Next.js 16 App Router, Supabase Auth (admin invite), RLS (row-level security), React 19.

---

## O que já existe (não construir novamente)

- `usuarios` table: `{ auth_user_id, perfil: 'admin'|'vendedor', vendedor_id }` ✅
- Funções SQL `meu_perfil()` e `meu_vendedor_id()` ✅
- RLS para leads/clientes/agenda ✅
- `NAV_VENDEDOR` no Sidebar ✅
- Dashboard já filtra por `vendedor_id` quando `isVendedor` ✅
- `createAdminClient()` em `src/lib/supabase/admin.ts` ✅
- Auth callback em `/auth/callback` (troca code por sessão) ✅

## Arquivos

| Ação    | Arquivo |
|---------|---------|
| Criar   | `supabase/migrations/20260526_vendedor_comissoes_access.sql` |
| Criar   | `src/app/api/admin/convidar-vendedor/route.ts` |
| Criar   | `src/app/completar-perfil/page.tsx` |
| Criar   | `src/components/CompletarPerfilForm.tsx` |
| Criar   | `src/app/(protected)/minhas-comissoes/page.tsx` |
| Modificar | `src/app/(protected)/layout.tsx` |
| Modificar | `src/app/(protected)/financeiro/page.tsx` |
| Modificar | `src/app/(protected)/gestao/page.tsx` |
| Modificar | `src/app/(protected)/configuracoes/page.tsx` |
| Modificar | `src/app/(protected)/gestao/[id]/page.tsx` |
| Modificar | `src/components/FichaVendedor.tsx` |
| Modificar | `src/components/Sidebar.tsx` |

---

### Task 1: SQL — RLS para comissões e vendas de vendedores

**Files:**
- Create: `supabase/migrations/20260526_vendedor_comissoes_access.sql`

- [ ] **Step 1: Criar a migration**

```sql
-- supabase/migrations/20260526_vendedor_comissoes_access.sql

-- Vendedor pode ler suas próprias vendas
create policy "vendas_vendedor_proprios" on vendas
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- Vendedor pode ler comissões das próprias vendas
create policy "comissoes_vendedor_proprios" on comissoes
  for select using (
    meu_perfil() = 'vendedor' and
    exists (
      select 1 from vendas v
      where v.id = comissoes.venda_id
      and v.vendedor_id = meu_vendedor_id()
    )
  );
```

- [ ] **Step 2: Aplicar no Supabase**

Abrir o Supabase Dashboard → SQL Editor → colar e executar o SQL acima.

Verificação: no SQL Editor rodar:
```sql
select * from pg_policies where tablename in ('vendas','comissoes');
```
Esperado: ver `vendas_vendedor_proprios` e `comissoes_vendedor_proprios` na lista.

- [ ] **Step 3: Commit**

```bash
git add "supabase/migrations/20260526_vendedor_comissoes_access.sql"
git commit -m "feat: RLS vendedor pode ler proprias vendas e comissoes"
```

---

### Task 2: API Route — enviar convite por e-mail

**Files:**
- Create: `src/app/api/admin/convidar-vendedor/route.ts`

- [ ] **Step 1: Criar o route handler**

```typescript
// src/app/api/admin/convidar-vendedor/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('auth_user_id', user.id)
    .single()

  if (usuario?.perfil !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { vendedor_id, email } = await request.json()
  if (!vendedor_id || !email) {
    return NextResponse.json({ error: 'vendedor_id e email são obrigatórios' }, { status: 400 })
  }

  const origin = request.nextUrl.origin
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { vendedor_id },
    redirectTo: `${origin}/auth/callback?next=/completar-perfil`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Verificar que o arquivo foi criado corretamente**

```bash
cat src/app/api/admin/convidar-vendedor/route.ts
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/admin/convidar-vendedor/route.ts"
git commit -m "feat: API route para convidar vendedor por e-mail"
```

---

### Task 3: Página de completar perfil (fora do layout protegido)

**Files:**
- Create: `src/app/completar-perfil/page.tsx`
- Create: `src/components/CompletarPerfilForm.tsx`

- [ ] **Step 1: Criar o componente client `CompletarPerfilForm`**

```tsx
// src/components/CompletarPerfilForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  authUserId: string
  vendedorId: string
  nomeInicial: string
  email: string
}

export default function CompletarPerfilForm({ authUserId, vendedorId, nomeInicial, email }: Props) {
  const [nome, setNome] = useState(nomeInicial)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setErro('Nome é obrigatório'); return }
    setLoading(true)
    setErro('')

    const { error } = await supabase.from('usuarios').insert({
      auth_user_id: authUserId,
      nome: nome.trim(),
      email,
      perfil: 'vendedor',
      vendedor_id: vendedorId,
      ativo: true,
    })

    if (error) {
      setErro('Erro ao salvar perfil. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f1ec' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md" style={{ border: '1px solid #e8e4dd' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#2d1f4e' }}>Completar Cadastro</h1>
        <p className="text-sm mb-6" style={{ color: '#9a918a' }}>
          Confirme seu nome para acessar o sistema.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#5a4e3c' }}>
              Nome completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              style={{ border: '1px solid #e8e4dd', color: '#2d1f4e' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#5a4e3c' }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ border: '1px solid #e8e4dd', color: '#9a918a', backgroundColor: '#faf8f5' }}
            />
          </div>

          {erro && <p className="text-sm" style={{ color: '#dc2626' }}>{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
            style={{ backgroundColor: '#2d1f4e' }}
          >
            {loading ? 'Salvando...' : 'Acessar o sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar a page server `completar-perfil`**

```tsx
// src/app/completar-perfil/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CompletarPerfilForm from '@/components/CompletarPerfilForm'

export default async function CompletarPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Se já tem registro em usuarios, vai direto pro dashboard
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (usuario) redirect('/dashboard')

  // Recupera o vendedor_id do metadata do convite
  const vendedorId = user.user_metadata?.vendedor_id as string | undefined

  if (!vendedorId) {
    // Sem vendedor_id no metadata — convite inválido ou usuário sem vínculo
    redirect('/login?erro=convite-invalido')
  }

  // Busca o nome pré-cadastrado do vendedor para pré-preencher
  const { data: vendedor } = await supabase
    .from('vendedores')
    .select('nome')
    .eq('id', vendedorId)
    .single()

  return (
    <CompletarPerfilForm
      authUserId={user.id}
      vendedorId={vendedorId}
      nomeInicial={vendedor?.nome ?? ''}
      email={user.email ?? ''}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/completar-perfil/page.tsx" "src/components/CompletarPerfilForm.tsx"
git commit -m "feat: página de completar perfil para vendedor convidado"
```

---

### Task 4: Redirecionar para /completar-perfil se não tiver registro em usuarios

**Files:**
- Modify: `src/app/(protected)/layout.tsx`

- [ ] **Step 1: Adicionar redirect ao layout protegido**

Arquivo atual (`src/app/(protected)/layout.tsx`):
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import Sidebar from '@/components/Sidebar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const usuario = await getUsuarioAtual()
  const perfil = usuario?.perfil ?? 'admin'
  const nome   = usuario?.nome ?? user.email ?? 'Usuário'

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f4f1ec' }}>
      <Sidebar perfil={perfil} nome={nome} />
      <main className="flex-1 md:ml-64">{children}</main>
    </div>
  )
}
```

Substituir por:
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import Sidebar from '@/components/Sidebar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const usuario = await getUsuarioAtual()

  // Usuário autenticado mas sem registro → completar perfil
  if (!usuario) redirect('/completar-perfil')

  const perfil = usuario.perfil
  const nome   = usuario.nome

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f4f1ec' }}>
      <Sidebar perfil={perfil} nome={nome} />
      <main className="flex-1 md:ml-64">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(protected)/layout.tsx"
git commit -m "feat: redireciona para /completar-perfil se sem registro em usuarios"
```

---

### Task 5: Bloquear vendedores em páginas de admin

**Files:**
- Modify: `src/app/(protected)/financeiro/page.tsx`
- Modify: `src/app/(protected)/gestao/page.tsx`
- Modify: `src/app/(protected)/configuracoes/page.tsx`

- [ ] **Step 1: Adicionar guard em `/financeiro/page.tsx`**

Adicionar logo após o `import` inicial, antes de qualquer query:
```tsx
import { redirect } from 'next/navigation'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
```

Adicionar no início da função `FinanceiroPage()`:
```tsx
const usuario = await getUsuarioAtual()
if (usuario?.perfil !== 'admin') redirect('/dashboard')
```

- [ ] **Step 2: Adicionar guard em `/gestao/page.tsx`**

Adicionar imports:
```tsx
import { redirect } from 'next/navigation'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
```

Adicionar no início da função `GestaoPage()`:
```tsx
const usuario = await getUsuarioAtual()
if (usuario?.perfil !== 'admin') redirect('/dashboard')
```

- [ ] **Step 3: Adicionar guard em `/configuracoes/page.tsx`**

Adicionar imports:
```tsx
import { redirect } from 'next/navigation'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
```

Adicionar no início da função `ConfiguracoesPage()`:
```tsx
const usuario = await getUsuarioAtual()
if (usuario?.perfil !== 'admin') redirect('/dashboard')
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/financeiro/page.tsx" "src/app/(protected)/gestao/page.tsx" "src/app/(protected)/configuracoes/page.tsx"
git commit -m "feat: bloqueia acesso de vendedores em páginas admin"
```

---

### Task 6: Página de comissões do vendedor

**Files:**
- Create: `src/app/(protected)/minhas-comissoes/page.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Criar a página `/minhas-comissoes`**

```tsx
// src/app/(protected)/minhas-comissoes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { redirect } from 'next/navigation'
import { Comissao, Venda } from '@/lib/types'

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

function tipoLabel(c: Comissao) {
  if (c.tipo === 'vitalicio') return 'Vitalício'
  if (c.numero_parcela === 1) return 'Adesão'
  return `Parcela ${c.numero_parcela}`
}

export default async function MinhasComissoesPage() {
  const usuario = await getUsuarioAtual()
  if (!usuario || usuario.perfil !== 'vendedor') redirect('/dashboard')

  const supabase = await createClient()

  const { data: comissoesRaw } = await supabase
    .from('comissoes')
    .select('*, vendas(cliente_nome, operadora)')
    .order('data_prevista', { ascending: false })

  const comissoes = (comissoesRaw ?? []) as (Comissao & {
    vendas: { cliente_nome: string; operadora: string } | null
  })[]

  const totalPendente = comissoes
    .filter(c => c.status_vendedor === 'Pendente')
    .reduce((s, c) => s + c.valor_vendedor, 0)

  const totalRecebido = comissoes
    .filter(c => c.status_vendedor === 'Recebido')
    .reduce((s, c) => s + c.valor_vendedor, 0)

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Minhas Comissões</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
          Valores a receber pelas suas vendas
        </p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e4dd' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#9a918a' }}>A Receber</p>
          <p className="text-xl font-bold" style={{ color: '#2d1f4e' }}>{fmtMoeda(totalPendente)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e4dd' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#9a918a' }}>Já Recebido</p>
          <p className="text-xl font-bold" style={{ color: '#15803d' }}>{fmtMoeda(totalRecebido)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        {comissoes.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: '#9a918a' }}>
            Nenhuma comissão registrada ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e4dd', backgroundColor: '#faf8f5' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Operadora</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Tipo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Previsto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9a918a' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f0ece6' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#2d1f4e' }}>
                    {c.vendas?.cliente_nome ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>
                    {c.vendas?.operadora ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{tipoLabel(c)}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: '#2d1f4e' }}>
                    {fmtMoeda(c.valor_vendedor)}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#5a4e3c' }}>{fmtData(c.data_prevista)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={c.status_vendedor === 'Recebido'
                        ? { backgroundColor: '#dcfce7', color: '#15803d' }
                        : { backgroundColor: '#fef9c3', color: '#a16207' }
                      }
                    >
                      {c.status_vendedor}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Adicionar "Comissões" ao NAV_VENDEDOR no Sidebar**

Em `src/components/Sidebar.tsx`, localizar:
```tsx
import {
  LayoutDashboard, Users, UserCheck, Calendar,
  DollarSign, BarChart2, Megaphone, Settings, LogOut, Menu, X,
} from 'lucide-react'
```
(já importa `DollarSign`)

Localizar `NAV_VENDEDOR`:
```tsx
const NAV_VENDEDOR = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm',       label: 'CRM',       icon: Users           },
  { href: '/clientes',  label: 'Clientes',  icon: UserCheck       },
  { href: '/agenda',    label: 'Agenda',    icon: Calendar, badge: true },
]
```

Substituir por:
```tsx
const NAV_VENDEDOR = [
  { href: '/dashboard',         label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/crm',               label: 'CRM',        icon: Users           },
  { href: '/clientes',          label: 'Clientes',   icon: UserCheck       },
  { href: '/agenda',            label: 'Agenda',     icon: Calendar, badge: true },
  { href: '/minhas-comissoes',  label: 'Comissões',  icon: DollarSign      },
]
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(protected)/minhas-comissoes/page.tsx" "src/components/Sidebar.tsx"
git commit -m "feat: página de comissões do vendedor + link no menu"
```

---

### Task 7: Botão de convite na Ficha do Vendedor

**Files:**
- Modify: `src/app/(protected)/gestao/[id]/page.tsx`
- Modify: `src/components/FichaVendedor.tsx`

- [ ] **Step 1: Buscar registro `usuarios` na página da ficha**

Em `src/app/(protected)/gestao/[id]/page.tsx`, o arquivo atual é:
```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FichaVendedor from '@/components/FichaVendedor'

export default async function FichaVendedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vendedor } = await supabase
    .from('vendedores')
    .select('*')
    .eq('id', id)
    .single()

  if (!vendedor) notFound()

  const { data: vendas } = await supabase
    .from('vendas')
    .select('*')
    .eq('vendedor', vendedor.nome)
    .order('data_venda', { ascending: false })

  const vendaIds = (vendas ?? []).map((v: { id: string }) => v.id)
  const { data: comissoes } = vendaIds.length > 0
    ? await supabase.from('comissoes').select('*').in('venda_id', vendaIds)
    : { data: [] }

  return (
    <div className="p-6 md:p-8">
      <FichaVendedor
        vendedor={vendedor}
        vendas={vendas ?? []}
        comissoes={comissoes ?? []}
      />
    </div>
  )
}
```

Substituir por:
```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FichaVendedor from '@/components/FichaVendedor'

export default async function FichaVendedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: vendedor }, { data: usuarioVendedor }] = await Promise.all([
    supabase.from('vendedores').select('*').eq('id', id).single(),
    supabase.from('usuarios').select('id, perfil, ativo').eq('vendedor_id', id).maybeSingle(),
  ])

  if (!vendedor) notFound()

  const { data: vendas } = await supabase
    .from('vendas')
    .select('*')
    .eq('vendedor', vendedor.nome)
    .order('data_venda', { ascending: false })

  const vendaIds = (vendas ?? []).map((v: { id: string }) => v.id)
  const { data: comissoes } = vendaIds.length > 0
    ? await supabase.from('comissoes').select('*').in('venda_id', vendaIds)
    : { data: [] }

  return (
    <div className="p-6 md:p-8">
      <FichaVendedor
        vendedor={vendedor}
        vendas={vendas ?? []}
        comissoes={comissoes ?? []}
        usuarioVinculado={usuarioVendedor ?? null}
      />
    </div>
  )
}
```

- [ ] **Step 2: Adicionar prop `usuarioVinculado` e botão de convite em `FichaVendedor.tsx`**

No início de `src/components/FichaVendedor.tsx`, localizar a interface `Props`:
```tsx
interface Props {
  vendedor: Vendedor
  vendas: Venda[]
  comissoes: Comissao[]
}
```

Substituir por:
```tsx
interface UsuarioVinculado {
  id: string
  perfil: string
  ativo: boolean
}

interface Props {
  vendedor: Vendedor
  vendas: Venda[]
  comissoes: Comissao[]
  usuarioVinculado: UsuarioVinculado | null
}
```

Localizar a assinatura do componente:
```tsx
export default function FichaVendedor({ vendedor, vendas, comissoes }: Props) {
```

Substituir por:
```tsx
export default function FichaVendedor({ vendedor, vendas, comissoes, usuarioVinculado }: Props) {
```

Adicionar state e função de convite logo após a declaração dos states existentes (após `const [filtroOp, setFiltroOp]`):
```tsx
  const [convidando, setConvidando] = useState(false)
  const [conviteMsg, setConviteMsg] = useState('')

  async function handleConvidar() {
    if (!vendedor.email) { setConviteMsg('Vendedor sem e-mail cadastrado.'); return }
    setConvidando(true)
    setConviteMsg('')
    const res = await fetch('/api/admin/convidar-vendedor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendedor_id: vendedor.id, email: vendedor.email }),
    })
    const json = await res.json()
    setConvidando(false)
    setConviteMsg(res.ok ? 'Convite enviado com sucesso!' : (json.error ?? 'Erro ao enviar convite.'))
  }
```

No JSX, dentro do card de dados cadastrais (logo após o `<h2>` do nome do vendedor ou no final do primeiro card), adicionar o bloco de status do convite. Localizar o bloco com o título da seção "Dados Pessoais" ou equivalente e adicionar antes do fechamento do primeiro `<div className={cardCls}>`:

```tsx
        {/* Status de acesso */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid #e8e4dd' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#9a918a' }}>Acesso ao Sistema</p>
          <div className="flex items-center gap-3 flex-wrap">
            {usuarioVinculado ? (
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
              >
                Ativo
              </span>
            ) : (
              <>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#f0ece6', color: '#9a918a' }}
                >
                  Sem acesso
                </span>
                <button
                  onClick={handleConvidar}
                  disabled={convidando || !vendedor.email}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#2d1f4e' }}
                >
                  {convidando ? 'Enviando...' : 'Convidar por E-mail'}
                </button>
                {!vendedor.email && (
                  <span className="text-xs" style={{ color: '#dc2626' }}>
                    Cadastre o e-mail do vendedor primeiro
                  </span>
                )}
              </>
            )}
            {conviteMsg && (
              <span
                className="text-xs"
                style={{ color: conviteMsg.includes('sucesso') ? '#15803d' : '#dc2626' }}
              >
                {conviteMsg}
              </span>
            )}
          </div>
        </div>
```

- [ ] **Step 3: Verificar que `useState` já está importado (está — é um componente client)**

```bash
head -5 src/components/FichaVendedor.tsx
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/gestao/[id]/page.tsx" "src/components/FichaVendedor.tsx"
git commit -m "feat: botão de convite por e-mail na ficha do vendedor"
```

---

## Self-Review

### Spec coverage check:
- ✅ Vendedor vê próprios clientes — RLS já existe (Task 1 não precisa, já tem)
- ✅ Vendedor vê próprias comissões — Task 1 (nova policy) + Task 6 (página)
- ✅ Vendedor pode cadastrar clientes — RLS já permite insert (política `clientes_vendedor_insert`)
- ✅ Vendedor não pode deletar — RLS não tem policy de DELETE para vendedor (só SELECT/INSERT)
- ✅ Convite por e-mail — Task 2 + Task 7
- ✅ Completar perfil ao aceitar convite — Task 3
- ✅ Redirect se sem registro — Task 4
- ✅ Bloquear páginas admin — Task 5
- ✅ Menu de comissões — Task 6
- ✅ Botão de convite na ficha — Task 7

### Placeholder scan:
- Nenhum "TBD" ou "TODO" encontrado.

### Type consistency:
- `UsuarioVinculado` definido na Task 7 Step 2 e usado consistentemente.
- `Comissao & { vendas: ... }` no cast da página de comissões — correto, join retorna objeto aninhado.
