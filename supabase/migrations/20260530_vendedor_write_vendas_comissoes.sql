-- vendas.vendedor_id nunca foi aplicada à produção (20260523_usuarios_permissoes.sql
-- foi parcialmente executada). A coluna precisa existir antes das policies.

-- ── 1. Garante que a coluna existe ───────────────────────────────────────────
alter table vendas
  add column if not exists vendedor_id uuid references vendedores(id);

-- ── 2. Preenche retroativamente ──────────────────────────────────────────────
-- Prioridade: pelo cliente (mais confiável)
update vendas
  set vendedor_id = c.vendedor_id
  from clientes c
  where vendas.cliente_id = c.id
    and c.vendedor_id is not null
    and vendas.vendedor_id is null;

-- Fallback: pelo nome do vendedor no campo texto
update vendas
  set vendedor_id = v.id
  from vendedores v
  where vendas.vendedor = v.nome
    and vendas.vendedor_id is null;

-- ── 3. Recria policy SELECT (pode estar quebrada ou inexistente) ──────────────
drop policy if exists "vendas_vendedor_proprios" on vendas;
create policy "vendas_vendedor_proprios" on vendas
  for select
  using (
    meu_perfil() = 'vendedor'
    and vendedor_id = meu_vendedor_id()
  );

-- ── 4. INSERT: vendedor cria apenas vendas próprias ──────────────────────────
drop policy if exists "vendas_vendedor_insert" on vendas;
create policy "vendas_vendedor_insert" on vendas
  for insert
  with check (
    meu_perfil() = 'vendedor'
    and vendedor_id = meu_vendedor_id()
  );

-- ── 5. UPDATE: vendedor edita apenas vendas próprias, sem reatribuição ───────
drop policy if exists "vendas_vendedor_update" on vendas;
create policy "vendas_vendedor_update" on vendas
  for update
  using (
    meu_perfil() = 'vendedor'
    and vendedor_id = meu_vendedor_id()
  )
  with check (
    meu_perfil() = 'vendedor'
    and vendedor_id = meu_vendedor_id()
  );

-- ── 6. comissoes INSERT ───────────────────────────────────────────────────────
drop policy if exists "comissoes_vendedor_insert" on comissoes;
create policy "comissoes_vendedor_insert" on comissoes
  for insert
  with check (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from vendas v
      where v.id = comissoes.venda_id
        and v.vendedor_id = meu_vendedor_id()
    )
  );

-- ── 7. comissoes DELETE (regeneração ao atualizar plano) ─────────────────────
drop policy if exists "comissoes_vendedor_delete" on comissoes;
create policy "comissoes_vendedor_delete" on comissoes
  for delete
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from vendas v
      where v.id = comissoes.venda_id
        and v.vendedor_id = meu_vendedor_id()
    )
  );

-- ── 8. Recria policy SELECT de comissoes (pode referenciar vendedor_id inexistente) ──
drop policy if exists "comissoes_vendedor_proprios" on comissoes;
create policy "comissoes_vendedor_proprios" on comissoes
  for select
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from vendas v
      where v.id = comissoes.venda_id
        and v.vendedor_id = meu_vendedor_id()
    )
  );

-- UPDATE em comissoes permanece admin-only (marcar como recebido é operação financeira).
