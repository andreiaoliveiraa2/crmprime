# Sistema de Permissões e Acesso por Perfil — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar perfis Admin e Vendedor com isolamento de dados por RLS no Supabase, convite por e-mail, sidebar condicional e seção de gerenciamento de usuários em Configurações.

**Architecture:** Tabela `usuarios` liga `auth.users` a perfis e cadastros de vendedores. O servidor lê o perfil em cada page server component e filtra as queries. RLS no banco garante isolamento mesmo que o código esqueça o filtro. Middleware protege rotas restritas.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), Supabase SSR, `@supabase/ssr`, `supabase-js` (admin client)

---

## Mapa de Arquivos

| Ação | Arquivo |
|---|---|
| Criar | `supabase/migrations/20260523_usuarios_permissoes.sql` |
| Criar | `supabase/migrations/20260523_rls_permissoes.sql` |
| Modificar | `src/lib/types.ts` |
| Criar | `src/lib/getUsuarioAtual.ts` |
| Criar | `src/middleware.ts` |
| Modificar | `src/app/(protected)/layout.tsx` |
| Modificar | `src/components/Sidebar.tsx` |
| Modificar | `src/app/(protected)/dashboard/page.tsx` |
| Modificar | `src/app/(protected)/crm/page.tsx` |
| Modificar | `src/app/(protected)/crm/novo/page.tsx` |
| Modificar | `src/components/LeadForm.tsx` |
| Modificar | `src/app/(protected)/clientes/page.tsx` |
| Modificar | `src/app/(protected)/clientes/novo/page.tsx` |
| Modificar | `src/components/ClienteFormPosVenda.tsx` |
| Modificar | `src/app/(protected)/agenda/page.tsx` |
| Modificar | `src/components/AgendaClient.tsx` |
| Modificar | `src/components/EventoModal.tsx` |
| Criar | `src/app/actions/usuarios.ts` |
| Criar | `src/components/UsuariosSection.tsx` |
| Modificar | `src/app/(protected)/configuracoes/page.tsx` |

---

## Task 1: Migration — Tabela `usuarios` e colunas `vendedor_id`

**Files:**
- Criar: `supabase/migrations/20260523_usuarios_permissoes.sql`

> Esta migration NÃO habilita RLS nas tabelas existentes (leads, clientes, agenda, vendas). O RLS é habilitado na Task 5, após as admins serem cadastradas. Isso evita que o sistema quebre antes do cadastro inicial.

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260523_usuarios_permissoes.sql

-- Tabela de usuários do sistema
create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  nome          text not null,
  email         text,
  perfil        text not null check (perfil in ('admin', 'vendedor')),
  vendedor_id   uuid references vendedores(id) on delete set null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

-- RLS na própria tabela usuarios
alter table usuarios enable row level security;

-- Usuário autenticado lê apenas o próprio registro
create policy "usuario_le_proprio" on usuarios
  for select using (auth_user_id = auth.uid());

-- Service role faz tudo (Server Actions usam service role)
create policy "service_role_full" on usuarios
  for all using (auth.role() = 'service_role');

-- Adicionar vendedor_id nas tabelas que precisam de isolamento
alter table leads    add column if not exists vendedor_id uuid references vendedores(id);
alter table clientes add column if not exists vendedor_id uuid references vendedores(id);
alter table agenda   add column if not exists vendedor_id uuid references vendedores(id);
alter table vendas   add column if not exists vendedor_id uuid references vendedores(id);

-- Preencher vendedor_id retroativamente a partir do campo texto existente
update leads    set vendedor_id = v.id from vendedores v where leads.vendedor    = v.nome and leads.vendedor_id    is null;
update clientes set vendedor_id = v.id from vendedores v where clientes.vendedor = v.nome and clientes.vendedor_id is null;
update vendas   set vendedor_id = v.id from vendedores v where vendas.vendedor   = v.nome and vendas.vendedor_id   is null;

-- Funções helper para as políticas RLS (usadas na Task 5)
create or replace function meu_perfil()
returns text language sql security definer stable as $$
  select perfil from usuarios where auth_user_id = auth.uid()
$$;

create or replace function meu_vendedor_id()
returns uuid language sql security definer stable as $$
  select vendedor_id from usuarios where auth_user_id = auth.uid()
$$;
```

- [ ] **Step 2: Executar no Supabase**

Abrir o painel do Supabase → SQL Editor → colar o conteúdo acima → Run.
Verificar que não há erros. As tabelas `leads`, `clientes`, `agenda`, `vendas` agora têm a coluna `vendedor_id`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260523_usuarios_permissoes.sql
git commit -m "feat: migration — tabela usuarios e colunas vendedor_id"
```

---

## Task 2: Atualizar tipos TypeScript

**Files:**
- Modificar: `src/lib/types.ts`

- [ ] **Step 1: Adicionar interface `Usuario` e atualizar Lead, Cliente, Compromisso**

No final do arquivo `src/lib/types.ts`, após `DocumentoCliente`, adicionar:

```typescript
export interface Usuario {
  id: string
  auth_user_id: string
  nome: string
  email: string | null
  perfil: 'admin' | 'vendedor'
  vendedor_id: string | null
  ativo: boolean
  criado_em: string
}
export type UsuarioInsert = Omit<Usuario, 'id' | 'criado_em'>
```

- [ ] **Step 2: Adicionar `vendedor_id` em Lead**

Na interface `Lead` (linha ~43), adicionar após `vendedor: string | null`:

```typescript
  vendedor_id: string | null
```

- [ ] **Step 3: Adicionar `vendedor_id` em Cliente**

Na interface `Cliente` (linha ~148), adicionar após `vendedor: string | null`:

```typescript
  vendedor_id: string | null
```

- [ ] **Step 4: Adicionar `vendedor_id` em Compromisso**

Na interface `Compromisso` (linha ~215), adicionar após `observacoes: string | null`:

```typescript
  vendedor_id: string | null
```

- [ ] **Step 5: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros novos (pode haver erros de propriedades faltando em `LeadInsert`, `ClienteInsert`, `CompromissoInsert` — serão corrigidos nas tasks seguintes conforme cada arquivo for atualizado).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: adiciona vendedor_id e tipo Usuario aos types"
```

---

## Task 3: Helper `getUsuarioAtual`

**Files:**
- Criar: `src/lib/getUsuarioAtual.ts`

Este helper é usado em todos os page server components para obter o perfil do usuário logado.

- [ ] **Step 1: Criar o arquivo**

```typescript
// src/lib/getUsuarioAtual.ts
import { createClient } from '@/lib/supabase/server'
import { Usuario } from '@/lib/types'

export type UsuarioAtual = Pick<Usuario, 'id' | 'auth_user_id' | 'nome' | 'perfil' | 'vendedor_id'>

export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('usuarios')
    .select('id, auth_user_id, nome, perfil, vendedor_id')
    .eq('auth_user_id', user.id)
    .single()

  return data as UsuarioAtual | null
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/getUsuarioAtual.ts
git commit -m "feat: helper getUsuarioAtual para server components"
```

---

## Task 4: Server Actions — gerenciamento de usuários

**Files:**
- Criar: `src/app/actions/usuarios.ts`

Todas as ações usam `createAdminClient()` (service role) para contornar RLS e chamar a API admin do Supabase Auth.

- [ ] **Step 1: Criar o arquivo de actions**

```typescript
// src/app/actions/usuarios.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function seedAdminAtual(nome: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const admin = createAdminClient()
  const { data: existe } = await admin
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (existe) return { ok: true, msg: 'Já cadastrado' }

  const { error } = await admin.from('usuarios').insert({
    auth_user_id: user.id,
    nome,
    perfil: 'admin',
    vendedor_id: null,
    ativo: true,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/configuracoes')
  return { ok: true }
}

export async function convidarUsuario(formData: FormData) {
  const nome       = formData.get('nome') as string
  const email      = formData.get('email') as string
  const perfil     = formData.get('perfil') as 'admin' | 'vendedor'
  const vendedor_id = formData.get('vendedor_id') as string | null

  if (!nome || !email || !perfil) throw new Error('Campos obrigatórios faltando')
  if (perfil === 'vendedor' && !vendedor_id) throw new Error('Selecione o vendedor vinculado')

  const admin = createAdminClient()

  const { data: authUser, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome },
  })
  if (inviteErr) throw new Error(inviteErr.message)

  const { error: dbErr } = await admin.from('usuarios').insert({
    auth_user_id: authUser.user.id,
    nome,
    email,
    perfil,
    vendedor_id: vendedor_id || null,
    ativo: true,
  })
  if (dbErr) throw new Error(dbErr.message)

  revalidatePath('/configuracoes')
}

export async function editarUsuario(formData: FormData) {
  const id          = formData.get('id') as string
  const nome        = formData.get('nome') as string
  const perfil      = formData.get('perfil') as 'admin' | 'vendedor'
  const vendedor_id = formData.get('vendedor_id') as string | null
  const ativo       = formData.get('ativo') === 'true'

  const admin = createAdminClient()
  const { error } = await admin
    .from('usuarios')
    .update({ nome, perfil, vendedor_id: vendedor_id || null, ativo })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/configuracoes')
}

export async function reenviarConvite(email: string) {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(email)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/usuarios.ts
git commit -m "feat: server actions para gerenciamento de usuarios"
```

---

## Task 5: Migration — Habilitar RLS nas tabelas existentes

**Files:**
- Criar: `supabase/migrations/20260523_rls_permissoes.sql`

> **ATENÇÃO:** Executar esta migration SOMENTE após as duas admins (Andreia e sócia) terem sido cadastradas em `usuarios` via o botão "Cadastrar como Admin" em Configurações (Task 13). Executar antes disso vai bloquear o acesso de todas as usuárias.

- [ ] **Step 1: Criar o arquivo**

```sql
-- supabase/migrations/20260523_rls_permissoes.sql
-- Executar APÓS as admins serem cadastradas em usuarios

-- ── LEADS ──
alter table leads enable row level security;

create policy "leads_admin_tudo" on leads
  for all using (meu_perfil() = 'admin');

create policy "leads_vendedor_proprios" on leads
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "leads_vendedor_insert" on leads
  for insert with check (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "leads_vendedor_update" on leads
  for update using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- ── CLIENTES ──
alter table clientes enable row level security;

create policy "clientes_admin_tudo" on clientes
  for all using (meu_perfil() = 'admin');

create policy "clientes_vendedor_proprios" on clientes
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "clientes_vendedor_insert" on clientes
  for insert with check (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "clientes_vendedor_update" on clientes
  for update using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- ── AGENDA ──
alter table agenda enable row level security;

create policy "agenda_admin_tudo" on agenda
  for all using (meu_perfil() = 'admin');

create policy "agenda_vendedor_proprios" on agenda
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "agenda_vendedor_insert" on agenda
  for insert with check (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "agenda_vendedor_update" on agenda
  for update using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- ── FINANCEIRO — apenas admins ──
alter table vendas             enable row level security;
alter table comissoes          enable row level security;
alter table contas             enable row level security;
alter table regras_comissao    enable row level security;
alter table parcelas_regra     enable row level security;
alter table cnpjs_recebimento  enable row level security;
alter table categorias_despesa enable row level security;
alter table despesas_fixas     enable row level security;

create policy "vendas_admin"             on vendas             for all using (meu_perfil() = 'admin');
create policy "comissoes_admin"          on comissoes          for all using (meu_perfil() = 'admin');
create policy "contas_admin"             on contas             for all using (meu_perfil() = 'admin');
create policy "regras_comissao_admin"    on regras_comissao    for all using (meu_perfil() = 'admin');
create policy "parcelas_regra_admin"     on parcelas_regra     for all using (meu_perfil() = 'admin');
create policy "cnpjs_recebimento_admin"  on cnpjs_recebimento  for all using (meu_perfil() = 'admin');
create policy "categorias_despesa_admin" on categorias_despesa for all using (meu_perfil() = 'admin');
create policy "despesas_fixas_admin"     on despesas_fixas     for all using (meu_perfil() = 'admin');

-- ── TABELAS COMPARTILHADAS (leitura por todos autenticados) ──
alter table vendedores  enable row level security;
alter table operadoras  enable row level security;
alter table tipos_agenda enable row level security;

create policy "vendedores_leitura"   on vendedores   for select using (auth.role() = 'authenticated');
create policy "vendedores_admin"     on vendedores   for all    using (meu_perfil() = 'admin');
create policy "operadoras_leitura"   on operadoras   for select using (auth.role() = 'authenticated');
create policy "operadoras_admin"     on operadoras   for all    using (meu_perfil() = 'admin');
create policy "tipos_agenda_leitura" on tipos_agenda for select using (auth.role() = 'authenticated');
create policy "tipos_agenda_todos"   on tipos_agenda for all    using (auth.role() = 'authenticated');
```

- [ ] **Step 2: Aguardar cadastro das admins (Task 13 concluída)**

Não executar ainda. O arquivo fica salvo localmente. Executar apenas após o botão "Cadastrar como Admin" ter sido usado pelas duas admins.

- [ ] **Step 3: Commit do arquivo**

```bash
git add supabase/migrations/20260523_rls_permissoes.sql
git commit -m "feat: migration RLS — executar após seed das admins"
```

---

## Task 6: Middleware — Proteção de rotas

**Files:**
- Criar: `src/middleware.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROTAS_RESTRITAS_VENDEDOR = ['/financeiro', '/gestao', '/configuracoes', '/marketing']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil, ativo')
    .eq('auth_user_id', user.id)
    .single()

  // Usuário inativo → logout
  if (usuario?.ativo === false) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Vendedor tentando acessar rota restrita → dashboard
  const pathname = request.nextUrl.pathname
  const restrita = ROTAS_RESTRITAS_VENDEDOR.some(r => pathname.startsWith(r))
  if (usuario?.perfil === 'vendedor' && restrita) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|signup|reset-senha|api).*)',
  ],
}
```

- [ ] **Step 2: Verificar que o servidor ainda sobe sem erros**

```bash
# O servidor já deve estar rodando; se não, iniciar:
npm run dev
```

Acessar `http://localhost:3000` — deve continuar funcionando normalmente (Andreia não tem registro em `usuarios` ainda, então `usuario` é null e nenhum redirect indevido ocorre).

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: middleware — proteção de rotas por perfil"
```

---

## Task 7: Layout + Sidebar — menu condicional e nome dinâmico

**Files:**
- Modificar: `src/app/(protected)/layout.tsx`
- Modificar: `src/components/Sidebar.tsx`

- [ ] **Step 1: Atualizar `layout.tsx` para buscar perfil e passar ao Sidebar**

Substituir o conteúdo de `src/app/(protected)/layout.tsx`:

```typescript
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

- [ ] **Step 2: Atualizar `Sidebar.tsx` para usar perfil e nome dinâmico**

Substituir o conteúdo de `src/components/Sidebar.tsx`:

```typescript
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, Calendar,
  DollarSign, BarChart2, Megaphone, Settings, LogOut, Menu, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_ADMIN = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/crm',           label: 'CRM',           icon: Users           },
  { href: '/clientes',      label: 'Clientes',      icon: UserCheck       },
  { href: '/agenda',        label: 'Agenda',        icon: Calendar, badge: true },
  { href: '/financeiro',    label: 'Financeiro',    icon: DollarSign      },
  { href: '/gestao',        label: 'Gestão',        icon: BarChart2       },
  { href: '/marketing',     label: 'Marketing',     icon: Megaphone       },
  { href: '/configuracoes', label: 'Configurações', icon: Settings        },
]

const NAV_VENDEDOR = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm',       label: 'CRM',       icon: Users           },
  { href: '/clientes',  label: 'Clientes',  icon: UserCheck       },
  { href: '/agenda',    label: 'Agenda',    icon: Calendar, badge: true },
]

interface Props {
  perfil: 'admin' | 'vendedor'
  nome: string
}

export default function Sidebar({ perfil, nome }: Props) {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const [agendaHoje, setAgendaHoje] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  const navItems = perfil === 'admin' ? NAV_ADMIN : NAV_VENDEDOR

  useEffect(() => {
    const inicio = new Date(); inicio.setHours(0,0,0,0)
    const fim = new Date(); fim.setHours(23,59,59,999)
    supabase.from('agenda').select('id', { count: 'exact', head: true })
      .gte('data_hora', inicio.toISOString())
      .lte('data_hora', fim.toISOString())
      .then(({ count }) => setAgendaHoje(count ?? 0))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('')

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-md"
        style={{ backgroundColor: '#2d1f4e' }}
        onClick={() => setAberto(!aberto)}
        aria-label="Abrir menu"
      >
        {aberto ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
      </button>

      {aberto && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setAberto(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-transform duration-200 ${aberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ backgroundColor: '#2d1f4e' }}
      >
        <div className="px-6 py-5 flex items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Image
            src="/logo-a2prime.png"
            alt="A2 Prime"
            width={48}
            height={48}
            className="object-cover rounded-full"
            style={{ width: '48px', height: '48px' }}
            priority
          />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = isActive(href)
            const showBadge = badge && agendaHoje > 0
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  backgroundColor: active ? 'rgba(184,154,106,0.12)' : 'transparent',
                  borderLeft: active ? '3px solid #b89a6a' : '3px solid transparent',
                  paddingLeft: '12px',
                }}
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{ backgroundColor: '#b89a6a', color: '#2d1f4e' }}>
                    {agendaHoje}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none"
              style={{ backgroundColor: '#b89a6a', color: '#2d1f4e' }}
            >
              {iniciais}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{nome}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {perfil === 'admin' ? 'Admin · A2 Prime' : 'Vendedor'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-red-500/10 hover:text-red-400"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 3: Verificar no browser**

Acessar `http://localhost:3000/dashboard`. O nome "Andreia Oliveira" deve desaparecer — o rodapé mostrará o e-mail do usuário enquanto não houver registro em `usuarios`. O menu continua completo (perfil padrão 'admin').

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/layout.tsx src/components/Sidebar.tsx
git commit -m "feat: sidebar com menu condicional por perfil e nome dinâmico"
```

---

## Task 8: Dashboard — filtro por vendedor

**Files:**
- Modificar: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Buscar perfil e aplicar filtros nas queries**

No topo da função `DashboardPage`, após `const supabase = await createClient()`, adicionar:

```typescript
  const usuario = await getUsuarioAtual()
  const isVendedor = usuario?.perfil === 'vendedor'
  const vendedorId = usuario?.vendedor_id ?? null
  const nomeUsuario = usuario?.nome ?? 'Você'
```

Adicionar o import no topo do arquivo:
```typescript
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
```

- [ ] **Step 2: Aplicar filtro nas queries de leads, clientes e agenda**

Substituir o bloco `Promise.all` atual pelo seguinte (adiciona `.eq('vendedor_id', vendedorId)` quando for vendedor):

```typescript
  let leadsQuery    = supabase.from('leads').select('*').order('criado_em', { ascending: false })
  let clientesQuery = supabase.from('clientes').select('*').order('criado_em', { ascending: false })
  let agendaHojeQ   = supabase.from('agenda').select('*').gte('data_hora', inicioDia.toISOString()).lte('data_hora', fimDia.toISOString()).order('data_hora', { ascending: true })
  let agendaSemanaQ = supabase.from('agenda').select('*').gte('data_hora', inicioSemana.toISOString()).lte('data_hora', fimSemana.toISOString()).order('data_hora', { ascending: true }).limit(5)
  let pendentesQ    = supabase.from('agenda').select('*').eq('status', 'Agendado').lt('data_hora', inicioDia.toISOString()).order('data_hora', { ascending: false }).limit(3)

  if (isVendedor && vendedorId) {
    leadsQuery    = leadsQuery.eq('vendedor_id', vendedorId)
    clientesQuery = clientesQuery.eq('vendedor_id', vendedorId)
    agendaHojeQ   = agendaHojeQ.eq('vendedor_id', vendedorId)
    agendaSemanaQ = agendaSemanaQ.eq('vendedor_id', vendedorId)
    pendentesQ    = pendentesQ.eq('vendedor_id', vendedorId)
  }

  const [
    { data: leadsData },
    { data: clientesData },
    { data: eventosHojeData },
    { data: eventosSemanaData },
    { data: pendentesData },
  ] = await Promise.all([leadsQuery, clientesQuery, agendaHojeQ, agendaSemanaQ, pendentesQ])
```

- [ ] **Step 3: Substituir "Andreia" pelo nome dinâmico**

Localizar a linha com `Olá, Andreia 👋` e trocar por:

```tsx
            Olá, {nomeUsuario} 👋
```

- [ ] **Step 4: Verificar no browser**

Acessar `http://localhost:3000/dashboard` — deve funcionar normalmente para admin (vê tudo).

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "feat: dashboard filtra dados por vendedor quando perfil=vendedor"
```

---

## Task 9: CRM/Leads — filtro e auto-preenchimento de vendedor

**Files:**
- Modificar: `src/app/(protected)/crm/page.tsx`
- Modificar: `src/app/(protected)/crm/novo/page.tsx`
- Modificar: `src/components/LeadForm.tsx`

- [ ] **Step 1: Filtrar leads por vendedor em `crm/page.tsx`**

Substituir o conteúdo de `src/app/(protected)/crm/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import PipelineClient from '@/components/PipelineClient'

export default async function CrmPage() {
  const supabase = await createClient()
  const usuario  = await getUsuarioAtual()

  let query = supabase.from('leads').select('*').order('criado_em', { ascending: false })
  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    query = query.eq('vendedor_id', usuario.vendedor_id)
  }
  const { data: leads } = await query

  return (
    <div className="p-5 md:p-7">
      <PipelineClient leads={leads ?? []} perfil={usuario?.perfil ?? 'admin'} />
    </div>
  )
}
```

- [ ] **Step 2: Atualizar `PipelineClient` para aceitar prop `perfil`**

Em `src/components/PipelineClient.tsx`, na interface `Props`, adicionar:

```typescript
interface Props {
  leads: Lead[]
  perfil: 'admin' | 'vendedor'
}
```

E no destructuring da função:
```typescript
export default function PipelineClient({ leads: leadsIniciais, perfil }: Props) {
```

No JSX, localizar o filtro de vendedor (select de filtroVendedor) e ocultar para vendedores — substituir o bloco do select de vendedor por:

```tsx
        {perfil === 'admin' && (
          <select
            className={selectCls}
            style={selectStyle}
            value={filtroVendedor}
            onChange={e => setFiltroVendedor(e.target.value)}
          >
            <option value="">Todos os vendedores</option>
            {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
```

- [ ] **Step 3: Tornar `crm/novo/page.tsx` server component que passa o perfil**

Substituir o conteúdo de `src/app/(protected)/crm/novo/page.tsx`:

```typescript
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { createClient } from '@/lib/supabase/server'
import LeadForm from '@/components/LeadForm'

export default async function NovoLeadPage() {
  const usuario = await getUsuarioAtual()
  let vendedorAtual: { id: string; nome: string } | null = null

  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('vendedores')
      .select('id, nome')
      .eq('id', usuario.vendedor_id)
      .single()
    if (data) vendedorAtual = data
  }

  return (
    <div className="p-5 md:p-7">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#2d1f4e' }}>Novo Lead</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>Preencha os dados do novo contato</p>
      </div>
      <LeadForm vendedorAtual={vendedorAtual} />
    </div>
  )
}
```

- [ ] **Step 4: Atualizar `LeadForm` para aceitar `vendedorAtual` e incluir `vendedor_id` no payload**

Na interface `Props` de `src/components/LeadForm.tsx`:

```typescript
interface Props {
  lead?: Lead
  vendedorAtual?: { id: string; nome: string } | null
}
```

No destructuring:
```typescript
export default function LeadForm({ lead, vendedorAtual }: Props) {
```

Na inicialização do estado `vendedor`:
```typescript
  const [vendedor, setVendedor] = useState(lead?.vendedor ?? vendedorAtual?.nome ?? '')
```

No `payload` dentro de `handleSubmit`, adicionar `vendedor_id`:
```typescript
    const payload: LeadInsert & { vendedor_id?: string | null } = {
      nome: nome.trim() || null,
      telefone: telefone.trim() || null,
      origem: origem || null,
      o_que_procura: oQueProcura.trim() || null,
      tipo_plano: tipo_plano || null,
      operadora: operadora.trim() || null,
      responsavel: responsavel.trim() || null,
      vendedor: vendedor.trim() || null,
      vendedor_id: lead?.vendedor_id ?? vendedorAtual?.id ?? null,
      observacoes: observacoes.trim() || null,
      etapa: lead?.etapa ?? 'Novo Lead',
      criado_em: dataEntrada ? new Date(dataEntrada).toISOString() : undefined,
    }
```

No JSX do campo vendedor, travar se `vendedorAtual` estiver presente:

```tsx
          <select
            id="vendedor"
            value={vendedor}
            onChange={e => setVendedor(e.target.value)}
            className={inputCls}
            style={{ ...inputStyle, color: vendedor ? '#1a1a1a' : '#9a918a' }}
            disabled={!!vendedorAtual}
          >
            <option value="">Selecione o vendedor...</option>
            {vendedorAtual
              ? <option value={vendedorAtual.nome}>{vendedorAtual.nome}</option>
              : vendedoresLista.map(v => <option key={v} value={v}>{v}</option>)
            }
          </select>
```

- [ ] **Step 5: Verificar no browser**

Acessar `/crm` como admin — lista completa, filtro de vendedor visível. Criar um lead novo — funciona normalmente.

- [ ] **Step 6: Commit**

```bash
git add src/app/(protected)/crm/page.tsx src/app/(protected)/crm/novo/page.tsx src/components/LeadForm.tsx src/components/PipelineClient.tsx
git commit -m "feat: CRM filtra leads por vendedor e auto-preenche no cadastro"
```

---

## Task 10: Clientes — filtro e auto-preenchimento de vendedor

**Files:**
- Modificar: `src/app/(protected)/clientes/page.tsx`
- Modificar: `src/app/(protected)/clientes/novo/page.tsx`
- Modificar: `src/components/ClienteFormPosVenda.tsx`

- [ ] **Step 1: Filtrar clientes por vendedor em `clientes/page.tsx`**

Substituir conteúdo de `src/app/(protected)/clientes/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import ClientesClient from '@/components/ClientesClient'

export default async function ClientesPage() {
  const supabase = await createClient()
  const usuario  = await getUsuarioAtual()

  let query = supabase.from('clientes').select('*').order('criado_em', { ascending: false })
  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    query = query.eq('vendedor_id', usuario.vendedor_id)
  }
  const { data: clientes } = await query

  return (
    <div className="p-6 md:p-8">
      <ClientesClient clientes={clientes ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Tornar `clientes/novo/page.tsx` server component**

Substituir conteúdo de `src/app/(protected)/clientes/novo/page.tsx`:

```typescript
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { createClient } from '@/lib/supabase/server'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'

export default async function NovoClientePage() {
  const usuario = await getUsuarioAtual()
  let vendedorAtual: { id: string; nome: string } | null = null

  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('vendedores')
      .select('id, nome')
      .eq('id', usuario.vendedor_id)
      .single()
    if (data) vendedorAtual = data
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Novo Cliente</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>Cadastre um cliente com plano ativo</p>
      </div>
      <ClienteFormPosVenda vendedorAtual={vendedorAtual} />
    </div>
  )
}
```

- [ ] **Step 3: Atualizar `ClienteFormPosVenda` para aceitar `vendedorAtual`**

Na interface `Props`:
```typescript
interface Props {
  cliente?: Cliente
  vendedorAtual?: { id: string; nome: string } | null
}
```

No destructuring:
```typescript
export default function ClienteFormPosVenda({ cliente, vendedorAtual }: Props) {
```

No estado `vendedor`:
```typescript
  const [vendedor, setVendedor] = useState(cliente?.vendedor ?? vendedorAtual?.nome ?? '')
```

No objeto `payload` dentro de `handleSalvar` (ou `handleSubmit`), adicionar `vendedor_id`:
```typescript
      vendedor_id: cliente?.vendedor_id ?? vendedorAtual?.id ?? null,
```

No JSX do campo vendedor, travar se `vendedorAtual`:
```tsx
            disabled={!!vendedorAtual && !editando}
```
E o select de vendedores só mostra a lista completa para admin:
```tsx
            {vendedorAtual && !editando
              ? <option value={vendedorAtual.nome}>{vendedorAtual.nome}</option>
              : vendedoresLista.map(v => <option key={v} value={v}>{v}</option>)
            }
```

- [ ] **Step 4: Verificar no browser**

Acessar `/clientes` — lista carrega. Criar novo cliente — funciona.

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/clientes/page.tsx src/app/(protected)/clientes/novo/page.tsx src/components/ClienteFormPosVenda.tsx
git commit -m "feat: Clientes filtra por vendedor e auto-preenche no cadastro"
```

---

## Task 11: Agenda — filtro e auto-preenchimento de vendedor

**Files:**
- Modificar: `src/app/(protected)/agenda/page.tsx`
- Modificar: `src/components/AgendaClient.tsx`
- Modificar: `src/components/EventoModal.tsx`

- [ ] **Step 1: Filtrar agenda por vendedor em `agenda/page.tsx`**

Substituir conteúdo de `src/app/(protected)/agenda/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import AgendaClient from '@/components/AgendaClient'

export default async function AgendaPage() {
  const supabase = await createClient()
  const usuario  = await getUsuarioAtual()

  let query = supabase.from('agenda').select('*').order('data_hora', { ascending: true })
  if (usuario?.perfil === 'vendedor' && usuario.vendedor_id) {
    query = query.eq('vendedor_id', usuario.vendedor_id)
  }
  const { data: eventos } = await query

  return (
    <div className="p-6 md:p-8">
      <AgendaClient
        eventos={eventos ?? []}
        vendedorId={usuario?.perfil === 'vendedor' ? (usuario.vendedor_id ?? null) : null}
      />
    </div>
  )
}
```

- [ ] **Step 2: Atualizar `AgendaClient` para aceitar e passar `vendedorId`**

Na interface `Props` de `src/components/AgendaClient.tsx`:

```typescript
interface Props {
  eventos: Compromisso[]
  vendedorId?: string | null
}
```

No destructuring:
```typescript
export default function AgendaClient({ eventos: inicial, vendedorId }: Props) {
```

Na abertura do `EventoModal`, adicionar a prop `vendedorId`. Localizar no JSX o bloco existente que renderiza `<EventoModal` (já tem `evento`, `dataInicial`, `onClose`, `onSalvo`) e acrescentar apenas a linha nova:

```tsx
            vendedorId={vendedorId}
```

O bloco completo ficará assim:
```tsx
        {modalAberto && (
          <EventoModal
            evento={eventoEditando}
            dataInicial={isoDate(dataSelecionada)}
            onClose={() => { setModalAberto(false); setEventoEditando(undefined) }}
            onSalvo={reload}
            vendedorId={vendedorId}
          />
        )}
```

- [ ] **Step 3: Atualizar `EventoModal` para aceitar e incluir `vendedorId` no insert**

Na interface `Props` de `src/components/EventoModal.tsx`:

```typescript
interface Props {
  evento?: Compromisso
  dataInicial?: string
  onClose: () => void
  onSalvo: () => void
  vendedorId?: string | null
}
```

No destructuring:
```typescript
export default function EventoModal({ evento, dataInicial, onClose, onSalvo, vendedorId }: Props) {
```

Em `handleSalvar`, no objeto `payload`, adicionar `vendedor_id`:

```typescript
    const payload: CompromissoInsert & { vendedor_id?: string | null } = {
      titulo:      titulo.trim(),
      data_hora:   new Date(dataHora).toISOString(),
      tipo,
      status,
      observacoes: observacoes.trim() || null,
      vendedor_id: evento?.vendedor_id ?? vendedorId ?? null,
    }
```

- [ ] **Step 4: Verificar no browser**

Acessar `/agenda` — calendário carrega normalmente. Criar um evento — funciona.

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/agenda/page.tsx src/components/AgendaClient.tsx src/components/EventoModal.tsx
git commit -m "feat: Agenda filtra por vendedor e inclui vendedor_id nos eventos"
```

---

## Task 12: Componente `UsuariosSection`

**Files:**
- Criar: `src/components/UsuariosSection.tsx`

Este é um Client Component que recebe a lista inicial de usuários e vendedores do servidor, e chama as Server Actions para convidar/editar/desativar.

- [ ] **Step 1: Criar o arquivo**

```typescript
'use client'

import { useState } from 'react'
import { Usuario, Vendedor } from '@/lib/types'
import { convidarUsuario, editarUsuario, reenviarConvite } from '@/app/actions/usuarios'
import { UserPlus, Pencil, MailCheck } from 'lucide-react'

interface Props {
  usuarios: Usuario[]
  vendedores: Vendedor[]
}

const inputCls = 'w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2'
const inputStyle = { borderColor: '#e8e4dd' }

export default function UsuariosSection({ usuarios: inicial, vendedores }: Props) {
  const [lista, setLista] = useState(inicial)
  const [modo, setModo]   = useState<'lista' | 'novo' | 'editar'>('lista')
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [erro, setErro]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConvidar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await convidarUsuario(new FormData(e.currentTarget))
      setModo('lista')
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao convidar')
    } finally {
      setLoading(false)
    }
  }

  async function handleEditar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await editarUsuario(new FormData(e.currentTarget))
      setModo('lista')
      setEditando(null)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  async function handleReenviar(email: string) {
    try {
      await reenviarConvite(email)
      alert('Convite reenviado!')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao reenviar')
    }
  }

  const perfilBadge = (perfil: string) => (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={perfil === 'admin'
        ? { backgroundColor: '#ede9fe', color: '#6d28d9' }
        : { backgroundColor: '#dbeafe', color: '#1d4ed8' }
      }
    >
      {perfil === 'admin' ? 'Admin' : 'Vendedor'}
    </span>
  )

  const statusBadge = (ativo: boolean) => (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={ativo
        ? { backgroundColor: '#dcfce7', color: '#15803d' }
        : { backgroundColor: '#fee2e2', color: '#b91c1c' }
      }
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e4dd' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>Usuários</h3>
        {modo === 'lista' && (
          <button
            onClick={() => { setModo('novo'); setErro('') }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#2d1f4e' }}
          >
            <UserPlus size={14} />
            Novo Usuário
          </button>
        )}
      </div>

      {/* LISTA */}
      {modo === 'lista' && (
        <div className="overflow-x-auto">
          {lista.length === 0
            ? <p className="text-sm text-center py-6" style={{ color: '#9a918a' }}>Nenhum usuário cadastrado.</p>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8e4dd' }}>
                    {['Nome', 'E-mail', 'Perfil', 'Status', ''].map(h => (
                      <th key={h} className="text-left py-2 pr-4 font-semibold" style={{ color: '#2d1f4e' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f4f1ec' }}>
                      <td className="py-2 pr-4 font-medium" style={{ color: '#1a1a1a' }}>{u.nome}</td>
                      <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>{u.email ?? '—'}</td>
                      <td className="py-2 pr-4">{perfilBadge(u.perfil)}</td>
                      <td className="py-2 pr-4">{statusBadge(u.ativo)}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => { setEditando(u); setModo('editar'); setErro('') }}
                            className="p-1.5 rounded-lg hover:bg-gray-100"
                            title="Editar"
                          >
                            <Pencil size={14} style={{ color: '#b89a6a' }} />
                          </button>
                          <button
                            onClick={() => handleReenviar(u.email ?? '')}
                            className="p-1.5 rounded-lg hover:bg-gray-100"
                            title="Reenviar convite"
                          >
                            <MailCheck size={14} style={{ color: '#2d1f4e' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* FORMULÁRIO NOVO */}
      {modo === 'novo' && (
        <form onSubmit={handleConvidar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Nome</label>
              <input name="nome" required className={inputCls} style={inputStyle} placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>E-mail</label>
              <input name="email" type="email" required className={inputCls} style={inputStyle} placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Perfil</label>
              <select name="perfil" required className={inputCls} style={inputStyle}>
                <option value="admin">Admin</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Vendedor vinculado</label>
              <select name="vendedor_id" className={inputCls} style={inputStyle}>
                <option value="">— nenhum (Admin) —</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#2d1f4e', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </button>
            <button
              type="button"
              onClick={() => { setModo('lista'); setErro('') }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#e8e4dd', color: '#4a4a4a' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* FORMULÁRIO EDITAR */}
      {modo === 'editar' && editando && (
        <form onSubmit={handleEditar} className="space-y-4">
          <input type="hidden" name="id" value={editando.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Nome</label>
              <input name="nome" required defaultValue={editando.nome} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Perfil</label>
              <select name="perfil" required defaultValue={editando.perfil} className={inputCls} style={inputStyle}>
                <option value="admin">Admin</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Vendedor vinculado</label>
              <select name="vendedor_id" defaultValue={editando.vendedor_id ?? ''} className={inputCls} style={inputStyle}>
                <option value="">— nenhum (Admin) —</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Status</label>
              <select name="ativo" defaultValue={editando.ativo ? 'true' : 'false'} className={inputCls} style={inputStyle}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#2d1f4e', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => { setModo('lista'); setEditando(null); setErro('') }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#e8e4dd', color: '#4a4a4a' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UsuariosSection.tsx
git commit -m "feat: componente UsuariosSection para gerenciar usuários"
```

---

## Task 13: Configurações — Seção Usuários + Botão Seed Admin

**Files:**
- Modificar: `src/app/(protected)/configuracoes/page.tsx`

Esta task também adiciona o botão **"Cadastrar como Admin"** — a única forma de criar o primeiro registro admin para Andreia e sua sócia. Cada uma deve clicar uma vez.

- [ ] **Step 1: Criar Server Action de seed inline na page**

Criar `src/app/actions/seed.ts`:

```typescript
'use server'
import { seedAdminAtual } from './usuarios'
export { seedAdminAtual }
```

(Só re-exporta para ser usado pelo form da Configurações page.)

- [ ] **Step 2: Substituir o conteúdo de `configuracoes/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import AlterarSenhaForm from '@/components/AlterarSenhaForm'
import CnpjRecebimentoSection from '@/components/CnpjRecebimentoSection'
import CategoriasDespesaSection from '@/components/CategoriasDespesaSection'
import UsuariosSection from '@/components/UsuariosSection'
import { CnpjRecebimento, CategoriaDespesa, Usuario, Vendedor } from '@/lib/types'
import SeedAdminButton from '@/components/SeedAdminButton'

export default async function ConfiguracoesPage() {
  const supabase  = await createClient()
  const usuario   = await getUsuarioAtual()
  const isAdmin   = !usuario || usuario.perfil === 'admin'

  const [
    { data: { user } },
    { data: cnpjsRaw },
    { data: categoriasRaw },
    { data: usuariosRaw },
    { data: vendedoresRaw },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('cnpjs_recebimento').select('*').order('nome'),
    supabase.from('categorias_despesa').select('*').order('nome'),
    isAdmin ? supabase.from('usuarios').select('*').order('nome') : Promise.resolve({ data: [] }),
    isAdmin ? supabase.from('vendedores').select('id, nome').eq('ativo', true).order('nome') : Promise.resolve({ data: [] }),
  ])

  const cnpjs      = (cnpjsRaw ?? []) as CnpjRecebimento[]
  const categorias = (categoriasRaw ?? []) as CategoriaDespesa[]
  const usuarios   = (usuariosRaw ?? []) as Usuario[]
  const vendedores = (vendedoresRaw ?? []) as Vendedor[]

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
            {/* Botão de seed — aparece enquanto não há registro em usuarios */}
            {!usuario && <SeedAdminButton email={user?.email ?? ''} />}
          </div>
        </div>

        {/* Usuários — apenas admin */}
        {isAdmin && (
          <div style={{ maxWidth: '680px' }}>
            <UsuariosSection usuarios={usuarios} vendedores={vendedores} />
          </div>
        )}

        {/* Operadoras — apenas admin */}
        {isAdmin && (
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
        )}

        {/* CNPJs de Recebimento — apenas admin */}
        {isAdmin && <CnpjRecebimentoSection cnpjs={cnpjs} />}

        {/* Categorias de Despesas — apenas admin */}
        {isAdmin && <CategoriasDespesaSection categorias={categorias} />}

        {/* Alterar senha — todos */}
        <AlterarSenhaForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar `SeedAdminButton`**

```typescript
// src/components/SeedAdminButton.tsx
'use client'

import { useState } from 'react'
import { seedAdminAtual } from '@/app/actions/usuarios'

interface Props { email: string }

export default function SeedAdminButton({ email }: Props) {
  const [nome, setNome]       = useState('')
  const [loading, setLoading] = useState(false)
  const [feito, setFeito]     = useState(false)

  async function handleClick() {
    const nomeFinal = nome.trim() || email
    setLoading(true)
    try {
      await seedAdminAtual(nomeFinal)
      setFeito(true)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  if (feito) return (
    <p className="text-sm text-green-700 font-medium">
      ✓ Cadastrado como admin. Recarregue a página.
    </p>
  )

  return (
    <div className="space-y-2 pt-2 border-t" style={{ borderColor: '#e8e4dd' }}>
      <p className="text-xs font-semibold" style={{ color: '#9a918a' }}>
        Primeiro acesso? Cadastre seu perfil de admin:
      </p>
      <input
        className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
        style={{ borderColor: '#e8e4dd' }}
        placeholder="Seu nome completo"
        value={nome}
        onChange={e => setNome(e.target.value)}
      />
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
        style={{ backgroundColor: '#2d1f4e', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Salvando...' : 'Cadastrar como Admin'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Verificar no browser**

Acessar `/configuracoes`. O campo "Cadastrar como Admin" aparece (enquanto não há registro). Preencher nome e clicar — registro criado. Recarregar — botão some, seção Usuários aparece.

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/configuracoes/page.tsx src/components/SeedAdminButton.tsx src/app/actions/seed.ts
git commit -m "feat: Configurações com seção Usuários e seed de admin"
```

---

## Task 14: Seed das admins + Ativar RLS

> Esta task é **executada manualmente**, não pelo agente.

- [ ] **Step 1: Andreia acessa `/configuracoes` → preenche nome → clica "Cadastrar como Admin"**

- [ ] **Step 2: Sócia acessa `/configuracoes` → mesmo processo**

- [ ] **Step 3: Verificar no Supabase SQL Editor**

```sql
select auth_user_id, nome, perfil, ativo from usuarios;
```

Esperado: 2 linhas, ambas com `perfil = 'admin'` e `ativo = true`.

- [ ] **Step 4: Executar a migration de RLS**

Abrir Supabase → SQL Editor → colar o conteúdo de `supabase/migrations/20260523_rls_permissoes.sql` → Run.

- [ ] **Step 5: Verificar que o sistema ainda funciona**

Acessar `/dashboard`, `/crm`, `/clientes`, `/agenda`, `/financeiro` — tudo deve carregar normalmente para as admins.

---

## Task 15: Teste end-to-end com vendedor real

- [ ] **Step 1: Em Configurações → Usuários → Novo Usuário**

Cadastrar um vendedor de teste: perfil "Vendedor", vincular a um cadastro ativo em Gestão, e-mail válido.

- [ ] **Step 2: Verificar que o convite chegou no e-mail**

O vendedor recebe link do Supabase para criar senha.

- [ ] **Step 3: Abrir o link, criar a senha e fazer login**

- [ ] **Step 4: Verificar menu lateral**

Deve mostrar apenas: Dashboard, CRM, Clientes, Agenda.

- [ ] **Step 5: Verificar que rotas restritas redirecionam**

Acessar `/financeiro` diretamente → redireciona para `/dashboard`. Mesmo para `/gestao` e `/configuracoes`.

- [ ] **Step 6: Verificar que só vê os próprios dados**

CRM, Clientes e Agenda mostram apenas registros com `vendedor_id` vinculado a ele.

- [ ] **Step 7: Criar um lead como vendedor**

Campo vendedor deve estar travado com o nome dele. Salvar. Verificar que o lead aparece na lista.

- [ ] **Step 8: Logar de volta como admin**

Verificar que o lead criado pelo vendedor aparece na lista de leads do admin.

---

## Ordem de Execução

```
Task 1  → Task 2 → Task 3 → Task 4 → Task 5 (commit só)
→ Task 6 → Task 7 → Task 8 → Task 9 → Task 10 → Task 11
→ Task 12 → Task 13
→ Task 14 (manual: seed admins + rodar migration RLS)
→ Task 15 (teste e2e)
```
