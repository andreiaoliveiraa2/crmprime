-- supabase/migrations/20260526_vendedor_comissoes_access.sql

-- Vendedor pode ler suas próprias vendas
create policy "vendas_vendedor_proprios" on vendas
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- Vendedor pode ler comissões das próprias vendas
create policy "comissoes_vendedor_proprios" on comissoes
  for select using (
    meu_perfil() = 'vendedor' and
    exists (
      select 1 from vendas v
      where v.id = comissoes.venda_id
      and v.vendedor_id = meu_vendedor_id()
    )
  );
