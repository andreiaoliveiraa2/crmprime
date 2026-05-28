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
