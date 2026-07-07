# Meu Dia do Vendedor + Metas por Operadora — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o "Meu Dia" mostrar, pro vendedor, o dinheiro e a meta dele; adicionar metas mensais por operadora (empresa + por vendedor) num card por operadora nos dois perfis; e deixar o card Agenda mostrar os próximos compromissos.

**Architecture:** Uma única página de dashboard (`/dashboard`) com cards condicionais ao `usuario.perfil`. A lógica de cálculo (meta por operadora, "vou receber" do vendedor) vive em funções puras testáveis em `src/lib`. Metas ficam numa tabela nova `metas` com RLS (admin escreve; vendedor só lê a dele). A admin edita metas na Gestão via um componente reutilizável + server action.

**Tech Stack:** Next.js (App Router, Server Components) + Supabase (Postgres + RLS) + TypeScript + Jest/Testing Library + Tailwind (estilos inline no padrão do projeto).

## Global Constraints

- **Next.js modificado:** o repo avisa em `AGENTS.md` que este Next.js tem breaking changes — conferir `node_modules/next/dist/docs/` antes de padrões novos. Seguir os padrões já usados no projeto (server components com `createClient()` de `@/lib/supabase/server`, server actions em `src/app/actions/`).
- **RLS é a fronteira de segurança:** o vendedor nunca deve ler metas de outro vendedor nem da empresa. Existem os helpers SQL `meu_perfil()` e `meu_vendedor_id()`.
- **Idioma:** toda a UI/textos em português do Brasil. Sem os termos de funil ("abordagem", "proposta", "prospecção", "conversão") no card de meta.
- **Estilo visual:** cores e cantos no padrão atual do dashboard (`cardGrey`/`cardGold`, roxo `#2d1f4e`, dourado `#b89a6a`/`#d4af7a`, verde `#22c55e`, cinza texto `#9a918a`).
- **`vendas` e `comissoes` já têm RLS por vendedor** — as queries no dashboard já retornam só os dados do usuário logado conforme o perfil (admin vê tudo; vendedor vê o dele). Este plano NÃO precisa filtrar `vendas` manualmente por vendedor no dashboard.
- **Tabela `metas` é redefinida por mês** via delete-then-insert do escopo+mês (sem upsert/on-conflict).
- **Migrações:** arquivo SQL em `supabase/migrations/YYYYMMDD_descricao.sql`; aplicar na produção via Supabase MCP `apply_migration` (ou o fluxo de deploy). Deploy do app é MANUAL no Easypanel/cursoia após `git push master`.

---

## Estrutura de arquivos

**Criar:**
- `supabase/migrations/20260707_metas.sql` — tabela `metas` + RLS.
- `src/lib/calcularMetas.ts` — funções puras `calcularMetas` (+ tipos `MetaLinha`, `ResumoMeta`).
- `src/lib/vouReceberVendedor.ts` — função pura `resumoVouReceberVendedor` (+ tipo `ResumoVouReceber`).
- `__tests__/calcularMetas.test.ts` — testes da lógica de metas.
- `__tests__/vouReceberVendedor.test.ts` — testes do "vou receber".
- `src/components/MetaMesCard.tsx` — card "Meta do mês" por operadora (apresentacional).
- `__tests__/MetaMesCard.test.tsx` — teste do card.
- `src/components/MetasEditor.tsx` — editor de metas (operadoras × valor) para um escopo+mês.
- `src/app/actions/metas.ts` — server action `salvarMetas`.

**Modificar:**
- `src/lib/types.ts` — adicionar `interface Meta`.
- `src/app/(protected)/dashboard/page.tsx` — carregar metas + comissões(vendedor) + próximos da agenda; cards condicionais; usar `MetaMesCard`.
- `src/app/(protected)/gestao/page.tsx` — passar operadoras + metas da empresa do mês pro GestaoClient.
- `src/components/GestaoClient.tsx` — seção "Meta da empresa" com `MetasEditor`.
- `src/app/(protected)/gestao/[id]/page.tsx` — carregar operadoras + metas do vendedor.
- `src/components/FichaVendedor.tsx` — seção "Meta do vendedor" com `MetasEditor`.

---

## Task 1: Migração — tabela `metas` + RLS

**Files:**
- Create: `supabase/migrations/20260707_metas.sql`

**Interfaces:**
- Produces: tabela `metas(id, vendedor_id nullable, mes_referencia date, operadora text, meta_valor numeric, criado_em, atualizado_em)` com RLS. `vendedor_id = null` significa meta da empresa.

- [ ] **Step 1: Escrever a migração**

Create `supabase/migrations/20260707_metas.sql`:

```sql
-- Metas mensais de vendas por operadora.
-- vendedor_id NULL = meta da empresa (aparece no dashboard da admin).
-- vendedor_id preenchido = meta daquele vendedor (aparece no Meu Dia dele).

create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references vendedores(id) on delete cascade,
  mes_referencia date not null,          -- sempre o 1º dia do mês (ex: 2026-07-01)
  operadora text not null,
  meta_valor numeric not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists metas_lookup on metas (vendedor_id, mes_referencia);

alter table metas enable row level security;

-- Admin lê e escreve tudo.
drop policy if exists "metas_admin" on metas;
create policy "metas_admin" on metas
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- Vendedor só LÊ as metas dele (nunca as da empresa nem de outros).
drop policy if exists "metas_vendedor_select" on metas;
create policy "metas_vendedor_select" on metas
  for select
  using (meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id());
```

- [ ] **Step 2: Aplicar a migração na produção**

Aplicar via Supabase MCP `apply_migration` (name: `metas`, query: conteúdo do arquivo).
Expected: sucesso, sem erro.

- [ ] **Step 3: Verificar tabela e policies**

Rodar via Supabase MCP `execute_sql`:
```sql
select tablename, policyname, cmd from pg_policies where tablename = 'metas' order by policyname;
```
Expected: 2 linhas — `metas_admin` (ALL) e `metas_vendedor_select` (SELECT).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260707_metas.sql
git commit -m "feat(metas): tabela metas mensais por operadora + RLS"
```

---

## Task 2: Lógica pura — `calcularMetas`

**Files:**
- Create: `src/lib/calcularMetas.ts`
- Test: `__tests__/calcularMetas.test.ts`

**Interfaces:**
- Produces:
  - `interface MetaLinha { operadora: string; meta: number; vendido: number; pct: number; falta: number }`
  - `interface ResumoMeta { totalMeta: number; totalVendido: number; pct: number; falta: number; ritmoSemana: number; linhas: MetaLinha[] }`
  - `function calcularMetas(metas: {operadora:string; meta_valor:number}[], vendido: {operadora:string; vendido:number}[], semanasRestantes: number): ResumoMeta`

- [ ] **Step 1: Escrever o teste que falha**

Create `__tests__/calcularMetas.test.ts`:

```ts
import { calcularMetas } from '@/lib/calcularMetas'

describe('calcularMetas', () => {
  it('junta metas e vendido por operadora, calcula % e falta', () => {
    const r = calcularMetas(
      [{ operadora: 'SulAmérica', meta_valor: 5000 }, { operadora: 'Amil', meta_valor: 3000 }],
      [{ operadora: 'SulAmérica', vendido: 3200 }, { operadora: 'Amil', vendido: 1000 }],
      2,
    )
    expect(r.totalMeta).toBe(8000)
    expect(r.totalVendido).toBe(4200)
    expect(r.falta).toBe(3800)
    expect(r.pct).toBe(53) // round(4200/8000*100)
    expect(r.ritmoSemana).toBe(1900) // 3800 / 2
    const sul = r.linhas.find(l => l.operadora === 'SulAmérica')!
    expect(sul.pct).toBe(64) // round(3200/5000*100)
    expect(sul.falta).toBe(1800)
  })

  it('inclui operadora que teve venda mesmo sem meta (pct 0, falta 0)', () => {
    const r = calcularMetas(
      [{ operadora: 'Amil', meta_valor: 3000 }],
      [{ operadora: 'Bradesco', vendido: 500 }],
      1,
    )
    const brad = r.linhas.find(l => l.operadora === 'Bradesco')!
    expect(brad.meta).toBe(0)
    expect(brad.pct).toBe(0)
    expect(brad.falta).toBe(0)
    expect(r.totalMeta).toBe(3000)
    expect(r.totalVendido).toBe(500)
  })

  it('falta nunca é negativa quando vendeu acima da meta', () => {
    const r = calcularMetas(
      [{ operadora: 'Amil', meta_valor: 1000 }],
      [{ operadora: 'Amil', vendido: 1500 }],
      3,
    )
    expect(r.falta).toBe(0)
    expect(r.ritmoSemana).toBe(0)
    expect(r.linhas[0].falta).toBe(0)
    expect(r.linhas[0].pct).toBe(150)
  })

  it('sem metas nem vendas retorna vazio zerado', () => {
    const r = calcularMetas([], [], 4)
    expect(r.linhas).toHaveLength(0)
    expect(r.totalMeta).toBe(0)
    expect(r.pct).toBe(0)
  })
})
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- calcularMetas`
Expected: FAIL — "Cannot find module '@/lib/calcularMetas'".

- [ ] **Step 3: Implementar a função**

Create `src/lib/calcularMetas.ts`:

```ts
export interface MetaLinha {
  operadora: string
  meta: number
  vendido: number
  pct: number   // inteiro 0..N
  falta: number
}

export interface ResumoMeta {
  totalMeta: number
  totalVendido: number
  pct: number
  falta: number
  ritmoSemana: number
  linhas: MetaLinha[]
}

function pctDe(vendido: number, meta: number): number {
  return meta > 0 ? Math.round((vendido / meta) * 100) : 0
}

export function calcularMetas(
  metas: { operadora: string; meta_valor: number }[],
  vendido: { operadora: string; vendido: number }[],
  semanasRestantes: number,
): ResumoMeta {
  const metaPorOp = new Map<string, number>()
  for (const m of metas) metaPorOp.set(m.operadora, (metaPorOp.get(m.operadora) ?? 0) + m.meta_valor)

  const vendidoPorOp = new Map<string, number>()
  for (const v of vendido) vendidoPorOp.set(v.operadora, (vendidoPorOp.get(v.operadora) ?? 0) + v.vendido)

  const operadoras = new Set<string>([...metaPorOp.keys(), ...vendidoPorOp.keys()])

  const linhas: MetaLinha[] = [...operadoras].map(operadora => {
    const meta = metaPorOp.get(operadora) ?? 0
    const vend = vendidoPorOp.get(operadora) ?? 0
    return { operadora, meta, vendido: vend, pct: pctDe(vend, meta), falta: Math.max(0, meta - vend) }
  }).sort((a, b) => (b.meta - a.meta) || (b.vendido - a.vendido))

  const totalMeta = linhas.reduce((s, l) => s + l.meta, 0)
  const totalVendido = linhas.reduce((s, l) => s + l.vendido, 0)
  const falta = Math.max(0, totalMeta - totalVendido)
  const ritmoSemana = semanasRestantes > 0 ? Math.round(falta / semanasRestantes) : falta

  return { totalMeta, totalVendido, pct: pctDe(totalVendido, totalMeta), falta, ritmoSemana, linhas }
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- calcularMetas`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/calcularMetas.ts __tests__/calcularMetas.test.ts
git commit -m "feat(metas): funcao pura calcularMetas por operadora"
```

---

## Task 3: Lógica pura — `resumoVouReceberVendedor`

**Files:**
- Create: `src/lib/vouReceberVendedor.ts`
- Test: `__tests__/vouReceberVendedor.test.ts`

**Interfaces:**
- Consumes: linhas de comissão achatadas `{ valor_vendedor: number; status_vendedor: string; data_prevista: string; operadora: string }`.
- Produces:
  - `interface ResumoVouReceber { totalReceber: number; esteMes: number; porOperadora: {operadora:string; valor:number}[] }`
  - `function resumoVouReceberVendedor(comissoes, mesRef: Date): ResumoVouReceber`

- [ ] **Step 1: Escrever o teste que falha**

Create `__tests__/vouReceberVendedor.test.ts`:

```ts
import { resumoVouReceberVendedor } from '@/lib/vouReceberVendedor'

const mesRef = new Date(2026, 6, 15) // julho/2026

describe('resumoVouReceberVendedor', () => {
  it('soma só as pendentes; separa as deste mês; agrupa por operadora', () => {
    const r = resumoVouReceberVendedor([
      { valor_vendedor: 100, status_vendedor: 'Pendente', data_prevista: '2026-07-10', operadora: 'Amil' },
      { valor_vendedor: 50,  status_vendedor: 'Pendente', data_prevista: '2026-08-10', operadora: 'Amil' },
      { valor_vendedor: 30,  status_vendedor: 'Pendente', data_prevista: '2026-07-20', operadora: 'SulAmérica' },
      { valor_vendedor: 999, status_vendedor: 'Recebido', data_prevista: '2026-07-05', operadora: 'Amil' },
    ], mesRef)
    expect(r.totalReceber).toBe(180) // 100+50+30 (exclui recebida)
    expect(r.esteMes).toBe(130)      // 100 (jul) + 30 (jul)
    expect(r.porOperadora).toEqual([
      { operadora: 'Amil', valor: 150 },
      { operadora: 'SulAmérica', valor: 30 },
    ])
  })

  it('sem comissões pendentes retorna tudo zero', () => {
    const r = resumoVouReceberVendedor([
      { valor_vendedor: 200, status_vendedor: 'Recebido', data_prevista: '2026-07-01', operadora: 'Amil' },
    ], mesRef)
    expect(r.totalReceber).toBe(0)
    expect(r.esteMes).toBe(0)
    expect(r.porOperadora).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- vouReceberVendedor`
Expected: FAIL — "Cannot find module '@/lib/vouReceberVendedor'".

- [ ] **Step 3: Implementar a função**

Create `src/lib/vouReceberVendedor.ts`:

```ts
export interface ResumoVouReceber {
  totalReceber: number
  esteMes: number
  porOperadora: { operadora: string; valor: number }[]
}

interface LinhaComissao {
  valor_vendedor: number
  status_vendedor: string
  data_prevista: string   // 'YYYY-MM-DD'
  operadora: string
}

export function resumoVouReceberVendedor(comissoes: LinhaComissao[], mesRef: Date): ResumoVouReceber {
  const pendentes = comissoes.filter(c => c.status_vendedor === 'Pendente')
  const ano = mesRef.getFullYear()
  const mes = mesRef.getMonth() // 0..11

  const totalReceber = pendentes.reduce((s, c) => s + c.valor_vendedor, 0)

  const esteMes = pendentes.reduce((s, c) => {
    const [y, m] = c.data_prevista.split('-').map(Number)
    return (y === ano && m - 1 === mes) ? s + c.valor_vendedor : s
  }, 0)

  const porOpMap = new Map<string, number>()
  for (const c of pendentes) {
    const op = c.operadora || 'Sem operadora'
    porOpMap.set(op, (porOpMap.get(op) ?? 0) + c.valor_vendedor)
  }
  const porOperadora = [...porOpMap.entries()]
    .map(([operadora, valor]) => ({ operadora, valor }))
    .sort((a, b) => b.valor - a.valor)

  return { totalReceber, esteMes, porOperadora }
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- vouReceberVendedor`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/vouReceberVendedor.ts __tests__/vouReceberVendedor.test.ts
git commit -m "feat(vendedor): funcao pura resumoVouReceberVendedor"
```

---

## Task 4: Tipo `Meta` + componente `MetaMesCard`

**Files:**
- Modify: `src/lib/types.ts` (adicionar `interface Meta`)
- Create: `src/components/MetaMesCard.tsx`
- Test: `__tests__/MetaMesCard.test.tsx`

**Interfaces:**
- Consumes: `ResumoMeta` de `@/lib/calcularMetas`.
- Produces:
  - `interface Meta { id: string; vendedor_id: string | null; mes_referencia: string; operadora: string; meta_valor: number; criado_em: string; atualizado_em: string }`
  - `<MetaMesCard resumo={ResumoMeta} subtitulo={string} />` — card apresentacional (sem `Link`; ocupa `col-span-12 md:col-span-4`).

- [ ] **Step 1: Adicionar o tipo `Meta`**

Modify `src/lib/types.ts` — adicionar ao final do arquivo:

```ts
export interface Meta {
  id: string
  vendedor_id: string | null
  mes_referencia: string   // 'YYYY-MM-01'
  operadora: string
  meta_valor: number
  criado_em: string
  atualizado_em: string
}
export type MetaInsert = Omit<Meta, 'id' | 'criado_em' | 'atualizado_em'>
```

- [ ] **Step 2: Escrever o teste que falha**

Create `__tests__/MetaMesCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import MetaMesCard from '@/components/MetaMesCard'
import { ResumoMeta } from '@/lib/calcularMetas'

const resumo: ResumoMeta = {
  totalMeta: 8000, totalVendido: 4200, pct: 53, falta: 3800, ritmoSemana: 1900,
  linhas: [
    { operadora: 'SulAmérica', meta: 5000, vendido: 3200, pct: 64, falta: 1800 },
    { operadora: 'Amil', meta: 3000, vendido: 1000, pct: 33, falta: 2000 },
  ],
}

describe('MetaMesCard', () => {
  it('mostra o total, o % e cada operadora com o que falta', () => {
    render(<MetaMesCard resumo={resumo} subtitulo="julho · semana 2 de 5" />)
    expect(screen.getByText('Meta do mês')).toBeInTheDocument()
    expect(screen.getByText('53%')).toBeInTheDocument()
    expect(screen.getByText('SulAmérica')).toBeInTheDocument()
    expect(screen.getByText('Amil')).toBeInTheDocument()
    // não usa termos de funil
    expect(screen.queryByText(/abordagen/i)).toBeNull()
    expect(screen.queryByText(/proposta/i)).toBeNull()
  })

  it('estado vazio quando não há meta nem venda', () => {
    const vazio: ResumoMeta = { totalMeta: 0, totalVendido: 0, pct: 0, falta: 0, ritmoSemana: 0, linhas: [] }
    render(<MetaMesCard resumo={vazio} subtitulo="julho" />)
    expect(screen.getByText(/nenhuma meta definida/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Rodar o teste e ver falhar**

Run: `npm test -- MetaMesCard`
Expected: FAIL — "Cannot find module '@/components/MetaMesCard'".

- [ ] **Step 4: Implementar o componente**

Create `src/components/MetaMesCard.tsx`:

```tsx
import { Target } from 'lucide-react'
import { ResumoMeta } from '@/lib/calcularMetas'

function fmt(n: number) {
  return n.toLocaleString('pt-BR')
}

export default function MetaMesCard({ resumo, subtitulo }: { resumo: ResumoMeta; subtitulo: string }) {
  const { totalMeta, totalVendido, pct, falta, ritmoSemana, linhas } = resumo

  return (
    <div className="col-span-12 md:col-span-4 bg-white p-4 hover:shadow-md transition-all duration-200"
      style={{ border: '1px solid #e8e4dd', borderRadius: '12px' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
          <Target size={15} style={{ color: '#22c55e' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Meta do mês</h3>
          <p className="text-xs" style={{ color: '#9a918a' }}>{subtitulo}</p>
        </div>
      </div>

      {linhas.length === 0 ? (
        <p className="text-xs py-6 text-center" style={{ color: '#9a918a' }}>Nenhuma meta definida ainda</p>
      ) : (
        <>
          {/* Total do mês */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-xl font-extrabold" style={{ background: 'linear-gradient(90deg, #22c55e, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              R$ {fmt(totalVendido)}
            </span>
            <span className="text-xs" style={{ color: '#9a918a' }}>/ R$ {fmt(totalMeta)}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
              style={{ backgroundColor: pct >= 80 ? 'rgba(34,197,94,0.12)' : 'rgba(212,168,67,0.15)', color: pct >= 80 ? '#22c55e' : '#b89a6a' }}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: '#f0ece6' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: 'linear-gradient(90deg, #22c55e, #86efac)' }} />
          </div>

          {/* Por operadora */}
          <div className="space-y-1.5">
            {linhas.map(l => (
              <div key={l.operadora} className="flex items-center gap-2 text-xs">
                <span className="w-16 truncate" style={{ color: '#5a4e3c' }}>{l.operadora}</span>
                <div className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece6' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, l.pct)}%`, background: 'linear-gradient(90deg, #5b3fb5, #8b6fc0)' }} />
                </div>
                <span className="w-10 text-right font-semibold" style={{ color: '#2d1f4e' }}>{l.pct}%</span>
                <span className="w-24 text-right" style={{ color: l.falta > 0 ? '#b89a6a' : '#22c55e' }}>
                  {l.falta > 0 ? `falta R$ ${fmt(l.falta)}` : 'batida ✓'}
                </span>
              </div>
            ))}
          </div>

          {falta > 0 && (
            <p className="text-xs text-center mt-3" style={{ color: '#9a918a' }}>
              Falta <b style={{ color: '#b89a6a' }}>R$ {fmt(falta)}</b> · ~<b style={{ color: '#b89a6a' }}>R$ {fmt(ritmoSemana)}</b>/semana
            </p>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Rodar o teste e ver passar**

Run: `npm test -- MetaMesCard`
Expected: PASS (2 testes).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/components/MetaMesCard.tsx __tests__/MetaMesCard.test.tsx
git commit -m "feat(metas): tipo Meta + card MetaMesCard por operadora"
```

---

## Task 5: Server action `salvarMetas` + componente `MetasEditor`

**Files:**
- Create: `src/app/actions/metas.ts`
- Create: `src/components/MetasEditor.tsx`

**Interfaces:**
- Consumes: `salvarMetas` de `@/app/actions/metas`.
- Produces:
  - `async function salvarMetas(vendedorId: string | null, mesRef: string, valores: {operadora:string; meta_valor:number}[]): Promise<void>`
  - `<MetasEditor operadoras={string[]} vendedorId={string|null} mesRef={string} iniciais={Record<string, number>} />`

- [ ] **Step 1: Implementar a server action**

Create `src/app/actions/metas.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { revalidatePath } from 'next/cache'

export async function salvarMetas(
  vendedorId: string | null,
  mesRef: string,                                       // 'YYYY-MM-01'
  valores: { operadora: string; meta_valor: number }[],
): Promise<void> {
  const usuario = await getUsuarioAtual()
  if (!usuario || usuario.perfil !== 'admin') throw new Error('Não autorizado')

  const supabase = await createClient()

  // Redefine o mês: apaga as metas do escopo+mês e regrava só as com valor > 0.
  let del = supabase.from('metas').delete().eq('mes_referencia', mesRef)
  del = vendedorId === null ? del.is('vendedor_id', null) : del.eq('vendedor_id', vendedorId)
  const { error: eDel } = await del
  if (eDel) throw new Error(eDel.message)

  const linhas = valores
    .filter(v => v.meta_valor > 0)
    .map(v => ({ vendedor_id: vendedorId, mes_referencia: mesRef, operadora: v.operadora, meta_valor: v.meta_valor }))

  if (linhas.length > 0) {
    const { error } = await supabase.from('metas').insert(linhas)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/gestao')
}
```

- [ ] **Step 2: Implementar o editor**

Create `src/components/MetasEditor.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { salvarMetas } from '@/app/actions/metas'

interface Props {
  operadoras: string[]
  vendedorId: string | null       // null = meta da empresa
  mesRef: string                  // 'YYYY-MM-01'
  iniciais: Record<string, number>
}

export default function MetasEditor({ operadoras, vendedorId, mesRef, iniciais }: Props) {
  const router = useRouter()
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(operadoras.map(op => [op, iniciais[op] ? String(iniciais[op]) : ''])),
  )
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  const total = operadoras.reduce((s, op) => s + (parseFloat(valores[op]) || 0), 0)

  async function handleSalvar() {
    setSalvando(true); setOk(false)
    try {
      await salvarMetas(
        vendedorId,
        mesRef,
        operadoras.map(op => ({ operadora: op, meta_valor: parseFloat(valores[op]) || 0 })),
      )
      setOk(true)
      router.refresh()
    } catch {
      alert('Não consegui salvar as metas. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8e4dd' }}>
      <div className="space-y-2">
        {operadoras.map(op => (
          <div key={op} className="flex items-center gap-3">
            <span className="text-sm w-32 shrink-0" style={{ color: '#5a4e3c' }}>{op}</span>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-xs" style={{ color: '#9a918a' }}>R$</span>
              <input
                type="number" min="0" step="0.01" inputMode="decimal"
                value={valores[op]}
                onChange={e => setValores(v => ({ ...v, [op]: e.target.value }))}
                placeholder="0,00"
                className="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#e8e4dd' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid #f0ece6' }}>
        <span className="text-sm" style={{ color: '#5a4e3c' }}>
          Total do mês: <b style={{ color: '#2d1f4e' }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>
        </span>
        <div className="flex items-center gap-3">
          {ok && <span className="text-xs" style={{ color: '#15803d' }}>Salvo ✓</span>}
          <button onClick={handleSalvar} disabled={salvando}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: '#2d1f4e', color: '#fff' }}>
            {salvando ? 'Salvando...' : 'Salvar metas'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar build (typecheck)**

Run: `npm run build`
Expected: build passa sem erros de tipo relacionados a `metas.ts` / `MetasEditor.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/metas.ts src/components/MetasEditor.tsx
git commit -m "feat(metas): server action salvarMetas + editor MetasEditor"
```

---

## Task 6: Ligar o editor na Gestão (empresa) e na Ficha do Vendedor

**Files:**
- Modify: `src/app/(protected)/gestao/page.tsx`
- Modify: `src/components/GestaoClient.tsx`
- Modify: `src/app/(protected)/gestao/[id]/page.tsx`
- Modify: `src/components/FichaVendedor.tsx`

**Interfaces:**
- Consumes: `<MetasEditor />` (Task 5). `mesRef` string calculada como `` `${ano}-${mm}-01` ``.

- [ ] **Step 1: Carregar operadoras + metas da empresa na página de Gestão**

Modify `src/app/(protected)/gestao/page.tsx` — trocar o bloco de `Promise.all` e o JSX. Substituir a função inteira por:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import GestaoClient from '@/components/GestaoClient'
import Link from 'next/link'
import { NivelVendedor } from '@/lib/types'

export default async function GestaoPage() {
  const usuario = await getUsuarioAtual()
  if (!usuario || usuario.perfil !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const agora = new Date()
  const mesRef = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`

  const [{ data: vendedores }, { data: niveisRaw }, { data: operadorasRaw }, { data: metasEmpresa }] = await Promise.all([
    supabase.from('vendedores').select('*').order('nome'),
    supabase.from('niveis_vendedor').select('*').order('nome'),
    supabase.from('operadoras').select('nome').order('nome'),
    supabase.from('metas').select('operadora, meta_valor').is('vendedor_id', null).eq('mes_referencia', mesRef),
  ])

  const operadoras = (operadorasRaw ?? []).map((o: { nome: string }) => o.nome)
  const metasIniciais: Record<string, number> = {}
  for (const m of (metasEmpresa ?? []) as { operadora: string; meta_valor: number }[]) metasIniciais[m.operadora] = m.meta_valor

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
        operadoras={operadoras}
        mesRef={mesRef}
        metasEmpresaIniciais={metasIniciais}
      />
    </div>
  )
}
```

- [ ] **Step 2: Adicionar a seção "Meta da empresa" no GestaoClient**

Modify `src/components/GestaoClient.tsx`:

Adicionar ao import (topo do arquivo):
```tsx
import MetasEditor from '@/components/MetasEditor'
```

Ampliar a interface de props (localizar a `interface Props`/assinatura da função e adicionar os campos):
```tsx
  operadoras: string[]
  mesRef: string
  metasEmpresaIniciais: Record<string, number>
```
E na desestruturação dos props do componente, incluir `operadoras, mesRef, metasEmpresaIniciais`.

Adicionar, logo antes do fechamento do JSX raiz do componente (após a lista de vendedores), a seção:
```tsx
      <div className="mt-8">
        <h2 className="text-sm font-bold mb-1" style={{ color: '#2d1f4e' }}>Meta da empresa · este mês</h2>
        <p className="text-xs mb-3" style={{ color: '#9a918a' }}>Aparece no seu Meu Dia. Some por operadora.</p>
        <MetasEditor operadoras={operadoras} vendedorId={null} mesRef={mesRef} iniciais={metasEmpresaIniciais} />
      </div>
```

- [ ] **Step 3: Carregar operadoras + metas do vendedor na Ficha**

Modify `src/app/(protected)/gestao/[id]/page.tsx` — adicionar as queries e passar props ao `FichaVendedor`. Substituir a função inteira por:

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
  const agora = new Date()
  const mesRef = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`

  const [{ data: vendedor }, { data: usuarioVendedor }, { data: operadorasRaw }, { data: metasVend }] = await Promise.all([
    supabase.from('vendedores').select('*').eq('id', id).single(),
    supabase.from('usuarios').select('id, perfil, ativo').eq('vendedor_id', id).maybeSingle(),
    supabase.from('operadoras').select('nome').order('nome'),
    supabase.from('metas').select('operadora, meta_valor').eq('vendedor_id', id).eq('mes_referencia', mesRef),
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

  const operadoras = (operadorasRaw ?? []).map((o: { nome: string }) => o.nome)
  const metasIniciais: Record<string, number> = {}
  for (const m of (metasVend ?? []) as { operadora: string; meta_valor: number }[]) metasIniciais[m.operadora] = m.meta_valor

  return (
    <div className="p-6 md:p-8">
      <FichaVendedor
        vendedor={vendedor}
        vendas={vendas ?? []}
        comissoes={comissoes ?? []}
        usuarioVinculado={usuarioVendedor ?? null}
        operadoras={operadoras}
        mesRef={mesRef}
        metasIniciais={metasIniciais}
      />
    </div>
  )
}
```

- [ ] **Step 4: Adicionar a seção "Meta do vendedor" no FichaVendedor**

Modify `src/components/FichaVendedor.tsx`:

Adicionar ao import (topo):
```tsx
import MetasEditor from '@/components/MetasEditor'
```

Ampliar a `interface Props` com:
```tsx
  operadoras: string[]
  mesRef: string
  metasIniciais: Record<string, number>
```
E incluir `operadoras, mesRef, metasIniciais` na desestruturação dos props (a assinatura hoje é `function FichaVendedor({ vendedor, vendas, comissoes, usuarioVinculado }: Props)`).

Adicionar, ao final do JSX (antes de fechar o container raiz), a seção:
```tsx
      <div className="mt-6">
        <h2 className="text-sm font-bold mb-1" style={{ color: '#2d1f4e' }}>Meta deste vendedor · este mês</h2>
        <p className="text-xs mb-3" style={{ color: '#9a918a' }}>Aparece no Meu Dia dele. Você pode mudar quando quiser.</p>
        <MetasEditor operadoras={operadoras} vendedorId={vendedor.id} mesRef={mesRef} iniciais={metasIniciais} />
      </div>
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: build passa. (Se `GestaoClient`/`FichaVendedor` tiverem `interface Props` nomeada, garanta que os novos campos foram adicionados lá.)

- [ ] **Step 6: Commit**

```bash
git add "src/app/(protected)/gestao/page.tsx" src/components/GestaoClient.tsx "src/app/(protected)/gestao/[id]/page.tsx" src/components/FichaVendedor.tsx
git commit -m "feat(metas): editor de metas na Gestao (empresa) e na Ficha do vendedor"
```

---

## Task 7: Dashboard — card "Vou receber" e donut com os dados do vendedor

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `resumoVouReceberVendedor` (Task 3).

- [ ] **Step 1: Carregar as comissões do vendedor**

Modify `src/app/(protected)/dashboard/page.tsx`:

Adicionar o import (junto aos outros de `@/lib`):
```tsx
import { resumoVouReceberVendedor } from '@/lib/vouReceberVendedor'
```

Após o bloco `const [ ... ] = await Promise.all([...])` (por volta da linha 59), adicionar a busca das comissões do vendedor:
```tsx
  // Comissões do vendedor (RLS já limita às dele) para o card "Vou receber".
  let vouReceber = { totalReceber: 0, esteMes: 0, porOperadora: [] as { operadora: string; valor: number }[] }
  if (isVendedor) {
    const { data: comissoesVend } = await supabase
      .from('comissoes')
      .select('valor_vendedor, status_vendedor, data_prevista, vendas!inner(operadora)')
      .eq('tipo', 'parcela')
      .gt('valor_vendedor', 0)
    const linhas = (comissoesVend ?? []).map((c: {
      valor_vendedor: number; status_vendedor: string; data_prevista: string; vendas: { operadora: string }
    }) => ({
      valor_vendedor: c.valor_vendedor,
      status_vendedor: c.status_vendedor,
      data_prevista: c.data_prevista,
      operadora: c.vendas?.operadora ?? 'Sem operadora',
    }))
    vouReceber = resumoVouReceberVendedor(linhas, agora)
  }
```

- [ ] **Step 2: Tornar o card "Vou receber" condicional**

No JSX, localizar o card "COMISSÕES — span 4" (o `<Link href="/financeiro" ...>` com o título "Vou receber", ~linha 226). Substituir esse `<Link>...</Link>` inteiro por:

```tsx
        {/* VOU RECEBER — span 4 (faixa dourada de topo) */}
        <Link href={isVendedor ? '/minhas-comissoes' : '/financeiro'} className={`col-span-12 lg:col-span-4 ${cardBase}`} style={cardGold}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
              <Wallet size={15} style={{ color: '#22c55e' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Vou receber</h3>
              <p className="text-xs" style={{ color: '#9a918a' }}>{isVendedor ? 'total a receber' : 'este mês'}</p>
            </div>
          </div>

          {isVendedor ? (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-extrabold" style={{ background: 'linear-gradient(90deg, #22c55e, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  R$ {vouReceber.totalReceber.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs" style={{ color: '#9a918a' }}>· R$ {vouReceber.esteMes.toLocaleString('pt-BR')} este mês</span>
              </div>
              <div className="space-y-2">
                {vouReceber.porOperadora.slice(0, 3).map(({ operadora, valor }, i) => {
                  const pct = vouReceber.totalReceber > 0 ? Math.round((valor / vouReceber.totalReceber) * 100) : 0
                  const colors = ['linear-gradient(90deg, #5b3fb5, #8b6fc0)', 'linear-gradient(90deg, #b89a6a, #d4bc8a)', 'linear-gradient(90deg, #3b82f6, #60a5fa)']
                  return (
                    <div key={operadora} className="flex items-center gap-2 text-xs">
                      <span className="w-16 truncate" style={{ color: '#9a918a' }}>{operadora}</span>
                      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece6' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % 3] }} />
                      </div>
                      <span className="w-20 text-right font-bold" style={{ color: '#2d1f4e' }}>R$ {valor.toLocaleString('pt-BR')}</span>
                    </div>
                  )
                })}
                {vouReceber.porOperadora.length === 0 && (
                  <p className="text-xs py-2 text-center" style={{ color: '#9a918a' }}>Nada a receber por enquanto</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-extrabold" style={{ background: 'linear-gradient(90deg, #22c55e, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  R$ {totalComissoes.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="space-y-2">
                {comissoesOrdenadas.slice(0, 3).map(([op, val], i) => {
                  const pct = totalComissoes > 0 ? Math.round((val / totalComissoes) * 100) : 0
                  const colors = ['linear-gradient(90deg, #5b3fb5, #8b6fc0)', 'linear-gradient(90deg, #b89a6a, #d4bc8a)', 'linear-gradient(90deg, #3b82f6, #60a5fa)']
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-16 truncate" style={{ color: '#9a918a' }}>{op}</span>
                      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece6' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % 3] }} />
                      </div>
                      <span className="w-20 text-right font-bold" style={{ color: '#2d1f4e' }}>R$ {val.toLocaleString('pt-BR')}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Link>
```

- [ ] **Step 3: Apontar o link do donut "Vendas por operadora" conforme o perfil**

No card "VENDAS POR OPERADORA — span 4 (donut)" (~linha 412), trocar `href="/financeiro"` por:
```tsx
        <Link href={isVendedor ? '/clientes' : '/financeiro'} className={`col-span-12 md:col-span-4 ${cardBase}`} style={cardGrey}>
```
(O conteúdo do donut já usa `vendasMes`, que a RLS limita ao vendedor — nada mais a mudar aqui.)

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(protected)/dashboard/page.tsx"
git commit -m "feat(dashboard): card Vou receber e donut com dados do vendedor"
```

---

## Task 8: Dashboard — card "Meta do mês" por operadora (nos dois perfis)

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `calcularMetas` (Task 2), `MetaMesCard` (Task 4).

- [ ] **Step 1: Importar e carregar as metas do mês**

Modify `src/app/(protected)/dashboard/page.tsx`:

Adicionar os imports:
```tsx
import { calcularMetas } from '@/lib/calcularMetas'
import MetaMesCard from '@/components/MetaMesCard'
```

Depois de `const vendasMes = vendasMesData ?? []` (~linha 75), carregar as metas e montar o resumo:
```tsx
  // Metas do mês: empresa (admin) ou do próprio vendedor (RLS limita a leitura).
  const mesRef = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`
  let metasQ = supabase.from('metas').select('operadora, meta_valor').eq('mes_referencia', mesRef)
  metasQ = isVendedor ? metasQ.eq('vendedor_id', vendedorId) : metasQ.is('vendedor_id', null)
  const { data: metasData } = await metasQ

  const vendidoPorOperadora = Object.entries(
    vendasMes.reduce((acc: Record<string, number>, v) => {
      const op = v.operadora ?? 'Sem operadora'
      acc[op] = (acc[op] ?? 0) + (v.valor_plano ?? 0)
      return acc
    }, {}),
  ).map(([operadora, vendido]) => ({ operadora, vendido }))

  const semanasRestantes = Math.max(1, totalSemanas - semanaNum + 1)
  const resumoMeta = calcularMetas(
    (metasData ?? []) as { operadora: string; meta_valor: number }[],
    vendidoPorOperadora,
    semanasRestantes,
  )
```

Nota: se já existir `const semanasRestantes = ...` mais abaixo (na seção "Meta"), remover a duplicata para não declarar duas vezes.

- [ ] **Step 2: Substituir o card antigo de meta pelo novo**

Localizar o bloco `{/* META DO MÊS — span 4 */}` (a `<div ...>` grande, ~linhas 342-378, com "Meta do mês", a barra, o "FUNIL DO MÊS" e o "Falta ...") e substituir esse `<div>...</div>` inteiro por:

```tsx
        {/* META DO MÊS — span 4 (por operadora) */}
        <MetaMesCard resumo={resumoMeta} subtitulo={`${mesNome} · semana ${semanaNum} de ${totalSemanas}`} />
```

- [ ] **Step 3: Remover cálculos que ficaram órfãos**

Na seção "// Meta (usando vendas do mês vs meta fixa...)" (~linhas 123-128), remover as linhas agora não usadas: `metaMes`, `totalVendas`, `pctMeta`, `faltaMeta` e a duplicata de `semanasRestantes` (mantida agora no Step 1). Remover também os cálculos do "Funil" (`abordagens`, `propostas`, `vendidos`) **somente se** não forem usados em nenhum outro card. (Se o build acusar "declared but never used" ou "não usado", remover; se algum ainda for referenciado, manter.)

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: build passa, sem variáveis não usadas.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(protected)/dashboard/page.tsx"
git commit -m "feat(dashboard): card Meta do mes por operadora nos dois perfis"
```

---

## Task 9: Dashboard — card Agenda com os próximos compromissos

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Buscar os próximos compromissos**

Modify `src/app/(protected)/dashboard/page.tsx`:

Adicionar uma query "próximos" junto às outras (antes do `Promise.all`, ~linha 42), com o mesmo isolamento por vendedor:
```tsx
  let proximosQ = supabase.from('agenda').select('*')
    .gte('data_hora', inicioDia.toISOString())
    .order('data_hora', { ascending: true })
    .limit(4)
  if (isVendedor && vendedorId) proximosQ = proximosQ.eq('vendedor_id', vendedorId)
```
Incluir `proximosQ` no `Promise.all` e capturar `{ data: proximosData }`. Depois:
```tsx
  const proximos: Compromisso[] = (proximosData ?? []) as Compromisso[]
```

Para o admin, mesclar os próximos eventos do Google (janela dos próximos 7 dias):
```tsx
  let proximosAgenda: Compromisso[] = proximos
  if (!isVendedor) {
    const fim7 = new Date(agora); fim7.setDate(fim7.getDate() + 7)
    const googleProx = (await getEventosGoogleAgenda(inicioDia, fim7)).map(g => ({
      id: g.id, titulo: g.titulo, data_hora: g.data_hora,
      tipo: 'Google', status: 'Google', vendedor_id: null,
    }) as unknown as Compromisso)
    proximosAgenda = [...proximos, ...googleProx]
      .sort((a, b) => a.data_hora.localeCompare(b.data_hora))
      .slice(0, 4)
  }
```

- [ ] **Step 2: Usar os próximos no card Agenda**

No card "AGENDA — span 4" (~linha 258), trocar o subtítulo e a fonte dos itens. Substituir `hoje` por `próximos`, e trocar `agendaHoje` por `proximosAgenda` no bloco (o badge de contagem e o `.slice(0,4)`), e o texto do estado vazio:
- Subtítulo: `<p ...>próximos</p>`
- Badge: `{proximosAgenda.length > 0 && <span ...>{proximosAgenda.length}</span>}`
- Vazio: `? <p ...>Nenhum compromisso agendado</p>`
- Lista: `: <div className="space-y-2">{proximosAgenda.slice(0, 4).map(ev => { ... })}</div>`
- Dentro do map, mostrar dia + hora (compromissos futuros não são só de hoje). Trocar a linha do horário por:
```tsx
                      <div><b style={{ color: '#2d1f4e' }}>{fmtDia(ev.data_hora)} {fmtHora(ev.data_hora)}</b> <span style={{ color: '#5a4e3c' }}>— {ev.titulo}</span>{ehGoogle && <span className="text-xs ml-1" style={{ color: '#4285F4' }}>· Google</span>}</div>
```
(`ehGoogle` continua sendo `String(ev.id).startsWith('google-')`.)

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/dashboard/page.tsx"
git commit -m "feat(dashboard): card Agenda mostra os proximos compromissos"
```

---

## Task 10: Verificação end-to-end + deploy

**Files:** nenhum (verificação manual).

- [ ] **Step 1: Rodar todos os testes**

Run: `npm test`
Expected: PASS — incluindo `calcularMetas`, `vouReceberVendedor`, `MetaMesCard` e os testes já existentes.

- [ ] **Step 2: Build final**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 3: Verificação manual (usar a skill `verify` / rodar `npm run dev`)**

Como admin (Andreia):
- Meu Dia: card "Vou receber" igual ao de hoje (empresa); card "Meta do mês" no formato por operadora; Agenda mostra próximos compromissos.
- Gestão: definir metas da empresa por operadora → salvar → o card "Meta do mês" reflete no Meu Dia.
- Gestão → abrir um vendedor → definir metas dele por operadora → salvar.

Como vendedor (logar numa conta de vendedor, ou impersonar):
- Meu Dia: "Vou receber" mostra o total dele + este mês + por operadora (bate com `/minhas-comissoes`); donut só com as vendas dele; "Meta do mês" com a meta dele; nenhum número da empresa aparece.
- Confirmar que o vendedor NÃO enxerga metas da empresa nem de outro vendedor (a meta some/zera se não houver a dele).

- [ ] **Step 4: Push e avisar sobre o Deploy**

```bash
git push origin master
```
Avisar a Andreia para: (a) aplicar a migração `20260707_metas.sql` na produção (se ainda não aplicada via MCP), e (b) dar **Deploy no cursoia** (Easypanel) — o deploy do app é manual.

---

## Self-Review (autor)

- **Cobertura do spec:**
  - "Vou receber" do vendedor → Task 3 + Task 7. ✅
  - "Meta do mês" por operadora nos dois perfis → Task 2, 4, 8. ✅
  - Donut com vendas do vendedor → Task 7 (RLS já isola; ajuste de link). ✅
  - Agenda com próximos compromissos → Task 9. ✅
  - Tabela `metas` + RLS (admin escreve, vendedor lê só a dele) → Task 1. ✅
  - Definir metas na Gestão (empresa + por vendedor), mensal → Task 5 + 6. ✅
  - Fora de escopo (lembretes, calculador V.E.N.D.A., meta semanal) → não há tasks (correto). ✅
- **Placeholders:** nenhum "TBD/TODO"; todo passo tem código ou comando concreto. ✅
- **Consistência de tipos:** `ResumoMeta`/`MetaLinha` (Task 2) usados igual em `MetaMesCard` (Task 4) e no dashboard (Task 8); `ResumoVouReceber` (Task 3) usado no dashboard (Task 7); `salvarMetas(vendedorId, mesRef, valores)` e `<MetasEditor>` com as mesmas props em Task 5/6; `mesRef` sempre `'YYYY-MM-01'`. ✅
- **Observação de risco:** Tasks 6, 8, 9 editam `dashboard/page.tsx`, `GestaoClient.tsx` e `FichaVendedor.tsx`, cujos formatos exatos de `interface Props`/JSX podem variar — cada passo indica *onde* localizar o bloco e *o que* trocar, e termina em `npm run build` para pegar qualquer divergência.
