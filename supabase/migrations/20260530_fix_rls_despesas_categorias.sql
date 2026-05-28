-- Remove as policies abertas (to authenticated using(true)) de despesas_fixas e
-- categorias_despesa que permitiam que qualquer vendedor criasse, editasse e
-- excluísse registros financeiros. As policies admin-only (despesas_fixas_admin e
-- categorias_despesa_admin) já existem — apenas as abertas precisam ser removidas.

-- ── despesas_fixas ────────────────────────────────────────────────────────────
drop policy if exists "auth_select_despesas_fixas" on despesas_fixas;
drop policy if exists "auth_insert_despesas_fixas" on despesas_fixas;
drop policy if exists "auth_update_despesas_fixas" on despesas_fixas;
drop policy if exists "auth_delete_despesas_fixas" on despesas_fixas;

-- Leitura para todos autenticados (necessária para exibir despesas no financeiro)
drop policy if exists "despesas_fixas_leitura" on despesas_fixas;
create policy "despesas_fixas_leitura" on despesas_fixas
  for select
  to authenticated
  using (true);

-- ── categorias_despesa ────────────────────────────────────────────────────────
drop policy if exists "auth_select_categorias_despesa" on categorias_despesa;
drop policy if exists "auth_insert_categorias_despesa" on categorias_despesa;
drop policy if exists "auth_update_categorias_despesa" on categorias_despesa;
drop policy if exists "auth_delete_categorias_despesa" on categorias_despesa;

-- Leitura para todos autenticados (necessária para exibir categorias no formulário)
drop policy if exists "categorias_despesa_leitura" on categorias_despesa;
create policy "categorias_despesa_leitura" on categorias_despesa
  for select
  to authenticated
  using (true);
