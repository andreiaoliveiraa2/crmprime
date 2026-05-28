-- Vendedores precisam escrever em vendas e comissoes para registrar vendas,
-- atualizar planos e gerar comissões dos próprios clientes.
-- Até aqui só tinham SELECT — INSERT/UPDATE/DELETE falhavam silenciosamente.
-- Escopo: somente dados do próprio vendedor (vendedor_id = meu_vendedor_id()).

-- ── vendas: INSERT ────────────────────────────────────────────────────────────
drop policy if exists "vendas_vendedor_insert" on vendas;
create policy "vendas_vendedor_insert" on vendas
  for insert
  with check (
    meu_perfil() = 'vendedor'
    and vendedor_id = meu_vendedor_id()
  );

-- ── vendas: UPDATE ────────────────────────────────────────────────────────────
-- Usando + with check garante que o vendedor não pode reatribuir a venda a outro.
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

-- ── comissoes: INSERT ─────────────────────────────────────────────────────────
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

-- ── comissoes: DELETE ─────────────────────────────────────────────────────────
-- Necessário para regenerar comissões quando o plano do cliente é atualizado.
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

-- Nota: UPDATE em comissoes (marcar como recebido) permanece admin-only.
-- Vendedores não podem alterar status financeiro das próprias comissões.
