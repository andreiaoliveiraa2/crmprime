create table if not exists niveis_vendedor (
  id   uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true
);

insert into niveis_vendedor (nome) values
  ('Iniciante'),
  ('Experiente'),
  ('VIP');
