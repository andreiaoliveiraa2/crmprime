-- Trigger BEFORE INSERT em vendas: preenche vendedor_id automaticamente a partir
-- do cliente vinculado, quando o payload não incluir o UUID.
-- Necessário porque o app envia apenas o campo texto "vendedor" (nome),
-- mas as policies RLS precisam de vendedor_id (uuid) para isolar por vendedor.

create or replace function set_venda_vendedor_id()
returns trigger language plpgsql security definer as $$
begin
  if new.vendedor_id is null and new.cliente_id is not null then
    select c.vendedor_id into new.vendedor_id
    from clientes c
    where c.id = new.cliente_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vendas_set_vendedor_id on vendas;
create trigger trg_vendas_set_vendedor_id
  before insert on vendas
  for each row execute function set_venda_vendedor_id();
