# Security Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todos os achados da auditoria de segurança: 5 críticos, 8 altos e 4 médios, eliminando escalação de privilégio, vazamento de documentos, constraint violada e bugs de lógica financeira.

**Architecture:** Correções em 3 camadas: (1) migrations SQL aplicadas no Supabase Dashboard SQL Editor e depois commitadas; (2) fixes de código em Server Components e Client Components Next.js; (3) novo `middleware.ts` para refresh de sessão. As migrations seguem o padrão `YYYYMMDD_nome.sql` já em uso no projeto.

**Tech Stack:** Next.js App Router, Supabase (Postgres + Auth + Storage + RLS), TypeScript, `@supabase/ssr`

---

## File Map

**New files:**
- `supabase/migrations/20260529_fix_comissoes_check.sql` — adiciona 'Cancelado' à CHECK constraint de comissoes
- `supabase/migrations/20260529_fix_rls_regras_comissao.sql` — restringe regras_comissao/parcelas_regra/repasse a admin
- `supabase/migrations/20260529_rls_documentos_cliente.sql` — habilita RLS em documentos_cliente + storage policies
- `supabase/migrations/20260529_rls_tabelas_admin.sql` — RLS em mapeamentos_importacao, importacoes_comissao; fix niveis_vendedor
- `supabase/migrations/20260529_fix_tipos_agenda_rls.sql` — bloqueia DELETE/INSERT/UPDATE de tipos_agenda para vendedores
- `src/middleware.ts` — refresh de sessão Supabase no Edge

**Modified files:**
- `src/app/(protected)/layout.tsx` — remove `?? 'admin'`, corrige lógica de vendedor sem registro
- `src/app/(protected)/financeiro/page.tsx` — corrige guard admin (padrão `!usuario ||`)
- `src/app/(protected)/gestao/page.tsx` — corrige guard admin
- `src/app/(protected)/configuracoes/page.tsx` — corrige guard admin
- `src/app/auth/callback/route.ts` — bloqueia open redirect via parâmetro `next`
- `src/lib/calcularComissoes.ts` — corrige overflow de `addMonth` em fim de mês
- `src/components/RegistrarVendaModal.tsx` — corrige overflow de `addMonth`; mostra erro ao usuário quando insert de comissões falha
- `src/components/ResultadoTab.tsx` — exclui comissões tipo=vitalicio da projeção (dupla contagem)
- `src/app/api/admin/convidar-vendedor/route.ts` — valida formato de email antes de enviar convite

---

## Contexto obrigatório para executar este plano

- Banco: Supabase — aplicar cada migration colando o SQL no Dashboard → SQL Editor → Run
- Dev server: `npm run dev` na raiz do projeto (porta 3000)
- Perfis disponíveis: `admin` (acesso total) e `vendedor` (dados próprios via RLS)
- Funções RLS auxiliares: `meu_perfil()` e `meu_vendedor_id()` (SECURITY DEFINER, já existem)
- `auth.role()` está sendo substituído por `to authenticated` nas policies (padrão atual do projeto)

---

## Task 1: Migration — CHECK constraint de comissoes (CRÍTICO)

**Problema:** `ClienteFormPosVenda.tsx` escreve `{ status_empresa: 'Cancelado', status_vendedor: 'Cancelado' }` ao cancelar cliente ou transitar para vitalício. A `CHECK constraint` atual aceita apenas `('Pendente', 'Recebido', 'Direto')` para `status_empresa` e `('Pendente', 'Recebido')` para `status_vendedor`. O UPDATE é silenciosamente rejeitado pelo Postgres — comissões ficam Pendente mesmo depois de cancelar o cliente.

**Files:**
- Create: `supabase/migrations/20260529_fix_comissoes_check.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```powershell
New-Item -ItemType File "supabase\migrations\20260529_fix_comissoes_check.sql"
```

- [ ] **Step 2: Escrever o SQL da migration**

Conteúdo completo do arquivo `supabase/migrations/20260529_fix_comissoes_check.sql`:

```sql
-- Adiciona 'Cancelado' às CHECK constraints de comissoes.
-- status_empresa já tinha 'Direto' (adesao_direta.sql); mantém.
-- status_vendedor nunca teve 'Cancelado'; adiciona.

alter table comissoes
  drop constraint if exists comissoes_status_empresa_check;

alter table comissoes
  add constraint comissoes_status_empresa_check
  check (status_empresa in ('Pendente', 'Recebido', 'Direto', 'Cancelado'));

alter table comissoes
  drop constraint if exists comissoes_status_vendedor_check;

alter table comissoes
  add constraint comissoes_status_vendedor_check
  check (status_vendedor in ('Pendente', 'Recebido', 'Cancelado'));
```

- [ ] **Step 3: Aplicar no Supabase Dashboard**

1. Abrir Supabase Dashboard → SQL Editor
2. Colar o SQL acima
3. Clicar em Run
4. Resultado esperado: `Success. No rows returned`

- [ ] **Step 4: Verificar no banco**

Rodar no SQL Editor:

```sql
select conname, consrc
from pg_constraint
where conrelid = 'comissoes'::regclass
  and contype = 'c';
```

Resultado esperado: ver duas linhas com `status_empresa` e `status_vendedor`, ambas incluindo `'Cancelado'`.

- [ ] **Step 5: Testar o fix em produção (manual)**

1. Abrir `http://localhost:3000`
2. Editar qualquer cliente com comissões Pendente
3. Mudar status para "Cancelado" e salvar
4. Abrir Supabase Dashboard → Table Editor → comissoes → filtrar por esse cliente
5. Resultado esperado: linhas com `status_empresa = 'Cancelado'` (não mais `'Pendente'`)

- [ ] **Step 6: Commit**

```powershell
git add supabase/migrations/20260529_fix_comissoes_check.sql
git commit -m "fix: adiciona 'Cancelado' à CHECK constraint de comissoes"
```

---

## Task 2: Migration — RLS regras_comissao / parcelas_regra / repasse_grupo_vendedor (CRÍTICO)

**Problema:** `20260522165247_fix_rls_regras_comissao.sql` substituiu as policies admin-only por `for all to authenticated using (true)`. Isso permite que qualquer vendedor autenticado crie, edite ou delete regras de comissão — possibilitando fraude (ex: aumentar seu próprio percentual).

**Files:**
- Create: `supabase/migrations/20260529_fix_rls_regras_comissao.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```powershell
New-Item -ItemType File "supabase\migrations\20260529_fix_rls_regras_comissao.sql"
```

- [ ] **Step 2: Escrever o SQL da migration**

Conteúdo completo do arquivo `supabase/migrations/20260529_fix_rls_regras_comissao.sql`:

```sql
-- Reverte policies abertas (for all to authenticated) em tabelas de configuração
-- de comissão de volta para admin-only, impedindo vendedores de alterar regras.

-- ── regras_comissao ──────────────────────────────────────────────────────────
drop policy if exists "regras_comissao_auth"  on regras_comissao;
drop policy if exists "regras_comissao_admin" on regras_comissao;

create policy "regras_comissao_admin" on regras_comissao
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- Vendedores precisam ler regras para calcular comissões na interface
create policy "regras_comissao_vendedor_leitura" on regras_comissao
  for select
  to authenticated
  using (true);

-- ── parcelas_regra ───────────────────────────────────────────────────────────
drop policy if exists "parcelas_regra_auth"  on parcelas_regra;
drop policy if exists "parcelas_regra_admin" on parcelas_regra;

create policy "parcelas_regra_admin" on parcelas_regra
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

create policy "parcelas_regra_vendedor_leitura" on parcelas_regra
  for select
  to authenticated
  using (true);

-- ── repasse_grupo_vendedor ───────────────────────────────────────────────────
drop policy if exists "repasse_grupo_vendedor_auth"  on repasse_grupo_vendedor;
drop policy if exists "repasse_grupo_vendedor_admin" on repasse_grupo_vendedor;

create policy "repasse_grupo_vendedor_admin" on repasse_grupo_vendedor
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

create policy "repasse_grupo_vendedor_vendedor_leitura" on repasse_grupo_vendedor
  for select
  to authenticated
  using (true);
```

- [ ] **Step 3: Aplicar no Supabase Dashboard**

1. Supabase Dashboard → SQL Editor
2. Colar o SQL acima → Run
3. Resultado esperado: `Success. No rows returned`

- [ ] **Step 4: Verificar**

```sql
select policyname, cmd, roles, qual
from pg_policies
where tablename in ('regras_comissao', 'parcelas_regra', 'repasse_grupo_vendedor')
order by tablename, policyname;
```

Resultado esperado: cada tabela tem exatamente 2 policies: `_admin` (ALL) e `_vendedor_leitura` (SELECT).

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/20260529_fix_rls_regras_comissao.sql
git commit -m "fix: restringe RLS de regras_comissao/parcelas_regra a admin-only"
```

---

## Task 3: Migration — RLS documentos_cliente + storage (CRÍTICO)

**Problema:** A tabela `documentos_cliente` foi criada em `20260520_cliente_campos_extra.sql` sem habilitar RLS. Qualquer vendedor autenticado pode ler documentos pessoais (CNH, certidões) de todos os clientes da corretora. O bucket `clientes-documentos` também não tem storage policies.

**Files:**
- Create: `supabase/migrations/20260529_rls_documentos_cliente.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```powershell
New-Item -ItemType File "supabase\migrations\20260529_rls_documentos_cliente.sql"
```

- [ ] **Step 2: Escrever o SQL da migration**

Conteúdo completo do arquivo `supabase/migrations/20260529_rls_documentos_cliente.sql`:

```sql
-- Habilita RLS em documentos_cliente e cria policies espelhando as de clientes:
-- admin vê tudo; vendedor vê apenas documentos de seus próprios clientes.

alter table documentos_cliente enable row level security;

create policy "documentos_admin_tudo" on documentos_cliente
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- Vendedor acessa documentos cujo cliente lhe pertence
create policy "documentos_vendedor_proprios" on documentos_cliente
  for select
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id = documentos_cliente.cliente_id
        and c.vendedor_id = meu_vendedor_id()
    )
  );

create policy "documentos_vendedor_insert" on documentos_cliente
  for insert
  with check (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id = documentos_cliente.cliente_id
        and c.vendedor_id = meu_vendedor_id()
    )
  );

create policy "documentos_vendedor_delete" on documentos_cliente
  for delete
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id = documentos_cliente.cliente_id
        and c.vendedor_id = meu_vendedor_id()
    )
  );

-- ── Storage: bucket clientes-documentos ─────────────────────────────────────
-- Admin: acesso total
insert into storage.policies (name, bucket_id, operation, definition)
values
  ('documentos_admin_select', 'clientes-documentos', 'SELECT',
   '(meu_perfil() = ''admin'')'),
  ('documentos_admin_insert', 'clientes-documentos', 'INSERT',
   '(meu_perfil() = ''admin'')'),
  ('documentos_admin_update', 'clientes-documentos', 'UPDATE',
   '(meu_perfil() = ''admin'')'),
  ('documentos_admin_delete', 'clientes-documentos', 'DELETE',
   '(meu_perfil() = ''admin'')'),
-- Vendedor: acessa apenas arquivos cujo caminho começa com cliente_id próprio
-- Convenção de path: {cliente_id}/{nome_arquivo}
  ('documentos_vendedor_select', 'clientes-documentos', 'SELECT',
   '(meu_perfil() = ''vendedor'' and exists (select 1 from clientes c where c.id::text = split_part(name, ''/'' , 1) and c.vendedor_id = meu_vendedor_id()))'),
  ('documentos_vendedor_insert', 'clientes-documentos', 'INSERT',
   '(meu_perfil() = ''vendedor'' and exists (select 1 from clientes c where c.id::text = split_part(name, ''/'' , 1) and c.vendedor_id = meu_vendedor_id()))'),
  ('documentos_vendedor_delete', 'clientes-documentos', 'DELETE',
   '(meu_perfil() = ''vendedor'' and exists (select 1 from clientes c where c.id::text = split_part(name, ''/'' , 1) and c.vendedor_id = meu_vendedor_id()))');
```

> **Nota:** Se o storage policy SQL acima falhar (o schema `storage.policies` varia por versão do Supabase), criar as políticas pela UI: Supabase Dashboard → Storage → clientes-documentos → Policies. Criar 2 políticas: (1) Admin: `meu_perfil() = 'admin'`, todas as operações; (2) Vendedor: `meu_perfil() = 'vendedor'`, SELECT/INSERT/DELETE com a condição de `split_part` acima.

- [ ] **Step 3: Aplicar no Supabase Dashboard**

1. Supabase Dashboard → SQL Editor
2. Colar apenas a parte de `documentos_cliente` (até o comentário de Storage)
3. Run → Resultado esperado: `Success. No rows returned`
4. Para o storage: verificar Dashboard → Storage → Policies → aplicar via UI se o SQL direto falhar

- [ ] **Step 4: Verificar RLS da tabela**

```sql
select relname, relrowsecurity
from pg_class
where relname = 'documentos_cliente';
```

Resultado esperado: `relrowsecurity = true`

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/20260529_rls_documentos_cliente.sql
git commit -m "fix: habilita RLS em documentos_cliente e storage policies"
```

---

## Task 4: Migration — RLS mapeamentos_importacao / importacoes_comissao / niveis_vendedor (ALTO + MÉDIO)

**Problema 1:** `mapeamentos_importacao` e `importacoes_comissao` foram criadas em `20260520_financeiro.sql` sem RLS. Vendedores podem ler/alterar mapeamentos de importação de extratos.

**Problema 2:** `niveis_vendedor` tem policies abertas para INSERT/UPDATE/DELETE a qualquer usuário autenticado — vendedor pode criar seu próprio nível ou editar os existentes.

**Files:**
- Create: `supabase/migrations/20260529_rls_tabelas_admin.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```powershell
New-Item -ItemType File "supabase\migrations\20260529_rls_tabelas_admin.sql"
```

- [ ] **Step 2: Escrever o SQL da migration**

Conteúdo completo do arquivo `supabase/migrations/20260529_rls_tabelas_admin.sql`:

```sql
-- ── mapeamentos_importacao: habilita RLS, admin-only ─────────────────────────
alter table mapeamentos_importacao enable row level security;

create policy "mapeamentos_admin" on mapeamentos_importacao
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- ── importacoes_comissao: habilita RLS, admin-only ───────────────────────────
alter table importacoes_comissao enable row level security;

create policy "importacoes_admin" on importacoes_comissao
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- ── niveis_vendedor: corrige policies (somente admin pode escrever) ──────────
-- Remove as policies abertas para todos os autenticados
drop policy if exists "auth_insert_niveis_vendedor" on niveis_vendedor;
drop policy if exists "auth_update_niveis_vendedor" on niveis_vendedor;
drop policy if exists "auth_delete_niveis_vendedor" on niveis_vendedor;

-- Adiciona policy admin para escrita
create policy "niveis_vendedor_admin_escrita" on niveis_vendedor
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- Mantém leitura para todos autenticados (policy auth_select_niveis_vendedor já existe)
```

- [ ] **Step 3: Aplicar no Supabase Dashboard**

1. Supabase Dashboard → SQL Editor → colar SQL → Run
2. Resultado esperado: `Success. No rows returned`

- [ ] **Step 4: Verificar niveis_vendedor**

```sql
select policyname, cmd
from pg_policies
where tablename = 'niveis_vendedor'
order by policyname;
```

Resultado esperado: exatamente 2 policies — `auth_select_niveis_vendedor` (SELECT) e `niveis_vendedor_admin_escrita` (ALL).

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/20260529_rls_tabelas_admin.sql
git commit -m "fix: habilita RLS em mapeamentos/importacoes; corrige niveis_vendedor"
```

---

## Task 5: Migration — tipos_agenda DELETE bloqueado (ALTO)

**Problema:** `20260523_rls_permissoes.sql` tem `create policy "tipos_agenda_todos" on tipos_agenda for all using (auth.role() = 'authenticated')`. A policy `for all` inclui DELETE, permitindo que qualquer vendedor delete tipos de agenda do sistema.

**Files:**
- Create: `supabase/migrations/20260529_fix_tipos_agenda_rls.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```powershell
New-Item -ItemType File "supabase\migrations\20260529_fix_tipos_agenda_rls.sql"
```

- [ ] **Step 2: Escrever o SQL da migration**

Conteúdo completo do arquivo `supabase/migrations/20260529_fix_tipos_agenda_rls.sql`:

```sql
-- Remove policy "for all" que permite DELETE de tipos_agenda por qualquer usuário.
-- Mantém apenas leitura para autenticados; escrita fica só para admin.

drop policy if exists "tipos_agenda_todos"   on tipos_agenda;
drop policy if exists "tipos_agenda_leitura" on tipos_agenda;
drop policy if exists "tipos_agenda_admin"   on tipos_agenda;

-- Leitura para todos autenticados (necessário para exibir lista de tipos no form)
create policy "tipos_agenda_leitura" on tipos_agenda
  for select
  to authenticated
  using (true);

-- Escrita exclusiva para admin
create policy "tipos_agenda_admin" on tipos_agenda
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');
```

- [ ] **Step 3: Aplicar no Supabase Dashboard**

1. SQL Editor → colar SQL → Run
2. Resultado esperado: `Success. No rows returned`

- [ ] **Step 4: Verificar**

```sql
select policyname, cmd
from pg_policies
where tablename = 'tipos_agenda';
```

Resultado esperado: 2 policies — `tipos_agenda_leitura` (SELECT) e `tipos_agenda_admin` (ALL).

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/20260529_fix_tipos_agenda_rls.sql
git commit -m "fix: bloqueia DELETE de tipos_agenda para vendedores"
```

---

## Task 6: Código — layout.tsx `?? 'admin'` e redirecionamento (CRÍTICO)

**Problema 1:** `const perfil = usuario?.perfil ?? 'admin'` na linha 24 de `src/app/(protected)/layout.tsx`. Se `getUsuarioAtual()` retornar `null` (usuário Auth sem registro em `usuarios`), ele recebe perfil `admin` silenciosamente.

**Problema 2:** `user.user_metadata?.vendedor_id` é user-editable — qualquer usuário pode definir um `vendedor_id` em seus metadados para forçar o redirecionamento para `/completar-perfil` e reivindicar o cadastro de outro vendedor.

**Files:**
- Modify: `src/app/(protected)/layout.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Arquivo: `src/app/(protected)/layout.tsx`

Conteúdo atual relevante (linhas 17-32):

```typescript
  if (!usuario) {
    // Só redireciona para completar-perfil se for vendedor convidado
    const vendedorId = user.user_metadata?.vendedor_id
    if (vendedorId) redirect('/completar-perfil')
    // Admin sem registro em usuarios → usa defaults (não entra em loop)
  }

  const perfil = usuario?.perfil ?? 'admin'
  const nome   = usuario?.nome ?? user.email ?? 'Usuário'
```

- [ ] **Step 2: Aplicar o fix**

Substituir as linhas 17-32 pelo seguinte. O arquivo começa na linha 1:

```typescript
  if (!usuario) {
    // Vendedor convidado: tem vendedor_id em user_metadata → completar perfil
    // NOTA: user_metadata é user-editable; a proteção real é na página completar-perfil
    // (valida se vendedor existe E não tem registro ainda)
    const vendedorId = user.user_metadata?.vendedor_id
    if (vendedorId) redirect('/completar-perfil')
    // Usuário Auth sem registro em usuarios e sem vendedor_id → estado inválido
    redirect('/login?erro=conta-sem-perfil')
  }

  const perfil = usuario.perfil
  const nome   = usuario.nome
```

Resultado final do arquivo `src/app/(protected)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nome, perfil, vendedor_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuario) {
    const vendedorId = user.user_metadata?.vendedor_id
    if (vendedorId) redirect('/completar-perfil')
    redirect('/login?erro=conta-sem-perfil')
  }

  const perfil = usuario.perfil
  const nome   = usuario.nome

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f4f1ec' }}>
      <Sidebar perfil={perfil} nome={nome} />
      <main className="flex-1 md:ml-64 print:ml-0">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Verificar que o servidor compila**

```powershell
# No terminal onde o dev server está rodando, verificar se não há erro de TypeScript
# Se o servidor não estiver rodando:
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

Resultado esperado: sem erros de TypeScript.

- [ ] **Step 4: Testar manualmente**

1. `npm run dev`
2. Abrir `http://localhost:3000` logado como admin → deve funcionar normalmente
3. (Se possível) Logar com uma conta que não tem registro em `usuarios` → deve redirecionar para `/login?erro=conta-sem-perfil`

- [ ] **Step 5: Commit**

```powershell
git add src/app/(protected)/layout.tsx
git commit -m "fix: remove fallback admin para usuarios sem registro no layout"
```

---

## Task 7: Código — Guards admin em financeiro / gestao / configuracoes (CRÍTICO)

**Problema:** As 3 páginas usam `if (usuario !== null && usuario.perfil !== 'admin') redirect('/dashboard')`. Se `getUsuarioAtual()` retornar `null` (usuário Auth sem registro), a condição é falsa (`null !== null` = false) e a página é renderizada sem guard — qualquer usuário Auth sem registro acessa dados financeiros e de gestão.

**Files:**
- Modify: `src/app/(protected)/financeiro/page.tsx:9`
- Modify: `src/app/(protected)/gestao/page.tsx:10`
- Modify: `src/app/(protected)/configuracoes/page.tsx:11`

- [ ] **Step 1: Corrigir financeiro/page.tsx**

Localizar linha 9 em `src/app/(protected)/financeiro/page.tsx`:

```typescript
  if (usuario !== null && usuario.perfil !== 'admin') redirect('/dashboard')
```

Substituir por:

```typescript
  if (!usuario || usuario.perfil !== 'admin') redirect('/dashboard')
```

- [ ] **Step 2: Corrigir gestao/page.tsx**

Localizar linha 10 em `src/app/(protected)/gestao/page.tsx`:

```typescript
  if (usuario !== null && usuario.perfil !== 'admin') redirect('/dashboard')
```

Substituir por:

```typescript
  if (!usuario || usuario.perfil !== 'admin') redirect('/dashboard')
```

- [ ] **Step 3: Corrigir configuracoes/page.tsx**

Localizar linha 11 em `src/app/(protected)/configuracoes/page.tsx`:

```typescript
  if (usuario !== null && usuario.perfil !== 'admin') redirect('/dashboard')
```

Substituir por:

```typescript
  if (!usuario || usuario.perfil !== 'admin') redirect('/dashboard')
```

- [ ] **Step 4: Verificar compilação**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

Resultado esperado: sem erros.

- [ ] **Step 5: Commit**

```powershell
git add src/app/(protected)/financeiro/page.tsx
git add src/app/(protected)/gestao/page.tsx
git add src/app/(protected)/configuracoes/page.tsx
git commit -m "fix: corrige guards admin (usuario !== null → !usuario)"
```

---

## Task 8: Código — Open redirect em auth/callback (ALTO)

**Problema:** `src/app/auth/callback/route.ts` linha 8: `const next = searchParams.get('next') ?? '/dashboard'`. Na linha 33: `return NextResponse.redirect(new URL(next, request.url))`. Se `next = 'https://evil.com'`, `new URL('https://evil.com', request.url)` retorna `https://evil.com` — o usuário é redirecionado para um site malicioso após login válido.

**Files:**
- Modify: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Aplicar o fix**

Localizar as linhas 8 e 33 em `src/app/auth/callback/route.ts`.

Linha 8, atual:
```typescript
  const next = searchParams.get('next') ?? '/dashboard'
```

Substituir por (garante que só aceita caminhos relativos):
```typescript
  const nextRaw = searchParams.get('next') ?? '/dashboard'
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard'
```

Linha 33 (agora linha 34 após a mudança acima), atual:
```typescript
      return NextResponse.redirect(new URL(next, request.url))
```

Não precisa mudar — `new URL('/dashboard', request.url)` já é seguro com o `next` validado.

- [ ] **Step 2: Verificar resultado final do arquivo**

O arquivo `src/app/auth/callback/route.ts` deve ficar:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const nextRaw = searchParams.get('next') ?? '/dashboard'
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?erro=confirmacao', request.url))
}
```

- [ ] **Step 3: Testar manualmente**

1. Abrir no browser: `http://localhost:3000/auth/callback?code=fake&next=https://google.com`
2. Resultado esperado: redirecionar para `/login?erro=confirmacao` (code inválido), não para google.com
3. Testar com `next=/dashboard` → deve funcionar normalmente após login real

- [ ] **Step 4: Commit**

```powershell
git add src/app/auth/callback/route.ts
git commit -m "fix: bloqueia open redirect via parametro next no auth/callback"
```

---

## Task 9: Código — middleware.ts para refresh de sessão (ALTO)

**Problema:** Sem `middleware.ts`, o token JWT do Supabase não é renovado automaticamente no Edge. Em sessões longas, o token expira e todas as chamadas ao Supabase retornam `401` — o usuário fica "preso" em estado autenticado no browser mas rejeitado no servidor.

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Criar o arquivo**

```powershell
New-Item -ItemType File "src\middleware.ts"
```

- [ ] **Step 2: Escrever o middleware**

Conteúdo completo do arquivo `src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  // Refresh token — não remover: garante que o cookie de sessão seja renovado
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 3: Verificar que compila**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

Resultado esperado: sem erros.

- [ ] **Step 4: Commit**

```powershell
git add src/middleware.ts
git commit -m "feat: adiciona middleware para refresh de sessao Supabase SSR"
```

---

## Task 10: Código — addMonth overflow em datas fim de mês (ALTO)

**Problema:** `new Date('2026-01-31').setMonth(1)` → JavaScript interpreta como Fevereiro 31, que vira Março 2 ou 3. Isso gera `data_prevista` errada em comissões calculadas para clientes com `data_venda` no fim do mês.

Afeta dois arquivos:
1. `src/lib/calcularComissoes.ts` — função `addMonth` na linha 31
2. `src/components/RegistrarVendaModal.tsx` — linha 304 usa `setMonth` diretamente

**Files:**
- Modify: `src/lib/calcularComissoes.ts`
- Modify: `src/components/RegistrarVendaModal.tsx`

- [ ] **Step 1: Corrigir calcularComissoes.ts**

Localizar linhas 31-35 em `src/lib/calcularComissoes.ts`:

```typescript
function addMonth(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + n)
  return d.toISOString().split('T')[0]
}
```

Substituir por:

```typescript
function addMonth(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const totalMonths = (m - 1) + n
  const targetYear = y + Math.floor(totalMonths / 12)
  const targetMonth = ((totalMonths % 12) + 12) % 12
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const day = Math.min(d, lastDay)
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
```

- [ ] **Step 2: Corrigir RegistrarVendaModal.tsx**

Localizar linhas 303-305 em `src/components/RegistrarVendaModal.tsx`:

```typescript
          const dataVit = new Date(baseDate)
          dataVit.setMonth(dataVit.getMonth() + regra.num_parcelas)
          dataPrevistaVit = dataVit.toISOString().split('T')[0]
```

Substituir por:

```typescript
          const [bY, bM, bD] = baseDate.split('-').map(Number)
          const totalM = (bM - 1) + regra.num_parcelas
          const tY = bY + Math.floor(totalM / 12)
          const tM = ((totalM % 12) + 12) % 12
          const lastD = new Date(tY, tM + 1, 0).getDate()
          dataPrevistaVit = `${tY}-${String(tM + 1).padStart(2, '0')}-${String(Math.min(bD, lastD)).padStart(2, '0')}`
```

- [ ] **Step 3: Verificar casos extremos manualmente no console do browser**

Abrir DevTools → Console e colar:

```javascript
// Teste: Jan 31 + 1 mês deve ser Fev 28 (não Mar 2)
function addMonth(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const totalMonths = (m - 1) + n
  const targetYear = y + Math.floor(totalMonths / 12)
  const targetMonth = ((totalMonths % 12) + 12) % 12
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const day = Math.min(d, lastDay)
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
console.log(addMonth('2026-01-31', 1))  // deve ser '2026-02-28'
console.log(addMonth('2026-03-31', 1))  // deve ser '2026-04-30'
console.log(addMonth('2026-12-31', 1))  // deve ser '2027-01-31'
console.log(addMonth('2026-01-15', 3))  // deve ser '2026-04-15'
```

Resultado esperado: todos os valores acima são corretos.

- [ ] **Step 4: Commit**

```powershell
git add src/lib/calcularComissoes.ts src/components/RegistrarVendaModal.tsx
git commit -m "fix: corrige overflow de addMonth em datas fim de mes"
```

---

## Task 11: Código — Dupla contagem vitalício no ResultadoTab (ALTO)

**Problema:** `ResultadoTab.tsx` soma em `lucroProjecaoTotal` as comissões com `tipo = 'vitalicio'` (tabela `comissoes`) E em `contasReceberMes` as contas a receber com `categoria = 'Vitalício'` (tabela `contas`). Ambas representam a mesma receita mensal de clientes vitalícios.

**Fix:** Excluir `tipo = 'vitalicio'` de `comissoesAtivas` — esses valores já estão nas contas a receber (geradas mensalmente em `financeiro/page.tsx`).

**Files:**
- Modify: `src/components/ResultadoTab.tsx:93-96`

- [ ] **Step 1: Localizar o useMemo de comissoesAtivas**

Localizar linhas 93-96 em `src/components/ResultadoTab.tsx`:

```typescript
  const comissoesAtivas = useMemo(() =>
    comissoes.filter(c => c.status_empresa !== 'Direto'),
    [comissoes]
  )
```

- [ ] **Step 2: Aplicar o fix**

Substituir por:

```typescript
  // Exclui 'Direto' (não passa pelo caixa) e 'vitalicio' (já contabilizado em contas a receber)
  const comissoesAtivas = useMemo(() =>
    comissoes.filter(c => c.status_empresa !== 'Direto' && c.tipo !== 'vitalicio'),
    [comissoes]
  )
```

- [ ] **Step 3: Testar manualmente**

1. `npm run dev` → abrir `http://localhost:3000/financeiro`
2. Navegar para aba "Resultado"
3. Selecionar o mês atual
4. Verificar que o valor de "Projeção" não inclui duplicata de clientes vitalícios
5. Verificar que "Contas a Receber" do mês aparece separado e correto

- [ ] **Step 4: Commit**

```powershell
git add src/components/ResultadoTab.tsx
git commit -m "fix: exclui comissoes vitalicio da projecao (dupla contagem)"
```

---

## Task 12: Código — RegistrarVendaModal: erro silencioso em comissões (MÉDIO)

**Problema:** Linhas 329-331 de `src/components/RegistrarVendaModal.tsx`:

```typescript
        if (comErr) {
          console.error('Erro ao inserir comissões:', comErr.message)
        }
```

O código chama `onSalvo()` na linha 334 mesmo quando o insert de comissões falhou. A venda é criada, mas sem comissões — estado inconsistente invisível para o usuário.

**Files:**
- Modify: `src/components/RegistrarVendaModal.tsx:329-334`

- [ ] **Step 1: Localizar o trecho**

Localizar linhas 324-334 em `src/components/RegistrarVendaModal.tsx`:

```typescript
        // Insert all commissions
        const { error: comErr } = await supabase
          .from('comissoes')
          .insert(comissoesParaInserir)

        if (comErr) {
          console.error('Erro ao inserir comissões:', comErr.message)
        }
      }

      onSalvo()
```

- [ ] **Step 2: Aplicar o fix**

Substituir por:

```typescript
        // Insert all commissions
        const { error: comErr } = await supabase
          .from('comissoes')
          .insert(comissoesParaInserir)

        if (comErr) {
          console.error('Erro ao inserir comissões:', comErr.message)
          setErro('Venda salva, mas erro ao registrar comissões: ' + comErr.message)
          setSalvando(false)
          return
        }
      }

      onSalvo()
```

- [ ] **Step 3: Testar manualmente**

1. `npm run dev` → abrir financeiro → Registrar Venda
2. Preencher campos válidos e salvar
3. Resultado esperado: venda e comissões criadas normalmente, modal fecha
4. (Não é fácil forçar o erro de comissão em dev — o `console.error` já estava funcionando; o importante é que o fluxo de sucesso não mudou)

- [ ] **Step 4: Commit**

```powershell
git add src/components/RegistrarVendaModal.tsx
git commit -m "fix: exibe erro ao usuario quando insert de comissoes falha"
```

---

## Task 13: Código — Validação de email no convite de vendedor (MÉDIO)

**Problema:** `src/app/api/admin/convidar-vendedor/route.ts` linha 21: recebe `email` do body e passa direto para `adminClient.auth.admin.inviteUserByEmail(email)` sem validar o formato. Um email malformado causa uma mensagem de erro genérica do Supabase em vez de uma validação clara.

**Files:**
- Modify: `src/app/api/admin/convidar-vendedor/route.ts`

- [ ] **Step 1: Localizar o trecho**

Localizar linhas 20-23 em `src/app/api/admin/convidar-vendedor/route.ts`:

```typescript
  const { vendedor_id, email } = await request.json()
  if (!vendedor_id || !email) {
    return NextResponse.json({ error: 'vendedor_id e email são obrigatórios' }, { status: 400 })
  }
```

- [ ] **Step 2: Aplicar o fix**

Substituir por:

```typescript
  const { vendedor_id, email } = await request.json()
  if (!vendedor_id || !email) {
    return NextResponse.json({ error: 'vendedor_id e email são obrigatórios' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(String(email))) {
    return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
  }
```

- [ ] **Step 3: Verificar**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

Resultado esperado: sem erros.

- [ ] **Step 4: Commit**

```powershell
git add src/app/api/admin/convidar-vendedor/route.ts
git commit -m "fix: valida formato de email antes de enviar convite"
```

---

## Task 14: Deploy — Push e verificação final

- [ ] **Step 1: Confirmar que todos os commits estão feitos**

```powershell
git log --oneline -15
```

Resultado esperado: ver os commits das Tasks 1-13 na lista.

- [ ] **Step 2: Push para o repositório**

```powershell
git push origin master
```

- [ ] **Step 3: Verificar deploy no Vercel**

1. Abrir o dashboard do Vercel
2. Aguardar o build completar (normalmente 2-3 minutos)
3. Verificar que não há erros de build

- [ ] **Step 4: Smoke test em produção**

1. Abrir a URL de produção
2. Logar como admin → navegar para Financeiro, Gestão, Configurações — deve funcionar
3. Logar como vendedor (se houver) → tentar acessar `/financeiro` diretamente → deve redirecionar para `/dashboard`
4. Verificar que documentos de clientes ainda carregam normalmente

- [ ] **Step 5: Verificar migrations aplicadas no banco de produção**

No Supabase Dashboard (produção), rodar no SQL Editor:

```sql
select tablename, policyname, cmd
from pg_policies
where tablename in (
  'regras_comissao', 'parcelas_regra', 'repasse_grupo_vendedor',
  'documentos_cliente', 'mapeamentos_importacao', 'importacoes_comissao',
  'niveis_vendedor', 'tipos_agenda'
)
order by tablename, policyname;
```

Resultado esperado: policies refletindo as correções das Tasks 2-5.

---

## Resumo dos achados corrigidos

| # | Severidade | Achado | Task |
|---|-----------|--------|------|
| 1 | CRÍTICO | CHECK constraint violada (`'Cancelado'` rejeitado silenciosamente) | Task 1 |
| 2 | CRÍTICO | RLS aberto em regras_comissao/parcelas_regra (fraude de comissão) | Task 2 |
| 3 | CRÍTICO | Sem RLS em documentos_cliente + storage (vazamento de PII) | Task 3 |
| 4 | CRÍTICO | `?? 'admin'` no layout (escalação de privilégio) | Task 6 |
| 5 | CRÍTICO | Guard admin incorreto em financeiro/gestao/configuracoes | Task 7 |
| 6 | ALTO | Open redirect em auth/callback via `?next=` | Task 8 |
| 7 | ALTO | `tipos_agenda for all` permite DELETE por vendedor | Task 5 |
| 8 | ALTO | `mapeamentos_importacao` sem RLS | Task 4 |
| 9 | ALTO | Middleware.ts ausente (sessão não renovada) | Task 9 |
| 10 | ALTO | Dupla contagem vitalício no ResultadoTab | Task 11 |
| 11 | ALTO | `addMonth` overflow em datas fim de mês | Task 10 |
| 12 | MÉDIO | `niveis_vendedor` com INSERT/UPDATE/DELETE aberto | Task 4 |
| 13 | MÉDIO | `importacoes_comissao` sem RLS | Task 4 |
| 14 | MÉDIO | Comissão insert falha silenciosamente no RegistrarVendaModal | Task 12 |
| 15 | MÉDIO | Convite sem validação de formato de email | Task 13 |
