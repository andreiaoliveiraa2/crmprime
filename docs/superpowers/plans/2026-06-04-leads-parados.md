# Alerta de Leads Parados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir um badge laranja com ícone de relógio nos cards do Kanban e nas linhas da lista quando um lead está há 5 ou mais dias sem movimentação.

**Architecture:** Uma coluna `atualizado_em` é adicionada à tabela `leads` via migration, com trigger Postgres que a mantém sempre atualizada. Uma função utilitária `isParado` calcula se o lead está parado. O badge é renderizado nos componentes `KanbanBoard` e `LeadTable`.

**Tech Stack:** Next.js 16, TypeScript, Supabase (Postgres), Tailwind 4, lucide-react, Jest + Testing Library

---

### Task 1: Migration — coluna `atualizado_em` + trigger

**Files:**
- Create: `supabase/migrations/20260604_leads_atualizado_em.sql`

- [ ] **Step 1: Criar o arquivo de migration**

Conteúdo exato do arquivo:

```sql
alter table leads add column atualizado_em timestamptz default now();
update leads set atualizado_em = criado_em;

create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_leads_atualizado_em
  before update on leads
  for each row execute function set_atualizado_em();
```

- [ ] **Step 2: Aplicar no Supabase**

Ir em **Supabase → SQL Editor** e executar o conteúdo do arquivo acima.

Verificar que a coluna aparece em **Table Editor → leads**.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260604_leads_atualizado_em.sql
git commit -m "feat: adiciona coluna atualizado_em em leads com trigger de auto-atualização"
```

---

### Task 2: Tipo `Lead` — adicionar `atualizado_em`

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `__tests__/KanbanBoard.test.tsx`
- Modify: `__tests__/LeadTable.test.tsx`

- [ ] **Step 1: Adicionar campo em `src/lib/types.ts`**

Localizar a interface `Lead` e adicionar `atualizado_em` após `criado_em`:

```ts
export interface Lead {
  id: string
  nome: string | null
  telefone: string | null
  tipo_plano: string | null
  operadora: string | null
  responsavel: string | null
  origem: string | null
  o_que_procura: string | null
  observacoes: string | null
  vendedor: string | null
  vendedor_id: string | null
  etapa: EtapaLead
  criado_em: string
  atualizado_em: string
}
```

Localizar `LeadInsert` e atualizar o Omit para excluir `atualizado_em`:

```ts
export type LeadInsert = Omit<Lead, 'id' | 'criado_em' | 'atualizado_em'> & { criado_em?: string | null }
```

- [ ] **Step 2: Atualizar mocks dos testes existentes**

Em `__tests__/KanbanBoard.test.tsx`, substituir o array `leads` para incluir `vendedor_id` e `atualizado_em`:

```ts
const leads: Lead[] = [
  {
    id: '1', nome: 'Ana Lima', telefone: null, tipo_plano: null,
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Novo Lead', criado_em: '', atualizado_em: '',
  },
  {
    id: '2', nome: 'Bruno Costa', telefone: null, tipo_plano: 'Saúde',
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Negociação', criado_em: '', atualizado_em: '',
  },
]
```

Também corrigir a chamada do componente que exige `onLeadMoved`:

```tsx
render(<KanbanBoard leads={leads} onLeadMoved={jest.fn()} />)
```

(Atualizar as 3 ocorrências de `render(<KanbanBoard leads={leads} />)` para incluir `onLeadMoved={jest.fn()}`.)

Em `__tests__/LeadTable.test.tsx`, substituir o array `leads`:

```ts
const leads: Lead[] = [
  {
    id: '1', nome: 'Ana Lima', telefone: '(83) 99999-1111', tipo_plano: 'Saúde',
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Novo Lead', criado_em: '', atualizado_em: '',
  },
  {
    id: '2', nome: 'Bruno Costa', telefone: null, tipo_plano: 'Odonto',
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Negociação', criado_em: '', atualizado_em: '',
  },
]
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

Esperado: nenhum erro fora de `__tests__/`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts __tests__/KanbanBoard.test.tsx __tests__/LeadTable.test.tsx
git commit -m "feat: adiciona atualizado_em ao tipo Lead e corrige mocks dos testes"
```

---

### Task 3: Utilitário `src/lib/leads.ts` (TDD)

**Files:**
- Create: `__tests__/leads.test.ts`
- Create: `src/lib/leads.ts`

- [ ] **Step 1: Escrever os testes (arquivo ainda não existe)**

Criar `__tests__/leads.test.ts`:

```ts
import { diasParado, isParado } from '@/lib/leads'
import { Lead } from '@/lib/types'

function makeLead(daysAgo: number, overrides: Partial<Lead> = {}): Lead {
  const date = new Date(Date.now() - daysAgo * 86_400_000).toISOString()
  return {
    id: '1',
    nome: 'Test',
    telefone: null,
    tipo_plano: null,
    operadora: null,
    responsavel: null,
    origem: null,
    o_que_procura: null,
    observacoes: null,
    vendedor: null,
    vendedor_id: null,
    etapa: 'Novo Lead',
    criado_em: date,
    atualizado_em: date,
    ...overrides,
  }
}

describe('diasParado', () => {
  it('retorna dias desde atualizado_em', () => {
    expect(diasParado(makeLead(7))).toBe(7)
  })

  it('usa criado_em como fallback quando atualizado_em está ausente', () => {
    const lead = { ...makeLead(4), atualizado_em: undefined as unknown as string }
    expect(diasParado(lead)).toBe(4)
  })
})

describe('isParado', () => {
  it('retorna true quando >= 5 dias e etapa ativa', () => {
    expect(isParado(makeLead(5))).toBe(true)
    expect(isParado(makeLead(10))).toBe(true)
  })

  it('retorna false quando < 5 dias', () => {
    expect(isParado(makeLead(4))).toBe(false)
    expect(isParado(makeLead(0))).toBe(false)
  })

  it('retorna false para etapa Vendido', () => {
    expect(isParado(makeLead(10, { etapa: 'Vendido' }))).toBe(false)
  })

  it('retorna false para etapa Perdido', () => {
    expect(isParado(makeLead(10, { etapa: 'Perdido' }))).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

```bash
npx jest __tests__/leads.test.ts --no-coverage
```

Esperado: FAIL — `Cannot find module '@/lib/leads'`

- [ ] **Step 3: Criar `src/lib/leads.ts`**

```ts
import { Lead } from '@/lib/types'

export function diasParado(lead: Lead): number {
  const ref = lead.atualizado_em ?? lead.criado_em
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000)
}

export function isParado(lead: Lead): boolean {
  return diasParado(lead) >= 5
    && lead.etapa !== 'Vendido'
    && lead.etapa !== 'Perdido'
}
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```bash
npx jest __tests__/leads.test.ts --no-coverage
```

Esperado: PASS — 6 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/lib/leads.ts __tests__/leads.test.ts
git commit -m "feat: adiciona utilitário isParado/diasParado para detectar leads sem movimentação"
```

---

### Task 4: Badge no Kanban

**Files:**
- Modify: `src/components/KanbanBoard.tsx`
- Modify: `__tests__/KanbanBoard.test.tsx`

- [ ] **Step 1: Escrever o teste antes de alterar o componente**

Adicionar ao final do `describe('KanbanBoard')` em `__tests__/KanbanBoard.test.tsx`:

```tsx
it('exibe badge de parado em lead com 5+ dias sem movimentação', () => {
  const leadParado: Lead = {
    id: '3', nome: 'Carlos Dias', telefone: null, tipo_plano: null,
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Cotação', criado_em: '',
    atualizado_em: new Date(Date.now() - 6 * 86_400_000).toISOString(),
  }
  render(<KanbanBoard leads={[leadParado]} onLeadMoved={jest.fn()} />)
  expect(screen.getByText(/6 dias/i)).toBeInTheDocument()
})

it('não exibe badge em lead atualizado recentemente', () => {
  const leadAtivo: Lead = {
    id: '4', nome: 'Daniela Melo', telefone: null, tipo_plano: null,
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Cotação', criado_em: '',
    atualizado_em: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  }
  render(<KanbanBoard leads={[leadAtivo]} onLeadMoved={jest.fn()} />)
  expect(screen.queryByText(/dias/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
npx jest __tests__/KanbanBoard.test.tsx --no-coverage
```

Esperado: os 2 novos testes FAIL, os 3 antigos PASS.

- [ ] **Step 3: Modificar `KanbanBoard.tsx`**

Atualizar a linha de imports no topo:

```tsx
import { Plus, Calendar, User, ArrowRight, Clock } from 'lucide-react'
import { isParado, diasParado } from '@/lib/leads'
```

Após o bloco `{/* Nome + badge de status */}` (após o `</div>` que fecha esse bloco, linha ~141), adicionar o badge de parado:

```tsx
              {/* Nome + badge de status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold leading-snug" style={{ color: '#2d1f4e' }}>
                  {l.nome}
                </p>
                <span
                  className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                  {l.etapa}
                </span>
              </div>

              {/* Badge de lead parado */}
              {isParado(l) && (
                <div className="flex items-center gap-1 mb-1.5">
                  <Clock size={13} style={{ color: '#ea580c' }} />
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                    {diasParado(l)} dias
                  </span>
                </div>
              )}
```

- [ ] **Step 4: Rodar todos os testes do Kanban**

```bash
npx jest __tests__/KanbanBoard.test.tsx --no-coverage
```

Esperado: 5 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/KanbanBoard.tsx __tests__/KanbanBoard.test.tsx
git commit -m "feat: exibe badge de lead parado no Kanban após 5 dias sem movimentação"
```

---

### Task 5: Badge na Lista

**Files:**
- Modify: `src/components/LeadTable.tsx`
- Modify: `__tests__/LeadTable.test.tsx`

- [ ] **Step 1: Escrever o teste antes de alterar o componente**

Adicionar ao final do `describe('LeadTable')` em `__tests__/LeadTable.test.tsx`:

```tsx
it('exibe badge de parado ao lado do nome quando >= 5 dias', () => {
  const leadParado: Lead = {
    id: '3', nome: 'Eva Souza', telefone: null, tipo_plano: null,
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Cotação', criado_em: '',
    atualizado_em: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  }
  render(<LeadTable leads={[leadParado]} />)
  expect(screen.getByText(/7 dias/i)).toBeInTheDocument()
})

it('não exibe badge em lead recente', () => {
  const leadAtivo: Lead = {
    id: '4', nome: 'Fábio Torres', telefone: null, tipo_plano: null,
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Cotação', criado_em: '',
    atualizado_em: new Date(Date.now() - 1 * 86_400_000).toISOString(),
  }
  render(<LeadTable leads={[leadAtivo]} />)
  expect(screen.queryByText(/dias/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
npx jest __tests__/LeadTable.test.tsx --no-coverage
```

Esperado: os 2 novos testes FAIL, os 5 antigos PASS.

- [ ] **Step 3: Modificar `LeadTable.tsx`**

Atualizar imports no topo:

```tsx
import { Search, Clock } from 'lucide-react'
import { isParado, diasParado } from '@/lib/leads'
```

Substituir a célula do nome (linha ~98):

```tsx
<td className="px-6 py-4 font-medium text-stone-800">
  <div className="flex items-center gap-2 flex-wrap">
    {l.nome}
    {isParado(l) && (
      <span className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
        style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
        <Clock size={11} />
        {diasParado(l)} dias
      </span>
    )}
  </div>
</td>
```

- [ ] **Step 4: Rodar todos os testes da LeadTable**

```bash
npx jest __tests__/LeadTable.test.tsx --no-coverage
```

Esperado: 7 testes PASS.

- [ ] **Step 5: Rodar toda a suite de testes**

```bash
npx jest --no-coverage
```

Esperado: todos os testes de `leads`, `KanbanBoard` e `LeadTable` passando.

- [ ] **Step 6: Commit final**

```bash
git add src/components/LeadTable.tsx __tests__/LeadTable.test.tsx
git commit -m "feat: exibe badge de lead parado na lista após 5 dias sem movimentação"
```

- [ ] **Step 7: Push**

```bash
git push
```
