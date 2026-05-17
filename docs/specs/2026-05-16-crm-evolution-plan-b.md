# CRM Evolução — Plano B: CRM + Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a gestão de leads (LeadTable com busca, LeadForm, páginas CRM) e o Pipeline Kanban completo com modal de conversão lead → cliente.

**Architecture:** Depende do Plano A estar concluído. LeadTable é um client component com busca e filtro client-side. LeadForm valida e persiste na tabela `leads`. ConversaoModal cria registro na tabela `clientes` quando lead fecha. KanbanBoard usa ConversaoModal real (substitui o stub do Plano A). Páginas CRM e Pipeline são server components que buscam leads e passam para os client components.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Supabase, Lucide React, @hello-pangea/dnd, Jest, React Testing Library

**Pré-requisito:** Plano A concluído (tabela `leads` existe, tipos atualizados, Sidebar com 5 itens).

---

## Estrutura de Arquivos

```
src/
├── components/
│   ├── LeadTable.tsx                     # CRIAR: tabela de leads com busca + filtro
│   ├── LeadForm.tsx                      # CRIAR: formulário novo/editar lead
│   ├── ConversaoModal.tsx                # SUBSTITUIR stub: modal conversão lead→cliente
│   └── KanbanBoard.tsx                   # JÁ ATUALIZADO no Plano A
├── app/(protected)/
│   ├── crm/
│   │   ├── page.tsx                      # REESCREVER: usa LeadTable
│   │   ├── novo/page.tsx                 # REESCREVER: usa LeadForm
│   │   └── [id]/page.tsx                 # REESCREVER: usa LeadForm com lead existente
│   └── pipeline/
│       └── page.tsx                      # CRIAR: usa KanbanBoard
__tests__/
│   ├── LeadTable.test.tsx                # CRIAR
│   ├── LeadForm.test.tsx                 # CRIAR
│   └── ConversaoModal.test.tsx           # CRIAR
```

---

### Task 1: Criar LeadTable

**Files:**
- Create: `src/components/LeadTable.tsx`
- Create: `__tests__/LeadTable.test.tsx`

- [ ] **Step 1: Escrever teste**

Arquivo: `__tests__/LeadTable.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LeadTable from '@/components/LeadTable'
import { Lead } from '@/lib/types'

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

const leads: Lead[] = [
  { id: '1', nome: 'Ana Lima', telefone: '(83) 99999-1111', tipo_plano: 'Saúde', etapa: 'Novo Lead', criado_em: '' },
  { id: '2', nome: 'Bruno Costa', telefone: null, tipo_plano: 'Odonto', etapa: 'Negociação', criado_em: '' },
]

describe('LeadTable', () => {
  it('renders all leads by default', () => {
    render(<LeadTable leads={leads} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })

  it('filters by name search', async () => {
    render(<LeadTable leads={leads} />)
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Ana')
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.queryByText('Bruno Costa')).not.toBeInTheDocument()
  })

  it('filters by pipeline stage', async () => {
    render(<LeadTable leads={leads} />)
    await userEvent.click(screen.getByRole('button', { name: 'Negociação' }))
    expect(screen.queryByText('Ana Lima')).not.toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })

  it('shows dash for missing phone', () => {
    render(<LeadTable leads={leads} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows empty message when no leads match', async () => {
    render(<LeadTable leads={leads} />)
    await userEvent.click(screen.getByRole('button', { name: 'Proposta Enviada' }))
    expect(screen.getByText(/nenhum lead encontrado/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Executar teste para confirmar falha**

```bash
npx jest __tests__/LeadTable.test.tsx
```

Esperado: FAIL — `Cannot find module '@/components/LeadTable'`

- [ ] **Step 3: Criar src/components/LeadTable.tsx**

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Lead, EtapaLead, ETAPAS_LEAD } from '@/lib/types'

type Filtro = EtapaLead | 'Todos'
const FILTROS: Filtro[] = ['Todos', ...ETAPAS_LEAD]

const etapaBadge: Record<EtapaLead, string> = {
  'Novo Lead': 'bg-blue-50 text-blue-700',
  'Contato Feito': 'bg-yellow-50 text-yellow-700',
  'Proposta Enviada': 'bg-purple-50 text-purple-700',
  'Negociação': 'bg-amber-50 text-amber-700',
  'Fechado': 'bg-emerald-50 text-emerald-700',
  'Perdido': 'bg-red-50 text-red-700',
}

interface Props {
  leads: Lead[]
}

export default function LeadTable({ leads }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('Todos')
  const [busca, setBusca] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const filtrados = leads.filter(l => {
    const matchFiltro = filtro === 'Todos' || l.etapa === filtro
    const matchBusca =
      busca === '' ||
      l.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (l.telefone ?? '').includes(busca)
    return matchFiltro && matchBusca
  })

  async function handleExcluir(id: string) {
    if (!confirm('Deseja excluir este lead?')) return
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) { alert('Erro ao excluir. Tente novamente.'); return }
    router.refresh()
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
        />
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtro === f
                ? 'bg-violet-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Nome</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Telefone</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Tipo de Plano</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Etapa</th>
              <th className="text-left px-6 py-3 font-medium text-stone-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-stone-400">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
            {filtrados.map(l => (
              <tr key={l.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 font-medium text-stone-800">{l.nome}</td>
                <td className="px-6 py-4 text-stone-500">{l.telefone ?? '—'}</td>
                <td className="px-6 py-4 text-stone-500">{l.tipo_plano ?? '—'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${etapaBadge[l.etapa]}`}>
                    {l.etapa}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4">
                    <Link href={`/crm/${l.id}`} className="text-violet-600 hover:underline">
                      Editar
                    </Link>
                    <button
                      onClick={() => handleExcluir(l.id)}
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
npx jest __tests__/LeadTable.test.tsx
```

Esperado: PASS — 5 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/components/LeadTable.tsx __tests__/LeadTable.test.tsx
git commit -m "feat: add LeadTable with search and pipeline filter"
```

---

### Task 2: Criar LeadForm

**Files:**
- Create: `src/components/LeadForm.tsx`
- Create: `__tests__/LeadForm.test.tsx`

- [ ] **Step 1: Escrever teste**

Arquivo: `__tests__/LeadForm.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import LeadForm from '@/components/LeadForm'
import { Lead } from '@/lib/types'

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

describe('LeadForm', () => {
  it('renders all form fields', () => {
    render(<LeadForm />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de plano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/etapa/i)).toBeInTheDocument()
  })

  it('shows error when submitting without nome', async () => {
    render(<LeadForm />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument()
  })

  it('pre-fills fields when editing lead', () => {
    const lead: Lead = {
      id: '1',
      nome: 'Carlos Mendes',
      telefone: '(83) 98888-9999',
      tipo_plano: 'Saúde',
      etapa: 'Proposta Enviada',
      criado_em: '',
    }
    render(<LeadForm lead={lead} />)
    expect(screen.getByDisplayValue('Carlos Mendes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('(83) 98888-9999')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Proposta Enviada')).toBeInTheDocument()
  })

  it('shows save and cancel buttons', () => {
    render(<LeadForm />)
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Executar teste para confirmar falha**

```bash
npx jest __tests__/LeadForm.test.tsx
```

Esperado: FAIL — `Cannot find module '@/components/LeadForm'`

- [ ] **Step 3: Criar src/components/LeadForm.tsx**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadInsert, EtapaLead, ETAPAS_LEAD, TIPOS_PLANO } from '@/lib/types'

interface Props {
  lead?: Lead
}

export default function LeadForm({ lead }: Props) {
  const [nome, setNome] = useState(lead?.nome ?? '')
  const [telefone, setTelefone] = useState(lead?.telefone ?? '')
  const [tipo_plano, setTipoPlano] = useState(lead?.tipo_plano ?? '')
  const [etapa, setEtapa] = useState<EtapaLead>(lead?.etapa ?? 'Novo Lead')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const editando = !!lead

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!nome.trim()) { setErro('Nome é obrigatório'); return }

    setLoading(true)

    const payload: LeadInsert = {
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      tipo_plano: tipo_plano || null,
      etapa,
    }

    if (editando) {
      const { error } = await supabase.from('leads').update(payload).eq('id', lead.id)
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    } else {
      const { error } = await supabase.from('leads').insert(payload)
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    }

    setLoading(false)
    router.push('/crm')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-stone-700 mb-1">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-stone-700 mb-1">
          Telefone / WhatsApp
        </label>
        <input
          id="telefone"
          type="text"
          value={telefone}
          onChange={e => setTelefone(e.target.value)}
          placeholder="(00) 00000-0000"
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      <div>
        <label htmlFor="tipo_plano" className="block text-sm font-medium text-stone-700 mb-1">
          Tipo de Plano
        </label>
        <select
          id="tipo_plano"
          value={tipo_plano}
          onChange={e => setTipoPlano(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">Selecione...</option>
          {TIPOS_PLANO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="etapa" className="block text-sm font-medium text-stone-700 mb-1">
          Etapa <span className="text-red-500">*</span>
        </label>
        <select
          id="etapa"
          value={etapa}
          onChange={e => setEtapa(e.target.value as EtapaLead)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          {ETAPAS_LEAD.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {erro && <p className="text-red-600 text-sm">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/crm')}
          className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl font-medium hover:bg-stone-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Executar teste para confirmar aprovação**

```bash
npx jest __tests__/LeadForm.test.tsx
```

Esperado: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/components/LeadForm.tsx __tests__/LeadForm.test.tsx
git commit -m "feat: add LeadForm for creating and editing leads"
```

---

### Task 3: Criar ConversaoModal (substitui stub)

**Files:**
- Modify: `src/components/ConversaoModal.tsx` (substitui stub)
- Create: `__tests__/ConversaoModal.test.tsx`

- [ ] **Step 1: Escrever teste**

Arquivo: `__tests__/ConversaoModal.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ConversaoModal from '@/components/ConversaoModal'
import { Lead } from '@/lib/types'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

const lead: Lead = {
  id: '1',
  nome: 'Maria Silva',
  telefone: '(83) 99999-0000',
  tipo_plano: 'Saúde',
  etapa: 'Fechado',
  criado_em: '',
}

describe('ConversaoModal', () => {
  it('renders lead name pre-filled', () => {
    render(<ConversaoModal lead={lead} onClose={jest.fn()} onCancelar={jest.fn()} />)
    expect(screen.getByDisplayValue('Maria Silva')).toBeInTheDocument()
  })

  it('renders all required fields', () => {
    render(<ConversaoModal lead={lead} onClose={jest.fn()} onCancelar={jest.fn()} />)
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor do plano/i)).toBeInTheDocument()
  })

  it('shows error when valor is missing', async () => {
    render(<ConversaoModal lead={lead} onClose={jest.fn()} onCancelar={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar como cliente/i }))
    expect(await screen.findByText('Valor do plano é obrigatório')).toBeInTheDocument()
  })

  it('calls onCancelar when cancel is clicked', () => {
    const onCancelar = jest.fn()
    render(<ConversaoModal lead={lead} onClose={jest.fn()} onCancelar={onCancelar} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancelar).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Executar teste para confirmar falha**

```bash
npx jest __tests__/ConversaoModal.test.tsx
```

Esperado: FAIL — teste falha (stub retorna null)

- [ ] **Step 3: Substituir src/components/ConversaoModal.tsx**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, ClienteInsert, TIPOS_PLANO } from '@/lib/types'

interface Props {
  lead: Lead
  onClose: () => void
  onCancelar: () => void
}

export default function ConversaoModal({ lead, onClose, onCancelar }: Props) {
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState(lead.telefone ?? '')
  const [tipo_plano, setTipoPlano] = useState(lead.tipo_plano ?? '')
  const [valor_plano, setValorPlano] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const valor = Number(valor_plano.replace(',', '.'))
    if (!valor_plano || isNaN(valor)) {
      setErro('Valor do plano é obrigatório')
      return
    }

    setLoading(true)

    const payload: ClienteInsert = {
      nome: lead.nome,
      contato: telefone || null,
      email: email || null,
      tipo_plano: tipo_plano || null,
      valor_plano: valor,
      observacoes: observacoes || null,
      lead_id: lead.id,
    }

    const { error } = await supabase.from('clientes').insert(payload)
    if (error) {
      setErro('Erro ao salvar cliente. Tente novamente.')
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🎉</span>
            <h2 className="text-lg font-bold text-stone-800">Converter para Cliente</h2>
          </div>
          <p className="text-sm text-stone-500">
            Complete os dados de <strong>{lead.nome}</strong>
          </p>
        </div>

        <form onSubmit={handleSalvar} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
            <input
              type="text"
              value={lead.nome}
              disabled
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-stone-50 text-stone-400"
            />
          </div>

          <div>
            <label htmlFor="conv-email" className="block text-sm font-medium text-stone-700 mb-1">
              E-mail
            </label>
            <input
              id="conv-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label htmlFor="conv-tel" className="block text-sm font-medium text-stone-700 mb-1">
              Telefone
            </label>
            <input
              id="conv-tel"
              type="text"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label htmlFor="conv-tipo" className="block text-sm font-medium text-stone-700 mb-1">
              Tipo de Plano
            </label>
            <select
              id="conv-tipo"
              value={tipo_plano}
              onChange={e => setTipoPlano(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">Selecione...</option>
              {TIPOS_PLANO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="conv-valor" className="block text-sm font-medium text-stone-700 mb-1">
              Valor do Plano (R$) <span className="text-red-500">*</span>
            </label>
            <input
              id="conv-valor"
              type="text"
              value={valor_plano}
              onChange={e => setValorPlano(e.target.value)}
              placeholder="0,00"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label htmlFor="conv-obs" className="block text-sm font-medium text-stone-700 mb-1">
              Observações
            </label>
            <textarea
              id="conv-obs"
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={3}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>

          {erro && <p className="text-red-600 text-sm">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 bg-stone-100 text-stone-700 py-2.5 rounded-xl font-medium hover:bg-stone-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar como Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Executar teste para confirmar aprovação**

```bash
npx jest __tests__/ConversaoModal.test.tsx
```

Esperado: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/components/ConversaoModal.tsx __tests__/ConversaoModal.test.tsx
git commit -m "feat: add ConversaoModal for converting leads to clients"
```

---

### Task 4: Atualizar páginas CRM

**Files:**
- Modify: `src/app/(protected)/crm/page.tsx`
- Modify: `src/app/(protected)/crm/novo/page.tsx`
- Modify: `src/app/(protected)/crm/[id]/page.tsx`

- [ ] **Step 1: Substituir src/app/(protected)/crm/page.tsx**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LeadTable from '@/components/LeadTable'
import { Plus } from 'lucide-react'

export default async function CrmPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">CRM</h1>
          <p className="text-sm text-stone-500 mt-1">Gestão de leads e negociações</p>
        </div>
        <Link
          href="/crm/novo"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={16} />
          Novo Lead
        </Link>
      </div>

      <LeadTable leads={leads ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Substituir src/app/(protected)/crm/novo/page.tsx**

```tsx
import LeadForm from '@/components/LeadForm'

export default function NovoLeadPage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Novo Lead</h1>
      <p className="text-sm text-stone-500 mb-6">Adicione um novo lead ao pipeline</p>
      <LeadForm />
    </div>
  )
}
```

- [ ] **Step 3: Substituir src/app/(protected)/crm/[id]/page.tsx**

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeadForm from '@/components/LeadForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarLeadPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Editar Lead</h1>
      <p className="text-sm text-stone-500 mb-6">{lead.nome}</p>
      <LeadForm lead={lead} />
    </div>
  )
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros nas páginas CRM

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/crm/
git commit -m "feat: update CRM pages to use LeadTable and LeadForm"
```

---

### Task 5: Criar página Pipeline

**Files:**
- Create: `src/app/(protected)/pipeline/page.tsx`

- [ ] **Step 1: Criar src/app/(protected)/pipeline/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/KanbanBoard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Pipeline</h1>
          <p className="text-sm text-stone-500 mt-1">Funil de vendas — arraste para mover etapas</p>
        </div>
        <Link
          href="/crm/novo"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={16} />
          Novo Lead
        </Link>
      </div>

      <KanbanBoard leads={leads ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Executar todos os testes**

```bash
npx jest
```

Esperado: PASS — todos os testes passam (Sidebar 4, DashboardCard 4, KanbanBoard 2, LeadTable 5, LeadForm 4, ConversaoModal 4 = 23 testes)

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Step 4: Commit final do Plano B**

```bash
git add src/app/(protected)/pipeline/ src/app/(protected)/crm/
git commit -m "feat: complete Plan B — CRM leads and Pipeline with conversion modal"
```
