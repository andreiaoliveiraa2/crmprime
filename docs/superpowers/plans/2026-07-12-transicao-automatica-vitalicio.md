# Transição Automática Venda → Vitalício — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quando o admin marca a última parcela de comissão como "Recebido", o cliente vira fase `vitalicio` sozinho, com valor mensal estimado calculado da regra da operadora.

**Architecture:** Lógica de decisão em funções puras (`src/lib/transicaoVitalicio.ts`, testadas no Jest), I/O numa server action (`src/app/actions/transicaoVitalicio.ts`, padrão de `actions/clientes.ts` com verificação de acesso via RLS + `createAdminClient`), chamada nos dois pontos de baixa do Financeiro (`ContasTab.marcarRecebido` e `ComissoesTab.toggleStatusEmpresa`).

**Tech Stack:** Next.js server actions, Supabase (tabelas `comissoes`, `vendas`, `clientes`, `regras_comissao`), Jest.

**Spec:** `docs/superpowers/specs/2026-07-12-transicao-automatica-vitalicio-design.md`

## Global Constraints

- Regra da virada: o cliente só vira quando TODAS as comissões `tipo='parcela'` de TODAS as vendas `status='Ativo'` dele estão com `status_empresa` em (`Recebido`, `Direto`) — e o cliente está `fase_cliente='ativo'` e `status='Ativo'`. Sem parcela nenhuma → NÃO vira.
- Ao virar, NÃO sobrescrever `vitalicio_valor_estimado` / `vitalicio_dia_previsto` / `vitalicio_inicio` que já estejam preenchidos no cliente.
- A venda NÃO é cancelada nem alterada; nenhuma comissão é alterada.
- Des-baixa (Recebido → Pendente) NÃO reverte a fase (decisão da Andreia).
- Erro na transição NUNCA bloqueia a baixa: os callers só fazem `console.error`.
- O worktree tem uma alteração NÃO relacionada pendente em `src/app/api/chat/route.ts`. NUNCA use `git add -A`/`git add .` — sempre stage por caminho explícito.
- Testes: `npx jest <arquivo>`. Commits em português no estilo do histórico, terminando com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Lib pura `transicaoVitalicio.ts`

**Files:**
- Create: `src/lib/transicaoVitalicio.ts`
- Test: `__tests__/transicaoVitalicio.test.ts` (novo)

**Interfaces:**
- Consumes: tipo `Comissao` de `@/lib/types` (campos usados: `tipo: 'parcela' | 'vitalicio'`, `status_empresa: 'Pendente' | 'Recebido' | 'Direto' | 'Cancelado'`).
- Produces (usadas na Task 2):
  - `todasParcelasRecebidas(comissoes: ParcelaStatus[]): boolean` com `type ParcelaStatus = Pick<Comissao, 'tipo' | 'status_empresa'>`
  - `calcularVitalicioInicial(p: { valorPlano: number | null; percentualVitalicio: number | null; diaVencimentoBoleto: number | null; hoje: string }): { vitalicio_valor_estimado: number | null; vitalicio_dia_previsto: number; vitalicio_inicio: string }`

- [ ] **Step 1: Write the failing tests**

Criar `__tests__/transicaoVitalicio.test.ts`:

```ts
import { todasParcelasRecebidas, calcularVitalicioInicial } from '@/lib/transicaoVitalicio'

const parcela = (status_empresa: 'Pendente' | 'Recebido' | 'Direto' | 'Cancelado') =>
  ({ tipo: 'parcela' as const, status_empresa })

describe('todasParcelasRecebidas', () => {
  it('true quando todas Recebido', () => {
    expect(todasParcelasRecebidas([parcela('Recebido'), parcela('Recebido')])).toBe(true)
  })

  it('true com mistura Recebido + Direto (adesão odonto)', () => {
    expect(todasParcelasRecebidas([parcela('Direto'), parcela('Recebido')])).toBe(true)
  })

  it('false quando alguma Pendente', () => {
    expect(todasParcelasRecebidas([parcela('Recebido'), parcela('Pendente')])).toBe(false)
  })

  it('false quando alguma Cancelado (não conta como recebida)', () => {
    expect(todasParcelasRecebidas([parcela('Recebido'), parcela('Cancelado')])).toBe(false)
  })

  it('false com lista vazia (sem parcela não vira)', () => {
    expect(todasParcelasRecebidas([])).toBe(false)
  })

  it('ignora comissões tipo vitalicio na verificação', () => {
    expect(todasParcelasRecebidas([
      parcela('Recebido'),
      { tipo: 'vitalicio' as const, status_empresa: 'Pendente' as const },
    ])).toBe(true)
  })
})

describe('calcularVitalicioInicial', () => {
  it('calcula o valor pela regra da operadora (% vitalício × valor do plano)', () => {
    const r = calcularVitalicioInicial({ valorPlano: 350, percentualVitalicio: 2, diaVencimentoBoleto: 15, hoje: '2026-07-12' })
    expect(r).toEqual({ vitalicio_valor_estimado: 7, vitalicio_dia_previsto: 15, vitalicio_inicio: '2026-07-12' })
  })

  it('arredonda pra 2 casas', () => {
    const r = calcularVitalicioInicial({ valorPlano: 333.33, percentualVitalicio: 2, diaVencimentoBoleto: 15, hoje: '2026-07-12' })
    expect(r.vitalicio_valor_estimado).toBe(6.67)
  })

  it('sem % vitalício (> 0) na regra → valor null', () => {
    expect(calcularVitalicioInicial({ valorPlano: 350, percentualVitalicio: null, diaVencimentoBoleto: 15, hoje: '2026-07-12' }).vitalicio_valor_estimado).toBeNull()
    expect(calcularVitalicioInicial({ valorPlano: 350, percentualVitalicio: 0, diaVencimentoBoleto: 15, hoje: '2026-07-12' }).vitalicio_valor_estimado).toBeNull()
  })

  it('sem valor do plano → valor null', () => {
    expect(calcularVitalicioInicial({ valorPlano: null, percentualVitalicio: 2, diaVencimentoBoleto: 15, hoje: '2026-07-12' }).vitalicio_valor_estimado).toBeNull()
  })

  it('sem dia de vencimento do boleto → fallback 10', () => {
    expect(calcularVitalicioInicial({ valorPlano: 350, percentualVitalicio: 2, diaVencimentoBoleto: null, hoje: '2026-07-12' }).vitalicio_dia_previsto).toBe(10)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/transicaoVitalicio.test.ts`
Expected: FAIL — "Cannot find module '@/lib/transicaoVitalicio'"

- [ ] **Step 3: Write the implementation**

Criar `src/lib/transicaoVitalicio.ts`:

```ts
import { Comissao } from '@/lib/types'

export type ParcelaStatus = Pick<Comissao, 'tipo' | 'status_empresa'>

// Todas as parcelas recebidas? (Direto = adesão odonto paga direto ao vendedor.)
// Lista sem nenhuma parcela não vira: cliente sem comissão gerada fica como está.
export function todasParcelasRecebidas(comissoes: ParcelaStatus[]): boolean {
  const parcelas = comissoes.filter(c => c.tipo === 'parcela')
  if (parcelas.length === 0) return false
  return parcelas.every(c => c.status_empresa === 'Recebido' || c.status_empresa === 'Direto')
}

interface VitalicioInicialParams {
  valorPlano: number | null
  percentualVitalicio: number | null
  diaVencimentoBoleto: number | null
  hoje: string // 'YYYY-MM-DD'
}

export function calcularVitalicioInicial(p: VitalicioInicialParams): {
  vitalicio_valor_estimado: number | null
  vitalicio_dia_previsto: number
  vitalicio_inicio: string
} {
  const temCalculo = p.percentualVitalicio != null && p.percentualVitalicio > 0 && p.valorPlano != null
  return {
    vitalicio_valor_estimado: temCalculo
      ? Math.round(p.valorPlano! * (p.percentualVitalicio! / 100) * 100) / 100
      : null,
    vitalicio_dia_previsto: p.diaVencimentoBoleto ?? 10,
    vitalicio_inicio: p.hoje,
  }
}
```

(O valor é valor_plano × percentual/100, arredondado a 2 casas via `Math.round(x * 100) / 100`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/transicaoVitalicio.test.ts`
Expected: PASS (12 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/transicaoVitalicio.ts __tests__/transicaoVitalicio.test.ts
git commit -m "feat(vitalicio): logica pura da transicao automatica (parcelas + calculo inicial)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Server action `verificarTransicaoVitalicio`

**Files:**
- Create: `src/app/actions/transicaoVitalicio.ts`

**Interfaces:**
- Consumes: `todasParcelasRecebidas` e `calcularVitalicioInicial` da Task 1; `createClient` de `@/lib/supabase/server`; `createAdminClient` de `@/lib/supabase/admin` (mesmos imports de `src/app/actions/clientes.ts`).
- Produces (usada na Task 3): `verificarTransicaoVitalicio(comissaoId: string): Promise<string | null>` — `null` = ok/nada a fazer; `string` = mensagem de erro.

Sem teste unitário próprio: a decisão está toda na lib pura (Task 1); a action é I/O fino, seguindo o padrão do repo (`actions/clientes.ts` também não tem teste). A verificação de comportamento é o teste manual da Task 4.

- [ ] **Step 1: Write the implementation**

Criar `src/app/actions/transicaoVitalicio.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { todasParcelasRecebidas, calcularVitalicioInicial } from '@/lib/transicaoVitalicio'

// Chamada após a baixa (status_empresa='Recebido') de uma comissão tipo 'parcela'.
// Vira o cliente pra fase vitalício quando todas as parcelas de todas as vendas
// ativas dele foram recebidas. Retorno de erro não deve bloquear a baixa.
export async function verificarTransicaoVitalicio(comissaoId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Não autenticado'

  const admin = createAdminClient()

  const { data: comissao } = await admin
    .from('comissoes')
    .select('id, tipo, venda_id')
    .eq('id', comissaoId)
    .maybeSingle()
  if (!comissao || comissao.tipo !== 'parcela' || !comissao.venda_id) return null

  const { data: venda } = await admin
    .from('vendas')
    .select('cliente_id')
    .eq('id', comissao.venda_id)
    .maybeSingle()
  if (!venda?.cliente_id) return null

  // Ownership via RLS: se o SELECT do cliente falhar, o caller não tem acesso.
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, status, fase_cliente, operadora, valor_plano, dia_vencimento_boleto, vitalicio_valor_estimado, vitalicio_dia_previsto, vitalicio_inicio')
    .eq('id', venda.cliente_id)
    .maybeSingle()
  if (!cliente) return 'Sem permissão para operar neste cliente'
  if (cliente.fase_cliente !== 'ativo' || cliente.status !== 'Ativo') return null

  const { data: vendasAtivas } = await admin
    .from('vendas')
    .select('id')
    .eq('cliente_id', cliente.id)
    .eq('status', 'Ativo')
  if (!vendasAtivas || vendasAtivas.length === 0) return null

  const { data: comissoes } = await admin
    .from('comissoes')
    .select('tipo, status_empresa')
    .in('venda_id', vendasAtivas.map(v => v.id))
  if (!todasParcelasRecebidas(comissoes ?? [])) return null

  // Regra ativa mais recente da operadora (mesma query do gerarComissoes do form)
  let percentualVitalicio: number | null = null
  if (cliente.operadora) {
    const { data: regra } = await admin
      .from('regras_comissao')
      .select('percentual_vitalicio')
      .eq('operadora', cliente.operadora)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle()
    percentualVitalicio = regra?.percentual_vitalicio ?? null
  }

  const inicial = calcularVitalicioInicial({
    valorPlano: cliente.valor_plano,
    percentualVitalicio,
    diaVencimentoBoleto: cliente.dia_vencimento_boleto,
    hoje: new Date().toISOString().split('T')[0],
  })

  const { error } = await admin
    .from('clientes')
    .update({
      fase_cliente: 'vitalicio',
      vitalicio_valor_estimado: cliente.vitalicio_valor_estimado ?? inicial.vitalicio_valor_estimado,
      vitalicio_dia_previsto: cliente.vitalicio_dia_previsto ?? inicial.vitalicio_dia_previsto,
      vitalicio_inicio: cliente.vitalicio_inicio ?? inicial.vitalicio_inicio,
    })
    .eq('id', cliente.id)
  if (error) return `Erro ao virar vitalício: ${error.message}`

  return null
}
```

- [ ] **Step 2: Typecheck via build**

Run: `npm run build`
Expected: build limpo (action ainda não é chamada por ninguém — só valida tipos/imports).

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/transicaoVitalicio.ts
git commit -m "feat(vitalicio): server action verificarTransicaoVitalicio

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Chamar a action nos dois pontos de baixa

**Files:**
- Modify: `src/components/ContasTab.tsx` (função `marcarRecebido`, ~linha 330)
- Modify: `src/components/ComissoesTab.tsx` (função `toggleStatusEmpresa`, ~linha 143)

**Interfaces:**
- Consumes: `verificarTransicaoVitalicio(comissaoId)` da Task 2.
- Produces: nada.

- [ ] **Step 1: ContasTab**

Adicionar o import no topo de `src/components/ContasTab.tsx` (junto dos outros imports):

```tsx
import { verificarTransicaoVitalicio } from '@/app/actions/transicaoVitalicio'
```

Trocar a função `marcarRecebido` por:

```tsx
  async function marcarRecebido(c: Comissao) {
    await supabase.from('comissoes').update({
      status_empresa: 'Recebido',
      data_recebida_empresa: new Date().toISOString().split('T')[0],
    }).eq('id', c.id)
    // Última parcela recebida → cliente pode virar vitalício (erro não bloqueia a baixa)
    const erroTransicao = await verificarTransicaoVitalicio(c.id)
    if (erroTransicao) console.error('Transição vitalício:', erroTransicao)
    onAtualizar()
  }
```

- [ ] **Step 2: ComissoesTab**

Adicionar o mesmo import no topo de `src/components/ComissoesTab.tsx`:

```tsx
import { verificarTransicaoVitalicio } from '@/app/actions/transicaoVitalicio'
```

Trocar a função `toggleStatusEmpresa` por (só a parte final muda — des-baixa não chama nada):

```tsx
  async function toggleStatusEmpresa(comissao: Comissao) {
    if (comissao.status_empresa === 'Direto') return
    const novoStatus = comissao.status_empresa === 'Pendente' ? 'Recebido' : 'Pendente'
    const update: Record<string, string | null> = {
      status_empresa: novoStatus,
      data_recebida_empresa: novoStatus === 'Recebido' ? new Date().toISOString().split('T')[0] : null,
    }
    await supabase.from('comissoes').update(update).eq('id', comissao.id)
    if (novoStatus === 'Recebido' && comissao.tipo === 'parcela') {
      // Última parcela recebida → cliente pode virar vitalício (erro não bloqueia a baixa)
      const erroTransicao = await verificarTransicaoVitalicio(comissao.id)
      if (erroTransicao) console.error('Transição vitalício:', erroTransicao)
    }
    onAtualizar()
  }
```

- [ ] **Step 3: Rodar a suíte + build**

Run: `npx jest` e depois `npm run build`
Expected: todos os testes passam; build limpo.

- [ ] **Step 4: Commit**

```bash
git add src/components/ContasTab.tsx src/components/ComissoesTab.tsx
git commit -m "feat(vitalicio): baixa da ultima parcela vira o cliente pra vitalicio

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Verificação manual de ponta a ponta (com a Andreia ou em dados de teste)

**Files:** nenhum.

- [ ] **Step 1: Cenário feliz em ambiente local/produção**

1. Escolher (ou criar) um cliente de teste `fase_cliente='ativo'` com venda ativa e comissões parcela 1..N, operadora com regra ativa e `percentual_vitalicio > 0`.
2. No Financeiro, marcar as parcelas como Recebido uma a uma.
3. Ao marcar a ÚLTIMA: conferir em Clientes que o cliente virou fase Vitalício, com `vitalicio_valor_estimado` = valor_plano × % da regra, `vitalicio_dia_previsto` = dia do boleto (ou 10) e `vitalicio_inicio` = hoje.
4. Conferir que a venda continua `Ativo` e nenhuma comissão mudou.
5. Desmarcar uma parcela (ComissoesTab) → conferir que o cliente CONTINUA vitalício.

- [ ] **Step 2: Confirmar que nada não relacionado foi staged**

Run: `git status`
Expected: único arquivo modificado fora dos commits é `src/app/api/chat/route.ts` (pendência antiga, NÃO commitar).
