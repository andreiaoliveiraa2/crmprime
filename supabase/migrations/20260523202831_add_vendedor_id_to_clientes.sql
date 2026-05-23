alter table clientes add column if not exists vendedor_id uuid references vendedores(id) on delete set null;
