-- despesas_fixas: despesas mensais fixas da empresa
create table if not exists despesas_fixas (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  valor          numeric not null,
  dia_vencimento integer not null check (dia_vencimento between 1 and 31),
  categoria      text not null default 'Outros',
  empresa        text,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);

-- Adiciona colunas em contas para suportar despesas e categorias
alter table contas
  add column if not exists categoria       text,
  add column if not exists despesa_fixa_id uuid references despesas_fixas(id) on delete set null;

-- Adiciona coluna empresa em contas (caso ainda não exista)
alter table contas
  add column if not exists empresa text;

-- RLS despesas_fixas
alter table despesas_fixas enable row level security;

create policy "auth_select_despesas_fixas"
  on despesas_fixas for select to authenticated using (true);

create policy "auth_insert_despesas_fixas"
  on despesas_fixas for insert to authenticated with check (true);

create policy "auth_update_despesas_fixas"
  on despesas_fixas for update to authenticated using (true);

create policy "auth_delete_despesas_fixas"
  on despesas_fixas for delete to authenticated using (true);

grant all on despesas_fixas to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- categorias_despesa: categorias configuráveis nas Configurações do sistema
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists categorias_despesa (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null unique,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Categorias padrão
insert into categorias_despesa (nome) values
  ('Aluguel'), ('Internet'), ('Telefone'), ('Contador'),
  ('Sistema'), ('Salário'), ('Imposto'), ('Outros')
on conflict (nome) do nothing;

-- RLS categorias_despesa
alter table categorias_despesa enable row level security;

create policy "auth_select_categorias_despesa"
  on categorias_despesa for select to authenticated using (true);

create policy "auth_insert_categorias_despesa"
  on categorias_despesa for insert to authenticated with check (true);

create policy "auth_update_categorias_despesa"
  on categorias_despesa for update to authenticated using (true);

create policy "auth_delete_categorias_despesa"
  on categorias_despesa for delete to authenticated using (true);

grant all on categorias_despesa to authenticated;
