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
