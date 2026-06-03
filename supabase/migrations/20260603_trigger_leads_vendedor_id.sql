-- Trigger BEFORE INSERT/UPDATE em leads: preenche vendedor_id automaticamente
-- a partir do campo texto "vendedor" (nome), quando o payload não incluir o UUID.
-- Espelho do trigger equivalente em vendas (trg_vendas_set_vendedor_id).

create or replace function set_lead_vendedor_id()
returns trigger language plpgsql security definer as $$
begin
  if new.vendedor_id is null and new.vendedor is not null then
    select v.id into new.vendedor_id
    from vendedores v
    where v.nome = new.vendedor
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_set_vendedor_id on leads;
create trigger trg_leads_set_vendedor_id
  before insert or update on leads
  for each row execute function set_lead_vendedor_id();

-- Corrige leads existentes que ainda têm vendedor_id nulo
update leads l
set vendedor_id = v.id
from vendedores v
where l.vendedor_id is null
  and l.vendedor is not null
  and l.vendedor = v.nome;
