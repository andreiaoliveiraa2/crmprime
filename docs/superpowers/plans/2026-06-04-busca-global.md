# Busca Global — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um modal de busca global no Sidebar que pesquisa leads e clientes por nome, telefone ou CPF e navega para a página de edição ao clicar no resultado.

**Architecture:** Novo componente `BuscaGlobal.tsx` com estado local (aberto/termo/dados). Ao abrir, busca todos os leads e clientes via Supabase e filtra localmente em JavaScript. Integrado no `Sidebar.tsx` acima da `<nav>`.

**Tech Stack:** Next.js 16, TypeScript, Supabase client, lucide-react, Jest + Testing Library

---

### Task 1: Componente `BuscaGlobal.tsx` (TDD)

**Files:**
- Create: `__tests__/BuscaGlobal.test.tsx`
- Create: `src/components/BuscaGlobal.tsx`

- [ ] **Step 1: Criar o arquivo de testes**

Criar `__tests__/BuscaGlobal.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuscaGlobal from '@/components/BuscaGlobal'

const mockLeads = [
  { id: 'l1', nome: 'Ana Lima',    telefone: '(83) 99999-1111' },
  { id: 'l2', nome: 'Bruno Costa', telefone: null },
]
const mockClientes = [
  { id: 'c1', nome: 'Carlos Dias', contato: '(83) 88888-0000', cpf: '123.456.789-00' },
]

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (_fields: string) => Promise.resolve({
        data: table === 'leads' ? mockLeads : mockClientes,
        error: null,
      }),
    }),
  }),
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('BuscaGlobal', () => {
  beforeEach(() => mockPush.mockClear())

  it('renders trigger button', () => {
    render(<BuscaGlobal />)
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument()
  })

  it('opens modal when trigger is clicked', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    expect(screen.getByPlaceholderText(/buscar leads e clientes/i)).toBeInTheDocument()
  })

  it('shows no results for less than 2 chars', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'A')
    expect(screen.queryByText('Ana Lima')).not.toBeInTheDocument()
  })

  it('shows matching leads when 2+ chars typed', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Ana')
    await waitFor(() => expect(screen.getByText('Ana Lima')).toBeInTheDocument())
    expect(screen.queryByText('Bruno Costa')).not.toBeInTheDocument()
  })

  it('shows matching clientes when 2+ chars typed', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Carlos')
    await waitFor(() => expect(screen.getByText('Carlos Dias')).toBeInTheDocument())
  })

  it('shows empty state when no results match', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'xyz')
    await waitFor(() => expect(screen.getByText(/nenhum resultado/i)).toBeInTheDocument())
  })

  it('navigates to lead page on result click', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Ana')
    await waitFor(() => screen.getByText('Ana Lima'))
    await userEvent.click(screen.getByText('Ana Lima'))
    expect(mockPush).toHaveBeenCalledWith('/crm/l1')
  })

  it('navigates to cliente page on result click', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Carlos')
    await waitFor(() => screen.getByText('Carlos Dias'))
    await userEvent.click(screen.getByText('Carlos Dias'))
    expect(mockPush).toHaveBeenCalledWith('/clientes/c1')
  })

  it('closes modal on Escape key', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByPlaceholderText(/buscar/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar testes para confirmar que FALHAM**

```bash
npx jest __tests__/BuscaGlobal.test.tsx --no-coverage 2>&1 | Select-Object -Last 10
```

Esperado: FAIL — `Cannot find module '@/components/BuscaGlobal'`

- [ ] **Step 3: Criar `src/components/BuscaGlobal.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LeadResult    { id: string; nome: string | null; telefone: string | null }
interface ClienteResult { id: string; nome: string; contato: string | null; cpf: string | null }

export default function BuscaGlobal() {
  const [aberto, setAberto]     = useState(false)
  const [termo, setTermo]       = useState('')
  const [leads, setLeads]       = useState<LeadResult[]>([])
  const [clientes, setClientes] = useState<ClienteResult[]>([])
  const router  = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!aberto) return
    async function carregar() {
      const [{ data: l }, { data: c }] = await Promise.all([
        supabase.from('leads').select('id, nome, telefone'),
        supabase.from('clientes').select('id, nome, contato, cpf'),
      ])
      setLeads((l ?? []) as LeadResult[])
      setClientes((c ?? []) as ClienteResult[])
    }
    carregar()
  }, [aberto])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') fechar() }
    if (aberto) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [aberto])

  function fechar() { setAberto(false); setTermo('') }

  function navegar(href: string) { router.push(href); fechar() }

  const match = (s: string | null) =>
    (s ?? '').toLowerCase().includes(termo.toLowerCase())

  const ativo         = termo.length >= 2
  const leadsMatch    = ativo ? leads.filter(l => match(l.nome) || match(l.telefone)).slice(0, 5) : []
  const clientesMatch = ativo ? clientes.filter(c => match(c.nome) || match(c.contato) || match(c.cpf)).slice(0, 5) : []
  const semResultados = ativo && leadsMatch.length === 0 && clientesMatch.length === 0

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        aria-label="Buscar"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-150"
        style={{ color: 'rgba(255,255,255,0.55)', borderLeft: '3px solid transparent', paddingLeft: '12px' }}
      >
        <Search size={17} />
        <span className="flex-1 text-left">Buscar</span>
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={fechar}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #f0ece6' }}>
              <Search size={16} style={{ color: '#9a918a' }} className="shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar leads e clientes..."
                value={termo}
                onChange={e => setTermo(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: '#1a1a1a' }}
              />
            </div>

            {ativo && (
              <div className="max-h-80 overflow-y-auto py-2">
                {semResultados && (
                  <p className="text-sm text-center py-6" style={{ color: '#9a918a' }}>
                    Nenhum resultado para &ldquo;{termo}&rdquo;
                  </p>
                )}

                {leadsMatch.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold px-4 py-1.5" style={{ color: '#2d1f4e' }}>
                      LEADS ({leadsMatch.length})
                    </p>
                    {leadsMatch.map(l => (
                      <button key={l.id} onClick={() => navegar(`/crm/${l.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50">
                        <Users size={14} style={{ color: '#2d1f4e' }} className="shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>{l.nome}</p>
                          {l.telefone && <p className="text-xs" style={{ color: '#9a918a' }}>{l.telefone}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {clientesMatch.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold px-4 py-1.5" style={{ color: '#15803d' }}>
                      CLIENTES ({clientesMatch.length})
                    </p>
                    {clientesMatch.map(c => (
                      <button key={c.id} onClick={() => navegar(`/clientes/${c.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50">
                        <UserCheck size={14} style={{ color: '#15803d' }} className="shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>{c.nome}</p>
                          <p className="text-xs" style={{ color: '#9a918a' }}>
                            {[c.contato, c.cpf].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Rodar testes para confirmar que PASSAM**

```bash
npx jest __tests__/BuscaGlobal.test.tsx --no-coverage 2>&1 | Select-Object -Last 15
```

Esperado: 8 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/components/BuscaGlobal.tsx" "__tests__/BuscaGlobal.test.tsx"
git commit -m "feat: adiciona componente BuscaGlobal com modal de busca de leads e clientes"
```

---

### Task 2: Integrar BuscaGlobal no Sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `__tests__/Sidebar.test.tsx`

- [ ] **Step 1: Adicionar teste para o botão de busca**

No `__tests__/Sidebar.test.tsx`, adicionar um novo mock para suportar o BuscaGlobal e um teste dentro do `describe('Sidebar')`:

Substituir o bloco `jest.mock('@/lib/supabase/client', ...)` existente por este (que cobre tanto Sidebar quanto BuscaGlobal):

```ts
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
    from: (table: string) => {
      if (table === 'agenda') return {
        select: () => ({
          gte: () => ({
            lte: () => Promise.resolve({ count: 0, error: null }),
          }),
        }),
      }
      return {
        select: (_fields: string) => Promise.resolve({ data: [], error: null }),
      }
    },
  }),
}))
```

Adicionar ao final do `describe('Sidebar')`:

```tsx
  it('renders search trigger button', () => {
    render(<Sidebar perfil="admin" nome="Andreia" />)
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument()
  })
```

- [ ] **Step 2: Rodar o novo teste para confirmar que FALHA**

```bash
npx jest __tests__/Sidebar.test.tsx --no-coverage -t "renders search trigger button" 2>&1 | Select-Object -Last 15
```

Esperado: FAIL — botão "Buscar" não existe ainda no Sidebar.

- [ ] **Step 3: Modificar `src/components/Sidebar.tsx`**

Adicionar o import do BuscaGlobal no topo do arquivo (após os outros imports):

```tsx
import BuscaGlobal from '@/components/BuscaGlobal'
```

Adicionar `<BuscaGlobal />` dentro do `<div>` que contém o sidebar, logo ANTES da tag `<nav>` (linha ~109). A seção ficará assim:

```tsx
        <div className="px-3 pt-2 pb-1">
          <BuscaGlobal />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
```

- [ ] **Step 4: Rodar todos os testes**

```bash
npx jest --no-coverage 2>&1 | Select-Object -Last 20
```

Esperado: testes de `BuscaGlobal`, `Sidebar` (novo), `KanbanBoard`, `LeadTable` e `leads` passando. Os testes antigos do Sidebar com props faltando (`render(<Sidebar />)`) continuarão falhando — são erros pré-existentes, não regredir nenhum teste que já passava.

- [ ] **Step 5: Commit**

```bash
git add "src/components/Sidebar.tsx" "__tests__/Sidebar.test.tsx"
git commit -m "feat: integra BuscaGlobal no Sidebar"
```

- [ ] **Step 6: Push**

```bash
git push
```
