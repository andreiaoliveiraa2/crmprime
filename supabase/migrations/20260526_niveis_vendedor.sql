create table if not exists niveis_vendedor (
  id   uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true
);

insert into niveis_vendedor (nome) values
  ('Iniciante'),
  ('Experiente'),
  ('VIP');

alter table niveis_vendedor enable row level security;

create policy "auth_select_niveis_vendedor"
  on niveis_vendedor for select to authenticated using (true);

create policy "auth_insert_niveis_vendedor"
  on niveis_vendedor for insert to authenticated with check (true);

create policy "auth_update_niveis_vendedor"
  on niveis_vendedor for update to authenticated using (true);

create policy "auth_delete_niveis_vendedor"
  on niveis_vendedor for delete to authenticated using (true);

grant all on niveis_vendedor to authenticated;
