# Integração Google Agenda (leitura) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar os compromissos da Google Agenda da Andreia (admin) na tela Agenda e no card "Agenda" do Meu Dia, só leitura, via link secreto iCal.

**Architecture:** Uma tabela `integracoes` guarda a URL secreta `.ics`. Uma lib server-side (`googleAgenda.ts`) busca e parseia o feed com `node-ical`, normalizando os eventos para o formato `Compromisso` já usado na UI (com `origem:'google'`). As páginas server (agenda e dashboard) mesclam esses eventos com os do banco antes de renderizar; a UI marca os do Google visualmente e bloqueia edição.

**Tech Stack:** Next.js 16 (custom fork), TypeScript, Supabase (Postgres + RLS), Tailwind, `node-ical` (novo).

## Global Constraints

- ⚠️ `crm-seguros/AGENTS.md`: "This is NOT the Next.js you know" — ler os guias em `node_modules/next/dist/docs/` antes de escrever código Next; respeitar avisos de deprecação.
- Deploy é MANUAL no Easypanel (serviço **cursoia**) após `git push origin master`. Ver [[project-deploy-easypanel]].
- Supabase project: `lctacientnedmarsbitt`. Migrations via MCP `apply_migration`.
- A URL secreta é SEGREDO: só admin lê/escreve (RLS), só usada no servidor, nunca enviada ao client nem logada.
- Cores/estilo: seguir o padrão do sistema (roxo #2d1f4e, dourado #b89a6a, bordas #e8e4dd).

---

## File Structure

- **Create** `supabase migration` → tabela `public.integracoes` (chave/valor + RLS admin).
- **Create** `src/lib/googleAgenda.ts` → `getEventosGoogleAgenda(inicio, fim)`: lê a URL salva, faz fetch+parse, retorna `EventoGoogle[]`.
- **Create** `src/app/actions/integracoes.ts` → server actions `salvarGoogleIcalUrl(url)`, `getGoogleIcalUrl()`, `testarGoogleIcal(url)` (admin only).
- **Modify** `src/app/(protected)/configuracoes/page.tsx` (+ um componente client `IntegracaoAgendaCard.tsx`) → UI pra colar/salvar/testar o link.
- **Modify** `src/app/(protected)/agenda/page.tsx` → mesclar eventos do Google nos `eventos` passados ao `AgendaClient`.
- **Modify** `src/components/AgendaClient.tsx` (+ AgendaDia/Semana/Mes conforme necessário) → renderizar evento Google com etiqueta e sem edição.
- **Modify** `src/app/(protected)/dashboard/page.tsx` → incluir eventos Google de hoje no card "Agenda".
- **Create** `src/lib/__tests__/googleAgenda.test.ts` → teste do parser com um `.ics` de exemplo.

---

## Task 1: Tabela `integracoes`

**Files:**
- Create: migration Supabase `criar_tabela_integracoes`

**Interfaces:**
- Produces: tabela `public.integracoes(id uuid pk, chave text unique, valor text, ativo bool default true, atualizado_em timestamptz default now())`.

- [ ] **Step 1: Aplicar a migration** (via MCP `apply_migration`, name `criar_tabela_integracoes`)

```sql
create table if not exists public.integracoes (
  id uuid primary key default gen_random_uuid(),
  chave text unique not null,
  valor text,
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);
alter table public.integracoes enable row level security;
create policy integracoes_admin on public.integracoes
  for all using (meu_perfil() = 'admin') with check (meu_perfil() = 'admin');
```

- [ ] **Step 2: Verificar** — `select * from public.integracoes;` retorna 0 linhas, sem erro; `select policyname from pg_policies where tablename='integracoes';` mostra `integracoes_admin`.

- [ ] **Step 3: Commit** (nada de código ainda; a migration fica registrada no Supabase). Seguir pro Task 2.

---

## Task 2: Lib de leitura do feed iCal

**Files:**
- Create: `src/lib/googleAgenda.ts`
- Test: `src/lib/__tests__/googleAgenda.test.ts`

**Interfaces:**
- Produces:
  - `type EventoGoogle = { id: string; titulo: string; data_hora: string /* ISO */; data_fim: string | null; diaInteiro: boolean; local: string | null }`
  - `parseIcs(ics: string, inicio: Date, fim: Date): EventoGoogle[]` (pura, testável)
  - `getEventosGoogleAgenda(inicio: Date, fim: Date): Promise<EventoGoogle[]>` (lê URL do banco, fetch, chama parseIcs; retorna `[]` em qualquer erro).

- [ ] **Step 1: Instalar node-ical**

Run: `npm install node-ical` (na pasta `crm-seguros`). Confirmar que entra no `package.json`.

- [ ] **Step 2: Escrever o teste do parser** (`src/lib/__tests__/googleAgenda.test.ts`)

```ts
import { parseIcs } from '../googleAgenda'

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:evt-1@google.com
SUMMARY:Reunião cliente João
DTSTART:20260706T140000Z
DTEND:20260706T150000Z
LOCATION:Escritório
END:VEVENT
END:VCALENDAR`

test('extrai evento dentro do período', () => {
  const eventos = parseIcs(ICS, new Date('2026-07-06T00:00:00Z'), new Date('2026-07-06T23:59:59Z'))
  expect(eventos).toHaveLength(1)
  expect(eventos[0].titulo).toBe('Reunião cliente João')
  expect(eventos[0].local).toBe('Escritório')
})

test('ignora evento fora do período', () => {
  const eventos = parseIcs(ICS, new Date('2026-07-10T00:00:00Z'), new Date('2026-07-11T00:00:00Z'))
  expect(eventos).toHaveLength(0)
})
```

- [ ] **Step 3: Rodar o teste e ver falhar** — `npx jest googleAgenda -t "extrai evento"` → FAIL (`parseIcs` não existe).

- [ ] **Step 4: Implementar `googleAgenda.ts`**

```ts
import * as ical from 'node-ical'
import { createAdminClient } from '@/lib/supabase/admin'

export type EventoGoogle = {
  id: string
  titulo: string
  data_hora: string
  data_fim: string | null
  diaInteiro: boolean
  local: string | null
}

export function parseIcs(ics: string, inicio: Date, fim: Date): EventoGoogle[] {
  const data = ical.sync.parseICS(ics)
  const out: EventoGoogle[] = []
  for (const k of Object.keys(data)) {
    const ev = data[k]
    if (!ev || ev.type !== 'VEVENT' || !ev.start) continue
    const start = new Date(ev.start as Date)
    if (start < inicio || start > fim) continue // (eventos recorrentes: expandir no futuro; YAGNI agora)
    out.push({
      id: 'google-' + (ev.uid || k),
      titulo: String(ev.summary ?? '(sem título)'),
      data_hora: start.toISOString(),
      data_fim: ev.end ? new Date(ev.end as Date).toISOString() : null,
      diaInteiro: (ev.datetype as string) === 'date',
      local: ev.location ? String(ev.location) : null,
    })
  }
  return out.sort((a, b) => a.data_hora.localeCompare(b.data_hora))
}

export async function getEventosGoogleAgenda(inicio: Date, fim: Date): Promise<EventoGoogle[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('integracoes').select('valor, ativo').eq('chave', 'google_ical_url').maybeSingle()
    if (!data?.ativo || !data.valor) return []
    const url = data.valor.replace(/^webcal:\/\//i, 'https://')
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return []
    return parseIcs(await res.text(), inicio, fim)
  } catch (e) {
    console.error('[googleAgenda] falha ao ler feed:', e)
    return []
  }
}
```

- [ ] **Step 5: Rodar os testes e ver passar** — `npx jest googleAgenda` → PASS (2 testes).

- [ ] **Step 6: Commit** — `git add src/lib/googleAgenda.ts src/lib/__tests__/googleAgenda.test.ts package.json package-lock.json && git commit -m "feat: leitura do feed iCal da Google Agenda"`

---

## Task 3: Config em /configuracoes (colar/salvar/testar o link)

**Files:**
- Create: `src/app/actions/integracoes.ts`
- Create: `src/components/IntegracaoAgendaCard.tsx`
- Modify: `src/app/(protected)/configuracoes/page.tsx` (renderizar o card)

**Interfaces:**
- Consumes: tabela `integracoes` (Task 1), padrão de admin client de `actions/usuarios.ts`.
- Produces: `salvarGoogleIcalUrl(formData)`, `getGoogleIcalUrl(): Promise<string>`, `testarGoogleIcal(url): Promise<{ ok: boolean; qtd?: number; erro?: string }>`.

- [ ] **Step 1: Escrever as server actions** (`src/app/actions/integracoes.ts`) — guardar/ler/testar. Guard `perfil==='admin'` (padrão de `usuarios.ts`). `testarGoogleIcal` faz fetch+`parseIcs` num range de ±30 dias e retorna a contagem.

```ts
'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import { parseIcs } from '@/lib/googleAgenda'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const u = await getUsuarioAtual()
  if (!u || u.perfil !== 'admin') throw new Error('Não autorizado')
}

export async function getGoogleIcalUrl(): Promise<string> {
  await assertAdmin()
  const admin = createAdminClient()
  const { data } = await admin.from('integracoes').select('valor').eq('chave', 'google_ical_url').maybeSingle()
  return data?.valor ?? ''
}

export async function salvarGoogleIcalUrl(formData: FormData) {
  await assertAdmin()
  const url = String(formData.get('url') ?? '').trim()
  const admin = createAdminClient()
  await admin.from('integracoes').upsert(
    { chave: 'google_ical_url', valor: url || null, ativo: !!url, atualizado_em: new Date().toISOString() },
    { onConflict: 'chave' }
  )
  revalidatePath('/agenda'); revalidatePath('/dashboard'); revalidatePath('/configuracoes')
}

export async function testarGoogleIcal(url: string): Promise<{ ok: boolean; qtd?: number; erro?: string }> {
  await assertAdmin()
  try {
    const res = await fetch(url.replace(/^webcal:\/\//i, 'https://'), { cache: 'no-store' })
    if (!res.ok) return { ok: false, erro: `Erro ${res.status} ao acessar o link` }
    const hoje = new Date()
    const ini = new Date(hoje); ini.setDate(hoje.getDate() - 30)
    const fim = new Date(hoje); fim.setDate(hoje.getDate() + 60)
    return { ok: true, qtd: parseIcs(await res.text(), ini, fim).length }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}
```

- [ ] **Step 2: Criar o card client** (`src/components/IntegracaoAgendaCard.tsx`) — input pra colar a URL, botão Salvar (chama `salvarGoogleIcalUrl`), botão Testar (chama `testarGoogleIcal`, mostra "✓ X compromissos encontrados" ou o erro), e um passo-a-passo curto (Google Agenda → Configurações → sua agenda → "Endereço secreto no formato iCal"). Estilo: card branco borda `#e8e4dd`, radius 12, no padrão do sistema.

- [ ] **Step 3: Renderizar o card em `configuracoes/page.tsx`** — importar e adicionar `<IntegracaoAgendaCard urlAtual={await getGoogleIcalUrl()} />` numa seção "Integrações".

- [ ] **Step 4: Verificar no app** — build local (`npm run build` OU rodar dev). Entrar em /configuracoes como admin: colar uma URL iCal de teste (a própria do Google), clicar Testar → mostra a contagem; Salvar → persiste (recarregar mantém a URL). Confirmar via `select valor from integracoes where chave='google_ical_url'`.

- [ ] **Step 5: Commit** — `git add src/app/actions/integracoes.ts src/components/IntegracaoAgendaCard.tsx "src/app/(protected)/configuracoes/page.tsx" && git commit -m "feat: tela de config da integracao Google Agenda"`

---

## Task 4: Mesclar eventos do Google na tela Agenda

**Files:**
- Modify: `src/app/(protected)/agenda/page.tsx`
- Modify: `src/components/AgendaClient.tsx` (marcar visualmente + bloquear edição dos eventos google)

**Interfaces:**
- Consumes: `getEventosGoogleAgenda` (Task 2). Tipo `Compromisso` de `@/lib/types`.
- Produces: eventos com `id` começando em `google-` e um campo `origem:'google'` no objeto passado ao `AgendaClient`.

- [ ] **Step 1: No `agenda/page.tsx`, buscar e mesclar** — só quando `perfil==='admin'`. Converter `EventoGoogle` → objeto no formato `Compromisso` (campos: `id`, `titulo`, `data_hora`, `tipo:'Google'`, `status:'Google'`, `vendedor_id:null`, `origem:'google'`). Período: mês visível ±. Simplest: buscar um range amplo (mês atual ±1 mês) e deixar o client filtrar por visão.

```ts
// depois de obter `eventos` do banco:
let eventosGoogle: Compromisso[] = []
if (usuario?.perfil === 'admin') {
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)
  const gs = await getEventosGoogleAgenda(ini, fim)
  eventosGoogle = gs.map(g => ({
    id: g.id, titulo: g.titulo, data_hora: g.data_hora,
    tipo: 'Google', status: 'Google', vendedor_id: null,
    origem: 'google', descricao: g.local ?? null,
  }) as unknown as Compromisso)
}
const todos = [...(eventos ?? []), ...eventosGoogle]
```

- [ ] **Step 2: No `AgendaClient` e nas visões, tratar `origem==='google'`** — cor fixa (ex `#4285F4` azul Google) + rótulo "Google"; ao clicar, NÃO abrir o `EventoModal` de edição (eventos do Google são read-only). Guardar `origem` no tipo local ou checar `String(ev.id).startsWith('google-')`.

- [ ] **Step 3: Verificar no app** — com a URL salva (Task 3), abrir /agenda como admin: os compromissos do Google aparecem junto com os do sistema, em azul/"Google", e clicar neles não abre edição. Os eventos do CRM continuam editáveis.

- [ ] **Step 4: Commit** — `git add "src/app/(protected)/agenda/page.tsx" src/components/AgendaClient.tsx && git commit -m "feat: mostra eventos da Google Agenda na tela Agenda"`

---

## Task 5: Eventos do Google no card "Agenda" do Meu Dia

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `getEventosGoogleAgenda` (Task 2). Já existe `eventosHoje: Compromisso[]` no dashboard (card "Agenda").

- [ ] **Step 1: Buscar os eventos do Google de hoje e mesclar em `eventosHoje`** — só admin. Range = início/fim do dia (já existem `inicioDia`/`fimDia`). Mapear pro formato usado no card (precisa de `data_hora` + `titulo`). Ordenar por hora.

```ts
if (!isVendedor) {
  const gs = await getEventosGoogleAgenda(inicioDia, fimDia)
  const googleHoje = gs.map(g => ({ id: g.id, titulo: g.titulo, data_hora: g.data_hora, tipo: 'Google', status: 'Google', vendedor_id: null } as unknown as Compromisso))
  // mesclar e reordenar
  ;(eventosHoje as Compromisso[]).push(...googleHoje)
  eventosHoje.sort((a, b) => a.data_hora.localeCompare(b.data_hora))
}
```

- [ ] **Step 2: (opcional) marcar visualmente no card** — um pontinho azul pros itens Google, pra diferenciar dos compromissos do CRM (a bolinha do card já existe; usar cor azul quando `String(ev.id).startsWith('google-')`).

- [ ] **Step 3: Verificar no app** — abrir Meu Dia como admin: os compromissos do Google de hoje aparecem no card "Agenda", junto com os do sistema, na ordem certa.

- [ ] **Step 4: Commit** — `git add "src/app/(protected)/dashboard/page.tsx" && git commit -m "feat: eventos da Google Agenda no card do Meu Dia"`

---

## Self-Review (cobertura do spec)

- Guardar URL secreta → Task 1 (tabela) + Task 3 (salvar). ✅
- Ler/normalizar feed → Task 2. ✅
- Mostrar na Agenda → Task 4. ✅
- Mostrar no Meu Dia → Task 5. ✅
- Tela de config + testar → Task 3. ✅
- Só leitura / não editar Google → Task 4 Step 2. ✅
- Erro não quebra tela → Task 2 (`getEventosGoogleAgenda` retorna `[]`). ✅
- Segurança (RLS admin, só server) → Task 1 (policy) + Task 2/3 (admin client, server-only). ✅
- Não-objetivos (sync, escrita, vendedor) → fora do plano. ✅

## Notas de verificação
- Não há suite de testes de UI; a verificação das Tasks 3–5 é **manual no app** (rodar `npm run build`/dev e conferir). O único teste automatizado é o do parser (Task 2), que é a peça de lógica pura.
- Depois de tudo: `git push origin master` → Andreia dá **Deploy no cursoia** → cola o link secreto em Configurações.
