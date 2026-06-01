-- supabase/migrations/20260523_usuarios_permissoes.sql

-- Tabela de usuários do sistema
create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  nome          text not null,
  email         text,
  perfil        text not null check (perfil in ('admin', 'vendedor')),
  vendedor_id   uuid references vendedores(id) on delete set null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

-- RLS na própria tabela usuarios
alter table usuarios enable row level security;

-- Usuário autenticado lê apenas o próprio registro
drop policy if exists "usuario_le_proprio" on usuarios;
create policy "usuario_le_proprio" on usuarios
  for select using (auth_user_id = auth.uid());

-- Service role faz tudo (Server Actions usam service role)
drop policy if exists "service_role_full" on usuarios;
create policy "service_role_full" on usuarios
  for all using (auth.role() = 'service_role');

-- Adicionar vendedor_id nas tabelas que precisam de isolamento
alter table leads    add column if not exists vendedor_id uuid references vendedores(id);
alter table clientes add column if not exists vendedor_id uuid references vendedores(id);
alter table agenda   add column if not exists vendedor_id uuid references vendedores(id);
alter table vendas   add column if not exists vendedor_id uuid references vendedores(id);

-- Preencher vendedor_id retroativamente a partir do campo texto existente
update leads    set vendedor_id = v.id from vendedores v where leads.vendedor    = v.nome and leads.vendedor_id    is null;
update clientes set vendedor_id = v.id from vendedores v where clientes.vendedor = v.nome and clientes.vendedor_id is null;
update vendas   set vendedor_id = v.id from vendedores v where vendas.vendedor   = v.nome and vendas.vendedor_id   is null;

-- Funções helper para as políticas RLS (usadas na Task 5)
create or replace function meu_perfil()
returns text language sql security definer stable as $$
  select perfil from usuarios where auth_user_id = auth.uid()
$$;

create or replace function meu_vendedor_id()
returns uuid language sql security definer stable as $$
  select vendedor_id from usuarios where auth_user_id = auth.uid()
$$;
