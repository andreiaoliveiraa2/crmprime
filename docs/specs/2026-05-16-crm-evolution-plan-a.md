# CRM Evolução — Plano A: Fundação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o banco de dados, atualizar os tipos TypeScript, redesenhar a Sidebar com visual premium e criar o componente DashboardCard.

**Architecture:** Migração SQL via Supabase MCP (cria tabela `leads` a partir da `clientes` atual e cria nova tabela `clientes` pós-venda). Tipos TypeScript atualizados. Sidebar redesenhada com paleta bege/marrom e 5 itens de navegação. DashboardCard com ícone, valor e cor pastel.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Supabase (@supabase/ssr), Lucide React, Jest, React Testing Library

---

## Estrutura de Arquivos

```
src/
├── lib/
│   └── types.ts                          # MODIFICAR: Lead, Cliente, EtapaLead, ETAPAS_LEAD
├── components/
│   ├── Sidebar.tsx                       # MODIFICAR: 5 itens, visual stone/violet
│   ├── DashboardCard.tsx                 # CRIAR: card com ícone, valor, cor pastel
│   ├── StatsCard.tsx                     # DELETAR (substituído por DashboardCard)
│   └── RenovacoesProximas.tsx            # DELETAR (substituído no Plano C)
__tests__/
│   ├── Sidebar.test.tsx                  # ATUALIZAR: novos links e classes
│   ├── DashboardCard.test.tsx            # CRIAR
│   ├── StatsCard.test.tsx                # DELETAR
│   └── RenovacoesProximas.test.tsx       # DELETAR
```

---

### Task 1: Migração do banco de dados via Supabase MCP

**Files:** Nenhum arquivo local — executado via Supabase MCP.

- [ ] **Step 1: Executar migração via MCP**

Execute o seguinte SQL usando a ferramenta `mcp__plugin_supabase_supabase__apply_migration` com `project_id: lctacientnedmarsbitt` e `name: crm_evolution_foundation`:

```sql
-- 1. Criar tabela leads com nova estrutura
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  tipo_plano text,
  etapa text not null check (etapa in (
    'Novo Lead', 'Contato Feito', 'Proposta Enviada',
    'Negociação', 'Fechado', 'Perdido'
  )),
  criado_em timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Authenticated can select leads"
  on public.leads for select to authenticated using (auth.uid() is not null);

create policy "Authenticated can insert leads"
  on public.leads for insert to authenticated with check (auth.uid() is not null);

create policy "Authenticated can update leads"
  on public.leads for update to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Authenticated can delete leads"
  on public.leads for delete to authenticated using (auth.uid() is not null);

-- 2. Migrar dados existentes de clientes → leads
insert into public.leads (id, nome, telefone, tipo_plano, etapa, criado_em)
select
  id,
  nome,
  contato as telefone,
  null as tipo_plano,
  case etapa
    when 'Lead' then 'Novo Lead'
    when 'Contato' then 'Contato Feito'
    when 'Proposta' then 'Proposta Enviada'
    when 'Fechado' then 'Fechado'
    when 'Perdido' then 'Perdido'
    else 'Novo Lead'
  end as etapa,
  criado_em
from public.clientes;

-- 3. Remover tabela clientes antiga
drop table public.clientes cascade;

-- 4. Criar nova tabela clientes (pós-venda)
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contato text,
  email text,
  tipo_plano text,
  valor_plano numeric,
  observacoes text,
  lead_id uuid references public.leads(id) on delete set null,
  criado_em timestamptz not null default now()
);

alter table public.clientes enable row level security;

create policy "Authenticated can select clientes"
  on public.clientes for select to authenticated using (auth.uid() is not null);

create policy "Authenticated can insert clientes"
  on public.clientes for insert to authenticated with check (auth.uid() is not null);

create policy "Authenticated can update clientes"
  on public.clientes for update to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Authenticated can delete clientes"
  on public.clientes for delete to authenticated using (auth.uid() is not null);

-- 5. Índices de performance
create index if not exists leads_criado_em_idx on public.leads (criado_em desc);
create index if not exists leads_etapa_idx on public.leads (etapa);
create index if not exists clientes_criado_em_idx on public.clientes (criado_em desc);
```

- [ ] **Step 2: Verificar migração**

Execute via MCP `execute_sql`:
```sql
select count(*) from public.leads;
select count(*) from public.clientes;
```

Esperado: `leads` tem o mesmo número de registros que a antiga `clientes`. `clientes` tem 0 registros (nova tabela vazia).

---

### Task 2: Atualizar tipos TypeScript

**Files:**
- Modify: `src/lib/types.ts`
- Delete: `src/lib/supabase/database.types.ts` (será regenerado no final)

- [ ] **Step 1: Substituir src/lib/types.ts**

```typescript
export type EtapaLead =
  | 'Novo Lead'
  | 'Contato Feito'
  | 'Proposta Enviada'
  | 'Negociação'
  | 'Fechado'
  | 'Perdido'

export const ETAPAS_LEAD: EtapaLead[] = [
  'Novo Lead',
  'Contato Feito',
  'Proposta Enviada',
  'Negociação',
  'Fechado',
  'Perdido',
]

export const TIPOS_PLANO = [
  'Saúde',
  'Odonto',
  'Vida',
  'Auto',
  'Residencial',
  'Empresarial',
  'Outro',
] as const

export interface Lead {
  id: string
  nome: string
  telefone: string | null
  tipo_plano: string | null
  etapa: EtapaLead
  criado_em: string
}

export type LeadInsert = Omit<Lead, 'id' | 'criado_em'>

export interface Cliente {
  id: string
  nome: string
  contato: string | null
  email: string | null
  tipo_plano: string | null
  valor_plano: number | null
  observacoes: string | null
  lead_id: string | null
  criado_em: string
}

export type ClienteInsert = Omit<Cliente, 'id' | 'criado_em'>
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: erros de tipo relacionados aos arquivos que ainda referenciam os tipos antigos (`Etapa`, `Cliente` com campos antigos). Esses erros serão corrigidos nas tasks seguintes.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: update TypeScript types for leads/clientes evolution"
```

---

### Task 3: Remover componentes obsoletos e testes antigos

**Files:**
- Delete: `src/components/StatsCard.tsx`
- Delete: `src/components/RenovacoesProximas.tsx`
- Delete: `src/components/CrmTabs.tsx`
- Delete: `__tests__/StatsCard.test.tsx`
- Delete: `__tests__/RenovacoesProximas.test.tsx`
- Delete: `__tests__/CrmTabs.test.tsx`
- Delete: `__tests__/ClienteTable.test.tsx`
- Delete: `__tests__/ClienteForm.test.tsx`

- [ ] **Step 1: Deletar arquivos obsoletos**

```bash
rm src/components/StatsCard.tsx
rm src/components/RenovacoesProximas.tsx
rm src/components/CrmTabs.tsx
rm __tests__/StatsCard.test.tsx
rm __tests__/RenovacoesProximas.test.tsx
rm __tests__/CrmTabs.test.tsx
rm __tests__/ClienteTable.test.tsx
rm __tests__/ClienteForm.test.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete components and tests replaced by evolution"
```

---

### Task 4: Criar DashboardCard

**Files:**
- Create: `src/components/DashboardCard.tsx`
- Create: `__tests__/DashboardCard.test.tsx`

- [ ] **Step 1: Escrever teste**

Arquivo: `__tests__/DashboardCard.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import DashboardCard from '@/components/DashboardCard'
import { Users } from 'lucide-react'

describe('DashboardCard', () => {
  it('renders title and value', () => {
    render(<DashboardCard title="Total de Clientes" value={42} icon={Users} color="violet" />)
    expect(screen.getByText('Total de Clientes')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<DashboardCard title="Ganhos no Mês" value="R$ 1.200,00" icon={Users} color="emerald" />)
    expect(screen.getByText('R$ 1.200,00')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<DashboardCard title="Leads" value={5} icon={Users} color="blue" subtitle="este mês" />)
    expect(screen.getByText('este mês')).toBeInTheDocument()
  })

  it('renders zero value', () => {
    render(<DashboardCard title="Vendas" value={0} icon={Users} color="amber" />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Executar teste para confirmar falha**

```bash
npx jest __tests__/DashboardCard.test.tsx
```

Esperado: FAIL — `Cannot find module '@/components/DashboardCard'`

- [ ] **Step 3: Criar src/components/DashboardCard.tsx**

```tsx
import { LucideIcon } from 'lucide-react'

type CardColor = 'violet' | 'blue' | 'amber' | 'emerald'

interface DashboardCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: CardColor
  subtitle?: string
}

const colorMap: Record<CardColor, { bg: string; border: string; icon: string; value: string }> = {
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    icon: 'text-violet-500 bg-violet-100',
    value: 'text-violet-700',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    icon: 'text-blue-500 bg-blue-100',
    value: 'text-blue-700',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    icon: 'text-amber-500 bg-amber-100',
    value: 'text-amber-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    icon: 'text-emerald-500 bg-emerald-100',
    value: 'text-emerald-700',
  },
}

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: DashboardCardProps) {
  const c = colorMap[color]
  return (
    <div
      className={`rounded-2xl border ${c.border} ${c.bg} p-6 hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-stone-500">{title}</p>
        <div className={`p-2.5 rounded-xl ${c.icon}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
      {subtitle && <p className="text-xs text-stone-400 mt-1">{subtitle}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Executar teste para confirmar aprovação**

```bash
npx jest __tests__/DashboardCard.test.tsx
```

Esperado: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardCard.tsx __tests__/DashboardCard.test.tsx
git commit -m "feat: add DashboardCard component with pastel colors"
```

---

### Task 5: Redesenhar Sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `__tests__/Sidebar.test.tsx`

- [ ] **Step 1: Atualizar teste da Sidebar**

Arquivo: `__tests__/Sidebar.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}))

describe('Sidebar', () => {
  it('renders all 5 navigation items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('CRM')).toBeInTheDocument()
    expect(screen.getByText('Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Sidebar />)
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('highlights active Dashboard link', () => {
    render(<Sidebar />)
    const link = screen.getByText('Dashboard').closest('a')
    expect(link).toHaveClass('text-violet-700')
  })

  it('renders brand name', () => {
    render(<Sidebar />)
    expect(screen.getByText('Gestão Seguros')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Executar teste para confirmar falha**

```bash
npx jest __tests__/Sidebar.test.tsx
```

Esperado: FAIL — Pipeline, Clientes e Configurações não encontrados

- [ ] **Step 3: Substituir src/components/Sidebar.tsx**

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Kanban,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'CRM', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/clientes', label: 'Clientes', icon: UserCheck },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-stone-100 rounded-lg shadow-md"
        onClick={() => setAberto(!aberto)}
        aria-label="Abrir menu"
      >
        {aberto ? (
          <X size={20} className="text-stone-700" />
        ) : (
          <Menu size={20} className="text-stone-700" />
        )}
      </button>

      {aberto && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setAberto(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-stone-100 border-r border-stone-200 z-40 flex flex-col
          transition-transform duration-200
          ${aberto ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-base font-bold text-stone-800">Gestão Seguros</h2>
          <p className="text-xs text-stone-500 mt-0.5">CRM Profissional</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setAberto(false)}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-violet-100 text-violet-700 shadow-sm'
                    : 'text-stone-600 hover:bg-stone-200 hover:text-stone-800'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 4: Executar teste para confirmar aprovação**

```bash
npx jest __tests__/Sidebar.test.tsx
```

Esperado: PASS — 4 tests passed

- [ ] **Step 5: Executar todos os testes para verificar regressões**

```bash
npx jest
```

Esperado: apenas DashboardCard (4) e Sidebar (4) passam. KanbanBoard e outros podem falhar por referências aos tipos antigos — serão corrigidos nas próximas tasks.

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar.tsx __tests__/Sidebar.test.tsx
git commit -m "feat: redesign Sidebar with stone/violet premium visual and 5 nav items"
```

---

### Task 6: Corrigir KanbanBoard para novos tipos

**Files:**
- Modify: `src/components/KanbanBoard.tsx`
- Modify: `__tests__/KanbanBoard.test.tsx`

- [ ] **Step 1: Atualizar __tests__/KanbanBoard.test.tsx**

```tsx
import { render, screen } from '@testing-library/react'
import KanbanBoard from '@/components/KanbanBoard'
import { Lead } from '@/lib/types'

jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({ children }: { children: (p: any, s: any) => React.ReactNode }) =>
    children(
      { innerRef: jest.fn(), droppableProps: {}, placeholder: null },
      { isDraggingOver: false }
    ),
  Draggable: ({ children }: { children: (p: any, s: any) => React.ReactNode }) =>
    children(
      { innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} },
      { isDragging: false }
    ),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

const leads: Lead[] = [
  { id: '1', nome: 'Ana Lima', telefone: null, tipo_plano: null, etapa: 'Novo Lead', criado_em: '' },
  { id: '2', nome: 'Bruno Costa', telefone: null, tipo_plano: 'Saúde', etapa: 'Negociação', criado_em: '' },
]

describe('KanbanBoard', () => {
  it('renders all 6 stage columns', () => {
    render(<KanbanBoard leads={leads} />)
    expect(screen.getByText('Novo Lead')).toBeInTheDocument()
    expect(screen.getByText('Contato Feito')).toBeInTheDocument()
    expect(screen.getByText('Proposta Enviada')).toBeInTheDocument()
    expect(screen.getByText('Negociação')).toBeInTheDocument()
    expect(screen.getByText('Fechado')).toBeInTheDocument()
    expect(screen.getByText('Perdido')).toBeInTheDocument()
  })

  it('shows lead cards', () => {
    render(<KanbanBoard leads={leads} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Executar teste para confirmar falha**

```bash
npx jest __tests__/KanbanBoard.test.tsx
```

Esperado: FAIL — tipo incompatível ou colunas antigas

- [ ] **Step 3: Substituir src/components/KanbanBoard.tsx**

```tsx
'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, EtapaLead, ETAPAS_LEAD } from '@/lib/types'
import ConversaoModal from './ConversaoModal'

interface Props {
  leads: Lead[]
}

const etapaStyle: Record<EtapaLead, { col: string; title: string }> = {
  'Novo Lead': { col: 'bg-blue-50 border-blue-200', title: 'text-blue-700' },
  'Contato Feito': { col: 'bg-yellow-50 border-yellow-200', title: 'text-yellow-700' },
  'Proposta Enviada': { col: 'bg-purple-50 border-purple-200', title: 'text-purple-700' },
  'Negociação': { col: 'bg-amber-50 border-amber-200', title: 'text-amber-700' },
  'Fechado': { col: 'bg-emerald-50 border-emerald-200', title: 'text-emerald-700' },
  'Perdido': { col: 'bg-red-50 border-red-200', title: 'text-red-600' },
}

export default function KanbanBoard({ leads: inicial }: Props) {
  const [leads, setLeads] = useState(inicial)
  const [leadConvertendo, setLeadConvertendo] = useState<Lead | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const novaEtapa = destination.droppableId as EtapaLead
    const etapaAnterior = source.droppableId as EtapaLead

    if (novaEtapa === 'Perdido') {
      if (!confirm('Marcar este lead como Perdido?')) return
    }

    setLeads(prev =>
      prev.map(l => (l.id === draggableId ? { ...l, etapa: novaEtapa } : l))
    )

    const { error } = await supabase
      .from('leads')
      .update({ etapa: novaEtapa })
      .eq('id', draggableId)

    if (error) {
      setLeads(prev =>
        prev.map(l => (l.id === draggableId ? { ...l, etapa: etapaAnterior } : l))
      )
      return
    }

    if (novaEtapa === 'Fechado') {
      const lead = leads.find(l => l.id === draggableId)
      if (lead) setLeadConvertendo(lead)
    } else {
      router.refresh()
    }
  }

  function handleCancelarConversao() {
    if (!leadConvertendo) return
    setLeads(prev =>
      prev.map(l => (l.id === leadConvertendo.id ? { ...l, etapa: 'Negociação' } : l))
    )
    supabase.from('leads').update({ etapa: 'Negociação' }).eq('id', leadConvertendo.id)
    setLeadConvertendo(null)
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS_LEAD.map(etapa => {
            const cartoes = leads.filter(l => l.etapa === etapa)
            const style = etapaStyle[etapa]
            return (
              <div key={etapa} className="flex-shrink-0 w-52">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-xs font-bold uppercase tracking-wide ${style.title}`}>
                    {etapa}
                  </h3>
                  <span className="text-xs bg-white border border-stone-200 rounded-full px-2 py-0.5 text-stone-500">
                    {cartoes.length}
                  </span>
                </div>

                <Droppable droppableId={etapa}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[120px] rounded-2xl p-2 space-y-2 border-2 transition-colors ${
                        snapshot.isDraggingOver ? style.col : 'border-stone-100 bg-stone-50'
                      }`}
                    >
                      {cartoes.map((l, index) => (
                        <Draggable key={l.id} draggableId={l.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-xl border border-stone-200 p-3 cursor-grab active:cursor-grabbing transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                              }`}
                            >
                              <p className="text-sm font-semibold text-stone-800 mb-1">
                                {l.nome}
                              </p>
                              {l.telefone && (
                                <p className="text-xs text-stone-400">{l.telefone}</p>
                              )}
                              {l.tipo_plano && (
                                <span className="mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
                                  {l.tipo_plano}
                                </span>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {leadConvertendo && (
        <ConversaoModal
          lead={leadConvertendo}
          onClose={() => {
            setLeadConvertendo(null)
            router.refresh()
          }}
          onCancelar={handleCancelarConversao}
        />
      )}
    </>
  )
}
```

> **Nota:** `ConversaoModal` será criado no Plano B. Por agora, crie um stub temporário:
>
> Arquivo: `src/components/ConversaoModal.tsx`
> ```tsx
> export default function ConversaoModal({ onClose }: { lead: any; onClose: () => void; onCancelar: () => void }) {
>   return null
> }
> ```

- [ ] **Step 4: Executar teste para confirmar aprovação**

```bash
npx jest __tests__/KanbanBoard.test.tsx
```

Esperado: PASS — 2 tests passed

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: erros apenas em arquivos de páginas que ainda usam tipos antigos (serão corrigidos no Plano B e C).

- [ ] **Step 6: Commit**

```bash
git add src/components/KanbanBoard.tsx src/components/ConversaoModal.tsx __tests__/KanbanBoard.test.tsx
git commit -m "feat: update KanbanBoard for new lead types and 6 pipeline stages"
```

---

### Task 7: Verificação final do Plano A

- [ ] **Step 1: Executar todos os testes**

```bash
npx jest
```

Esperado: DashboardCard (4) e Sidebar (4) e KanbanBoard (2) passam — total 10 testes. Outros testes podem ter sido removidos na Task 3.

- [ ] **Step 2: Verificar banco de dados via MCP**

Execute `get_advisors` com `type: security` e `type: performance` para confirmar zero avisos.

- [ ] **Step 3: Commit final do Plano A**

```bash
git add -A
git commit -m "feat: complete Plan A — DB migration, types, Sidebar, DashboardCard"
```
