# CRM Evolução — Plano C: Clientes + Dashboard + Configurações

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a seção Clientes pós-venda (lista, formulário, ficha), redesenhar o Dashboard com 4 cards de métricas reais e criar a página de Configurações.

**Architecture:** Depende dos Planos A e B concluídos. ClienteTablePosVenda e ClienteFormPosVenda são componentes focados na tabela `clientes` (pós-venda). Dashboard é um server component que busca dados das duas tabelas (`leads` e `clientes`) e calcula métricas. Configurações busca dados do usuário autenticado via Supabase Auth.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Supabase, Lucide React, Jest, React Testing Library

**Pré-requisito:** Planos A e B concluídos.

---

## Estrutura de Arquivos

```
src/
├── components/
│   ├── ClienteTablePosVenda.tsx           # CRIAR: tabela de clientes com busca
│   └── ClienteFormPosVenda.tsx            # CRIAR: formulário criar/editar cliente
├── app/(protected)/
│   ├── dashboard/page.tsx                 # REESCREVER: 4 cards + listas recentes
│   ├── clientes/
│   │   ├── page.tsx                       # CRIAR: lista de clientes
│   │   ├── novo/page.tsx                  # CRIAR: novo cliente
│   │   └── [id]/page.tsx                  # CRIAR: editar cliente
│   └── configuracoes/
│       └── page.tsx                       # CRIAR: dados da conta
__tests__/
│   ├── ClienteTablePosVenda.test.tsx      # CRIAR
│   └── ClienteFormPosVenda.test.tsx       # CRIAR
```

---

### Task 1: Criar ClienteTablePosVenda

**Files:**
- Create: `src/components/ClienteTablePosVenda.tsx`
- Create: `__tests__/ClienteTablePosVenda.test.tsx`

- [ ] **Step 1: Escrever teste**

Arquivo: `__tests__/ClienteTablePosVenda.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClienteTablePosVenda from '@/components/ClienteTablePosVenda'
import { Cliente } from '@/lib/types'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      delete: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

const clientes: Cliente[] = [
  {
    id: '1',
    nome: 'Ana Lima',
    contato: '(83) 99999-1111',
    email: 'ana@email.com',
    tipo_plano: 'Saúde',
    valor_plano: 350,
    observacoes: null,
    lead_id: null,
    criado_em: '',
  },
  {
    id: '2',
    nome: 'Bruno Costa',
    contato: null,
    email: null,
    tipo_plano: 'Odonto',
    valor_plano: 120,
    observacoes: null,
    lead_id: null,
    criado_em: '',
  },
]

describe('ClienteTablePosVenda', () => {
  it('renders all clients by default', () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })

  it('filters by name search', async () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Ana')
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.queryByText('Bruno Costa')).not.toBeInTheDocument()
  })

  it('renders formatted valor_plano', () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    expect(screen.getByText(/350,00/)).toBeInTheDocument()
  })

  it('shows dash for missing email', () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows empty message when no match', async () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'XXXXXXXXXXX')
    expect(screen.getByText(/nenhum cliente encontrado/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Executar teste para confirmar falha**

```bash
npx jest __tests__/ClienteTablePosVenda.test.tsx
```

Esperado: FAIL — `Cannot find module '@/components/ClienteTablePosVenda'`

- [ ] **Step 3: Criar src/components/ClienteTablePosVenda.tsx**

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Cliente } from '@/lib/types'

interface Props {
  clientes: Cliente[]
}

export default function ClienteTablePosVenda({ clientes }: Props) {
  const [busca, setBusca] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const filtrados = clientes.filter(c =>
    busca === '' ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.contato ?? '').includes(busca)
  )

  async function handleExcluir(id: string) {
    if (!confirm('Deseja excluir este cliente?')) return
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) { alert('Erro ao excluir. Tente novamente.'); return }
    router.refresh()
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar por nome, email ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Nome</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Email</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Telefone</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Plano</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Valor</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-stone-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {filtrados.map(c => (
              <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 font-medium text-stone-800">{c.nome}</td>
                <td className="px-6 py-4 text-stone-500">{c.email ?? '—'}</td>
                <td className="px-6 py-4 text-stone-500">{c.contato ?? '—'}</td>
                <td className="px-6 py-4 text-stone-500">{c.tipo_plano ?? '—'}</td>
                <td className="px-6 py-4 font-semibold text-emerald-600">
                  {c.valor_plano != null
                    ? `R$ ${c.valor_plano.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4">
                    <Link href={`/clientes/${c.id}`} className="text-violet-600 hover:underline">
                      Editar
                    </Link>
                    <button
                      onClick={() => handleExcluir(c.id)}
                      className="text-red-400 hover:underline"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Executar teste para confirmar aprovação**

```bash
npx jest __tests__/ClienteTablePosVenda.test.tsx
```

Esperado: PASS — 5 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/components/ClienteTablePosVenda.tsx __tests__/ClienteTablePosVenda.test.tsx
git commit -m "feat: add ClienteTablePosVenda with search"
```

---

### Task 2: Criar ClienteFormPosVenda

**Files:**
- Create: `src/components/ClienteFormPosVenda.tsx`
- Create: `__tests__/ClienteFormPosVenda.test.tsx`

- [ ] **Step 1: Escrever teste**

Arquivo: `__tests__/ClienteFormPosVenda.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'
import { Cliente } from '@/lib/types'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

describe('ClienteFormPosVenda', () => {
  it('renders all form fields', () => {
    render(<ClienteFormPosVenda />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de plano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor do plano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/observações/i)).toBeInTheDocument()
  })

  it('shows error when nome is missing', async () => {
    render(<ClienteFormPosVenda />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument()
  })

  it('shows error when valor is missing', async () => {
    render(<ClienteFormPosVenda />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'João' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByText('Valor do plano é obrigatório')).toBeInTheDocument()
  })

  it('pre-fills fields when editing', () => {
    const cliente: Cliente = {
      id: '1',
      nome: 'Maria Souza',
      contato: '(83) 99999-9999',
      email: 'maria@email.com',
      tipo_plano: 'Saúde',
      valor_plano: 350,
      observacoes: 'Cliente VIP',
      lead_id: null,
      criado_em: '',
    }
    render(<ClienteFormPosVenda cliente={cliente} />)
    expect(screen.getByDisplayValue('Maria Souza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('maria@email.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('350')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Executar teste para confirmar falha**

```bash
npx jest __tests__/ClienteFormPosVenda.test.tsx
```

Esperado: FAIL — `Cannot find module '@/components/ClienteFormPosVenda'`

- [ ] **Step 3: Criar src/components/ClienteFormPosVenda.tsx**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cliente, ClienteInsert, TIPOS_PLANO } from '@/lib/types'

interface Props {
  cliente?: Cliente
}

export default function ClienteFormPosVenda({ cliente }: Props) {
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [contato, setContato] = useState(cliente?.contato ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [tipo_plano, setTipoPlano] = useState(cliente?.tipo_plano ?? '')
  const [valor_plano, setValorPlano] = useState(cliente?.valor_plano?.toString() ?? '')
  const [observacoes, setObservacoes] = useState(cliente?.observacoes ?? '')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const editando = !!cliente

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!nome.trim()) { setErro('Nome é obrigatório'); return }

    const valor = Number(valor_plano.replace(',', '.'))
    if (!valor_plano || isNaN(valor)) {
      setErro('Valor do plano é obrigatório')
      return
    }

    setLoading(true)

    const payload: ClienteInsert = {
      nome: nome.trim(),
      contato: contato.trim() || null,
      email: email.trim() || null,
      tipo_plano: tipo_plano || null,
      valor_plano: valor,
      observacoes: observacoes.trim() || null,
      lead_id: cliente?.lead_id ?? null,
    }

    if (editando) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    } else {
      const { error } = await supabase.from('clientes').insert(payload)
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    }

    setLoading(false)
    router.push('/clientes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-stone-700 mb-1">
          Nome <span className="text-red-500">*</span>
        </label>
        <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-stone-700 mb-1">Telefone</label>
        <input id="telefone" type="text" value={contato} onChange={e => setContato(e.target.value)}
          placeholder="(00) 00000-0000"
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">E-mail</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      <div>
        <label htmlFor="tipo_plano" className="block text-sm font-medium text-stone-700 mb-1">Tipo de Plano</label>
        <select id="tipo_plano" value={tipo_plano} onChange={e => setTipoPlano(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
          <option value="">Selecione...</option>
          {TIPOS_PLANO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="valor_plano" className="block text-sm font-medium text-stone-700 mb-1">
          Valor do Plano (R$) <span className="text-red-500">*</span>
        </label>
        <input id="valor_plano" type="text" value={valor_plano} onChange={e => setValorPlano(e.target.value)}
          placeholder="0,00"
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
        <textarea id="observacoes" value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={4}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
      </div>

      {erro && <p className="text-red-600 text-sm">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={() => router.push('/clientes')}
          className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl font-medium hover:bg-stone-200 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Executar teste para confirmar aprovação**

```bash
npx jest __tests__/ClienteFormPosVenda.test.tsx
```

Esperado: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/components/ClienteFormPosVenda.tsx __tests__/ClienteFormPosVenda.test.tsx
git commit -m "feat: add ClienteFormPosVenda for post-sale client registration"
```

---

### Task 3: Criar páginas Clientes

**Files:**
- Create: `src/app/(protected)/clientes/page.tsx`
- Create: `src/app/(protected)/clientes/novo/page.tsx`
- Create: `src/app/(protected)/clientes/[id]/page.tsx`

- [ ] **Step 1: Criar src/app/(protected)/clientes/page.tsx**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ClienteTablePosVenda from '@/components/ClienteTablePosVenda'
import { Plus } from 'lucide-react'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Clientes</h1>
          <p className="text-sm text-stone-500 mt-1">Clientes com planos ativos</p>
        </div>
        <Link
          href="/clientes/novo"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={16} />
          Novo Cliente
        </Link>
      </div>

      <ClienteTablePosVenda clientes={clientes ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Criar src/app/(protected)/clientes/novo/page.tsx**

```tsx
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'

export default function NovoClientePage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Novo Cliente</h1>
      <p className="text-sm text-stone-500 mb-6">Cadastre um cliente com plano ativo</p>
      <ClienteFormPosVenda />
    </div>
  )
}
```

- [ ] **Step 3: Criar src/app/(protected)/clientes/[id]/page.tsx**

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Editar Cliente</h1>
      <p className="text-sm text-stone-500 mb-6">{cliente.nome}</p>
      <ClienteFormPosVenda cliente={cliente} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/clientes/
git commit -m "feat: add Clientes pages for post-sale client management"
```

---

### Task 4: Redesenhar Dashboard

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Substituir src/app/(protected)/dashboard/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import DashboardCard from '@/components/DashboardCard'
import { Users, Activity, TrendingUp, DollarSign } from 'lucide-react'
import { Lead, Cliente } from '@/lib/types'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: leadsData }, { data: clientesData }] = await Promise.all([
    supabase.from('leads').select('*').order('criado_em', { ascending: false }),
    supabase.from('clientes').select('*').order('criado_em', { ascending: false }),
  ])

  const leads: Lead[] = leadsData ?? []
  const clientes: Cliente[] = clientesData ?? []

  const leadsAtivos = leads.filter(
    l => l.etapa !== 'Fechado' && l.etapa !== 'Perdido'
  ).length

  const vendasAndamento = leads.filter(
    l => l.etapa === 'Proposta Enviada' || l.etapa === 'Negociação'
  ).length

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const ganhosMes = clientes
    .filter(c => new Date(c.criado_em) >= inicioMes)
    .reduce((sum, c) => sum + (c.valor_plano ?? 0), 0)

  const leadsRecentes = leads.slice(0, 5)
  const clientesRecentes = clientes.slice(0, 5)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <DashboardCard
          title="Total de Clientes"
          value={clientes.length}
          icon={Users}
          color="violet"
          subtitle="clientes ativos"
        />
        <DashboardCard
          title="Leads Ativos"
          value={leadsAtivos}
          icon={Activity}
          color="blue"
          subtitle="em negociação"
        />
        <DashboardCard
          title="Vendas em Andamento"
          value={vendasAndamento}
          icon={TrendingUp}
          color="amber"
          subtitle="proposta + negociação"
        />
        <DashboardCard
          title="Ganhos no Mês"
          value={`R$ ${ganhosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="emerald"
          subtitle="clientes fechados este mês"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-800">Leads Recentes</h3>
            <Link href="/crm" className="text-xs text-violet-600 hover:underline">Ver todos</Link>
          </div>
          {leadsRecentes.length === 0 ? (
            <p className="text-sm text-stone-400">Nenhum lead cadastrado.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {leadsRecentes.map(l => (
                <li key={l.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{l.nome}</p>
                    <p className="text-xs text-stone-400">{l.tipo_plano ?? '—'}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-600 font-medium">
                    {l.etapa}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-800">Clientes Recentes</h3>
            <Link href="/clientes" className="text-xs text-violet-600 hover:underline">Ver todos</Link>
          </div>
          {clientesRecentes.length === 0 ? (
            <p className="text-sm text-stone-400">Nenhum cliente fechado ainda.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {clientesRecentes.map(c => (
                <li key={c.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{c.nome}</p>
                    <p className="text-xs text-stone-400">{c.tipo_plano ?? '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    R$ {(c.valor_plano ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "feat: redesign dashboard with 4 KPI cards and recent lists"
```

---

### Task 5: Criar página Configurações

**Files:**
- Create: `src/app/(protected)/configuracoes/page.tsx`

- [ ] **Step 1: Criar src/app/(protected)/configuracoes/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Configurações</h1>
        <p className="text-sm text-stone-500 mt-1">Dados da sua conta</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-lg">
        <h3 className="text-base font-semibold text-stone-800 mb-5">Perfil</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">E-mail</label>
            <p className="text-sm text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
              {user?.email ?? '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">ID da conta</label>
            <p className="text-xs text-stone-400 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 font-mono">
              {user?.id ?? '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">Conta criada em</label>
            <p className="text-sm text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/configuracoes/
git commit -m "feat: add Configuracoes page with account info"
```

---

### Task 6: Verificação final e cleanup

**Files:**
- Delete: `src/components/ClienteTable.tsx` (substituído por LeadTable + ClienteTablePosVenda)
- Delete: `src/components/ClienteForm.tsx` (substituído por LeadForm + ClienteFormPosVenda)

- [ ] **Step 1: Remover componentes antigos**

```bash
rm src/components/ClienteTable.tsx
rm src/components/ClienteForm.tsx
```

- [ ] **Step 2: Executar todos os testes**

```bash
npx jest
```

Esperado: PASS — todos os testes passam:
- Sidebar: 4 ✅
- DashboardCard: 4 ✅
- KanbanBoard: 2 ✅
- LeadTable: 5 ✅
- LeadForm: 4 ✅
- ConversaoModal: 4 ✅
- ClienteTablePosVenda: 5 ✅
- ClienteFormPosVenda: 4 ✅
Total: 32 testes

- [ ] **Step 3: Verificar TypeScript final**

```bash
npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Step 4: Commit final do Plano C**

```bash
git add -A
git commit -m "feat: complete Plan C — Clientes, Dashboard KPIs and Configuracoes"
```
