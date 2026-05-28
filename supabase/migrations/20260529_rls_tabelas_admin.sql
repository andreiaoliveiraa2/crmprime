-- ── mapeamentos_importacao: habilita RLS, admin-only ─────────────────────────
alter table mapeamentos_importacao enable row level security;

drop policy if exists "mapeamentos_admin" on mapeamentos_importacao;
create policy "mapeamentos_admin" on mapeamentos_importacao
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- ── importacoes_comissao: habilita RLS, admin-only ───────────────────────────
alter table importacoes_comissao enable row level security;

drop policy if exists "importacoes_admin" on importacoes_comissao;
create policy "importacoes_admin" on importacoes_comissao
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- ── niveis_vendedor: corrige policies (somente admin pode escrever) ──────────
-- Remove as policies abertas para todos os autenticados
drop policy if exists "auth_insert_niveis_vendedor" on niveis_vendedor;
drop policy if exists "auth_update_niveis_vendedor" on niveis_vendedor;
drop policy if exists "auth_delete_niveis_vendedor" on niveis_vendedor;

-- Adiciona policy admin para escrita (leitura já existe via auth_select_niveis_vendedor)
drop policy if exists "niveis_vendedor_admin_escrita" on niveis_vendedor;
create policy "niveis_vendedor_admin_escrita" on niveis_vendedor
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');
